import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function ShareModal({ document, onClose }) {
  const [email, setEmail] = useState('')
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingShares, setFetchingShares] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchShares()
  }, [])

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
      setSuccess(`Document shared successfully`)
      setEmail('')
      fetchShares()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to share document')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (userId) => {
    try {
      await api.delete(`/api/sharing/${document.id}/${userId}`)
      setShares((prev) => prev.filter((s) => s.user.id !== userId))
    } catch {
      setError('Failed to remove access')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Share Document</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{document.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Share form */}
        <div className="p-5">
          <form onSubmit={handleShare} className="flex gap-2">
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </form>

          {error && (
            <p className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{success}</p>
          )}

          {/* Shared users list */}
          <div className="mt-5">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              People with access
            </h3>

            {fetchingShares ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : shares.length === 0 ? (
              <p className="text-sm text-gray-400">Not shared with anyone yet</p>
            ) : (
              <ul className="space-y-2">
                {shares.map((share) => (
                  <li
                    key={share.id}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{share.user.name}</p>
                      <p className="text-xs text-gray-500">{share.user.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(share.user.id)}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}