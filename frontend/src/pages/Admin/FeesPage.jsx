import { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { getAllFees, createFeeRecord, recordPayment, getFeeSummary, deleteFeeRecord } from '../../services/feeApi'
import { getAllStudents } from '../../services/studentApi'
import { getAllBatches } from '../../services/batchApi'

const FeesPage = () => {
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [batches, setBatches] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [payModal, setPayModal] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [form, setForm] = useState({ studentId: '', batchId: '', amount: '', dueDate: '', note: '' })
  const [payForm, setPayForm] = useState({ paidAmount: '', paidDate: new Date().toISOString().split('T')[0], note: '' })

  const fetchAll = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      if (filterBatch) params.append('batchId', filterBatch)
      const queryString = params.toString() ? `?${params.toString()}` : ''
      const [feesRes, studRes, batRes, sumRes] = await Promise.all([
        getAllFees(queryString),
        getAllStudents(),
        getAllBatches(),
        getFeeSummary(),
      ])
      setFees(feesRes.data.data)
      setStudents(studRes.data.data)
      setBatches(batRes.data.data)
      setSummary(sumRes.data.data)
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [filterStatus, filterBatch])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createFeeRecord(form)
      setForm({ studentId: '', batchId: '', amount: '', dueDate: '', note: '' })
      setShowForm(false)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create fee record')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await recordPayment(payModal._id, {
        paidAmount: Number(payForm.paidAmount),
        paidDate: payForm.paidDate,
        note: payForm.note,
      })
      setPayModal(null)
      setPayForm({ paidAmount: '', paidDate: new Date().toISOString().split('T')[0], note: '' })
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fee record?')) return
    try {
      await deleteFeeRecord(id)
      fetchAll()
    } catch {
      setError('Failed to delete fee record')
    }
  }

  const statusColors = {
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-red-100 text-red-600',
    partial: 'bg-amber-100 text-amber-700',
  }

  const formatAmount = (n) => `₹${Number(n).toLocaleString('en-IN')}`

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
            <p className="text-gray-500 text-sm mt-1">Track and collect student fees</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError('') }}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add fee record'}
          </button>
        </div>

        {summary && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total due', value: formatAmount(summary.totalDue), color: 'text-gray-900' },
              { label: 'Collected', value: formatAmount(summary.totalCollected), color: 'text-emerald-600' },
              { label: 'Pending', value: formatAmount(summary.totalPending), color: 'text-red-500' },
              { label: 'Records', value: `${summary.paid} paid · ${summary.pending} pending · ${summary.partial} partial`, color: 'text-blue-700' },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Create fee record</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Student</label>
                <select
                  value={form.studentId}
                  onChange={(e) => {
                    const student = students.find(s => s._id === e.target.value)
                    setForm({ ...form, studentId: e.target.value, batchId: student?.batchId?._id || '' })
                  }}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select student</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.fullName} — {s.batchId?.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Total fee amount (₹)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 15000"
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Due date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Note (optional)</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="e.g. First installment"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create record'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex gap-3 mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
          </select>
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All batches</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : fees.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">No fee records yet</p>
            <p className="text-sm">Click "Add fee record" to get started</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Batch</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total fee</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Paid</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Due date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee, i) => (
                  <tr key={fee._id} className={`border-b border-gray-100 hover:bg-gray-50 ${i === fees.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{fee.studentId?.fullName}</p>
                      <p className="text-xs text-gray-400">{fee.studentId?.userId?.username}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{fee.batchId?.name}</td>
                    <td className="px-5 py-4 font-medium text-gray-900">{formatAmount(fee.amount)}</td>
                    <td className="px-5 py-4 text-emerald-600">{formatAmount(fee.paidAmount)}</td>
                    <td className="px-5 py-4 text-gray-500">{fee.dueDate}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[fee.status]}`}>
                        {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {fee.status !== 'paid' && (
                          <button
                            onClick={() => { setPayModal(fee); setPayForm({ paidAmount: fee.amount - fee.paidAmount, paidDate: new Date().toISOString().split('T')[0], note: '' }) }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            Record payment
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(fee._id)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {payModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h2 className="font-semibold text-gray-900 mb-1">Record payment</h2>
              <p className="text-sm text-gray-500 mb-4">
                {payModal.studentId?.fullName} — Total fee: {formatAmount(payModal.amount)} — Already paid: {formatAmount(payModal.paidAmount)}
              </p>
              <form onSubmit={handlePayment} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Amount being paid now (₹)</label>
                  <input
                    type="number"
                    value={payForm.paidAmount}
                    onChange={(e) => setPayForm({ ...payForm, paidAmount: e.target.value })}
                    required
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Payment date</label>
                  <input
                    type="date"
                    value={payForm.paidDate}
                    onChange={(e) => setPayForm({ ...payForm, paidDate: e.target.value })}
                    required
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Note (optional)</label>
                  <input
                    type="text"
                    value={payForm.note}
                    onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                    placeholder="e.g. Cash payment"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setPayModal(null)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-emerald-600 text-white text-sm rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Confirm payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default FeesPage