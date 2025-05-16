import type { NextRequest } from 'next/server';

import { DELETE } from '@/app/api/video-generation/delete/[id]/route';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              mockResolvedValue: jest.fn(),
              mockRejectedValue: jest.fn(),
            })),
          })),
        })),
      })),
    })),
  })),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('DELETE /api/video-generation/delete/[id]', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: jest.fn(),
      headers: new Headers(),
      url: 'http://localhost/api/video-generation/delete/1',
    } as unknown as NextRequest;
  });

  it('should return 401 if the user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const response = await DELETE(mockRequest, { params: { id: '1' } } as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 200 and delete video generation for an authenticated user', async () => {
    mockRequest.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockGenerateVideoGeneration = {
      id: '1',
      name: 'Model A',
      created_at: '2023-04-01T00:00:00Z',
    };

    mockSupabase.from.mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockGenerateVideoGeneration,
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    const response = await DELETE(mockRequest, { params: { id: '1' } } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockGenerateVideoGeneration);
    expect(mockSupabase.from).toHaveBeenCalledWith('video_generations');
  });

  it('should return 500 if there is an error deleting video generation', async () => {
    const mockUser = { id: 'user-id' };
    mockRequest.headers.set('Authorization', 'Bearer valid-token');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error'),
              }),
            }),
          }),
        }),
      }),
    });

    const response = await DELETE(mockRequest, { params: { id: '1' } } as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database error');
    expect(mockSupabase.from).toHaveBeenCalledWith('video_generations');
  });
});
