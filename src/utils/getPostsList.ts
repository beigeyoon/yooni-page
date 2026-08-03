import { Category, Post } from "@/types";
import handleTimeStirng from "./handleTimeStirng";

// 정렬은 데이터 조회 계층(posts.server.ts / api/posts)에서 이미 끝난 상태로 들어온다.
// 여기서 다시 정렬하면 시리즈 순서가 깨진다.
function getPostsList(posts: Post[], category: Category) {
  return posts
    .filter((post) => post.category === category)
    .map((post) => {
    const { id, title, subtitle, content, createdAt, isPublished } = post;

    const result = {
      id,
      title,
      subtitle,
      createdAt: handleTimeStirng(createdAt),
      isPublished,
    }

    if (category !== 'photo') {
      return result;
    } else return { content, ...result };
  });
}

export default getPostsList;
