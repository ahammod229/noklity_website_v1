import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Link2, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3,
  Code, Quote, Minus, Loader2, Unlink, X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uploadDescImage = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `products/desc-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from('products')
    .upload(path, file, { cacheControl: '31536000', upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('products').getPublicUrl(data.path);
  return urlData.publicUrl;
};

// ─── Toolbar Button ───────────────────────────────────────────────────────────

const ToolBtn: React.FC<{
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, active, children }) => (
  <button
    type="button"
    title={title}
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    className={`w-7 h-7 flex items-center justify-center rounded text-[13px] transition-all ${
      active
        ? 'bg-primary text-white'
        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-gray-300 mx-1 self-center" />;

// ─── Main Component ───────────────────────────────────────────────────────────

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  minHeight = 200,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const savedRange = useRef<Range | null>(null);

  // Sync value on mount only (avoid cursor jump on every keystroke)
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync when value changes externally (e.g. edit mode pre-fill)
  useEffect(() => {
    if (!isInternalChange.current && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    isInternalChange.current = true;
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // ── execCommand wrapper ──

  const exec = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val ?? undefined);
    handleInput();
  }, [handleInput]);

  // Save selection before toolbar click (mousedown)
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedRange.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRange.current);
    }
  };

  // ── Heading ──

  const applyHeading = (tag: string) => {
    exec('formatBlock', tag);
  };

  // ── Link ──

  const handleLinkInsert = () => {
    restoreSelection();
    if (linkUrl.trim()) {
      exec('createLink', linkUrl.trim());
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const handleUnlink = () => exec('unlink');

  // ── Image ──

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploadingImage(true);
      try {
        const url = await uploadDescImage(file);
        editorRef.current?.focus();
        restoreSelection();
        exec('insertImage', url);
        // Style the inserted image
        setTimeout(() => {
          const imgs = editorRef.current?.querySelectorAll('img:not([data-styled])');
          imgs?.forEach(img => {
            (img as HTMLImageElement).style.maxWidth = '100%';
            (img as HTMLImageElement).style.borderRadius = '8px';
            (img as HTMLImageElement).style.margin = '8px 0';
            img.setAttribute('data-styled', '1');
          });
          handleInput();
        }, 50);
      } catch (err: any) {
        alert('Image upload failed: ' + (err.message || 'Unknown error'));
      } finally {
        setUploadingImage(false);
      }
    };
    input.click();
  }, [exec, handleInput]);

  // ── Keyboard shortcuts ──

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); exec('bold'); break;
        case 'i': e.preventDefault(); exec('italic'); break;
        case 'u': e.preventDefault(); exec('underline'); break;
        case 'k':
          e.preventDefault();
          saveSelection();
          setShowLinkInput(true);
          break;
      }
    }
  };

  const isEmpty = !value || value === '<br>' || value === '<div><br></div>';

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden hover:border-primary/50 focus-within:border-primary transition-colors bg-white shadow-sm">

      {/* ── Toolbar ── */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-2 py-2 bg-gray-50 border-b border-gray-200"
        onMouseDown={saveSelection}
      >
        {/* Headings */}
        <ToolBtn onClick={() => applyHeading('h1')} title="Heading 1 (H1)">
          <span className="text-[11px] font-black">H1</span>
        </ToolBtn>
        <ToolBtn onClick={() => applyHeading('h2')} title="Heading 2 (H2)">
          <span className="text-[11px] font-black">H2</span>
        </ToolBtn>
        <ToolBtn onClick={() => applyHeading('h3')} title="Heading 3 (H3)">
          <span className="text-[11px] font-black">H3</span>
        </ToolBtn>
        <ToolBtn onClick={() => applyHeading('p')} title="Paragraph">
          <span className="text-[11px] font-bold">P</span>
        </ToolBtn>

        <Divider />

        {/* Text Style */}
        <ToolBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)">
          <Underline className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('strikeThrough')} title="Strikethrough">
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* Text Color */}
        <label
          className="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-gray-200 transition-all"
          title="Text Color"
          onMouseDown={e => e.preventDefault()}
        >
          <div className="relative">
            <span className="text-[11px] font-black" style={{ color: '#e53e3e' }}>A</span>
            <input
              type="color"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onChange={e => exec('foreColor', e.target.value)}
              title="Text Color"
            />
          </div>
        </label>

        {/* Background Highlight */}
        <label
          className="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-gray-200 transition-all"
          title="Highlight Color"
          onMouseDown={e => e.preventDefault()}
        >
          <div className="relative">
            <span className="text-[11px] font-black bg-yellow-200 px-0.5">A</span>
            <input
              type="color"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              defaultValue="#fef08a"
              onChange={e => exec('hiliteColor', e.target.value)}
              title="Highlight"
            />
          </div>
        </label>

        <Divider />

        {/* Lists */}
        <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet List">
          <List className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered List">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* Alignment */}
        <ToolBtn onClick={() => exec('justifyLeft')} title="Align Left">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('justifyCenter')} title="Align Center">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('justifyRight')} title="Align Right">
          <AlignRight className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* Quote & Code */}
        <ToolBtn onClick={() => applyHeading('blockquote')} title="Blockquote">
          <Quote className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => applyHeading('pre')} title="Code Block">
          <Code className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('insertHorizontalRule')} title="Horizontal Line">
          <Minus className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* Link */}
        <ToolBtn
          onClick={() => { saveSelection(); setShowLinkInput(prev => !prev); setLinkUrl(''); }}
          title="Insert Link (Ctrl+K)"
        >
          <Link2 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={handleUnlink} title="Remove Link">
          <Unlink className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* Image Upload */}
        <ToolBtn onClick={handleImageUpload} title="Insert Image from Computer">
          {uploadingImage
            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            : <ImageIcon className="w-3.5 h-3.5" />}
        </ToolBtn>

        <Divider />

        {/* Clear Format */}
        <ToolBtn onClick={() => exec('removeFormat')} title="Clear Formatting">
          <X className="w-3.5 h-3.5" />
        </ToolBtn>
      </div>

      {/* ── Link Input ── */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-200">
          <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <input
            autoFocus
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); handleLinkInsert(); }
              if (e.key === 'Escape') { setShowLinkInput(false); }
            }}
            className="flex-1 text-[13px] outline-none bg-transparent text-blue-900 placeholder-blue-300"
          />
          <button
            type="button"
            onClick={handleLinkInsert}
            className="text-[12px] bg-blue-600 text-white px-3 py-1 rounded font-bold hover:bg-blue-700"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Editable Area ── */}
      <div className="relative">
        {isEmpty && (
          <div className="absolute top-4 left-4 text-gray-400 text-[14px] pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          style={{ minHeight }}
          className={`
            p-4 outline-none text-[14px] leading-relaxed
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-2
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-2
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2
            [&_p]:mb-2
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
            [&_li]:mb-1
            [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:text-gray-600 [&_blockquote]:italic [&_blockquote]:my-3
            [&_pre]:bg-gray-900 [&_pre]:text-green-400 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:my-3
            [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80
            [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2
            [&_hr]:border-gray-300 [&_hr]:my-4
          `}
        />
      </div>

      {/* ── Footer hint ── */}
      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          Ctrl+B Bold · Ctrl+I Italic · Ctrl+U Underline · Ctrl+K Link
        </span>
        <span className="text-[11px] text-gray-400">
          Click 🖼 to insert images
        </span>
      </div>
    </div>
  );
};

export default RichTextEditor;
