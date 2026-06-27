import AdminLayout from '../../layouts/AdminLayout'
import { useAuth } from '../../context/AuthContext'

const AdminDashboard = () => {
  const { user } = useAuth()

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Good morning, {user?.username}
        </h1>
        <p className="text-gray-500 text-sm mb-8">Here's what's happening at your institute today.</p>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total students', value: '248', sub: '+12 this month', color: 'text-blue-700' },
            { label: 'Attendance today', value: '87%', sub: '216 of 248 present', color: 'text-emerald-700' },
            { label: 'Fee collected', value: '₹4.2L', sub: '₹0.8L pending', color: 'text-amber-700' },
            { label: 'New inquiries', value: '14', sub: '3 uncontacted', color: 'text-pink-700' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-800 mb-2">System status</h2>
          <p className="text-sm text-emerald-600">✅ All systems running. Welcome to Instora Admin — Phase 2 features coming soon.</p>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard