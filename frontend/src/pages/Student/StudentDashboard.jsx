import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMyProfile } from '../../services/studentApi'
import { getAttendanceByStudent } from '../../services/attendanceApi'
import { getMyFees } from '../../services/feeApi'

const StudentDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await getMyProfile()
        const student = profileRes.data.data
        setProfile(student)

        const [attRes, feeRes] = await Promise.all([
          getAttendanceByStudent(student._id),
          getMyFees(),
        ])
        setAttendance(attRes.data.data)
        
        setFees(feeRes.data.data)
      } catch {
        setError('Failed to load your profile data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const feeStatusColors = {
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-red-100 text-red-600',
    partial: 'bg-amber-100 text-amber-700',
  }

  const getAttendanceColor = (pct) => {
    if (pct >= 75) return 'text-emerald-600'
    if (pct >= 50) return 'text-amber-600'
    return 'text-red-500'
  }

  const getBarColor = (pct) => {
    if (pct >= 75) return 'bg-emerald-500'
    if (pct >= 50) return 'bg-amber-500'
    return 'bg-red-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading your dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-blue-800">
          Inst<span className="text-emerald-600">ora</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.username}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.fullName}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {profile?.batchId?.name} · {profile?.batchId?.course}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">Attendance</p>
            <p className={`text-3xl font-bold ${getAttendanceColor(attendance?.percentage || 0)}`}>
              {attendance?.percentage || 0}%
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {attendance?.present || 0} present · {attendance?.absent || 0} absent
            </p>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${getBarColor(attendance?.percentage || 0)}`}
                style={{ width: `${attendance?.percentage || 0}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">Fee status</p>
            <p className={`text-3xl font-bold ${
              profile?.feeStatus === 'paid' ? 'text-emerald-600' :
              profile?.feeStatus === 'partial' ? 'text-amber-600' : 'text-red-500'
            }`}>
              {profile?.feeStatus?.charAt(0).toUpperCase() + profile?.feeStatus?.slice(1)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {fees.length} fee record{fees.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">Batch</p>
            <p className="text-lg font-bold text-blue-700">{profile?.batchId?.name}</p>
            <p className="text-xs text-gray-400 mt-1">{profile?.batchId?.course}</p>
          </div>
        </div>

        {attendance?.records?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Recent attendance</h2>
            <div className="flex flex-col gap-2">
              {attendance.records.slice(0, 10).map((r) => (
                <div key={r._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{r.date}</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    r.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-500'
                  }`}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {fees.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Fee records</h2>
            <div className="flex flex-col gap-3">
              {fees.map((fee) => (
                <div key={fee._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      ₹{Number(fee.amount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-400">Due: {fee.dueDate}</p>
                    {fee.note && <p className="text-xs text-gray-400">{fee.note}</p>}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${feeStatusColors[fee.status]}`}>
                      {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      Paid: ₹{Number(fee.paidAmount).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentDashboard