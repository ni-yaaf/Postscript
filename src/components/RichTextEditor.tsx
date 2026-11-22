import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Minus,
  Undo2,
  Redo2,
  Search,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import type { EditorFontOption, FontSizeOption } from '../types/letter';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  editorFont: EditorFontOption;
  fontSize: FontSizeOption;
  distractionFree: boolean;
  onToggleDistractionFree: () => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  editorFont,
  fontSize,
  distractionFree,
  onToggleDistractionFree,
  placeholder = 'Begin your letter here… take all the room you need.',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const lastEmittedHtml = useRef<string>(value);

  const [, setSelectionTick] = useState(0);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [findStatus, setFindStatus] = useState('');
  const lastMatchEndRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;

    const editor = new Editor({
      element: mountRef.current,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Underline,
      ],
      content: value || '<p></p>',
      editorProps: {
        attributes: {
          spellcheck: 'true',
          'aria-label': 'Letter content editor',
          'data-placeholder': placeholder,
        },
      },
      onUpdate: ({ editor: ed }) => {
        const html = ed.getHTML();
        lastEmittedHtml.current = html;
        onChange(html);
      },
      onTransaction: () => {
        setSelectionTick((t) => t + 1);
      },
    });

    editorRef.current = editor;
    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (value !== lastEmittedHtml.current) {
      lastEmittedHtml.current = value;
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
    }
  }, [value]);

  const editor = editorRef.current;

  const fontClass =
    editorFont === 'serif'
      ? 'font-serif-editorial'
      : editorFont === 'mono'
        ? 'font-mono-tabular'
        : 'font-sans-ui';

  const sizeClass =
    editorFont === 'serif'
      ? fontSize === 'small'
        ? 'text-[18px]'
        : fontSize === 'large'
          ? 'text-[23px]'
          : 'text-[20px]'
      : fontSize === 'small'
        ? 'text-[14px]'
        : fontSize === 'large'
          ? 'text-[18px]'
          : 'text-[16px]';

  const findNext = (fromStart = false): boolean => {
    if (!editor || !findQuery) {
      setFindStatus('');
      return false;
    }
    const { doc } = editor.state;
    const needle = findQuery.toLowerCase();
    const matches: Array<{ from: number; to: number }> = [];

    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        const hay = node.text.toLowerCase();
        let idx = hay.indexOf(needle);
        while (idx !== -1) {
          matches.push({ from: pos + idx, to: pos + idx + needle.length });
          idx = hay.indexOf(needle, idx + needle.length);
        }
      }
    });

    if (matches.length === 0) {
      setFindStatus('No matches found');
      return false;
    }

    const searchFrom = fromStart ? 0 : lastMatchEndRef.current;
    const matchIndex = matches.findIndex((m) => m.from >= searchFrom);
    const chosenIndex = matchIndex >= 0 ? matchIndex : 0;
    const chosen = matches[chosenIndex];
    lastMatchEndRef.current = chosen.to;

    editor
      .chain()
      .focus()
      .setTextSelection({ from: chosen.from, to: chosen.to })
      .scrollIntoView()
      .run();

    setFindStatus(`${chosenIndex + 1} of ${matches.length}`);
    return true;
  };

  const replaceCurrent = () => {
    if (!editor || !findQuery) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    if (selectedText.toLowerCase() === findQuery.toLowerCase()) {
      editor
        .chain()
        .focus()
        .insertContentAt({ from, to }, replaceQuery)
        .run();
      lastMatchEndRef.current = from + replaceQuery.length;
      findNext(false);
    } else {
      findNext(false);
    }
  };

  const replaceAll = () => {
    if (!editor || !findQuery) return;
    const { doc } = editor.state;
    const needle = findQuery.toLowerCase();
    const matches: Array<{ from: number; to: number }> = [];
    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        const hay = node.text.toLowerCase();
        let idx = hay.indexOf(needle);
        while (idx !== -1) {
          matches.push({ from: pos + idx, to: pos + idx + needle.length });
          idx = hay.indexOf(needle, idx + needle.length);
        }
      }
    });

    if (matches.length === 0) {
      setFindStatus('No matches found');
      return;
    }

    const tr = editor.state.tr;
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      tr.insertText(replaceQuery, m.from, m.to);
    }
    editor.view.dispatch(tr);
    lastMatchEndRef.current = 0;
    setFindStatus(`Replaced ${matches.length}`);
  };

  const toolbarButtons: Array<{
    label: string;
    icon: React.ReactNode;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
  }> = [
    {
      label: 'Undo',
      icon: <Undo2 className="h-4 w-4" />,
      disabled: !editor?.can().undo(),
      onClick: () => editor?.chain().focus().undo().run(),
    },
    {
      label: 'Redo',
      icon: <Redo2 className="h-4 w-4" />,
      disabled: !editor?.can().redo(),
      onClick: () => editor?.chain().focus().redo().run(),
    },
    {
      label: 'Bold (Ctrl+B)',
      icon: <Bold className="h-4 w-4" />,
      active: editor?.isActive('bold'),
      onClick: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: 'Italic (Ctrl+I)',
      icon: <Italic className="h-4 w-4" />,
      active: editor?.isActive('italic'),
      onClick: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Underline (Ctrl+U)',
      icon: <UnderlineIcon className="h-4 w-4" />,
      active: editor?.isActive('underline'),
      onClick: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      label: 'Heading 1',
      icon: <Heading1 className="h-4 w-4" />,
      active: editor?.isActive('heading', { level: 1 }),
      onClick: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: 'Heading 2',
      icon: <Heading2 className="h-4 w-4" />,
      active: editor?.isActive('heading', { level: 2 }),
      onClick: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Blockquote',
      icon: <Quote className="h-4 w-4" />,
      active: editor?.isActive('blockquote'),
      onClick: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    {
      label: 'Bulleted List',
      icon: <List className="h-4 w-4" />,
      active: editor?.isActive('bulletList'),
      onClick: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Numbered List',
      icon: <ListOrdered className="h-4 w-4" />,
      active: editor?.isActive('orderedList'),
      onClick: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Divider Line',
      icon: <Minus className="h-4 w-4" />,
      onClick: () => editor?.chain().focus().setHorizontalRule().run(),
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Subtle Paper-Integrated Formatting Ribbon */}
      <div className="sticky top-[65px] z-20 flex flex-wrap items-center justify-between gap-2 border-y border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-bg)]/95 px-2 py-2 backdrop-blur-xs">
        <div className="flex flex-wrap items-center gap-0.5">
          {toolbarButtons.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.onClick}
              disabled={btn.disabled}
              title={btn.label}
              aria-label={btn.label}
              aria-pressed={btn.active}
              className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ps-sheet-accent)] ${
                btn.active
                  ? 'bg-[var(--ps-sheet-slip)] text-[var(--ps-sheet-accent)]'
                  : 'text-[var(--ps-sheet-muted)] hover:bg-[var(--ps-sheet-slip)]/70 hover:text-[var(--ps-sheet-ink)]'
              } disabled:opacity-30 disabled:pointer-events-none`}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowFindReplace((v) => !v)}
            title="Find and replace"
            aria-label="Find and replace"
            aria-pressed={showFindReplace}
            className={`flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--ps-sheet-accent)] ${
              showFindReplace
                ? 'bg-[var(--ps-sheet-slip)] text-[var(--ps-sheet-accent)]'
                : 'text-[var(--ps-sheet-muted)] hover:bg-[var(--ps-sheet-slip)]/70 hover:text-[var(--ps-sheet-ink)]'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Find</span>
          </button>

          <button
            type="button"
            onClick={onToggleDistractionFree}
            title={
              distractionFree
                ? 'Exit distraction-free mode'
                : 'Distraction-free writing mode'
            }
            aria-label={
              distractionFree
                ? 'Exit distraction-free mode'
                : 'Distraction-free writing mode'
            }
            className="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-[var(--ps-sheet-muted)] transition-colors hover:bg-[var(--ps-sheet-slip)]/70 hover:text-[var(--ps-sheet-ink)] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--ps-sheet-accent)]"
          >
            {distractionFree ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exit Focus</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Focus</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Find & Replace Slip */}
      {showFindReplace && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-slip)] px-3 py-2.5">
          <input
            type="text"
            value={findQuery}
            onChange={(e) => {
              setFindQuery(e.target.value);
              lastMatchEndRef.current = 0;
              setFindStatus('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                findNext(false);
              }
            }}
            placeholder="Find word or phrase…"
            className="min-h-[36px] flex-1 min-w-[140px] rounded-md border border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-bg)] px-2.5 py-1 text-sm text-[var(--ps-sheet-ink)] placeholder:text-[var(--ps-sheet-muted)] focus:border-[var(--ps-sheet-accent)] focus:outline-none"
          />
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="Replace with…"
            className="min-h-[36px] flex-1 min-w-[140px] rounded-md border border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-bg)] px-2.5 py-1 text-sm text-[var(--ps-sheet-ink)] placeholder:text-[var(--ps-sheet-muted)] focus:border-[var(--ps-sheet-accent)] focus:outline-none"
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => findNext(false)}
              className="min-h-[36px] rounded-md border border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-bg)] px-3 py-1 text-xs font-medium text-[var(--ps-sheet-ink-2)] hover:text-[var(--ps-sheet-ink)] whitespace-nowrap shrink-0"
            >
              Find Next
            </button>
            <button
              type="button"
              onClick={replaceCurrent}
              className="min-h-[36px] rounded-md border border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-bg)] px-3 py-1 text-xs font-medium text-[var(--ps-sheet-ink-2)] hover:text-[var(--ps-sheet-ink)] whitespace-nowrap shrink-0"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={replaceAll}
              className="min-h-[36px] rounded-md border border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-bg)] px-3 py-1 text-xs font-medium text-[var(--ps-sheet-ink-2)] hover:text-[var(--ps-sheet-ink)] whitespace-nowrap shrink-0"
            >
              Replace All
            </button>
            {findStatus && (
              <span className="px-1.5 text-xs text-[var(--ps-sheet-muted)] tabular-nums whitespace-nowrap">
                {findStatus}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowFindReplace(false)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--ps-sheet-muted)] hover:text-[var(--ps-sheet-ink)]"
              aria-label="Close find and replace"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Ruled Stationery Writing Area */}
      <div
        className={`stationery-ruled pt-7 pb-4 ${fontClass} ${sizeClass} letter-ink-prose cursor-text`}
        onClick={() => editor?.commands.focus()}
      >
        <div ref={mountRef} />
      </div>
    </div>
  );
};
