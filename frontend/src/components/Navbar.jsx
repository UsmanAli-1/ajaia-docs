import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate('/dashboard')}
      >
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <span className="text-lg font-semibold text-gray-800">Ajaia Docs</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          {user?.name}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-red-500 transition-colors px-3 py-1.5 rounded-md hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}