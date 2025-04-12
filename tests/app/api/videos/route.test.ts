import { GET } from '@/app/api/videos/route';
import { createClient } from '@/utils/supabase/client';

// Mock the createClient function and Supabase client
jest.mock('@/utils/supabase/client');

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

describe('GET /api/videos', () => {
  let mockReq: Request;

  beforeEach(() => {
    // Reset the mock before each test
    jest.clearAllMocks();
    mockReq = {
      headers: new Headers(),
    } as Request;
  });

  it('should return 401 if Authorization header is missing', async () => {
    const response = await GET(mockReq);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization token is invalid or user not found', async () => {
    mockReq.headers.set('Authorization', 'Bearer invalid-token');
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid token'),
    });

    const response = await GET(mockReq);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('invalid-token');
  });

  it('should return 401 if getUser returns an error', async () => {
    mockReq.headers.set('Authorization', 'Bearer valid-token');
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Auth error'),
    });

    const response = await GET(mockReq);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('valid-token');
  });

  it('should return 500 if there is an error fetching video generations', async () => {
    mockReq.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };

    // Mock the user authentication
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock the database query chain to return an error
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

    const response = await GET(mockReq);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch video generations' });
    expect(mockSupabase.from).toHaveBeenCalledWith('video_generations');
    expect(mockSupabase.from().select).toHaveBeenCalledWith(
      'id, prompt, task_id, processing_status, created_at',
    );
    expect(mockSupabase.from().select().eq).toHaveBeenCalledWith(
      'user_id',
      mockUser.id,
    );
    expect(mockSupabase.from().select().eq().order).toHaveBeenCalledWith(
      'created_at',
      { ascending: false },
    );
  });

  it('should return 200 with video generations if successful', async () => {
    mockReq.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    const mockVideoGenerations = [
      {
        id: 1,
        prompt: 'Prompt 1',
        task_id: 'task-1',
        processing_status: 'completed',
        created_at: '2025-04-12T00:00:00.000Z',
      },
      {
        id: 2,
        prompt: 'Prompt 2',
        task_id: 'task-2',
        processing_status: 'pending',
        created_at: '2025-04-11T00:00:00.000Z',
      },
    ];
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockVideoGenerations,
            error: null,
          }),
        }),
      }),
    });

    const response = await GET(mockReq);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ videoGenerations: mockVideoGenerations });
    expect(mockSupabase.from).toHaveBeenCalledWith('video_generations');
    expect(mockSupabase.from().select).toHaveBeenCalledWith(
      'id, prompt, task_id, processing_status, created_at',
    );
    expect(mockSupabase.from().select().eq).toHaveBeenCalledWith(
      'user_id',
      mockUser.id,
    );
    expect(mockSupabase.from().select().eq().order).toHaveBeenCalledWith(
      'created_at',
      { ascending: false },
    );
  });

  it('should handle generic errors during the process', async () => {
    mockReq.headers.set('Authorization', 'Bearer valid-token');
    mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'));

    const response = await GET(mockReq);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Unexpected error' });
    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('valid-token');
  });
});
