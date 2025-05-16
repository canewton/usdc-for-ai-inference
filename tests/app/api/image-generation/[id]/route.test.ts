import type { NextRequest } from 'next/server';

import { GET } from '@/app/api/image-generation/[id]/route';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          mockResolvedValue: jest.fn(),
          mockRejectedValue: jest.fn(),
        })),
      })),
    })),
  })),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('GET /api/image-generation/[id]', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: jest.fn(),
      headers: new Headers(),
      url: 'http://localhost/api/image-generation/1',
    } as unknown as NextRequest;
  });

  it('should return 401 if the user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const response = await GET(mockRequest, { params: { id: '1' } } as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 200 with image generation for an authenticated user', async () => {
    mockRequest.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockImageGeneration = [{ id: '1' }];

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockImageGeneration,
            error: null,
          }),
        }),
      }),
    });

    const response = await GET(mockRequest, { params: { id: '1' } } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockImageGeneration);
    expect(mockSupabase.from).toHaveBeenCalledWith('image_generations');
  });

  it('should return 500 if there is an error fetching generated models', async () => {
    const mockUser = { id: 'user-id' };
    mockRequest.headers.set('Authorization', 'Bearer valid-token');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      }),
    });

    const response = await GET(mockRequest, { params: { id: '1' } } as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error fetching image generation');
    expect(mockSupabase.from).toHaveBeenCalledWith('image_generations');
  });
});
