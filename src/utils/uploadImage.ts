async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await res.json();

  if (!res.ok) {
    console.error('❌ 이미지 업로드 실패:', result.error);
    return null;
  }

  return result.url;
};

export default uploadImage;