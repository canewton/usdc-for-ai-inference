import type { NextRequest } from 'next/server';

import { POST } from '@/app/api/3d-generation/generation-status/route';
import { aiGenerationPayment } from '@/app/utils/aiGenerationPayment';
import { createDatabaseBucketItem } from '@/app/utils/createDatabaseBucketItem';
import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');
jest.mock('@/utils/developer-controlled-wallets-client');
jest.mock('@/app/utils/createDatabaseBucketItem');
jest.mock('@/app/utils/aiGenerationPayment');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              mockResolvedValue: jest.fn(),
              mockRejectedValue: jest.fn(),
            })),
          })),
        })),
      })),
    })),
  })),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);
(circleDeveloperSdk.getWalletTokenBalance as jest.Mock).mockResolvedValue({
  data: { tokenBalances: [{ token: { symbol: 'USDC', id: 1 }, amount: 10 }] },
});
(createDatabaseBucketItem as jest.Mock).mockResolvedValue({
  data: {
    fullPath:
      'user-images/b09e9c64-4406-4e9d-853e-14219129b1a4_fc116881-ec7b-4c66-adc0-7e656a12db4d.webp',
  },
});
(aiGenerationPayment as jest.Mock).mockResolvedValue({
  data: { success: true },
});

describe('POST /api/3d-generation/generation-status', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: () =>
        Promise.resolve({
          taskId: 1,
          title: 'test',
        }),
      headers: new Headers(),
      url: 'http://localhost/api/3d-generation/generation-status',
    } as unknown as NextRequest;

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            status: 'SUCCEEDED',
            model_urls: { glb: 'http://example.com' },
          }),
        blob: () => Promise.resolve('blob'),
        ok: true,
      }),
    ) as jest.Mock;
  });

  it('should return 401 if the user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 200 with generated model status for an authenticated user', async () => {
    mockRequest.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockGeneratedModel = {
      id: '1',
      name: 'Model A',
      created_at: '2023-04-01T00:00:00Z',
    };

    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockGeneratedModel,
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockGeneratedModel);
    expect(mockSupabase.from).toHaveBeenCalledWith('3d_generations');
  });

  it('should return 500 if there is an error getting generated model status', async () => {
    const mockUser = { id: 'user-id' };
    mockRequest.headers.set('Authorization', 'Bearer valid-token');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error'),
              }),
            }),
          }),
        }),
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe(
      'Error inserting record into Supabase: Database error',
    );
    expect(mockSupabase.from).toHaveBeenCalledWith('3d_generations');
  });
});
