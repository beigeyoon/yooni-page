import { Category, Post } from "@/types";
import handleTimeStirng from "./handleTimeStirng";

function getPostsList(posts: Post[], category: Category) {
  return posts
    .filter((post) => post.category === category)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((post) => {
    const { id, title, subtitle, createdAt, isPublished } = post;
    return {
      id,
      title,
      subtitle,
      createdAt: handleTimeStirng(createdAt),
      isPublished,
    };
  });
}

export default getPostsList;