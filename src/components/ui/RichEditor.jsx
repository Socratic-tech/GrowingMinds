import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function RichEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="space-y-2">

      {/* Toolbar */}
      <div className="flex gap-2 bg-gray-100 border border-gray-300 rounded-xl p-2 shadow-inner">
        
        <Tool
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <b>B</b>
        </Tool>

        <Tool
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <i>I</i>
        </Tool>

      </div>

      {/* Editor Box */}
      <div className="bg-white border border-gray-300 rounded-xl p-3 shadow-inner min-h-[100px]">
        <EditorContent editor={editor} />
      </div>

    </div>
  );
}

function Tool({ children, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-8 h-8 flex items-center justify-center rounded-lg text-sm shadow-sm transition
        ${
          active
            ? "bg-teal-700 text-white shadow"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }
      `}
    >
      {children}
    </button>
  );
}
