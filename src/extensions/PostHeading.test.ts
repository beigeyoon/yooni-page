// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import PostHeading from './PostHeading';

let editor: Editor;

beforeEach(() => {
  editor = new Editor({
    extensions: [StarterKit.configure({ heading: false }), PostHeading]
  });
});

afterEach(() => editor.destroy());

// 실제 타이핑처럼 한 글자씩 넣어 입력 규칙(마크다운 단축 입력)이 돌게 한다.
function type(text: string) {
  for (const char of text) {
    const { from, to } = editor.state.selection;
    const handled = editor.view.someProp('handleTextInput', handle =>
      handle(editor.view, from, to, char, () => editor.state.tr)
    );
    if (!handled) {
      editor.view.dispatch(editor.state.tr.insertText(char, from, to));
    }
  }
}

// jsdom은 맥이 아니라서 Mod-Alt-N은 Ctrl+Alt+N으로 눌린다.
function pressShortcut(key: string) {
  const event = new KeyboardEvent('keydown', {
    key,
    code: `Digit${key}`,
    keyCode: 48 + Number(key),
    ctrlKey: true,
    altKey: true
  });
  editor.view.someProp('handleKeyDown', handle => handle(editor.view, event));
}

describe('PostHeading', () => {
  it('예전 글의 본문 h1은 그대로 읽고 그대로 저장한다', () => {
    editor.commands.setContent('<h1>예전 제목</h1><h2>소제목</h2>');
    expect(editor.getHTML()).toBe('<h1>예전 제목</h1><h2>소제목</h2>');
  });

  it('## 와 ### 입력은 h2, h3가 된다', () => {
    type('## 둘');
    editor.commands.enter();
    type('### 셋');
    expect(editor.getHTML()).toBe('<h2>둘</h2><h3>셋</h3>');
  });

  it('# 입력으로는 h1이 생기지 않는다', () => {
    type('# 하나');
    expect(editor.getHTML()).toBe('<p># 하나</p>');
  });

  it('단축키로는 h2, h3만 만들 수 있다', () => {
    editor.commands.setContent('<p>글</p>');
    editor.commands.focus('end');

    pressShortcut('1');
    expect(editor.getHTML()).toBe('<p>글</p>');

    pressShortcut('2');
    expect(editor.getHTML()).toBe('<h2>글</h2>');
  });
});
