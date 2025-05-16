import { streamText } from 'ai';
import type { NextRequest } from 'next/server';

import { POST } from '@/app/api/chat-generation/generate/route';
import { checkDemoLimit } from '@/app/utils/demoLimit';
import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');
jest.mock('@/app/utils/demoLimit');
jest.mock('@/utils/developer-controlled-wallets-client');
jest.mock('ai');

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

const mockStream = {
  toDataStreamResponse: jest.fn(),
};

(streamText as jest.Mock).mockReturnValue(mockStream);
(createClient as jest.Mock).mockReturnValue(mockSupabase);
(circleDeveloperSdk.getWalletTokenBalance as jest.Mock).mockResolvedValue({
  data: { tokenBalances: [{ token: { symbol: 'USDC', id: 1 }, amount: '10' }] },
});
(checkDemoLimit as jest.Mock).mockResolvedValue({
  canGenerate: true,
  remaining: 5,
});

describe('POST /api/chat-generation/generate', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: () =>
        Promise.resolve({
          messages: [],
          provider: 'gpt-4o',
          max_tokens: 1000,
          circle_wallet_id: '1',
        }),
      headers: new Headers(),
      url: 'http://localhost/api/chat-generation/generate',
    } as unknown as NextRequest;

    mockStream.toDataStreamResponse.mockResolvedValue({
      text: 'text response',
    });
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

  it('should return 200 with generated text for an authenticated user', async () => {
    mockRequest.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const response = await POST(mockRequest);

    expect(response.text).toEqual('text response');
  });
});
