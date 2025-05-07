// extensions/Iframe.ts
import { Node, mergeAttributes, CommandProps, RawCommands } from '@tiptap/core';

const Iframe = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: 640 },
      height: { default: 300 },
      frameborder: { default: 10 },
    };
  },

  parseHTML() {
    return [{ tag: 'iframe' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['iframe', mergeAttributes(HTMLAttributes, {
      style: 'display: block; margin-left: auto; margin-right: auto;',
    })];
  },

  addCommands() {
    return {
      setIframe:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (options: Record<string, any>) =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as unknown as Partial<RawCommands>;
  },
});

export default Iframe;