import type { NextRequest } from 'next/server';

import { GET } from '@/app/api/image-generation/route';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
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

describe('GET /api/image-generation', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: jest.fn(),
      headers: new Headers(),
      url: 'http://localhost/api/image-generation',
    } as unknown as NextRequest;
  });

  it('should return 401 if the user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 200 with image generations for an authenticated user', async () => {
    mockRequest.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockGeneratedChatGenerations = [
      { id: '1', name: 'image A', created_at: '2023-04-01T00:00:00Z' },
      { id: '2', name: 'image B', created_at: '2023-04-02T00:00:00Z' },
    ];

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockGeneratedChatGenerations,
            error: null,
          }),
        }),
      }),
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockGeneratedChatGenerations);
    expect(mockSupabase.from).toHaveBeenCalledWith('image_generations');
  });

  it('should return 500 if there is an error fetching image generations', async () => {
    const mockUser = { id: 'user-id' };
    mockRequest.headers.set('Authorization', 'Bearer valid-token');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      }),
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error fetching images');
    expect(mockSupabase.from).toHaveBeenCalledWith('image_generations');
  });
});
