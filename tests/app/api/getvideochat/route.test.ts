import type { NextRequest } from 'next/server';

import { GET } from '@/app/api/getvideochat/route';
import { createClient } from '@/utils/supabase/server';

// Mock the createClient function and Supabase client
jest.mock('@/utils/supabase/server');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            mockResolvedValue: jest.fn(),
            mockRejectedValue: jest.fn(),
          })),
        })),
      })),
    })),
  })),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('POST /api/getvideochat', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: jest.fn(),
      headers: new Headers(),
    } as unknown as NextRequest;
  });

  it('should return 400 if videoId is missing in the request body', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({});

    const response = await GET(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'Missing required parameter: videoId' });
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });

  it('should return 401 if the user is not authenticated', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      videoId: 'non-existent-id',
    });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if video generation is not found', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      videoId: 'non-existent-id',
    });
    mockRequest.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      }),
    });

    const response = await GET(mockRequest);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({
      error: 'Video generation not found or access denied',
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('video_generations');
    expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
    expect(mockSupabase.from().select().eq).toHaveBeenCalledWith(
      'task_id',
      'non-existent-id',
    );
    expect(mockSupabase.from().select().eq().eq).toHaveBeenCalledWith(
      'user_id',
      mockUser.id,
    );
  });

  it('should return 500 if there is a database error fetching video generation', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({ videoId: 'test-id' });
    mockRequest.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          }),
        }),
      }),
    });

    const response = await GET(mockRequest);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toEqual('Video generation not found or access denied');
    expect(mockSupabase.from).toHaveBeenCalledWith('video_generations');
    expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
    expect(mockSupabase.from().select().eq).toHaveBeenCalledWith(
      'task_id',
      'test-id',
    );
    expect(mockSupabase.from().select().eq().eq).toHaveBeenCalledWith(
      'user_id',
      mockUser.id,
    );
  });

  it('should return 200 with video generation details if successful', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({ videoId: 'test-id' });
    mockRequest.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    const mockVideoGeneration = {
      id: 1,
      task_id: 'test-id',
      prompt: 'Test prompt',
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockVideoGeneration,
              error: null,
            }),
          }),
        }),
      }),
    });

    const response = await GET(mockRequest);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockVideoGeneration);
    expect(mockSupabase.from).toHaveBeenCalledWith('video_generations');
    expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
    expect(mockSupabase.from().select().eq).toHaveBeenCalledWith(
      'task_id',
      'test-id',
    );
    expect(mockSupabase.from().select().eq().eq).toHaveBeenCalledWith(
      'user_id',
      mockUser.id,
    );
  });
});
