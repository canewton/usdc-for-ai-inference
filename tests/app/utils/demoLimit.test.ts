import { checkDemoLimit } from '@/app/utils/demoLimit';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');

const mockSupabase = {
  from: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('checkDemoLimit', () => {
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

      if (tableName === 'ai_projects') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ id: '1' }, { id: '2' }],
              error: null,
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
    const response = await checkDemoLimit('1');
    expect(response.canGenerate).toBe(true);
    expect(response.remaining).toBe(
      parseInt(process.env.USER_AI_GENERATION_LIMIT ?? '5') - 2,
    );
  });

  // Add your error test case here when ready
});
