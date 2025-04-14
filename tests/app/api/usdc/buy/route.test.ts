import type { NextRequest } from 'next/server';

import { POST } from '@/app/api/usdc/buy/route';
import { createRampSession } from '@/utils/create-circle-ramp-session';

// Mock the createRampSession function
jest.mock('@/utils/create-circle-ramp-session', () => ({
  createRampSession: jest.fn(),
}));

// Mock NextRequest
const mockNextRequest = (body: any): NextRequest =>
  ({
    json: () => Promise.resolve(body),
  }) as any;

describe('POST /api/ramp-session', () => {
  const mockSuccessResponse = {
    data: {
      url: 'https://ramp.circle.com/buy-session/123',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createRampSession as jest.Mock).mockResolvedValue(mockSuccessResponse);
  });

  it('should return a buy ramp session URL for valid wallet address', async () => {
    const req = mockNextRequest({
      wallet_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://ramp.circle.com/buy-session/123');
    expect(createRampSession).toHaveBeenCalledWith(
      'BUY',
      '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    );
  });

  it('should return 400 when wallet_address is missing or empty', async () => {
    const testCases = [
      {}, // missing entirely
      { invalidField: 'value' }, // wrong field
    ];

    for (const testCase of testCases) {
      const req = mockNextRequest(testCase);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing wallet_address');
      expect(createRampSession).not.toHaveBeenCalled();
    }
  });

  it('should return 500 when createRampSession fails', async () => {
    const error = new Error('API unavailable');
    (createRampSession as jest.Mock).mockRejectedValue(error);

    const req = mockNextRequest({ wallet_address: '0x123abc' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error while requesting buy url');
  });

  it('should log errors to console', async () => {
    const consoleSpy = jest.spyOn(console, 'error');
    const error = new Error('Network failure');
    (createRampSession as jest.Mock).mockRejectedValue(error);

    const req = mockNextRequest({ wallet_address: '0x123abc' });
    await POST(req);

    expect(consoleSpy).toHaveBeenCalledWith('Error requesting buy url:', error);
  });

  it('should validate wallet address format', async () => {
    const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
    const req = mockNextRequest({ wallet_address: validAddress });
    await POST(req);

    expect(createRampSession).toHaveBeenCalledWith('BUY', validAddress);
  });
});
