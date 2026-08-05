// Next.js는 동적 세그먼트를 URL에 적힌 그대로(퍼센트 인코딩된 상태로) 넘긴다.
// 한글 슬러그는 그래서 DB에 저장된 값과 직접 비교하면 절대 맞지 않는다.
//
// 슬러그에는 slugify가 문자·숫자·하이픈만 남기므로 '%'가 들어갈 일이 없다.
// 이미 디코딩된 값을 한 번 더 디코딩해도 값이 바뀌지 않는다는 뜻이라,
// 서버/클라이언트 어느 쪽에서 호출해도 안전하다.
//
// 깨진 인코딩(예: '%E0%A4')은 URIError를 던지므로 원문을 그대로 돌려준다.
// 그런 값은 어차피 조회에 실패해 404로 이어진다.
export default function decodeSlugParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
