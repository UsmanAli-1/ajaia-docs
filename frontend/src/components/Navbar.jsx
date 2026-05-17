import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, FileText } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <nav className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between sticky top-0 z-40 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      {/* Brand */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2.5 group"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
          <FileText size={14} className="text-white" strokeWidth={2} />
        </div>
        <span className="text-base font-bold text-gray-900 tracking-tight">
          Ajaia <span className="text-blue-600">Docs</span>
        </span>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* User info */}
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <span className="text-sm font-medium text-gray-700">{user?.name}</span>
        </div>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-all font-medium"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  )
}