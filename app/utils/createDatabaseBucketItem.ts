import { createClient } from '@/utils/supabase/server';

export async function createDatabaseBucketItem(
  file: any,
  bucketName: string,
  filePath: string,
  contentType: string,
  cacheControl?: string,
): Promise<{
  data: { path: string; fullPath: string } | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error: storageError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType,
        ...(cacheControl ? { cacheControl } : {}),
      });

    if (storageError) {
      throw storageError;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
