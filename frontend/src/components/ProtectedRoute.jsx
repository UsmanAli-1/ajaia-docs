import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2, FileText } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fc] gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <FileText size={15} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Ajaia Docs</span>
        </div>
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-2" />
      </div>
    )
  }

  if (!token) return <Navigate to="/login" replace />

  return children
}