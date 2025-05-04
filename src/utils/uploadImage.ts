import { supabase } from "@/lib/supabase";

async function uploadImage(file: File) {
  const fileName = `${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from('images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error('❌ 이미지 업로드 실패: ', error.message);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);

  return publicUrlData?.publicUrl || null;
};

export default uploadImage;