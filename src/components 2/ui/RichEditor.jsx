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
      <div
        role="toolbar"
        aria-label="Text formatting toolbar"
        className="
          flex gap-2 bg-gray-100 border border-gray-300 
          rounded-3xl lg:rounded-2xl p-2 shadow-inner
        "
      >
        <ToolButton
          aria-label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <b>B</b>
        </ToolButton>

        <ToolButton
          aria-label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <i>I</i>
        </ToolButton>
      </div>

      {/* Editor Container */}
      <label htmlFor="editor" className="sr-only">
        Post content
      </label>

      <div
        className="
          bg-white border border-gray-300 rounded-3xl lg:rounded-2xl 
          p-3 shadow-inner min-h-[100px]
        "
      >
        <EditorContent id="editor" editor={editor} />
      </div>
    </div>
  );
}

function ToolButton({ children, onClick, active, ...props }) {
  return (
    <button
      {...props}
      type="button"
      onClick={onClick}
      className={`
        w-10 h-10 flex items-center justify-center rounded-xl text-sm
        transition shadow-sm select-none
        focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2

        ${
          active
            ? "bg-teal-700 text-white shadow-lg"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }
      `}
    >
      {children}
    </button>
  );
}
