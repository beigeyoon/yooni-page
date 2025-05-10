'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Toolbar from './Toolbar';
import { Input } from '../ui/input';
import { forwardRef, useImperativeHandle } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { PostFormValues } from '@/types';
import Link from '@tiptap/extension-link';
import Iframe from '../../extensions/Iframe';
import ImageGroup from '@/extensions/ImageGroup';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import plaintext from 'highlight.js/lib/languages/plaintext';
import { createLowlight } from 'lowlight';
import { toHtml } from 'hast-util-to-html';

const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('html', html);
lowlight.register('css', css);
lowlight.register('text', plaintext);
lowlight.register('plaintext', plaintext);

interface Props {
  register: UseFormRegister<PostFormValues>;
  content?: string;
}

const TiptapEditor = forwardRef((props: Props, ref) => {
  const { register, content } = props;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        codeBlock: false
      }),
      Image.configure({
        inline: false
      }),
      ImageGroup,
      Link.configure({
        protocols: ['ftp'],
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'custom-link'
        }
      }),
      Iframe,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'my-code-block'
        }
      })
    ],
    editable: true,
    content
  });

  useImperativeHandle(ref, () => ({
    getEditorContent: () => {
      if (!editor) return '';

      const rawHTML = editor.getHTML();
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHTML, 'text/html');

      doc.querySelectorAll('pre code').forEach(codeElement => {
        const language =
          codeElement.getAttribute('data-language') || 'javascript';
        const code = codeElement.textContent || '';

        const tree = lowlight.highlight(language, code);
        const highlightedHTML = toHtml(tree);

        codeElement.innerHTML = highlightedHTML;
      });

      return doc.body.innerHTML;
    }
  }));

  if (!editor) return <></>;
  return (
    <div className="flex flex-col gap-2">
      <Input
        id="title"
        placeholder="타이틀을 입력하세요"
        className="py-6"
        style={{ fontSize: 22, lineHeight: 1 }}
        {...register('title', { required: '타이틀을 입력하세요.' })}
      />
      <Input
        id="subtitle"
        placeholder="설명을 입력하세요"
        className="mb-3"
        {...register('subtitle', { required: '설명을 입력하세요.' })}
      />
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="editor-container prose"
      />
    </div>
  );
});

TiptapEditor.displayName = 'TiptapEditor';
export default TiptapEditor;
