import { Node, mergeAttributes } from '@tiptap/core';

const ImageGroup = Node.create({
  name: 'imageGroup',
  group: 'block',
  content: 'image+',
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