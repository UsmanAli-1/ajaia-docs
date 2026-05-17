import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import {
  FilePlus2, Upload, FileText, Users, MoreHorizontal,
  Pencil, Trash2, Clock, Search, ChevronRight
} from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()

  const [myDocs, setMyDocs] = useState([])
  const [sharedDocs, setSharedDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('mine')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchAll()
  }, [])

  // Close menu on outside click
  useEffect(() => {
    const handler = () => setMenuOpenId(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [myRes, sharedRes] = await Promise.all([
        api.get('/api/documents'),
        api.get('/api/documents/shared'),
      ])
      setMyDocs(myRes.data)
      setSharedDocs(sharedRes.data)
    } catch {
      setError('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const res = await api.post('/api/documents')
      navigate(`/editor/${res.data.id}`)
    } catch {
      setError('Failed to create document')
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const ext = file.name.split('.').pop().toLowerCase()
    if (!['txt', 'md'].includes(ext)) {
      setUploadError('Only .txt and .md files are supported')
      return
    }

    setUploading(true)
    setUploadError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate(`/editor/${res.data.id}`)
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    setMenuOpenId(null)
    if (!window.confirm('Delete this document?')) return
    try {
      await api.delete(`/api/documents/${id}`)
      setMyDocs((prev) => prev.filter((d) => d.id !== id))
    } catch {
      setError('Failed to delete document')
    }
  }

  const startRename = (doc, e) => {
    e.stopPropagation()
    setMenuOpenId(null)
    setRenamingId(doc.id)
    setRenameValue(doc.title)
  }

  const handleRename = async (id) => {
    if (!renameValue.trim()) { setRenamingId(null); return }
    try {
      await api.patch(`/api/documents/${id}/rename`, { title: renameValue.trim() })
      setMyDocs((prev) =>
        prev.map((d) => (d.id === id ? { ...d, title: renameValue.trim() } : d))
      )
    } catch {
      setError('Failed to rename')
    } finally {
      setRenamingId(null)
    }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filterDocs = (docs) => {
    if (!searchQuery.trim()) return docs
    return docs.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const DocCard = ({ doc, isShared = false }) => (
    <div
      onClick={() => navigate(`/editor/${doc.id}`)}
      className="doc-card group bg-white border border-gray-100 rounded-xl cursor-pointer overflow-hidden relative"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Card preview area */}
      <div className="h-32 bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center border-b border-gray-50 relative overflow-hidden">
        {/* Faint lines like a doc */}
        <div className="absolute inset-4 space-y-1.5 opacity-20">
          {[90, 75, 85, 60, 70].map((w, i) => (
            <div key={i} className={`h-1.5 rounded-full bg-gray-400`} style={{ width: `${w}%` }} />
          ))}
        </div>
        <FileText className="w-8 h-8 text-blue-300 relative z-10" strokeWidth={1.5} />

        {/* Shared badge */}
        {isShared && (
          <span className="absolute top-2 right-2 bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <Users size={9} />
            Shared
          </span>
        )}

        {/* 3-dot menu — owned only */}
        {!isShared && (
          <div
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === doc.id ? null : doc.id) }}
              className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-50 shadow-sm"
            >
              <MoreHorizontal size={12} className="text-gray-500" />
            </button>
            {menuOpenId === doc.id && (
              <div className="absolute right-0 top-7 bg-white border border-gray-100 rounded-lg shadow-xl z-50 w-40 py-1 overflow-hidden">
                <button
                  onClick={(e) => startRename(doc, e)}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={13} className="text-gray-400" />
                  Rename
                </button>
                <button
                  onClick={(e) => handleDelete(doc.id, e)}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} className="text-red-400" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3.5">
        {renamingId === doc.id ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => handleRename(doc.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename(doc.id)
              if (e.key === 'Escape') setRenamingId(null)
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full border border-blue-400 rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50"
          />
        ) : (
          <p className="text-sm font-semibold text-gray-900 truncate leading-snug">{doc.title || 'Untitled'}</p>
        )}

        <div className="flex items-center gap-1 mt-1.5">
          <Clock size={10} className="text-gray-300 shrink-0" />
          <p className="text-xs text-gray-400 truncate">
            {isShared ? `by ${doc.owner?.name}` : formatDate(doc.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  )

  const currentDocs = filterDocs(activeTab === 'mine' ? myDocs : sharedDocs)

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* ── Page header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Documents</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {myDocs.length} document{myDocs.length !== 1 ? 's' : ''} · {sharedDocs.length} shared
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all shadow-sm"
            >
              <Upload size={14} />
              <span className="hidden sm:inline">{uploading ? 'Uploading…' : 'Upload'}</span>
            </button>

            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
            >
              <FilePlus2 size={15} />
              New Document
            </button>
          </div>
        </div>

        {/* ── Error banners ── */}
        {error && (
          <div className="mb-5 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <span className="font-medium">{error}</span>
          </div>
        )}
        {uploadError && (
          <div className="mb-5 bg-amber-50 border border-amber-100 text-amber-700 text-sm px-4 py-3 rounded-xl">
            {uploadError}
          </div>
        )}

        {/* ── Search ── */}
        <div className="relative mb-6 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search documents…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-gray-300 shadow-sm"
          />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl w-fit mb-7 border border-gray-200/60">
          {[
            { key: 'mine', label: 'My Documents', count: myDocs.length },
            { key: 'shared', label: 'Shared with me', count: sharedDocs.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/80'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }
              `}
            >
              {tab.key === 'mine' ? <FileText size={13} /> : <Users size={13} />}
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.key
                    ? tab.key === 'mine' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="h-32 bg-gray-100 animate-pulse" />
                <div className="p-3.5 space-y-2">
                  <div className="h-3 bg-gray-100 rounded-full animate-pulse w-4/5" />
                  <div className="h-2.5 bg-gray-50 rounded-full animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : currentDocs.length === 0 ? (
          <EmptyState
            isShared={activeTab === 'shared'}
            hasSearch={!!searchQuery}
            onCreate={handleCreate}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* New doc quick-create card */}
            {activeTab === 'mine' && !searchQuery && (
              <button
                onClick={handleCreate}
                className="doc-card border-2 border-dashed border-gray-200 rounded-xl h-[220px] flex flex-col items-center justify-center gap-2.5 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/40 transition-all bg-white/40 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <FilePlus2 size={18} />
                </div>
                <span className="text-xs font-semibold">New Document</span>
              </button>
            )}
            {currentDocs.map((doc) => (
              <DocCard key={doc.id} doc={doc} isShared={activeTab === 'shared'} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ isShared, hasSearch, onCreate }) {
  if (hasSearch) return (
    <div className="text-center py-20">
      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
        <Search size={22} className="text-gray-300" />
      </div>
      <p className="text-gray-500 font-semibold">No results found</p>
      <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
    </div>
  )

  if (isShared) return (
    <div className="text-center py-20">
      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
        <Users size={22} className="text-gray-300" />
      </div>
      <p className="text-gray-700 font-semibold">Nothing shared yet</p>
      <p className="text-gray-400 text-sm mt-1">Documents that others share with you will appear here</p>
    </div>
  )

  return (
    <div className="text-center py-20">
      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
        <FileText size={22} className="text-blue-400" />
      </div>
      <p className="text-gray-700 font-semibold">No documents yet</p>
      <p className="text-gray-400 text-sm mt-1 mb-5">Create your first document to get started</p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md"
      >
        <FilePlus2 size={15} />
        Create Document
        <ChevronRight size={14} />
      </button>
    </div>
  )
}