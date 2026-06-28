import { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { getAllBatches } from '../../services/batchApi'
import { getAllStudents } from '../../services/studentApi'
import {
  markAttendance,
  getAttendanceByBatchAndDate,
  getBatchAttendanceSummary,
  getDatewiseAttendance,
} from '../../services/attendanceApi'
import AttendanceChart from '../../components/AttendanceChart'

const AttendancePage = () => {
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [summary, setSummary] = useState([])
  const [datewiseData, setDatewiseData] = useState([])
  const [isLocked, setIsLocked] = useState(false)
  const [tab, setTab] = useState('mark')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getAllBatches().then(res => setBatches(res.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedBatch) return
    setStudents([])
    setAttendance({})
    setMessage('')
    setError('')
    setIsLocked(false)

    getAllStudents().then(res => {
      const batchStudents = res.data.data.filter(s => s.batchId?._id === selectedBatch)
      setStudents(batchStudents)

      const initial = {}
      batchStudents.forEach(s => { initial[s._id] = 'present' })

      getAttendanceByBatchAndDate(selectedBatch, selectedDate).then(attRes => {
        const existing = {}
        attRes.data.data.forEach(r => { existing[r.studentId?._id] = r.status })
        if (Object.keys(existing).length > 0) {
          setAttendance(existing)
          setIsLocked(true)
        } else {
          setAttendance(initial)
          setIsLocked(false)
        }
      }).catch(() => { setAttendance(initial) })
    })

    getBatchAttendanceSummary(selectedBatch)
      .then(res => setSummary(res.data.data))
      .catch(() => {})

    getDatewiseAttendance(selectedBatch)
      .then(res => setDatewiseData(res.data.data))
      .catch(() => {})

  }, [selectedBatch, selectedDate])

  const toggleAll = (status) => {
    const updated = {}
    students.forEach(s => { updated[s._id] = status })
    setAttendance(updated)
  }

  const handleSave = async () => {
    if (!selectedBatch || students.length === 0) return
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const records = students.map(s => ({
        studentId: s._id,
        status: attendance[s._id] || 'absent',
      }))
      await markAttendance({ batchId: selectedBatch, date: selectedDate, records })
      setIsLocked(true)
      setMessage('Attendance saved successfully')
      getBatchAttendanceSummary(selectedBatch).then(res => setSummary(res.data.data))
      getDatewiseAttendance(selectedBatch).then(res => setDatewiseData(res.data.data))
    } catch {
      setError('Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkAgain = () => {
    if (!window.confirm(`Re-mark attendance for ${selectedDate}? This will update existing records.`)) return
    setIsLocked(false)
    setMessage('')
  }

  const presentCount = Object.values(attendance).filter(v => v === 'present').length
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length

  const getPercentageColor = (pct) => {
    if (pct >= 75) return 'text-emerald-600'
    if (pct >= 50) return 'text-amber-600'
    return 'text-red-500'
  }

  const getBarColor = (pct) => {
    if (pct >= 75) return 'bg-emerald-500'
    if (pct >= 50) return 'bg-amber-500'
    return 'bg-red-400'
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 text-sm mt-1">Mark and track student attendance by batch</p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-48"
            >
              <option value="">Select batch</option>
              {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {selectedBatch && (
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            {['mark', 'summary', 'chart'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'mark' ? 'Mark attendance' : t === 'summary' ? 'Summary report' : 'Date-wise chart'}
              </button>
            ))}
          </div>
        )}

        {!selectedBatch && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">Select a batch to get started</p>
            <p className="text-sm">Choose a batch and date above to mark or view attendance</p>
          </div>
        )}

        {selectedBatch && tab === 'mark' && (
          <div>
            {message && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
                <span>{message}</span>
                <button
                  onClick={handleMarkAgain}
                  className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 transition-colors ml-4"
                >
                  Mark again
                </button>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {isLocked && !message && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
                <span>Attendance already marked for <strong>{selectedDate}</strong></span>
                <button
                  onClick={handleMarkAgain}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors ml-4"
                >
                  Mark again
                </button>
              </div>
            )}

            {students.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No students in this batch yet</p>
              </div>
            ) : (
              <div className={`bg-white border rounded-xl overflow-hidden ${isLocked ? 'border-blue-200 opacity-75 pointer-events-none' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">{students.length} students</span>
                    <span className="text-emerald-600 font-medium">{presentCount} present</span>
                    <span className="text-red-500 font-medium">{absentCount} absent</span>
                  </div>
                  {!isLocked && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleAll('present')}
                        className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        All present
                      </button>
                      <button
                        onClick={() => toggleAll('absent')}
                        className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        All absent
                      </button>
                    </div>
                  )}
                </div>

                {students.map((student, i) => (
                  <div
                    key={student._id}
                    className={`flex items-center justify-between px-5 py-4 ${i !== students.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                        {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.fullName}</p>
                        <p className="text-xs text-gray-400">{student.userId?.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAttendance({ ...attendance, [student._id]: 'present' })}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          attendance[student._id] === 'present'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => setAttendance({ ...attendance, [student._id]: 'absent' })}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          attendance[student._id] === 'absent'
                            ? 'bg-red-400 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                ))}

                {!isLocked && (
                  <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save attendance'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedBatch && tab === 'summary' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {summary.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No attendance data yet for this batch</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Student</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Present</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Absent</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row, i) => (
                    <tr key={row.studentId} className={`border-b border-gray-100 ${i === summary.length - 1 ? 'border-b-0' : ''}`}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{row.fullName}</p>
                        <p className="text-xs text-gray-400">{row.username}</p>
                      </td>
                      <td className="px-5 py-4 text-emerald-600 font-medium">{row.present}</td>
                      <td className="px-5 py-4 text-red-500 font-medium">{row.absent}</td>
                      <td className="px-5 py-4 text-gray-500">{row.total}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${getBarColor(row.percentage)}`}
                              style={{ width: `${row.percentage}%` }}
                            />
                          </div>
                          <span className={`text-sm font-semibold ${getPercentageColor(row.percentage)}`}>
                            {row.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {selectedBatch && tab === 'chart' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Daily attendance — all time</h2>
            <AttendanceChart data={datewiseData} />
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AttendancePage