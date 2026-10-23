import { Node, mergeAttributes } from '@tiptap/core';

const ImageGroup = Node.create({
  name: 'imageGroup',
  group: 'block',
  content: 'image+',
  addAttributes() {
    return {
      // 배치 창에서 고른 레이아웃 id. 예전 묶음은 없고, 그때는 data-count 규칙으로 배치된다.
      layout: {
        default: null,
        parseHTML: element => element.getAttribute('data-layout'),
        renderHTML: attributes =>
          attributes.layout ? { 'data-layout': attributes.layout } : {}
      }
    };
  },
  parseHTML() {
    return [{ tag: 'div.image-album' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const count = node.childCount;
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'image-album',
        'data-count': count,
        style: `--count: ${count};`,
      }),
      0
    ];
  }
});

export default ImageGroup;