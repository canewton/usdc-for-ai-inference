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

    const filteredProjects = (projects ?? []).filter(
      (project) => transactionMap.get(project.circle_transaction_id) != null,
    );

    const billingTransactions: BillingTransaction[] = (
      filteredProjects ?? []
    ).map((project) => {
      const transaction = transactionMap.get(project.circle_transaction_id);
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
    });

    return billingTransactions;
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
