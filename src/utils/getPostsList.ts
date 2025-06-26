import { Category, Post } from "@/types";
import handleTimeStirng from "./handleTimeStirng";

function getPostsList(posts: Post[], category: Category) {
  return posts
    .filter((post) => post.category === category)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
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