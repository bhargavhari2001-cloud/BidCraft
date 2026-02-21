"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
} from "lucide-react";

export interface RichTextEditorHandle {
  getContent: () => string;
  getPlainText: () => string;
  getWordCount: () => number;
  setContent: (html: string) => void;
  focus: () => void;
}

interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  /** Called on every content change with (html, wordCount) */
  onChange?: (html: string, wordCount: number) => void;
  /** Called when Ctrl+S is pressed */
  onSave?: (html: string) => void;
  /** localStorage key for auto-save drafts (30s interval) */
  autoSaveKey?: string;
  autoSaveInterval?: number;
  readOnly?: boolean;
  className?: string;
  minHeight?: string;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  (
    {
      initialContent = "",
      placeholder = "Edit your response here...",
      onChange,
      onSave,
      autoSaveKey,
      autoSaveInterval = 30_000,
      readOnly = false,
      className = "",
      minHeight = "280px",
    },
    ref
  ) => {
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit,
        Underline,
        Placeholder.configure({ placeholder }),
      ],
      content: initialContent || "",
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const text = editor.getText();
        const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
        onChange?.(html, wc);

        // Reset auto-save debounce
        if (autoSaveKey) {
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = setTimeout(() => {
            try {
              localStorage.setItem(autoSaveKey, html);
            } catch {
              // localStorage quota exceeded — ignore
            }
          }, autoSaveInterval);
        }
      },
    });

    useImperativeHandle(ref, () => ({
      getContent: () => editor?.getHTML() ?? "",
      getPlainText: () => editor?.getText() ?? "",
      getWordCount: () => {
        const text = editor?.getText() ?? "";
        return text.trim() ? text.trim().split(/\s+/).length : 0;
      },
      setContent: (html: string) => {
        editor?.commands.setContent(html);
      },
      focus: () => {
        editor?.commands.focus();
      },
    }));

    // On mount: load from auto-save slot if present, otherwise use initialContent
    useEffect(() => {
      if (!editor) return;
      if (autoSaveKey) {
        const saved = localStorage.getItem(autoSaveKey);
        if (saved) {
          editor.commands.setContent(saved);
          return;
        }
      }
      if (initialContent) {
        editor.commands.setContent(initialContent);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor]);

    // Cleanup auto-save timer on unmount
    useEffect(() => {
      return () => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      };
    }, []);

    // Keyboard shortcut: Ctrl/Cmd+S → onSave
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          if (onSaveRef.current && editor) {
            onSaveRef.current(editor.getHTML());
          }
        }
      },
      [editor]
    );

    if (!editor) return null;

    return (
      <div
        className={`flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden ${className}`}
        onKeyDown={handleKeyDown}
      >
        {/* ── Toolbar ── */}
        {!readOnly && (
          <div
            role="toolbar"
            aria-label="Text formatting toolbar"
            className="flex items-center gap-0.5 px-3 py-2 border-b border-white/[0.06] flex-wrap"
          >
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              title="Bold (Ctrl+B)"
              aria-label="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              title="Italic (Ctrl+I)"
              aria-label="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive("underline")}
              title="Underline (Ctrl+U)"
              aria-label="Underline"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </ToolbarBtn>

            <Divider />

            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
              aria-label="Heading 1"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
              aria-label="Heading 2"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
              aria-label="Heading 3"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </ToolbarBtn>

            <Divider />

            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              title="Bullet list"
              aria-label="Bullet list"
            >
              <List className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              title="Numbered list"
              aria-label="Numbered list"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </ToolbarBtn>

            <Divider />

            <ToolbarBtn
              onClick={() => editor.chain().focus().undo().run()}
              active={false}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().redo().run()}
              active={false}
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </ToolbarBtn>
          </div>
        )}

        {/* ── Editor Content ── */}
        <EditorContent
          editor={editor}
          className="tiptap-editor flex-1 px-4 py-3"
          style={{ minHeight }}
        />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";
export default RichTextEditor;

// ── Sub-components ──

function ToolbarBtn({
  onClick,
  active,
  title,
  "aria-label": ariaLabel,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  "aria-label": string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? "bg-violet-500/20 text-violet-300"
          : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-white/[0.08] mx-0.5 shrink-0" />;
}
