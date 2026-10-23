import { textblockTypeInputRule } from '@tiptap/core';
import Heading, { type Level } from '@tiptap/extension-heading';

// 본문 소제목은 h2·h3만 새로 만든다. 글 제목이 이미 h1이라 본문에 h1을 넣으면
// 한 페이지에 h1이 여러 개가 된다.
// h1을 읽는 것은 막지 않는다. 막으면 본문에 h1이 있는 예전 글을 에디터로 열었다
// 저장할 때 h1이 문단으로 바뀌어 버린다.
const CREATABLE_LEVELS: Level[] = [2, 3];

const PostHeading = Heading.extend({
  addKeyboardShortcuts() {
    return Object.fromEntries(
      CREATABLE_LEVELS.map(level => [
        `Mod-Alt-${level}`,
        () => this.editor.commands.toggleHeading({ level })
      ])
    );
  },

  // 기본 규칙은 "# "을 h1로 바꾼다. 샵 개수가 정확히 맞을 때만 h2·h3로 바꾼다.
  addInputRules() {
    return CREATABLE_LEVELS.map(level =>
      textblockTypeInputRule({
        find: new RegExp(`^(#{${level}})\\s$`),
        type: this.type,
        getAttributes: { level }
      })
    );
  }
}).configure({ levels: [1, 2, 3] });

export default PostHeading;
