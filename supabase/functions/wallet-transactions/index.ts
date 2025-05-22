// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { initiateDeveloperControlledWalletsClient } from 'https://esm.sh/@circle-fin/developer-controlled-wallets';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

import type { Database } from '@/types/database.types';

const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
  apiKey: Deno.env.get('CIRCLE_API_KEY'),
  entitySecret: Deno.env.get('CIRCLE_ENTITY_SECRET'),
});

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_ANON_KEY'),
);

serve(async (req: any) => {
  const res = await req.json();
  const data = res.notification;

  if (data.state == 'CONFIRMED') {
    try {
      try {
        const { data: existingWallet, error: fetchWalletError } = await supabase
          .from('wallets')
          .select('*')
          .eq('circle_wallet_id', data.walletId)
          .single();

        const { data: existingTransaction, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('circle_transaction_id', data.id)
          .single();

        if (
          (fetchError && fetchError.code !== 'PGRST116') ||
          fetchWalletError
        ) {
          // PGRST116 means no rows found
          console.error('Error fetching transaction:', fetchError);
          new Response('Error fetching transaction', {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (existingTransaction) {
          const { data: updatedTransaction, error: updateError } =
            await supabase
              .from('transactions')
              .update({
                transaction_type: data.transactionType,
                amount: parseFloat(data.amounts[0]?.replace(/[$,]/g, '')) || 0,
                status: data.state,
              })
              .eq('circle_transaction_id', data.id)
              .select()
              .single();

          if (updateError) {
            console.error('Error updating transaction:', updateError);
            new Response('Error fetching transaction', {
              headers: { 'Content-Type': 'application/json' },
            });
          }

          console.log('Transaction updated:', updatedTransaction);
          new Response(JSON.stringify(updatedTransaction), {
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          // Create a new transaction
          const balanceResponse =
            await circleDeveloperSdk.getWalletTokenBalance({
              id: existingWallet.circle_wallet_id,
              includeAll: true,
            });

          const parsedBalance = balanceResponse.data?.tokenBalances?.find(
            ({ token }: { token: { symbol?: string } }) =>
              token.symbol === 'USDC',
          )?.amount;

          const { data: newTransaction, error: insertError } = await supabase
            .from('transactions')
            .insert([
              {
                wallet_id: existingWallet.id,
                circle_transaction_id: data.id,
                currency: 'USDC',
                transaction_type: data.transactionType,
                amount: parseFloat(data.amounts[0]?.replace(/[$,]/g, '')) || 0,
                status: data.state,
                balance: parsedBalance,
              },
            ])
            .select();

          if (insertError) {
            console.error('Error creating transaction:', insertError);
            return new Response('Error creating transaction', {
              headers: { 'Content-Type': 'application/json' },
            });
          }

          console.log('New transaction created:', newTransaction);
          new Response(JSON.stringify(newTransaction), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        return new Response('Internal Server Error', {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  }

  return new Response('Invalid Notification', {
    headers: { 'Content-Type': 'application/json' },
  });
});
