import { Category, Post } from "@/types";
import handleTimeStirng from "./handleTimeStirng";

function getPostsList(posts: Post[], category: Category) {
  return posts.filter((post) => post.category === category).map((post) => {
    const { id, title, subtitle, createdAt } = post;
    return {
      id,
      title,
      subtitle,
      createdAt: handleTimeStirng(createdAt),
    };
  });
}

export default getPostsList;