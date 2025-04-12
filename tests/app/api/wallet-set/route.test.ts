import type { NextRequest } from 'next/server';

import { PUT } from '@/app/api/wallet-set/route';
import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';

// Mock the Circle SDK
jest.mock('@/utils/developer-controlled-wallets-client', () => ({
  circleDeveloperSdk: {
    createWalletSet: jest.fn(),
  },
}));

// Mock NextRequest
const mockNextRequest = (body: any): NextRequest =>
  ({
    json: () => Promise.resolve(body),
  }) as any;

describe('PUT /api/wallet-sets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockWalletSet = {
    id: 'wallet-set-123',
    name: 'Test Entity',
    createDate: '2023-01-01T00:00:00Z',
  };

  it('should successfully create a wallet set with valid entityName', async () => {
    (circleDeveloperSdk.createWalletSet as jest.Mock).mockResolvedValue({
      data: { walletSet: mockWalletSet },
    });

    const req = mockNextRequest({ entityName: 'Test Entity' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(mockWalletSet);
    expect(circleDeveloperSdk.createWalletSet).toHaveBeenCalledWith({
      name: 'Test Entity',
    });
  });

  it('should return 400 for empty entityName', async () => {
    const testCases = [{ entityName: '' }, { entityName: '   ' }, {}];

    for (const testCase of testCases) {
      const req = mockNextRequest(testCase);
      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('entityName is required');
      expect(circleDeveloperSdk.createWalletSet).not.toHaveBeenCalled();
    }
  });

  it('should return 500 when response data is missing', async () => {
    (circleDeveloperSdk.createWalletSet as jest.Mock).mockResolvedValue({
      data: null,
    });

    const req = mockNextRequest({ entityName: 'Test Entity' });
    const response = await PUT(req);
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(text).toBe('\"The response did not include a valid wallet set\"');
  });

  it('should return 500 when walletSet creation fails', async () => {
    const errorMessage = 'API rate limit exceeded';
    (circleDeveloperSdk.createWalletSet as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    const req = mockNextRequest({ entityName: 'Test Entity' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create wallet set');
  });

  it('should log errors to console', async () => {
    const consoleSpy = jest.spyOn(console, 'error');
    const errorMessage = 'Network error';
    (circleDeveloperSdk.createWalletSet as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    const req = mockNextRequest({ entityName: 'Test Entity' });
    await PUT(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Wallet set creation failed: Network error',
    );
  });

  it('should handle non-Error exceptions', async () => {
    (circleDeveloperSdk.createWalletSet as jest.Mock).mockRejectedValue(
      'Some string error',
    );

    const req = mockNextRequest({ entityName: 'Test Entity' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create wallet set');
  });
});
