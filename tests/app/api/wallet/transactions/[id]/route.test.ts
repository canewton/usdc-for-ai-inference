import type { NextRequest } from 'next/server';

import { GET } from '@/app/api/wallet/transactions/[id]/route';
import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';

// Mock the Circle SDK
jest.mock('@/utils/developer-controlled-wallets-client', () => ({
  circleDeveloperSdk: {
    getTransaction: jest.fn(),
  },
}));

describe('GET /api/transactions/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTransaction = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    amounts: ['100', '200'],
    state: 'COMPLETE',
    createDate: '2023-01-01T00:00:00Z',
    blockchain: 'ETH',
    transactionType: 'TRANSFER',
    updateDate: '2023-01-01T00:01:00Z',
  };

  it('should return transaction details for a valid transaction ID', async () => {
    (circleDeveloperSdk.getTransaction as jest.Mock).mockResolvedValue({
      data: { transaction: mockTransaction },
    });

    const params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    const response = await GET({} as NextRequest, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transaction).toEqual({
      id: '123e4567-e89b-12d3-a456-426614174000',
      amounts: ['100', '200'],
      state: 'COMPLETE',
      createDate: '2023-01-01T00:00:00Z',
      blockchain: 'ETH',
      transactionType: 'TRANSFER',
      updateDate: '2023-01-01T00:01:00Z',
    });
    expect(circleDeveloperSdk.getTransaction).toHaveBeenCalledWith({
      id: '123e4567-e89b-12d3-a456-426614174000',
    });
  });

  it('should return 400 for invalid transaction ID format', async () => {
    const params = { id: 'invalid-id' };
    const response = await GET({} as NextRequest, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid transaction ID format');
    expect(circleDeveloperSdk.getTransaction).not.toHaveBeenCalled();
  });

  it('should return 404 when transaction is not found', async () => {
    (circleDeveloperSdk.getTransaction as jest.Mock).mockResolvedValue({
      data: { transaction: undefined },
    });

    const params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    const response = await GET({} as NextRequest, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Transaction not found');
  });

  it('should return 404 when Circle API returns not found error', async () => {
    (circleDeveloperSdk.getTransaction as jest.Mock).mockRejectedValue(
      new Error('Transaction not found'),
    );

    const params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    const response = await GET({} as NextRequest, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Transaction not found');
  });

  it('should return 500 for invalid response from Circle API', async () => {
    (circleDeveloperSdk.getTransaction as jest.Mock).mockResolvedValue({
      data: { transaction: { invalid: 'data' } }, // Missing required fields
    });

    const params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    const response = await GET({} as NextRequest, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Invalid response from Circle API');
  });

  it('should return 500 for other errors', async () => {
    (circleDeveloperSdk.getTransaction as jest.Mock).mockRejectedValue(
      new Error('Internal server error'),
    );

    const params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    const response = await GET({} as NextRequest, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error while fetching transaction');
  });

  it('should handle optional amounts field', async () => {
    const transactionWithoutAmounts = {
      ...mockTransaction,
      amounts: undefined,
    };

    (circleDeveloperSdk.getTransaction as jest.Mock).mockResolvedValue({
      data: { transaction: transactionWithoutAmounts },
    });

    const params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    const response = await GET({} as NextRequest, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transaction.amounts).toBeUndefined();
  });
});
