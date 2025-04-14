import type { NextRequest } from "next/server";

import { GET } from "@/app/api/getgeneratedmodels/route";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server");

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from:
    jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          in: jest.fn(() => ({
            order: jest.fn(() => ({
              mockResolvedValue: jest.fn(),
              mockRejectedValue: jest.fn(),
            })),
          })),
        })),
      })),
    })) ||
    jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            mockResolvedValue: jest.fn(),
            mockRejectedValue: jest.fn(),
          })),
        })),
      })),
    })),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe("GET /api/getgeneratedmodels", () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: jest.fn(),
      headers: new Headers(),
      url: "http://localhost/api/getgeneratedmodels?modelids=1&modelids=2",
    } as unknown as NextRequest;
  });

  it("should return 401 if the user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Not authenticated"),
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 200 with generated models for an authenticated user", async () => {
    mockRequest.headers.set("Authorization", "Bearer valid-token");
    const mockUser = { id: "user-id" };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockGeneratedModels = [
      { id: "1", name: "Model A", created_at: "2023-04-01T00:00:00Z" },
      { id: "2", name: "Model B", created_at: "2023-04-02T00:00:00Z" },
    ];

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockGeneratedModels,
              error: null,
            }),
          }),
        }),
      }),
    });

    const response = await GET(mockRequest);

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ models: mockGeneratedModels });
    expect(mockSupabase.from).toHaveBeenCalledWith("3d_generations");
  });

  it("should return 200 with all generated models for an authenticated user if no modelids specified", async () => {
    const mockUser = { id: "user-id" };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockGeneratedModels = [
      { id: "1", name: "Model A", created_at: "2023-04-01T00:00:00Z" },
      { id: "2", name: "Model B", created_at: "2023-04-02T00:00:00Z" },
    ];

    let otherRequest = {
      json: jest.fn(),
      headers: new Headers(),
      url: "http://localhost/api/getgeneratedimages",
    } as unknown as NextRequest;
    otherRequest.headers.set("Authorization", "Bearer valid-token");

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockGeneratedModels,
            error: null,
          }),
        }),
      }),
    });

    const response = await GET(otherRequest);

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ models: mockGeneratedModels });
    expect(mockSupabase.from).toHaveBeenCalledWith("3d_generations");
  });

  it("should return 500 if there is an error fetching generated models", async () => {
    const mockUser = { id: "user-id" };
    mockRequest.headers.set("Authorization", "Bearer valid-token");

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: new Error("Database error"),
            }),
          }),
        }),
      }),
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch models");
    expect(mockSupabase.from).toHaveBeenCalledWith("3d_generations");
  });
});
