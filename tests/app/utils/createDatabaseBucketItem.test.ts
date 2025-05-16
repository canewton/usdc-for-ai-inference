import { createDatabaseBucketItem } from '@/app/utils/createDatabaseBucketItem';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');

const mockSupabase = {
  storage: {
    from: jest.fn(),
  },
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('createDatabaseBucketItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an item in the database bucket', async () => {
    mockSupabase.storage.from.mockImplementation((bucket) => {
      return {
        upload: jest.fn().mockResolvedValue({
          data: { id: '1' },
          error: null,
        }),
      };
    });

    const result = await createDatabaseBucketItem(
      'test.txt',
      'test-bucket',
      'test/test.txt',
      'text/plain',
    );
    expect(result).toEqual({
      data: { id: '1' },
      error: null,
    });
  });

  it('should return an error if unable to create item in supabase storage', async () => {
    mockSupabase.storage.from.mockImplementation((bucket) => {
      return {
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Upload error'),
        }),
      };
    });

    const result = await createDatabaseBucketItem(
      'test.txt',
      'test-bucket',
      'test/test.txt',
      'text/plain',
    );
    expect(result).toEqual({
      data: null,
      error: new Error('Upload error'),
    });
  });
});
