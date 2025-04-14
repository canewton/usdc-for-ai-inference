import type { NextRequest } from 'next/server';

import { POST } from '@/app/api/wallet/balance/request/route';

// Mock environment variables
process.env.CIRCLE_BLOCKCHAIN = 'ETH';
process.env.CIRCLE_API_KEY = 'test-api-key';

// Mock global fetch
global.fetch = jest.fn() as jest.Mock;

// Mock NextRequest
const mockNextRequest = (body: any): NextRequest =>
  ({
    json: () => Promise.resolve(body),
  }) as any;

describe('POST /api/faucet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockReset();
  });

  it('should successfully request funds for valid walletAddress', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    const req = mockNextRequest({ walletAddress: '0x123...abc' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Funds requested successfully');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.circle.com/v1/faucet/drips',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        body: JSON.stringify({
          address: '0x123...abc',
          blockchain: 'ETH',
          usdc: true,
        }),
      },
    );
  });

  it('should return 400 when walletAddress is missing', async () => {
    const req = mockNextRequest({});
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('walletAddress is required');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle fetch exceptions', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const req = mockNextRequest({ walletAddress: '0x123...abc' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to request USDC via faucet');
  });
});
