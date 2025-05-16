import type { NextRequest } from 'next/server';

import { POST } from '@/app/api/3d-generation/generate/route';
import { createDatabaseBucketItem } from '@/app/utils/createDatabaseBucketItem';
import { checkDemoLimit } from '@/app/utils/demoLimit';
import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');
jest.mock('@/app/utils/demoLimit');
jest.mock('@/utils/developer-controlled-wallets-client');
jest.mock('@/app/utils/createDatabaseBucketItem');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          mockResolvedValue: jest.fn(),
          mockRejectedValue: jest.fn(),
        })),
      })),
    })),
  })),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);
(circleDeveloperSdk.getWalletTokenBalance as jest.Mock).mockResolvedValue({
  data: { tokenBalances: [{ token: { symbol: 'USDC', id: 1 }, amount: 10 }] },
});
(checkDemoLimit as jest.Mock).mockResolvedValue({
  canGenerate: true,
  remaining: 5,
});
(createDatabaseBucketItem as jest.Mock).mockResolvedValue({
  data: {
    fullPath:
      'user-images/b09e9c64-4406-4e9d-853e-14219129b1a4_fc116881-ec7b-4c66-adc0-7e656a12db4d.webp',
  },
});

describe('POST /api/3d-generation/generate', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: () =>
        Promise.resolve({
          image_url:
            'https://gnsrqnjozcseghlllguk.supabase.co/storage/v1/object/public/user-images/b09e9c64-4406-4e9d-853e-14219129b1a4_fc116881-ec7b-4c66-adc0-7e656a12db4d.webp',
          should_texture: true,
          texture_prompt: 'metal',
          circle_wallet_id: 1,
          title: 'Test Model',
        }),
      headers: new Headers(),
      url: 'http://localhost/api/3d-generation/generate',
    } as unknown as NextRequest;

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ result: 1 }),
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

  it('should return 200 with generated models for an authenticated user', async () => {
    mockRequest.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockGeneratedModels = {
      id: '1',
      name: 'Model A',
      created_at: '2023-04-01T00:00:00Z',
    };

    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockGeneratedModels,
            error: null,
          }),
        }),
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockGeneratedModels);
    expect(mockSupabase.from).toHaveBeenCalledWith('3d_generations');
  });

  it('should return 500 if there is an error fetching generated models', async () => {
    const mockUser = { id: 'user-id' };
    mockRequest.headers.set('Authorization', 'Bearer valid-token');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error saving 3d generation');
    expect(mockSupabase.from).toHaveBeenCalledWith('3d_generations');
  });
});
