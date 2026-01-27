/**
 * RichTextEditor Component
 * Neurodivergent-friendly rich text editor using TipTap
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import { $settings } from '../../stores/settingsStore';
import { useStore } from '@nanostores/react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Digite aqui...',
  className = '',
  editable = true,
}: RichTextEditorProps) {
  const settings = useStore($settings);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable some features for simplicity
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      {editable && (
        <div className="flex items-center gap-1 p-2 border-b border-theme-border bg-theme-sidebar rounded-t-lg">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-theme-panel transition-colors ${
              editor.isActive('bold') ? 'bg-theme-panel text-theme-accent' : 'text-theme-muted'
            }`}
            title="Negrito"
            aria-label="Negrito"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 7.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-theme-panel transition-colors ${
              editor.isActive('italic') ? 'bg-theme-panel text-theme-accent' : 'text-theme-muted'
            }`}
            title="Itálico"
            aria-label="Itálico"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/>
            </svg>
          </button>
          <div className="w-px h-4 bg-theme-border mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-theme-panel transition-colors ${
              editor.isActive('bulletList') ? 'bg-theme-panel text-theme-accent' : 'text-theme-muted'
            }`}
            title="Lista"
            aria-label="Lista"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-theme-panel transition-colors ${
              editor.isActive('orderedList') ? 'bg-theme-panel text-theme-accent' : 'text-theme-muted'
            }`}
            title="Lista numerada"
            aria-label="Lista numerada"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 11.9V11H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
            </svg>
          </button>
        </div>
      )}
      <div className="border border-theme-border rounded-b-lg bg-theme-sidebar">
        <EditorContent
          editor={editor}
          className="min-h-24 px-4 py-3 text-theme-text focus-within:ring-2 focus-within:ring-theme-accent focus-within:border-theme-accent rounded-b-lg prose prose-sm max-w-none"
        />
      </div>
      <style jsx global>{`
        .rich-text-editor .ProseMirror {
          outline: none;
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--muted);
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor .ProseMirror p {
          margin: 0.5em 0;
        }
        .rich-text-editor .ProseMirror ul,
        .rich-text-editor .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .rich-text-editor .ProseMirror strong {
          font-weight: 600;
          color: var(--text);
        }
        .rich-text-editor .ProseMirror em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
