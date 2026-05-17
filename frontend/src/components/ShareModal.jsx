import { useState, useEffect } from 'react'
import api from '../api/axios'
import { X, UserPlus, Loader2, Check, AlertCircle, UserX, Users } from 'lucide-react'

function Avatar({ name, size = 'md' }) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const colors = [
    'from-blue-400 to-blue-600',
    'from-violet-400 to-violet-600',
    'from-emerald-400 to-emerald-600',
    'from-amber-400 to-amber-600',
    'from-rose-400 to-rose-600',
    'from-cyan-400 to-cyan-600',
  ]
  // deterministic color from name
  const idx = name ? [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length : 0
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'

  return (
    <div className={`rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center shrink-0 ${sizeClass}`}>
      <span className="text-white font-semibold">{initials}</span>
    </div>
  )
}

export default function ShareModal({ document, onClose }) {
  const [email, setEmail] = useState('')
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingShares, setFetchingShares] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    fetchShares()
  }, [])

  // Auto-clear messages
  useEffect(() => {
    if (!success && !error) return
    const t = setTimeout(() => { setSuccess(''); setError('') }, 3500)
    return () => clearTimeout(t)
  }, [success, error])

  const fetchShares = async () => {
    try {
      setFetchingShares(true)
      const res = await api.get(`/api/sharing/${document.id}`)
      setShares(res.data)
    } catch {
      // silently fail
    } finally {
      setFetchingShares(false)
    }
  }

  const handleShare = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email.trim()) return

    setLoading(true)
    try {
      await api.post(`/api/sharing/${document.id}`, { email: email.trim() })
      setSuccess(`Shared successfully with ${email.trim()}`)
      setEmail('')
      fetchShares()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to share document')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (userId) => {
    setRemovingId(userId)
    try {
      await api.delete(`/api/sharing/${document.id}/${userId}`)
      setShares((prev) => prev.filter((s) => s.user.id !== userId))
    } catch {
      setError('Failed to remove access')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Users size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Share Document</h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{document.title || 'Untitled'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Invite form */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Invite by email
            </label>
            <form onSubmit={handleShare} className="flex gap-2">
              <input
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-gray-300 min-w-0 shadow-sm"
              />
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md shrink-0"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                <span className="hidden sm:inline">Invite</span>
              </button>
            </form>

            {/* Status messages */}
            {error && (
              <div className="mt-2.5 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-3.5 py-2.5 rounded-xl">
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="mt-2.5 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 rounded-xl">
                <Check size={13} className="shrink-0" />
                {success}
              </div>
            )}
          </div>

          {/* People with access */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              People with access
              {shares.length > 0 && (
                <span className="ml-2 font-normal normal-case text-gray-400">({shares.length})</span>
              )}
            </label>

            {fetchingShares ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-gray-300" />
              </div>
            ) : shares.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-2.5">
                  <Users size={16} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">Not shared with anyone yet</p>
                <p className="text-xs text-gray-300 mt-1">Invite someone using the form above</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {shares.map((share) => (
                  <li
                    key={share.id}
                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100/70 border border-gray-100 px-3.5 py-3 rounded-xl transition-colors"
                  >
                    <Avatar name={share.user.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{share.user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{share.user.email}</p>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                      Can edit
                    </span>
                    <button
                      onClick={() => handleRemove(share.user.id)}
                      disabled={removingId === share.user.id}
                      title="Remove access"
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50 shrink-0"
                    >
                      {removingId === share.user.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <UserX size={13} />
                      }
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400 text-center">
            Shared users can view and edit this document
          </p>
        </div>
      </div>
    </div>
  )
}