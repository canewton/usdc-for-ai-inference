import type { NextRequest } from 'next/server';

import { POST } from '@/app/api/video-generation/generation-status/route';
import { createDatabaseBucketItem } from '@/app/utils/createDatabaseBucketItem';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');
jest.mock('@/app/utils/createDatabaseBucketItem');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    update: jest.fn(() => ({
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
(createDatabaseBucketItem as jest.Mock).mockResolvedValue({
  data: {
    fullPath:
      'user-images/b09e9c64-4406-4e9d-853e-14219129b1a4_fc116881-ec7b-4c66-adc0-7e656a12db4d.webp',
  },
});

describe('POST /api/video-generation/generation-status', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: () =>
        Promise.resolve({
          task_id: 1,
        }),
      headers: new Headers(),
      url: 'http://localhost/api/video-generation/generation-status',
    } as unknown as NextRequest;
  });

  it('should return 401 if the user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 200 with generated model status for an authenticated user', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            videos: ['http://example.com'],
            task: { status: 'succeeded' },
          }),
        blob: () => Promise.resolve('blob'),
        ok: true,
      }),
    ) as jest.Mock;

    mockRequest.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockGeneratedModel = {
      id: '1',
      name: 'Model A',
      created_at: '2023-04-01T00:00:00Z',
    };

    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockGeneratedModel,
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.videos[0]).toEqual('http://example.com');
    expect(mockSupabase.from).toHaveBeenCalledWith('video_generations');
  });

  it('should return 500 if there is an error getting generated model status', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            videos: ['http://example.com'],
            task: { status: 'succeeded' },
          }),
        ok: false,
      }),
    ) as jest.Mock;

    const mockUser = { id: 'user-id' };
    mockRequest.headers.set('Authorization', 'Bearer valid-token');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
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

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error from Novita API');
    expect(mockSupabase.from).toHaveBeenCalledWith('video_generations');
  });
});
