import type { NextRequest } from 'next/server';

import { POST } from '@/app/api/postimagegeneration/route';
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
(checkDemoLimit as jest.Mock).mockReturnValue({
  canGenerate: true,
  remaining: 5,
});
(aiGenerationPayment as jest.Mock).mockReturnValue({
  circle_transaction_id: 'transaction-id',
});

describe('GET /api/postimagegeneration', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: jest.fn().mockResolvedValue({
        prompt: 'make a cake',
        chat_id: '1',
        provider: 'gpt-4o',
        url: 'http://example.com',
      }),
      headers: new Headers(),
      url: 'http://localhost/api/postimagegeneration',
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

  it('should return 201 with generated image for an authenticated user', async () => {
    mockRequest.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockGeneratedImage = {
      id: '1',
      name: 'Image A',
      created_at: '2023-04-01T00:00:00Z',
    };

    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockGeneratedImage,
            error: null,
          }),
        }),
      }),
    });

    const response = await POST(mockRequest);

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(mockGeneratedImage);
    expect(mockSupabase.from).toHaveBeenCalledWith('image_generations');
  });

  it('should return 500 if there is an error posting generated image', async () => {
    mockRequest.headers.set('Authorization', 'Bearer valid-token');
    const mockUser = { id: 'user-id' };
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
    expect(data.error).toEqual(
      'Error inserting record into Supabase: Database error',
    );
    expect(mockSupabase.from).toHaveBeenCalledWith('image_generations');
  });
});
