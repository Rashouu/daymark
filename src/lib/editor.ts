import StarterKit from '@tiptap/starter-kit';

/** Only what the spec asks for: bold, italic, lists, headings (typed as **, *, -, 1., #). */
export const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2] },
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    link: false,
    underline: false,
  }),
];
