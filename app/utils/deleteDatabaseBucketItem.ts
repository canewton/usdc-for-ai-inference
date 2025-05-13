import { createClient } from '@/utils/supabase/server';

export async function deleteDatabaseBucketItem(
  url: string | null,
): Promise<void> {
  const supabase = await createClient();

  if (url) {
    const bucket = url.split('/storage/v1/object/public/')[1].split('/')[0];
    const filePath = url.split(
      `/storage/v1/object/public/video-gen/${bucket}/`,
    )[1];
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);
      if (storageError) {
        console.warn('Storage file deletion failed:', storageError.message);
      }
    }
  }
}
