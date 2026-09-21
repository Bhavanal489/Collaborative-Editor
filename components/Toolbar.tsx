"use client";

import type { Editor } from "@tiptap/react";

type ToolbarProps = {
  editor: Editor;
};

export default function Toolbar({ editor }: ToolbarProps) {
  return (
    <div className="toolbar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        Bold
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        Italic
      </button>

      <button
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        Heading
      </button>

      <button
        onClick={() =>
          editor.chain().focus().toggleBulletList().run()
        }
      >
        Bullet List
      </button>

      <button
        onClick={() =>
          editor.chain().focus().toggleCodeBlock().run()
        }
      >
        Code
      </button>

      <button
        onClick={() => editor.chain().focus().undo().run()}
      >
        ↶ Undo
      </button>

      <button
        onClick={() => editor.chain().focus().redo().run()}
      >
        ↷ Redo
      </button>
    </div>
  );
}