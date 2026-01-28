import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Button } from "./button";

export default function RichEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        HTMLAttributes: { class: "text-teal-600 underline" },
      }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="space-y-2">

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 border rounded-md p-2 bg-gray-50">

        <Button
          type="button"
          className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </Button>

        <Button
          type="button"
          className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </Button>

        <Button
          type="button"
          className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </Button>

        <Button
          type="button"
          className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </Button>

        <Button
          type="button"
          className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300"
          onClick={() => {
            const url = prompt("Enter link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          Link
        </Button>
      </div>

      {/* Editor box */}
      <div className="border rounded-lg p-3 min-h-[120px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

