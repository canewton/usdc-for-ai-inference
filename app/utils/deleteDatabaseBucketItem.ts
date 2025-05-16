import { createClient } from '@/utils/supabase/server';

export async function deleteDatabaseBucketItem(
  url: string | null,
): Promise<any> {
  try {
    const supabase = await createClient();

    if (url) {
      const bucket = url.split('/storage/v1/object/public/')[1].split('/')[0];
      const filePath = url.split(`/storage/v1/object/public/${bucket}/`)[1];

      if (filePath) {
        const { data, error: storageError } = await supabase.storage
          .from(bucket)
          .remove([filePath]);
        if (storageError) {
          console.warn('Storage file deletion failed:', storageError.message);
          throw new Error(
            `Failed to delete file from storage: ${storageError.message}`,
          );
        }

        return data;
      }

      console.warn('File path is null or undefined. Cannot delete item.');
      throw new Error('File path is null or undefined. Cannot delete item.');
    }

    console.warn('URL is null or undefined. Cannot delete item.');
    throw new Error('URL is null or undefined. Cannot delete item.');
  } catch (error) {
    return null;
  }
}
