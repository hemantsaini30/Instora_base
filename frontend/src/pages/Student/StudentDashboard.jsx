import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const StudentDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Welcome, {user?.username}</h1>
        <p className="text-gray-500 mb-6">Student Dashboard — Phase 2 features coming soon.</p>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

export default StudentDashboard