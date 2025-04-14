import type { NextRequest } from 'next/server';

import { POST } from '@/app/api/usdc/sell/route';
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
      url: 'https://ramp.circle.com/session/123',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createRampSession as jest.Mock).mockResolvedValue(mockSuccessResponse);
  });

  it('should return a ramp session URL for valid wallet address', async () => {
    const req = mockNextRequest({ wallet_address: '0x123abc' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://ramp.circle.com/session/123');
    expect(createRampSession).toHaveBeenCalledWith('SELL', '0x123abc');
  });

  it('should return 500 when wallet_address is missing', async () => {
    const testCases = [{}, { invalidField: 'value' }];

    for (const testCase of testCases) {
      const req = mockNextRequest(testCase);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Missing wallet_address');
      expect(createRampSession).not.toHaveBeenCalled();
    }
  });

  it('should return 500 when createRampSession fails', async () => {
    (createRampSession as jest.Mock).mockRejectedValue(new Error('API error'));

    const req = mockNextRequest({ wallet_address: '0x123abc' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error while requesting sell url');
  });

  it('should handle different wallet address formats', async () => {
    const testAddresses = [
      '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Ethereum
      '0x123', // Short address
      '0x' + 'a'.repeat(40), // Long address
    ];

    for (const address of testAddresses) {
      const req = mockNextRequest({ wallet_address: address });
      await POST(req);

      expect(createRampSession).toHaveBeenCalledWith('SELL', address);
      (createRampSession as jest.Mock).mockClear();
    }
  });

  it('should log errors to console', async () => {
    const consoleSpy = jest.spyOn(console, 'error');
    const testError = new Error('Test error');
    (createRampSession as jest.Mock).mockRejectedValue(testError);

    const req = mockNextRequest({ wallet_address: '0x123abc' });
    await POST(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error requesting sell url:',
      testError,
    );
  });
});
