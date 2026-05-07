import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ShareModal from '../components/ShareModal'

// ── Toolbar button helper ──────────────────────────────────────────────────
function ToolbarButton({ onClick, active, title, children }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

// ── Divider ────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="w-px h-5 bg-gray-300 mx-1" />
}

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [document, setDocument] = useState(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'unsaved' | 'saving'
  const [error, setError] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const saveTimer = useRef(null)

  // ── Tiptap editor ──────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '',
    onUpdate: () => {
      setSaveStatus('unsaved')
      // Auto-save after 2 seconds of inactivity
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        handleSave()
      }, 2000)
    },
  })

  // ── Load document ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await api.get(`/api/documents/${id}`)
        setDocument(res.data)
        setTitle(res.data.title)
        setIsOwner(res.data.isOwner)

        if (editor && res.data.content) {
          // content can be {} (empty) or a full Tiptap JSON doc
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

  // ── Save ───────────────────────────────────────────────────────────────
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

  // Save when title changes
  useEffect(() => {
    if (!document) return
    if (title === document.title) return
    setSaveStatus('unsaved')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(handleSave, 1500)
  }, [title])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  // ── Keyboard shortcut Ctrl+S ───────────────────────────────────────────
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">A</span>
          </div>
        </div>

        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          placeholder="Untitled Document"
          className="flex-1 text-base font-medium text-gray-900 bg-transparent focus:outline-none focus:border-b-2 focus:border-blue-500 pb-0.5 min-w-0"
        />

        {/* Save status */}
        <span
          className={`text-xs shrink-0 ${
            saveStatus === 'saved'
              ? 'text-green-600'
              : saveStatus === 'saving'
              ? 'text-blue-500'
              : 'text-orange-500'
          }`}
        >
          {saveStatus === 'saved' && '✓ Saved'}
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'unsaved' && '● Unsaved'}
        </span>

        {/* Manual save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          Save
        </button>

        {/* Share — owner only */}
        {isOwner && (
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        )}

        {/* User */}
        <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
          {user?.name}
        </span>
      </header>

      {/* ── Formatting toolbar ───────────────────────────────────────────── */}
      {editor && (
        <div className="bg-white border-b border-gray-200 px-4 py-1.5 flex items-center gap-0.5 flex-wrap">
          {/* Text style */}
          <select
            onChange={(e) => {
              const val = e.target.value
              if (val === 'paragraph') {
                editor.chain().focus().setParagraph().run()
              } else {
                editor.chain().focus().toggleHeading({ level: parseInt(val) }).run()
              }
            }}
            value={
              editor.isActive('heading', { level: 1 })
                ? '1'
                : editor.isActive('heading', { level: 2 })
                ? '2'
                : editor.isActive('heading', { level: 3 })
                ? '3'
                : 'paragraph'
            }
            className="text-sm border border-gray-200 rounded px-2 py-1 mr-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="paragraph">Normal</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>

          <Divider />

          {/* Bold */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </ToolbarButton>

          {/* Italic */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </ToolbarButton>

          {/* Underline */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <span className="underline">U</span>
          </ToolbarButton>

          <Divider />

          {/* Bullet list */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </ToolbarButton>

          {/* Ordered list */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </ToolbarButton>

          <Divider />

          {/* Blockquote */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
            </svg>
          </ToolbarButton>

          {/* Code */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Inline Code"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </ToolbarButton>

          <Divider />

          {/* Undo / Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            active={false}
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 010 16H3" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l4-4m-4 4l4 4" />
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            active={false}
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 000 16h10" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10l-4-4m4 4l-4 4" />
            </svg>
          </ToolbarButton>
        </div>
      )}

      {/* ── Editor area ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 min-h-[70vh] p-10">
          <EditorContent
            editor={editor}
            className="prose prose-sm sm:prose max-w-none focus:outline-none min-h-[60vh]"
          />
        </div>
      </main>

      {/* ── Share modal ──────────────────────────────────────────────────── */}
      {showShare && document && (
        <ShareModal document={document} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}