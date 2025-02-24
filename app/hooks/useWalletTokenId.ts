'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { createClient } from '@/utils/supabase/client';

interface UseWalletTokenIdResult {
	tokenId: string | null;
	tokenLoading: boolean;
	refreshTokenId: () => Promise<void>;
}

const supabase = createClient();

export function useWalletTokenId(walletId: string): UseWalletTokenIdResult {
	const [tokenId, setTokenId] = useState<string | null>(null);
	const [tokenLoading, setTokenLoading] = useState(true);

	const fetchTokenId = useCallback(async () => {
		try {
			setTokenLoading(true);
			const balanceResponse = await fetch('/api/wallet/balance', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ walletId }),
			});

			const response = await balanceResponse.json();
			const parsedTokenId = response.tokenBalances?.[0]?.token?.id;

			if (response.error) {
				console.error('Error fetching wallet token ID:', response.error);
				toast.error('Error fetching wallet token ID', {
					description: response.error,
				});
				return;
			}

			if (!parsedTokenId) {
				console.log('No token ID found for this wallet');
				toast.info('No token ID found for this wallet');
				setTokenId(null);
				return;
			}

			setTokenId(parsedTokenId);
		} catch (error) {
			console.error('Error fetching token ID:', error);
			toast.error('Failed to fetch token ID');
		} finally {
			setTokenLoading(false);
		}
	}, [walletId]);

	useEffect(() => {
		fetchTokenId();
	}, [fetchTokenId]);

	return {
		tokenId,
		tokenLoading,
		refreshTokenId: fetchTokenId,
	};
}
