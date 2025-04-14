import type { NextRequest } from "next/server";

import { POST } from "@/app/api/wallet/balance/route";
import { circleDeveloperSdk } from "@/utils/developer-controlled-wallets-client";

// Mock the Circle SDK
jest.mock("@/utils/developer-controlled-wallets-client", () => ({
  circleDeveloperSdk: {
    getWalletTokenBalance: jest.fn(),
  },
}));

// Mock NextRequest
const mockNextRequest = (body: any): NextRequest =>
  ({
    json: () => Promise.resolve(body),
  }) as any;

describe("POST /api/wallet-balance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return token balances for a valid walletId", async () => {
    const mockTokenBalances = [{ tokenId: "1", amount: "100" }];
    (circleDeveloperSdk.getWalletTokenBalance as jest.Mock).mockResolvedValue({
      data: { tokenBalances: mockTokenBalances },
    });

    const req = mockNextRequest({
      walletId: "123e4567-e89b-12d3-a456-426614174000",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tokenBalances).toEqual(mockTokenBalances);
    expect(circleDeveloperSdk.getWalletTokenBalance).toHaveBeenCalledWith({
      id: "123e4567-e89b-12d3-a456-426614174000",
      includeAll: true,
    });
  });

  it("should return 400 for invalid walletId format", async () => {
    const req = mockNextRequest({ walletId: "invalid-uuid" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid walletId format");
    expect(circleDeveloperSdk.getWalletTokenBalance).not.toHaveBeenCalled();
  });

  it("should return 404 when wallet is not found", async () => {
    (circleDeveloperSdk.getWalletTokenBalance as jest.Mock).mockRejectedValue(
      new Error("Wallet not found"),
    );

    const req = mockNextRequest({
      walletId: "123e4567-e89b-12d3-a456-426614174000",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Wallet not found");
  });

  it("should return 500 for other errors", async () => {
    (circleDeveloperSdk.getWalletTokenBalance as jest.Mock).mockRejectedValue(
      new Error("Internal server error"),
    );

    const req = mockNextRequest({
      walletId: "123e4567-e89b-12d3-a456-426614174000",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error while fetching balance");
  });

  it("should handle Zod parsing errors", async () => {
    const req = mockNextRequest({ invalidField: "value" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid walletId format");
  });
});
