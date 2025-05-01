// app/actions/index.ts
'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';
import { encodedRedirect } from '@/utils/utils'; // Assuming utils/utils.ts exists

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? process.env.NEXT_PUBLIC_VERCEL_URL
  : 'http://localhost:3000';

export const signUpAction = async (formData: FormData) => {
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get('origin') ?? baseUrl; // Fallback if origin header isn't set

  if (!email || !password) {
    // Use encodedRedirect for user-facing errors
    return encodedRedirect(
      'error',
      '/sign-up',
      'Email and password are required.',
    );
  }

  const { error: signUpError, data: authData } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Ensure emailRedirectTo uses a reliable origin
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError.message);
    return encodedRedirect('error', '/sign-up', signUpError.message);
  }

  if (!authData.user) {
    console.error('Sign up error: No user data returned.');
    return encodedRedirect(
      'error',
      '/sign-up',
      'Could not create user. Please try again.',
    );
  }

  // ---- Wallet Creation Logic ----
  // NOTE: Consider moving wallet creation to *after* email confirmation
  // or handle potential cleanup if user never confirms email.
  try {
    // 1. Create Wallet Set
    const createWalletSetResponse = await fetch(
      `${baseUrl}/api/wallet-set`,
      {
        method: 'PUT',
        body: JSON.stringify({ entityName: email }), // Use email as entity name for simplicity
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!createWalletSetResponse.ok) {
      const errorBody = await createWalletSetResponse.text();
      console.error(
        `Failed to create wallet set: ${createWalletSetResponse.status} ${errorBody}`,
      );
      // Don't redirect yet, maybe show a generic error, or attempt profile update anyway?
      // For now, we'll proceed but log the error. Consider a more robust recovery/cleanup.
      // Potentially delete the Supabase user if wallet creation fails critically?
    }

    const createdWalletSet = await createWalletSetResponse.json();
    const walletSetId = createdWalletSet?.id;

    if (!walletSetId) {
      console.error('Failed to get walletSetId from response.');
      // Decide how to handle this - maybe delete the user?
      return encodedRedirect(
        'error',
        '/sign-up',
        'Wallet setup failed (Set ID). Please contact support.',
      );
    }

    // 2. Create Wallet
    const createWalletResponse = await fetch(`${baseUrl}/api/wallet`, {
      method: 'POST',
      body: JSON.stringify({ walletSetId }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!createWalletResponse.ok) {
      const errorBody = await createWalletResponse.text();
      console.error(
        `Failed to create wallet: ${createWalletResponse.status} ${errorBody}`,
      );
      // Critical failure - maybe delete user and wallet set?
      return encodedRedirect(
        'error',
        '/sign-up',
        'Wallet setup failed (Wallet Creation). Please contact support.',
      );
    }

    const createdWallet = await createWalletResponse.json();
    const circleWalletId = createdWallet?.id;
    const walletAddress = createdWallet?.address;

    if (!circleWalletId || !walletAddress) {
      console.error('Failed to get wallet details from response.');
      return encodedRedirect(
        'error',
        '/sign-up',
        'Wallet setup failed (Wallet Details). Please contact support.',
      );
    }

    // 3. Update Supabase Profile (should exist due to trigger or default value)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({ email: email }) // Update email just in case, is_admin defaults to false
      .eq('auth_user_id', authData.user.id)
      .select('id') // Select only the ID needed for the wallet insert
      .single(); // Expecting a single profile

    if (profileError || !profileData) {
      console.error(
        'Error updating/finding profile:',
        profileError?.message ?? 'Profile not found',
      );
      // Critical failure - user exists but profile doesn't match? Cleanup needed.
      return encodedRedirect(
        'error',
        '/sign-up',
        'User profile setup failed. Please contact support.',
      );
    }

    // 4. Insert Wallet Info into Supabase
    const { error: walletInsertError } = await supabase.from('wallets').insert({
      profile_id: profileData.id,
      circle_wallet_id: circleWalletId,
      wallet_type: createdWallet.custodyType, // Make sure these fields match your table
      wallet_set_id: walletSetId,
      wallet_address: walletAddress,
      account_type: createdWallet.accountType, // Make sure these fields match your table
      blockchain: createdWallet.blockchain,
      currency: 'USDC', // Assuming USDC
    });

    if (walletInsertError) {
      console.error('Error inserting wallet info:', walletInsertError.message);
      // Less critical maybe, but indicates inconsistency.
      return encodedRedirect(
        'error',
        '/sign-up',
        'Wallet data saving failed. Please contact support.',
      );
    }
  } catch (error: any) {
    console.error('Wallet creation process error:', error.message);
    // Generic catch-all
    return encodedRedirect(
      'error',
      '/sign-up',
      'An unexpected error occurred during wallet setup.',
    );
  }
  // ---- End Wallet Creation Logic ----

  // Redirect based on email confirmation setting
  const isEmailConfirmationEnabled =
    process.env.AUTH_EMAIL_CONFIRMATION_ENABLED === 'true'; // Example env var

  if (isEmailConfirmationEnabled) {
    // Redirect to a page informing the user to check their email
    return encodedRedirect(
      'success',
      '/sign-in', // Redirect to sign-in page with success message
      'Sign up successful! Please check your email to confirm your account before signing in.',
    );
  } else {
    // If email confirmation is disabled, redirect directly to dashboard
    return redirect('/dashboard');
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  if (!email || !password) {
    return encodedRedirect(
      'error',
      '/sign-in',
      'Email and password are required.',
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error.message);
    return encodedRedirect('error', '/sign-in', error.message); // Use Supabase error message directly
  }

  // Check if the user is admin AFTER successful login
  const { data: user } = await supabase.auth.getUser();
  if (user.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('auth_user_id', user.user.id)
      .single();

    if (profile?.is_admin) {
      return redirect('/admin');
    }
  }

  return redirect('/dashboard'); // Default redirect for non-admins
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get('email')?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get('origin') ?? baseUrl; // Get origin reliably

  if (!email) {
    return encodedRedirect('error', '/forgot-password', 'Email is required');
  }

  // Generate the reset link URL
  // Ensure the redirect path within the app is correct
  const redirectUrl = `${origin}/auth/callback?next=/dashboard/reset-password`; // Changed 'redirect_to' to 'next' as per convention

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    console.error('Forgot password error:', error.message);
    return encodedRedirect(
      'error',
      '/forgot-password',
      error.message, // Provide more specific feedback if possible, else use Supabase message
    );
  }

  return encodedRedirect(
    'success',
    '/forgot-password', // Redirect back to forgot password page with success message
    'Password reset email sent! Check your inbox for instructions.',
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      'error',
      '/dashboard/reset-password', // Stay on the same page
      'Both password fields are required.',
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      'error',
      '/dashboard/reset-password', // Stay on the same page
      'Passwords do not match.',
    );
  }

  if (password.length < 6) {
    return encodedRedirect(
      'error',
      '/dashboard/reset-password', // Stay on the same page
      'Password must be at least 6 characters long.',
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error('Reset password error:', error.message);
    return encodedRedirect(
      'error',
      '/dashboard/reset-password', // Stay on the same page
      error.message, // Use Supabase error message
    );
  }

  // Use success redirect to clear form and show message, then redirect to dashboard
  return encodedRedirect(
    'success',
    '/dashboard', // Redirect to dashboard after success
    'Password updated successfully!',
  );
};

// Sign out action remains the same
export const signOutAction = async () => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error.message);
    // Redirect even if sign out fails, maybe log error
  }
  return redirect('/sign-in'); // Redirect to sign-in after sign out
};
