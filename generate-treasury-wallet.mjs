import { config } from 'dotenv';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: ['.env.local'] });

// Initialize Circle client
const requiredEnvVars = [
  'CIRCLE_API_KEY',
  'CIRCLE_ENTITY_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

// Makes the request to Circle's API to create the wallet
try {
  const supabase = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  const { error, data: authData } = await supabase.auth.signUp({
    email: adminUsername,
    password: adminPassword,
  });

  if (error) {
    console.error('Error while attempting to create user:', error);
    process.exit(1);
  }

  const createdWalletSetResponse = await circleDeveloperSdk.createWalletSet({
    name: 'Treasury Wallet',
  });

  const walletSetId = createdWalletSetResponse.data.walletSet.id;
  console.log(`Created wallet set with ID: ${walletSetId}`);

  const createdWalletResponse = await circleDeveloperSdk.createWallets({
    accountType: 'SCA',
    blockchains: ['ARB-SEPOLIA'],
    walletSetId,
  });

  const [createdWallet] = createdWalletResponse.data.wallets;
  if (!createdWallet) {
    throw new Error('No wallet was created');
  }

  console.log(
    `Agent wallet created successfully. Address: ${createdWallet.address}, ID: ${createdWallet.id}`,
  );

  // Update environment variables in .env.local
  const envPath = path.resolve('.env.local');
  let envContent = fs.readFileSync(envPath, 'utf-8');

  // Update the environment variables
  envContent = envContent.replace(
    /^NEXT_PUBLIC_TREASURY_WALLET_ID=.*$/m,
    `NEXT_PUBLIC_TREASURY_WALLET_ID=${createdWallet.id}`,
  );
  envContent = envContent.replace(
    /^NEXT_PUBLIC_TREASURY_WALLET_ADDRESS=.*$/m,
    `NEXT_PUBLIC_TREASURY_WALLET_ADDRESS=${createdWallet.address}`,
  );

  // Write the updated content back to .env.local
  fs.writeFileSync(envPath, envContent);
  console.log('Environment variables updated successfully in .env.local');

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .update({ email: adminUsername, is_admin: true })
    .eq('auth_user_id', authData.user?.id)
    .select()
    .single();

  if (profileError) {
    console.error('Error while attempting to create user:', profileError);
  }

  const { error: walletError } = await supabase
    .schema('public')
    .from('wallets')
    .insert({
      profile_id: profileData.id,
      circle_wallet_id: createdWallet.id,
      wallet_type: createdWallet.custodyType,
      wallet_set_id: walletSetId,
      wallet_address: createdWallet.address,
      account_type: createdWallet.accountType,
      blockchain: createdWallet.blockchain,
      currency: 'USDC',
    })
    .select();

  if (walletError) {
    console.error(
      "Error while attempting to create user's wallet:",
      walletError,
    );
  }
} catch (error) {
  console.error('Failed to create treasury wallet:', error.message);
  process.exit(1);
}
