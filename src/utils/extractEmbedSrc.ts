// 구글맵의 "지도 퍼가기"는 <iframe ...> 태그 전체를 복사해 준다.
// 태그를 통째로 붙여넣어도 src만 꺼내 쓰고, 주소만 붙여넣으면 그대로 쓴다.
function extractEmbedSrc(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (!/^<iframe\b/i.test(value)) return value;

  const match = value.match(/\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const src = (match?.[1] ?? match?.[2] ?? '').trim();
  return src ? src.replace(/&amp;/g, '&') : null;
}

export default extractEmbedSrc;
