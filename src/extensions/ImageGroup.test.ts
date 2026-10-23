// @vitest-environment jsdom
import { Editor, type Content } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { describe, expect, it } from 'vitest';
import ImageGroup from './ImageGroup';

function render(content: Content) {
  const editor = new Editor({ extensions: [StarterKit, Image, ImageGroup], content });
  const html = editor.getHTML();
  editor.destroy();
  return html;
}

describe('ImageGroup', () => {
  it('data-layout을 읽어 그대로 다시 쓴다', () => {
    const html = render(
      '<div class="image-album" data-layout="3-c"><img src="a"><img src="b"><img src="c"></div>'
    );
    expect(html).toContain('data-layout="3-c"');
    expect(html).toContain('data-count="3"');
  });

  it('data-layout이 없는 예전 묶음에는 속성을 붙이지 않는다', () => {
    const html = render('<div class="image-album"><img src="a"><img src="b"></div>');
    expect(html).not.toContain('data-layout');
    expect(html).toContain('data-count="2"');
  });

  it('layout 속성을 data-layout으로 렌더한다', () => {
    const html = render({
      type: 'doc',
      content: [
        {
          type: 'imageGroup',
          attrs: { layout: '1-a' },
          content: [{ type: 'image', attrs: { src: 'a' } }]
        }
      ]
    });
    expect(html).toContain('data-layout="1-a"');
  });
});
