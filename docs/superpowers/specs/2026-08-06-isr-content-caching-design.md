# 콘텐츠 페이지 ISR 도입 설계

작성일: 2026-08-06
대상: yooni-page (https://yooni.seoul.kr)

## 배경

소프트 404를 고치면서 `src/app/loading.tsx`를 제거했다(커밋 85c413e).
그 파일이 트리 최상단에 Suspense 경계를 만들어 셸을 먼저 흘려보냈고,
응답 상태가 200으로 굳은 뒤에 던진 `notFound()`가 상태 코드를 바꾸지 못했기 때문이다.

수정 자체는 프로덕션에서 의도대로 동작한다. 없는 글·카테고리·시리즈·경로·UUID가 모두 404를 반환한다.

그런데 경계를 걷어내자 그동안 스피너에 가려져 있던 서버 렌더링 지연이 드러났다.

| 경로 | 프로덕션 TTFB (6회 측정) |
| --- | --- |
| `/` | 1.14 – 2.69초 |
| `/travel/신혼여행-톨레도` | 0.78 – 1.55초 |
| `/talk/no-such-post-xyz` | 0.48 – 1.07초 |

콜드 스타트가 아니다(6회 연속 모두 느리다). 네트워크도 아니다(`time_connect` 7–17ms).
이 지연은 이번 변경이 만든 것이 아니라 원래 있던 것이며,
`loading.tsx`가 13ms만에 스피너를 띄워 가리고 있었을 뿐이다.
콘텐츠가 도착하는 시점은 전후가 같고, 그 사이 보이는 것만 스피너에서 흰 화면으로 바뀌었다.

## 현재 상태 진단

### 모든 콘텐츠 페이지가 캐싱 없는 동적 렌더링이다

빌드 라우트 표의 `Revalidate` 열이 전부 비어 있다.

```
┌ ƒ /                                Revalidate: (없음)
├ ƒ /[category]                      Revalidate: (없음)
├ ƒ /[category]/[slug]               Revalidate: (없음)
├ ƒ /[category]/series/[seriesSlug]  Revalidate: (없음)
└ ○ /sitemap.xml                     Revalidate: 1h
```

매 요청마다 Vercel 함수(`x-vercel-id`가 `icn1::iad1::` — 서울 엣지, 워싱턴 리전 실행)에서
Supabase를 왕복한다. 404 페이지조차 0.5–1.0초가 걸리는데, 이는 DB 왕복 한 번의 비용이다.

### 원인은 Supabase 클라이언트가 Next.js 데이터 캐시를 우회하는 것

`src/lib/supabasePublic.ts`의 `createClient`는 `supabase-js` 자체 fetch를 쓴다.
Next.js의 캐싱 확장(`next: { revalidate }`)을 타지 않으므로 데이터 캐시에 들어가지 않고,
세그먼트에 `revalidate` 선언도 없어 라우트가 동적으로 남는다.

### ISR을 막는 구조적 장애물은 없다

전수 확인 결과:

- `cookies()`, `headers()`를 쓰는 곳이 없다.
- 루트 `layout.tsx`가 서버에서 세션을 조회하지 않는다. 인증은 클라이언트(next-auth)에서 처리한다.
- 댓글은 `src/components/Comment/index.tsx`가 `/api/comments`로 클라이언트에서 가져온다.
  정적화해도 댓글은 실시간으로 유지된다.
- `src/app/page.tsx:1`의 `export const dynamic = 'auto'`는 기본값이라 동작에 영향이 없다.

## 목표

1. 콘텐츠 페이지 TTFB를 CDN 서빙 수준(수십 ms)으로 낮춘다.
2. 방금 고친 404 동작을 유지한다.
3. 글을 쓰거나 고치면 즉시 반영된다.

## 설계

### 1. 세그먼트 캐싱 전환

네 개 콘텐츠 라우트에 `export const revalidate = 3600`을 선언한다.
시간 기반 재생성은 즉시 무효화가 실패했을 때의 백스톱이고, 평소 갱신은 무효화가 담당한다.

`/[category]/[slug]`와 `/[category]/series/[seriesSlug]`에 `generateStaticParams`를 추가해
발행된(`isPublished = true`) 글과 시리즈를 빌드 시점에 생성한다.
크롤러가 어떤 글의 첫 방문자가 되더라도 캐시된 응답을 받게 하려는 것이다.

`dynamicParams`는 기본값 `true`로 둔다.
`false`로 하면 빌드 이후에 쓴 새 글이 404가 되는데, `revalidatePath`는 기존 경로를 무효화할 뿐
params 목록에 새 경로를 추가하지 않으므로 즉시 무효화로도 이를 구제할 수 없다.

### 2. 즉시 무효화

`/api/posts`의 POST·PUT·DELETE에서 영향받는 경로를 무효화한다.

| 무효화 대상 | 이유 |
| --- | --- |
| `/[category]/[slug]` | 글 본문 |
| `/[category]` | 카테고리 목록의 제목·날짜 |
| `/` | 홈의 최신 글 |
| `/[category]/series/[seriesSlug]` | 시리즈 소속일 때 목차·순서 |

수정으로 글이 시리즈를 옮겼다면 이전 시리즈와 새 시리즈 양쪽을 무효화한다.
`isPublished`가 꺼지거나 켜질 때도 같은 경로들이 바뀐다.

`/api/series`의 POST·PUT·DELETE도 같은 처리가 필요하다.
시리즈 제목·설명은 시리즈 페이지와 홈의 시리즈 목록에, 시리즈 삭제는 소속 글들의 페이지에 영향을 준다.

### 3. 404 동작 보존

정적 생성된 글은 CDN에서 200으로 나온다.
없는 slug는 `dynamicParams = true`에 따라 함수에서 렌더되어 `notFound()`가 404를 낸다.

`src/app/routeBoundaries.test.ts`가 지키는 불변식(`notFound()`가 닿는 서브트리 위에 `loading.tsx` 없음)은
이번 변경으로 깨지지 않는다. ISR은 Suspense 경계를 도입하지 않는다.

다만 **ISR에서 404 상태 코드가 실제로 유지되는지는 구현 중 실측으로 확인한다.**
이번 작업에서 로컬 TTFB(73–110ms)로 프로덕션(0.8–2.7초)을 예측했다가 10–20배 빗나갔으므로,
로컬 추론만으로 결론 내리지 않는다.

### 4. 감수하는 부작용

`src/app/layout.tsx`의 `shuffleArray(mainYooniMessages)`가 지금은 매 요청 셔플되지만,
정적화되면 재생성 시점에만 바뀐다. 상단 배너 문구 순서가 고정된다는 뜻이다.
셔플 코드는 손대지 않기로 했다.

## 검증

| 항목 | 방법 |
| --- | --- |
| 캐싱 적용 | 빌드 라우트 표에서 `ƒ` → `●` 전환 확인 |
| 404 유지 | 로컬·프로덕션 양쪽에서 404 매트릭스 재실행 |
| TTFB | 프로덕션 배포 후 재측정, 목표는 수십 ms |
| 즉시 반영 | 글 수정 후 해당 글·카테고리·홈이 바로 바뀌는지 확인 |
| 회귀 | 기존 37개 테스트, 스크린샷 5종 |

프로덕션 검증이 필수다. 로컬 빌드는 Vercel의 캐싱·리전 동작을 재현하지 못한다.

## 범위 밖

- `shuffleArray` 동작 변경
- 미들웨어 정리 — 페이지 폴백만으로도 308이 나오므로 기능적으로 중복이지만,
  렌더 없이 처리하는 이점이 있어 유지한다.
- 예약 발행(`publishedAt`), 동적 OG 이미지, 홈 `h1`, `src/lib/email.ts:53`의 UUID 주소
