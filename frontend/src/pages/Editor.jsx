import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ShareModal from '../components/ShareModal'
import {
  ArrowLeft, Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Quote, Code, Undo2, Redo2,
  Share2, Save, AlignLeft, AlignCenter, AlignRight,
  ChevronDown, Check, Loader2, FileText, Users
} from 'lucide-react'

function ToolbarButton({ onClick, active, title, children, className = '' }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`
        inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium
        transition-all duration-100 shrink-0 select-none
        ${active
          ? 'bg-blue-100 text-blue-700 shadow-inner'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        } ${className}
      `}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />
}

function SaveIndicator({ status }) {
  if (status === 'saved') return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
      <Check size={12} strokeWidth={2.5} />
      Saved
    </span>
  )
  if (status === 'saving') return (
    <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
      <Loader2 size={12} className="animate-spin" />
      Saving…
    </span>
  )
  return (
    <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 save-dot-saving inline-block" />
      Unsaved
    </span>
  )
}

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [document, setDocument] = useState(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [error, setError] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const saveTimer = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved')
      // word count
      const text = editor.getText()
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      setWordCount(words)

      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => handleSave(), 2000)
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
        'data-placeholder': 'Start writing…',
      },
    },
  })

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await api.get(`/api/documents/${id}`)
        setDocument(res.data)
        setTitle(res.data.title)
        setIsOwner(res.data.isOwner)

        if (editor && res.data.content) {
          const content = res.data.content
          const isEmpty =
            !content ||
            (typeof content === 'object' && Object.keys(content).length === 0)

          editor.commands.setContent(
            isEmpty ? { type: 'doc', content: [{ type: 'paragraph' }] } : content
          )
        }
      } catch {
        setError('Failed to load document')
      } finally {
        setLoading(false)
      }
    }

    if (editor) fetchDoc()
  }, [id, editor])

  const handleSave = useCallback(async () => {
    if (!editor) return
    setSaving(true)
    setSaveStatus('saving')
    try {
      await api.put(`/api/documents/${id}`, {
        content: editor.getJSON(),
        title,
      })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('unsaved')
    } finally {
      setSaving(false)
    }
  }, [editor, id, title])

  useEffect(() => {
    if (!document) return
    if (title === document.title) return
    setSaveStatus('unsaved')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(handleSave, 1500)
  }, [title])

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Opening document…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <div className="text-center px-4">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-gray-800 font-medium mb-1">{error}</p>
          <p className="text-gray-400 text-sm mb-4">This document may have been deleted or you don't have access.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const headingValue = editor?.isActive('heading', { level: 1 }) ? '1'
    : editor?.isActive('heading', { level: 2 }) ? '2'
    : editor?.isActive('heading', { level: 3 }) ? '3'
    : 'paragraph'

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      {/* ── Top bar ── */}
      <header className="bg-white border-b border-gray-100 px-3 sm:px-5 py-2.5 flex items-center gap-2 sm:gap-3 sticky top-0 z-30 shadow-sm">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          title="Back to Dashboard"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all shrink-0"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Logo mark */}
        <div className="shrink-0 hidden sm:flex w-7 h-7 bg-blue-600 rounded-md items-center justify-center">
          <span className="text-white font-bold text-xs">A</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 shrink-0 hidden sm:block" />

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          placeholder="Untitled Document"
          className="flex-1 text-sm sm:text-base font-semibold text-gray-900 bg-transparent focus:outline-none border-b-2 border-transparent focus:border-blue-400 pb-0.5 min-w-0 placeholder:text-gray-300 transition-colors"
          style={{ fontFamily: 'var(--font-ui)' }}
        />

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Save status */}
          <div className="hidden sm:flex">
            <SaveIndicator status={saveStatus} />
          </div>

          {/* Manual save */}
          <button
            onClick={handleSave}
            disabled={saving}
            title="Save (Ctrl+S)"
            className="flex items-center gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50 transition-all"
          >
            <Save size={13} />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Share */}
          {isOwner && (
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
            >
              <Share2 size={13} />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* User avatar */}
          <div className="hidden lg:flex w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center shrink-0" title={user?.name}>
            <span className="text-white text-xs font-semibold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* ── Formatting toolbar ── */}
      {editor && (
        <div className="bg-white border-b border-gray-100 px-3 py-1.5 flex items-center gap-0.5 overflow-x-auto flex-nowrap sticky top-[49px] z-20 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          {/* Text style dropdown */}
          <div className="relative shrink-0 mr-1">
            <select
              onChange={(e) => {
                const val = e.target.value
                if (val === 'paragraph') {
                  editor.chain().focus().setParagraph().run()
                } else {
                  editor.chain().focus().toggleHeading({ level: parseInt(val) }).run()
                }
              }}
              value={headingValue}
              className="appearance-none text-xs font-medium border border-gray-200 rounded-md pl-2.5 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 cursor-pointer hover:bg-gray-50"
            >
              <option value="paragraph">Normal text</option>
              <option value="1">Heading 1</option>
              <option value="2">Heading 2</option>
              <option value="3">Heading 3</option>
            </select>
            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <ToolbarDivider />

          {/* Text formatting */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
            <Bold size={14} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
            <UnderlineIcon size={14} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
            <AlignLeft size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
            <AlignCenter size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
            <AlignRight size={14} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
            <ListOrdered size={14} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Block */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
            <Quote size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
            <Code size={14} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Undo/Redo */}
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo (Ctrl+Z)">
            <Undo2 size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo (Ctrl+Y)">
            <Redo2 size={14} />
          </ToolbarButton>

          {/* Word count — right side */}
          <div className="ml-auto pl-2 shrink-0 hidden sm:flex items-center text-xs text-gray-300 select-none">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </div>
        </div>
      )}

      {/* ── Document canvas ── */}
      <main className="flex-1 overflow-y-auto py-8 sm:py-14 px-4">
        <div
          className="max-w-[780px] mx-auto bg-white rounded-lg min-h-[calc(100vh-220px)] px-8 sm:px-16 py-10 sm:py-16"
          style={{ boxShadow: 'var(--shadow-doc)' }}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Bottom padding for comfort */}
        <div className="h-24" />
      </main>

      {/* Share modal */}
      {showShare && document && (
        <ShareModal document={document} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}