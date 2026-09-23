import { useEffect, useId } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function RichEditor({ value, onChange, ariaLabel = "Post content" }) {
  const editorId = useId();
  const editor = useEditor({
    // TipTap v3 no longer re-renders on every transaction by default; we need
    // it so the toolbar's active (bold/italic) states stay in sync.
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        "aria-label": ariaLabel,
        role: "textbox",
        "aria-multiline": "true",
        id: editorId,
      },
    },
    // Emit "" for an empty editor so a bare "<p></p>" can never be posted.
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Parent clears `value` after a successful post -> clear the editor too.
  useEffect(() => {
    if (editor && value === "" && !editor.isEmpty) {
      editor.commands.clearContent();
    }
  }, [editor, value]);

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
      <label htmlFor={editorId} className="sr-only">
        {ariaLabel}
      </label>

      <div
        className="
          bg-white border border-gray-300 rounded-3xl lg:rounded-2xl 
          p-3 shadow-inner min-h-[100px]
        "
      >
        <EditorContent editor={editor} />
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
