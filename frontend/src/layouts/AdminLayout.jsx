import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

 const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '⊞' },
  { label: 'Students', path: '/admin/students', icon: '👤' },
  { label: 'Teachers', path: '/admin/teachers', icon: '🎓' },
  { label: 'Batches', path: '/admin/batches', icon: '📚' },
  { label: 'Attendance', path: '/admin/attendance', icon: '✅' },
  { label: 'Fees', path: '/admin/fees', icon: '₹' },
  { label: 'Inquiries', path: '/admin/inquiries', icon: '📋' },
]

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-blue-950 text-white flex flex-col fixed top-0 left-0 h-full">
        <div className="p-5 border-b border-blue-900">
          <span className="text-lg font-bold">
            Inst<span className="text-emerald-400">ora</span>
          </span>
          <p className="text-xs text-blue-400 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-5 py-3 text-sm text-blue-200 hover:bg-blue-900 hover:text-white transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-900">
          <p className="text-xs text-blue-400 mb-2">{user?.username}</p>
          <button
            onClick={handleLogout}
            className="w-full text-xs text-blue-300 hover:text-white py-1 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="ml-56 flex-1 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  )
}

export default AdminLayout