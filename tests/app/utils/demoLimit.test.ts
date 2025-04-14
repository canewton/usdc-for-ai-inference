import { checkDemoLimit } from "@/app/utils/demoLimit";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server");

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        mockResolvedValue: jest.fn(),
        mockRejectedValue: jest.fn(),
      })),
    })),
  })),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe("checkDemoLimit", () => {
  it("should return the ai inference limit", async () => {
    var changeUrlBack = false;
    if (!process.env.NEXT_PUBLIC_VERCEL_URL) {
      process.env.NEXT_PUBLIC_VERCEL_URL = "test.vercel.app";
      changeUrlBack = true;
    }

    const mockGeneratedAI = [
      { id: "1", name: "Chat A", created_at: "2023-04-01T00:00:00Z" },
    ];

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockGeneratedAI,
          error: null,
        }),
      }),
    });

    let response = await checkDemoLimit("1");
    expect(response.canGenerate).toBe(true);
    expect(response.remaining).toBe(2);

    if (changeUrlBack) {
      process.env.NEXT_PUBLIC_VERCEL_URL = "";
    }
  });

  it("should handle database errors", async () => {
    var changeUrlBack = false;
    if (!process.env.NEXT_PUBLIC_VERCEL_URL) {
      process.env.NEXT_PUBLIC_VERCEL_URL = "test.vercel.app";
      changeUrlBack = true;
    }

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Database error"),
        }),
      }),
    });

    let response = await checkDemoLimit("1");
    expect(response.canGenerate).toBe(true);
    expect(response.remaining).toBe(5);

    if (changeUrlBack) {
      process.env.NEXT_PUBLIC_VERCEL_URL = "";
    }
  });
});
