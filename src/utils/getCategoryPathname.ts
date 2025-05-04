import { Category } from "@/types";

export const getCategoryPathname = (category: Category) => {
  switch (category) {
    case 'DEV':
      return 'devs';
    case 'TRAVEL':
      return 'travels';
    case 'TALK':
      return 'talks';
  }
}