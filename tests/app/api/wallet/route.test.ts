import type { NextRequest } from "next/server";

import { POST } from "@/app/api/wallet/route";
import { circleDeveloperSdk } from "@/utils/developer-controlled-wallets-client";

// Mock the Circle SDK
jest.mock("@/utils/developer-controlled-wallets-client", () => ({
  circleDeveloperSdk: {
    createWallets: jest.fn(),
  },
}));

// Mock environment variables
process.env.CIRCLE_BLOCKCHAIN = "ETH";

// Mock NextRequest
const mockNextRequest = (body: any): NextRequest =>
  ({
    json: () => Promise.resolve(body),
  }) as any;

describe("POST /api/wallets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockWallet = {
    id: "wallet_123",
    address: "0x123...abc",
    blockchain: "ETH",
    walletSetId: "set_123",
  };

  it("should successfully create a wallet", async () => {
    (circleDeveloperSdk.createWallets as jest.Mock).mockResolvedValue({
      data: { wallets: [mockWallet] },
    });

    const req = mockNextRequest({ walletSetId: "set_123" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(mockWallet);
    expect(circleDeveloperSdk.createWallets).toHaveBeenCalledWith({
      accountType: "SCA",
      blockchains: ["ETH"],
      count: 1,
      walletSetId: "set_123",
    });
  });

  it("should return 400 when walletSetId is missing", async () => {
    const req = mockNextRequest({});
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("walletSetId is required");
    expect(circleDeveloperSdk.createWallets).not.toHaveBeenCalled();
  });

  it("should return 500 when no wallets are created", async () => {
    (circleDeveloperSdk.createWallets as jest.Mock).mockResolvedValue({
      data: { wallets: [] },
    });

    const req = mockNextRequest({ walletSetId: "set_123" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("No wallets were created");
  });

  it("should handle Circle API errors", async () => {
    (circleDeveloperSdk.createWallets as jest.Mock).mockRejectedValue(
      new Error("API limit exceeded"),
    );

    const req = mockNextRequest({ walletSetId: "set_123" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to create wallet: API limit exceeded");
  });

  it("should handle unknown errors", async () => {
    (circleDeveloperSdk.createWallets as jest.Mock).mockRejectedValue(
      "Non-Error thrown",
    );

    const req = mockNextRequest({ walletSetId: "set_123" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to create wallet: Unknown error");
  });
});
