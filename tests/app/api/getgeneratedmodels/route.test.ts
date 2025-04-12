import type { NextRequest } from 'next/server';

import { GET } from '@/app/api/getgeneratedmodels/route';
import { createClient } from '@/utils/supabase/client';

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

const mockNextRequest = (headers: Record<string, string>): NextRequest =>
  ({
    headers: new Headers(headers),
  }) as any;

describe('GET /api/getgeneratedmodels', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: jest.fn(),
      headers: new Headers(),
      url: 'http://localhost/api/getgeneratedmodels?modelids=1&modelids=2',
    } as unknown as NextRequest;
  });

  it('should return 401 if the user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: null,
      error: new Error('Not authenticated'),
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 200 with generated models for an authenticated user', async () => {
    const mockUser = { id: 'user-id' };
    const mockGeneratedModels = [
      { id: '1', name: 'Model A', created_at: '2023-04-01T00:00:00Z' },
      { id: '2', name: 'Model B', created_at: '2023-04-02T00:00:00Z' },
    ];

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          in: jest.fn().mockResolvedValue({
            order: jest.fn().mockResolvedValue({
              data: mockGeneratedModels,
              error: null,
            }),
          }),
        }),
      }),
    });

    mockRequest.headers.set('Authorization', 'Bearer valid-token');

    const response = await GET(mockRequest);

    console.log('response', response);

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockGeneratedModels);
    expect(mockSupabase.from).toHaveBeenCalledWith('generated_models');
    expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
    expect(mockSupabase.from().select().eq).toHaveBeenCalledWith(
      'user_id',
      mockUser.id,
    );
  });

  it('should return 500 if there is an error fetching generated models', async () => {
    const mockUser = { id: 'user-id' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      }),
    });

    const req = mockNextRequest({ Authorization: 'Bearer valid-token' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch generated models');
    expect(mockSupabase.from).toHaveBeenCalledWith('generated_models');
    expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
    expect(mockSupabase.from().select().eq).toHaveBeenCalledWith(
      'user_id',
      mockUser.id,
    );
  });
});
