import { circleWalletTransfer } from '@/app/utils/circleWalletTransfer';
import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');
jest.mock('@/utils/developer-controlled-wallets-client');

const mockSupabase = {
  schema: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);
(circleDeveloperSdk.getWalletTokenBalance as jest.Mock).mockResolvedValue({
  data: { tokenBalances: [{ token: { symbol: 'USDC', id: 1 } }] },
});
(circleDeveloperSdk.createTransaction as jest.Mock).mockResolvedValue({
  data: { id: 1 },
});

describe('aiGenerationPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation that can handle different tables
    mockSupabase.schema.mockImplementation(() => {
      return {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 1 },
                error: null,
              }),
            }),
          }),
        }),
      };
    });
  });

  it('should return the wallet transfer', async () => {
    const response = await circleWalletTransfer('name', '3d', '1', '10');
    expect(response.id).toBe(1);
  });
});
