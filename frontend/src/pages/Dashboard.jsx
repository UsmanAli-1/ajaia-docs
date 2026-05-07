import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'

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
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchAll()
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
    setRenamingId(doc.id)
    setRenameValue(doc.title)
  }

  const handleRename = async (id) => {
    if (!renameValue.trim()) return
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
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const DocCard = ({ doc, isShared = false }) => (
    <div
      onClick={() => navigate(`/editor/${doc.id}`)}
      className="group bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
    >
      {/* Document icon */}
      <div className="w-10 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center mb-3">
        <svg className="w-5 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 24">
          <path d="M13 0H3C1.9 0 1 .9 1 2v20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-6-6zm-1 7V1.5L17.5 7H12z" />
        </svg>
      </div>

      {/* Title */}
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
          className="w-full border border-blue-400 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <p className="text-sm font-medium text-gray-900 truncate mb-1">{doc.title}</p>
      )}

      <p className="text-xs text-gray-400">
        {isShared ? `Shared by ${doc.owner?.name}` : `Edited ${formatDate(doc.updatedAt)}`}
      </p>

      {/* Actions — only on owned docs */}
      {!isShared && (
        <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => startRename(doc, e)}
            className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            Rename
          </button>
          <button
            onClick={(e) => handleDelete(doc.id, e)}
            className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <div className="flex items-center gap-3">
            {/* Upload button */}
            <div className="relative">
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
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors bg-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {uploading ? 'Uploading...' : 'Upload .txt / .md'}
              </button>
            </div>

            {/* New doc button */}
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Document
            </button>
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {uploadError && (
          <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-3 rounded-lg">
            {uploadError}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-200 p-1 rounded-lg w-fit mb-6">
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'mine'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Documents
            {myDocs.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                {myDocs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'shared'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Shared With Me
            {sharedDocs.length > 0 && (
              <span className="ml-2 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">
                {sharedDocs.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : activeTab === 'mine' ? (
          myDocs.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No documents yet</p>
              <p className="text-gray-400 text-sm mt-1">Create your first document to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {myDocs.map((doc) => (
                <DocCard key={doc.id} doc={doc} />
              ))}
            </div>
          )
        ) : sharedDocs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Nothing shared with you yet</p>
            <p className="text-gray-400 text-sm mt-1">Documents shared by others will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sharedDocs.map((doc) => (
              <DocCard key={doc.id} doc={doc} isShared />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}