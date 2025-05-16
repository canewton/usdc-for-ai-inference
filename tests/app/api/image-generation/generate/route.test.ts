import type { NextRequest } from 'next/server';
import Replicate from 'replicate';

import { POST } from '@/app/api/image-generation/generate/route';
import { createDatabaseBucketItem } from '@/app/utils/createDatabaseBucketItem';
import { checkDemoLimit } from '@/app/utils/demoLimit';
import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');
jest.mock('@/app/utils/demoLimit');
jest.mock('@/utils/developer-controlled-wallets-client');
jest.mock('@/app/utils/createDatabaseBucketItem');
jest.mock('replicate');

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

const mockReplicate = {
  run: jest.fn(),
};

(Replicate as jest.Mock).mockReturnValue(mockReplicate);
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

describe('POST /api/image-generation/generate', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: () =>
        Promise.resolve({
          provider: 'flux',
          output_quality: 'medium',
          chat_id: 1,
          prompt: 'test',
          aspect_ratio: '1:1',
          circle_wallet_id: '1',
        }),
      headers: new Headers(),
      url: 'http://localhost/api/image-generation/generate',
    } as unknown as NextRequest;

    global.fetch = jest.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve('blob'),
        ok: true,
      }),
    ) as jest.Mock;

    mockReplicate.run.mockResolvedValue(['http://example.com']);
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

  it('should return 200 with generated videos for an authenticated user', async () => {
    mockRequest.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.prompt).toEqual('test');
  });
});
