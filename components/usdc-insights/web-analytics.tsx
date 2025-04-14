'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/utils/supabase/client';

import type { BillingTransaction } from './billing';
import { WebInsights } from './web-insights';

export const WebAnalytics = () => {
  const [allBillingData, setAllBillingData] = useState<BillingTransaction[]>(
    [],
  );
  const supabase = createClient();

  const createBillingData = (transactions: any[], projects: any[]) => {
    var hasNull = false;

    const transactionMap = new Map(
      (transactions ?? []).map((tx) => [tx.circle_transaction_id, tx]),
    );

    const billingTransactions: BillingTransaction[] = (projects ?? []).map(
      (project) => {
        const transaction = transactionMap.get(project.circle_transaction_id);

        if (!transaction) {
          hasNull = true;
        }

        return {
          id: project.id,
          ai_model: project.ai_model,
          project_name: project.project_name,
          transaction_type: transaction?.transaction_type,
          amount: transaction?.amount,
          status: transaction?.status,
          created_at: project.created_at,
          expanded: false,
        };
      },
    );

    if (hasNull) {
      return null;
    } else {
      return billingTransactions;
    }
  };

  const updateBillingTransactions = async () => {
    try {
      const { data: allProjects } = await supabase
        .from('ai_projects')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('*');

      const allBillingTransactions: BillingTransaction[] | null =
        createBillingData(allTransactions ?? [], allProjects ?? []);

      if (allBillingTransactions !== null) {
        setAllBillingData(allBillingTransactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  useEffect(() => {
    updateBillingTransactions();
  }, []);

  return <WebInsights data={allBillingData} />;
};
