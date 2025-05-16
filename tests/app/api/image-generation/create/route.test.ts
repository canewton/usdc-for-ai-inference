import type { NextRequest } from 'next/server';

import { POST } from '@/app/api/image-generation/create/route';
import { aiGenerationPayment } from '@/app/utils/aiGenerationPayment';
import { checkDemoLimit } from '@/app/utils/demoLimit';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');
jest.mock('@/app/utils/aiGenerationPayment');
jest.mock('@/app/utils/demoLimit');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          mockResolvedValue: jest.fn(),
          mockRejectedValue: jest.fn(),
        })),
      })),
    })),
  })),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);
(checkDemoLimit as jest.Mock).mockResolvedValue({
  canGenerate: true,
  remaining: 5,
});
(aiGenerationPayment as jest.Mock).mockResolvedValue({
  data: { success: true },
});

describe('POST /api/image-generation/create', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: () =>
        Promise.resolve({
          prompt: 'test',
          chat_id: 1,
          provider: 'flux',
          url: 'http://example.com',
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

  it('should return 200 with created image for an authenticated user', async () => {
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
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockGeneratedModel,
            error: null,
          }),
        }),
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(mockGeneratedModel);
    expect(mockSupabase.from).toHaveBeenCalledWith('image_generations');
  });

  it('should return 500 if there is an error getting generated model status', async () => {
    const mockUser = { id: 'user-id' };
    mockRequest.headers.set('Authorization', 'Bearer valid-token');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe(
      'Error inserting record into Supabase: Database error',
    );
    expect(mockSupabase.from).toHaveBeenCalledWith('image_generations');
  });
});
