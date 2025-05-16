import { deleteDatabaseBucketItem } from '@/app/utils/deleteDatabaseBucketItem';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');

const mockSupabase = {
  storage: {
    from: jest.fn(),
  },
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('deleteDatabaseBucketItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete an item in the database bucket', async () => {
    const mockUrl =
      'https://gnsrqnjozcseghlllguk.supabase.co/storage/v1/object/public/user-images/b09e9c64-4406-4e9d-853e-14219129b1a4_fc116881-ec7b-4c66-adc0-7e656a12db4d.webp';
    mockSupabase.storage.from.mockImplementation((bucket) => {
      return {
        remove: jest.fn().mockResolvedValue({
          data: { id: '1' },
          error: null,
        }),
      };
    });

    const result = await deleteDatabaseBucketItem(mockUrl);
    expect(result).toEqual({ id: '1' });
  });

  it('should return an error if unable to delete item in supabase storage', async () => {
    mockSupabase.storage.from.mockImplementation((bucket) => {
      return {
        remove: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Delete error'),
        }),
      };
    });

    const mockUrl =
      'https://gnsrqnjozcseghlllguk.supabase.co/storage/v1/object/public/user-images/b09e9c64-4406-4e9d-853e-14219129b1a4_fc116881-ec7b-4c66-adc0-7e656a12db4d.webp';
    const result = await deleteDatabaseBucketItem(mockUrl);

    expect(result).toEqual(null);
  });
});
