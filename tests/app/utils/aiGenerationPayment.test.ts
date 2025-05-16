import { aiGenerationPayment } from '@/app/utils/aiGenerationPayment';
import { circleWalletTransfer } from '@/app/utils/circleWalletTransfer';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');
jest.mock('@/app/utils/circleWalletTransfer');

const mockSupabase = {
  from: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);
(circleWalletTransfer as jest.Mock).mockResolvedValue({ id: 1 });

describe('aiGenerationPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation that can handle different tables
    mockSupabase.from.mockImplementation((tableName) => {
      if (tableName === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: '1' },
                error: null,
              }),
            }),
          }),
        };
      }

      if (tableName === 'wallets') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { circle_wallet_id: '1' },
                error: null,
              }),
            }),
          }),
        };
      }

      // Default case
      return {
        select: jest.fn(),
      };
    });
  });

  it('should return the ai inference limit', async () => {
    const response = await aiGenerationPayment(
      { id: '1' },
      'test-title',
      'test-type',
      10,
    );
    expect(response.id).toBe(1);
  });
});
