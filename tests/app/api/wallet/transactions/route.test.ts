import type { NextRequest } from 'next/server';

import { POST } from '@/app/api/wallet/transactions/route';
import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';

// Mock the Circle SDK
jest.mock('@/utils/developer-controlled-wallets-client', () => ({
  circleDeveloperSdk: {
    listTransactions: jest.fn(),
  },
}));

// Mock NextRequest
const mockNextRequest = (body: any): NextRequest =>
  ({
    json: () => Promise.resolve(body),
  }) as any;

describe('POST /api/wallet-transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTransactions = [
    {
      id: 'txn_123',
      amounts: ['100', '200'],
      state: 'COMPLETE',
      transactionType: 'TRANSFER',
      createDate: '2023-01-01T00:00:00Z',
    },
  ];

  it('should return transactions for a valid walletId', async () => {
    (circleDeveloperSdk.listTransactions as jest.Mock).mockResolvedValue({
      data: { transactions: mockTransactions },
    });

    const req = mockNextRequest({
      walletId: '123e4567-e89b-12d3-a456-426614174000',
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transactions).toEqual([
      {
        id: 'txn_123',
        amount: ['100', '200'],
        status: 'COMPLETE',
        transactionType: 'TRANSFER',
        createDate: '2023-01-01T00:00:00Z',
      },
    ]);
    expect(circleDeveloperSdk.listTransactions).toHaveBeenCalledWith({
      walletIds: ['123e4567-e89b-12d3-a456-426614174000'],
      includeAll: true,
    });
  });

  it('should return 400 for invalid walletId format', async () => {
    const req = mockNextRequest({ walletId: 'invalid-uuid' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid walletId format');
    expect(circleDeveloperSdk.listTransactions).not.toHaveBeenCalled();
  });

  it('should return 404 when no transactions are found', async () => {
    (circleDeveloperSdk.listTransactions as jest.Mock).mockResolvedValue({
      data: { transactions: [] },
    });

    const req = mockNextRequest({
      walletId: '123e4567-e89b-12d3-a456-426614174000',
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No transactions found');
  });

  it('should return 404 when wallet is not found', async () => {
    (circleDeveloperSdk.listTransactions as jest.Mock).mockRejectedValue(
      new Error('Wallet not found'),
    );

    const req = mockNextRequest({
      walletId: '123e4567-e89b-12d3-a456-426614174000',
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Wallet not found');
  });

  it('should return 500 for other errors', async () => {
    (circleDeveloperSdk.listTransactions as jest.Mock).mockRejectedValue(
      new Error('Internal server error'),
    );

    const req = mockNextRequest({
      walletId: '123e4567-e89b-12d3-a456-426614174000',
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe(
      'Internal server error while fetching transactions',
    );
  });

  it('should handle Zod parsing errors', async () => {
    const req = mockNextRequest({ invalidField: 'value' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid walletId format');
  });

  it('should properly transform transaction data', async () => {
    const mockTxWithExtraFields = [
      {
        id: 'txn_456',
        amounts: ['300'],
        state: 'PENDING',
        transactionType: 'MINT',
        createDate: '2023-01-02T00:00:00Z',
        extraField: 'should be excluded',
        circleContractAddress: '0x123...',
      },
    ];

    (circleDeveloperSdk.listTransactions as jest.Mock).mockResolvedValue({
      data: { transactions: mockTxWithExtraFields },
    });

    const req = mockNextRequest({
      walletId: '123e4567-e89b-12d3-a456-426614174000',
    });
    const response = await POST(req);
    const data = await response.json();

    expect(data.transactions).toEqual([
      {
        id: 'txn_456',
        amount: ['300'],
        status: 'PENDING',
        transactionType: 'MINT',
        createDate: '2023-01-02T00:00:00Z',
      },
    ]);
    expect(data.transactions[0]).not.toHaveProperty('extraField');
    expect(data.transactions[0]).not.toHaveProperty('circleContractAddress');
  });
});
