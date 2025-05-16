import { POST } from '@/app/api/wallet/transfer/route';
import { circleWalletTransfer } from '@/app/utils/circleWalletTransfer';

// Mock the circleWalletTransfer function
jest.mock('@/app/(ai)/server/circleWalletTransfer', () => ({
  circleWalletTransfer: jest.fn(),
}));

describe('POST /api/wallet-transfer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTransferRequest = {
    projectName: 'test-project',
    aiModel: 'gpt-4',
    circleWalletId: '123e4567-e89b-12d3-a456-426614174000',
    amount: '100',
  };

  const mockSuccessResponse = {
    transactionId: 'txn_123456789',
    status: 'pending',
    amount: '100',
  };

  it('should successfully process a wallet transfer', async () => {
    (circleWalletTransfer as jest.Mock).mockResolvedValue(mockSuccessResponse);

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockTransferRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(mockSuccessResponse);
    expect(circleWalletTransfer).toHaveBeenCalledWith(
      'test-project',
      'gpt-4',
      '123e4567-e89b-12d3-a456-426614174000',
      '100',
    );
  });

  it('should return 500 when transfer fails', async () => {
    const errorMessage = 'Insufficient funds';
    (circleWalletTransfer as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockTransferRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe(
      `Transfer failed with error: Error: ${errorMessage}`,
    );
  });

  it('should handle invalid request body', async () => {
    const invalidRequest = {
      ...mockTransferRequest,
      amount: undefined, // Missing required field
    };

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Transfer failed with error');
  });

  it('should log errors to console', async () => {
    const consoleSpy = jest.spyOn(console, 'error');
    const errorMessage = 'Network error';
    (circleWalletTransfer as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockTransferRequest),
    });

    await POST(request);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Transfer failed:',
      expect.any(Error),
    );
  });

  it('should handle different amount formats', async () => {
    (circleWalletTransfer as jest.Mock).mockResolvedValue({
      ...mockSuccessResponse,
      amount: '0.5',
    });

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...mockTransferRequest,
        amount: '0.5',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.amount).toBe('0.5');
  });
});
