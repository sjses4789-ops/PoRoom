"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";

const MAX_CHARS = 5000;

const CONTENT_CLASS =
  "min-h-[120px] px-3 py-2.5 text-sm text-neutral-900 outline-none dark:text-white " +
  "[&_a]:text-sky-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 " +
  "[&_blockquote]:pl-3 [&_blockquote]:text-neutral-500 dark:[&_blockquote]:border-neutral-600 " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_mark]:rounded-sm [&_mark]:bg-amber-200 dark:[&_mark]:bg-amber-500/40 " +
  "[&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold " +
  "[&_p]:mb-1 last:[&_p]:mb-0";

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Highlight,
      CharacterCount.configure({ limit: MAX_CHARS }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
    editorProps: {
      attributes: { class: CONTENT_CLASS },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const same = value === editor.getHTML() || (value === "" && editor.isEmpty);
    if (!same) editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 주소를 입력하세요", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const headingValue = editor.isActive("heading", { level: 1 })
    ? "1"
    : editor.isActive("heading", { level: 2 })
      ? "2"
      : editor.isActive("heading", { level: 3 })
        ? "3"
        : "0";

  const setHeading = (v: string) => {
    if (v === "0") editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: Number(v) as 1 | 2 | 3 }).run();
  };

  const chars = editor.storage.characterCount.characters() as number;

  return (
    <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900">
        <select
          value={headingValue}
          onChange={(e) => setHeading(e.target.value)}
          className="rounded border border-neutral-200 bg-white px-1.5 py-1 text-xs text-neutral-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
        >
          <option value="0">본문</option>
          <option value="1">제목 1</option>
          <option value="2">제목 2</option>
          <option value="3">제목 3</option>
        </select>

        <Divider />

        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label="굵게">
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label="기울임">
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} label="밑줄">
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} label="취소선">
          <span className="line-through">S</span>
        </ToolbarButton>

        <Divider />

        <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="인용">
          <QuoteIcon />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} label="형광펜">
          <HighlightIcon />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("link")} onClick={setLink} label="링크">
          <LinkIcon />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="목록">
          <ListIcon />
        </ToolbarButton>

        <span className="ml-auto shrink-0 pr-1 text-[11px] tabular-nums text-neutral-400">
          {chars}/{MAX_CHARS}
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-neutral-200 dark:bg-neutral-700" aria-hidden />;
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded text-sm transition ${
        active
          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

function QuoteIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.6">
      <path d="M7.5 6.5c-2 0-3.5 1.6-3.5 4v3h4v-4H5.5c0-1.4 1-2 2-2v-1zm7 0c-2 0-3.5 1.6-3.5 4v3h4v-4h-2.5c0-1.4 1-2 2-2v-1z" />
    </svg>
  );
}
function HighlightIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
      <rect x="3" y="14" width="14" height="3" rx="1" />
      <path d="M6 12l6-9 4 3-8 8-4-2z" opacity="0.55" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.6">
      <path
        d="M8.5 11.5l3-3M7 13l-1.5 1.5a2.5 2.5 0 01-3.5-3.5L4.5 9M13 7l1.5-1.5a2.5 2.5 0 013.5 3.5L16.5 11"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.6">
      <circle cx="3.5" cy="5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="15" r="0.8" fill="currentColor" stroke="none" />
      <path d="M7 5h10M7 10h10M7 15h10" strokeLinecap="round" />
    </svg>
  );
}
