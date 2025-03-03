// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// @ts-ignore
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

// @ts-ignore
import type { Database } from '@/types/database.types';

const supabase = createClient<Database>(
  'https://gnsrqnjozcseghlllguk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imduc3JxbmpvemNzZWdobGxsZ3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczMjUzMzcsImV4cCI6MjA1MjkwMTMzN30.P1FOAGHFnzPYqZ12WVZvK0ByTTVjyauB3dsIoji0kro',
);

console.log('Hello from Functions!');

serve(async (req: any) => {
  const res = await req.json();
  const data = res.notification;

  console.log('notification', res);

  if (res.notificationType == 'transactions.inbound') {
    try {
      console.log('storing transaction', data);
      console.log('storing transaction id', data.id);

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

        console.log('existingWallet', existingWallet);

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

          new Response(JSON.stringify(updatedTransaction), {
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          // Create a new transaction
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

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello-world' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
