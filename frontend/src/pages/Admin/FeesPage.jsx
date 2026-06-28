import { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { generateMonthlyFees, getAllFees, getFeeSummary, deleteFeeRecord } from '../../services/feeApi'
import { recordPayment, getAllPayments, getPaymentsByFee, getStudentLedger } from '../../services/paymentApi'
import { getAllBatches } from '../../services/batchApi'
import { getAllStudents } from '../../services/studentApi'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const statusColors = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-red-100 text-red-600',
  partial: 'bg-amber-100 text-amber-700',
}

const methodColors = {
  cash: 'bg-gray-100 text-gray-600',
  online: 'bg-blue-100 text-blue-700',
  cheque: 'bg-purple-100 text-purple-700',
}

const FeesPage = () => {
  const [tab, setTab] = useState('fees')
  const [fees, setFees] = useState([])
  const [payments, setPayments] = useState([])
  const [batches, setBatches] = useState([])
  const [students, setStudents] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const now = new Date()
  const [filterBatch, setFilterBatch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterYear, setFilterYear] = useState(now.getFullYear())
  const [filterPayStudent, setFilterPayStudent] = useState('')

  const [showGenModal, setShowGenModal] = useState(false)
  const [genForm, setGenForm] = useState({
    mode: 'student', studentId: '', batchId: '',
    amount: '', month: now.getMonth() + 1, year: now.getFullYear()
  })
  const [generating, setGenerating] = useState(false)

  const [payModal, setPayModal] = useState(null)
  const [feePayments, setFeePayments] = useState([])
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 'cash', note: '' })
  const [paying, setPaying] = useState(false)

  const [ledgerModal, setLedgerModal] = useState(null)
  const [ledgerLoading, setLedgerLoading] = useState(false)

  const fetchAll = async () => {
    try {
      const params = new URLSearchParams()
      if (filterBatch) params.append('batchId', filterBatch)
      if (filterStatus) params.append('status', filterStatus)
      if (filterMonth) params.append('month', filterMonth)
      if (filterYear) params.append('year', filterYear)
      const qs = params.toString() ? `?${params.toString()}` : ''

      const payParams = new URLSearchParams()
      if (filterPayStudent) payParams.append('studentId', filterPayStudent)
      const payQs = payParams.toString() ? `?${payParams.toString()}` : ''

      const [feesRes, batchRes, sumRes, payRes, studRes] = await Promise.all([
        getAllFees(qs),
        getAllBatches(),
        getFeeSummary(),
        getAllPayments(payQs),
        getAllStudents(),
      ])
      setFees(feesRes.data.data)
      setBatches(batchRes.data.data)
      setSummary(sumRes.data.data)
      setPayments(payRes.data.data)
      setStudents(studRes.data.data)
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [filterBatch, filterStatus, filterMonth, filterYear, filterPayStudent])

  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenerating(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        amount: Number(genForm.amount),
        month: Number(genForm.month),
        year: Number(genForm.year),
      }
      if (genForm.mode === 'student') payload.studentId = genForm.studentId
      else payload.batchId = genForm.batchId
      const res = await generateMonthlyFees(payload)
      setSuccess(res.data.message)
      setShowGenModal(false)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate fees')
    } finally {
      setGenerating(false)
    }
  }

  const openPayModal = async (fee) => {
    setPayModal(fee)
    setPayForm({ amount: fee.amount - fee.paidAmount, paymentMethod: 'cash', note: '' })
    setError('')
    try {
      const res = await getPaymentsByFee(fee._id)
      setFeePayments(res.data.data)
    } catch { setFeePayments([]) }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    setPaying(true)
    setError('')
    try {
      await recordPayment({
        feeId: payModal._id,
        amount: Number(payForm.amount),
        paymentMethod: payForm.paymentMethod,
        note: payForm.note,
      })
      setPayModal(null)
      setSuccess('Payment recorded permanently')
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setPaying(false)
    }
  }

  const handleDeleteFee = async (id) => {
    if (!window.confirm('Delete this fee record? Note: Any payments already made against this record will remain in the payment history.')) return
    try {
      await deleteFeeRecord(id)
      setSuccess('Fee record deleted')
      fetchAll()
    } catch { setError('Failed to delete fee record') }
  }

  const openLedger = async (student) => {
    setLedgerModal({ student, ledger: null, summary: null })
    setLedgerLoading(true)
    try {
      const res = await getStudentLedger(student._id)
      setLedgerModal(res.data.data)
    } catch {
      setError('Failed to load student ledger')
      setLedgerModal(null)
    } finally {
      setLedgerLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
            <p className="text-gray-500 text-sm mt-1">Monthly billing and permanent payment records</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => openLedger(students[0]) && false}
              className="hidden"
            />
            <button
              onClick={() => { setShowGenModal(true); setError('') }}
              className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              + Generate monthly fees
            </button>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">This month</p>
              <p className="text-xl font-bold text-gray-900">{fmt(summary.thisMonthBilled)} billed</p>
              <p className="text-sm mt-1">
                <span className="text-emerald-600">{fmt(summary.thisMonthCollected)} collected</span>
                <span className="text-gray-400"> · </span>
                <span className="text-red-500">{fmt(summary.thisMonthPending)} pending</span>
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">All time collected</p>
              <p className="text-xl font-bold text-emerald-600">{fmt(summary.totalCollected)}</p>
              <p className="text-sm text-gray-400 mt-1">of {fmt(summary.totalBilled)} total billed</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Outstanding balance</p>
              <p className="text-xl font-bold text-red-500">{fmt(summary.totalPending)}</p>
              <p className="text-sm text-gray-400 mt-1">
                {summary.pending} pending · {summary.partial} partial · {summary.paid} paid
              </p>
            </div>
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}

        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
          {['fees', 'payments', 'ledger'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'fees' ? 'Fee records' : t === 'payments' ? 'All transactions' : 'Student ledger'}
            </button>
          ))}
        </div>

        {tab === 'fees' && (
          <>
            <div className="flex gap-3 mb-4 flex-wrap">
              <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All batches</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            {loading ? <p className="text-gray-400 text-sm">Loading...</p> :
              fees.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-lg mb-1">No fee records for this period</p>
                  <p className="text-sm">Click "Generate monthly fees" to create them</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Student</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Period</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Fee</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Paid</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((fee, i) => (
                        <tr key={fee._id} className={`border-b border-gray-100 hover:bg-gray-50 ${i === fees.length - 1 ? 'border-b-0' : ''}`}>
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-900">{fee.studentId?.fullName}</p>
                            <p className="text-xs text-gray-400">{fee.batchId?.name}</p>
                          </td>
                          <td className="px-5 py-4 font-medium text-gray-700">{MONTHS[fee.month - 1]} {fee.year}</td>
                          <td className="px-5 py-4 font-medium text-gray-900">{fmt(fee.amount)}</td>
                          <td className="px-5 py-4 text-emerald-600">{fmt(fee.paidAmount)}</td>
                          <td className="px-5 py-4 text-red-500 font-medium">{fmt(fee.amount - fee.paidAmount)}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[fee.status]}`}>
                              {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-3 items-center">
                              {fee.status !== 'paid' ? (
                                <button onClick={() => openPayModal(fee)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                                  + Payment
                                </button>
                              ) : (
                                <button onClick={() => openPayModal(fee)}
                                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                                  View
                                </button>
                              )}
                              {/* <button onClick={() => handleDeleteFee(fee._id)}
                                className="text-xs text-red-400 hover:text-red-600 transition-colors">
                                Delete
                              </button> */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </>
        )}

        {tab === 'payments' && (
          <>
            <div className="flex gap-3 mb-4">
              <select value={filterPayStudent} onChange={e => setFilterPayStudent(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All students</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
              </select>
              <div className="flex items-center gap-2 ml-auto bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-lg">
                🔒 Payment records are permanent and cannot be deleted
              </div>
            </div>
            {payments.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg mb-1">No payments recorded yet</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Receipt</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Student</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">For month</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Method</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Recorded by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={p._id} className={`border-b border-gray-100 hover:bg-gray-50 ${i === payments.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{p.receiptNumber}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{p.studentId?.fullName}</p>
                          <p className="text-xs text-gray-400">{p.studentId?.batchId?.name}</p>
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-700">
                          {p.feeId ? `${MONTHS[p.feeId.month - 1]} ${p.feeId.year}` : '—'}
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-600">{fmt(p.amount)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${methodColors[p.paymentMethod]}`}>
                            {p.paymentMethod.charAt(0).toUpperCase() + p.paymentMethod.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">{p.recordedBy?.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'ledger' && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-3">Select a student to view their complete month-wise fee and payment history</p>
              <div className="grid grid-cols-3 gap-3">
                {students.map(s => (
                  <button key={s._id} onClick={() => openLedger(s)}
                    className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                        {s.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{s.fullName}</p>
                        <p className="text-xs text-gray-400">{s.batchId?.name}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.feeStatus]}`}>
                        {s.feeStatus?.charAt(0).toUpperCase() + s.feeStatus?.slice(1)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {students.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p>No students yet</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Generate fees modal */}
        {showGenModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h2 className="font-semibold text-gray-900 mb-1">Generate monthly fees</h2>
              <p className="text-sm text-gray-500 mb-4">Creates a fee record for the selected student or entire batch</p>
              <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
                <button type="button" onClick={() => setGenForm({ ...genForm, mode: 'student', batchId: '' })}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${genForm.mode === 'student' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  Single student
                </button>
                <button type="button" onClick={() => setGenForm({ ...genForm, mode: 'batch', studentId: '' })}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${genForm.mode === 'batch' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  Entire batch
                </button>
              </div>
              <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                {genForm.mode === 'student' ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Student</label>
                    <select value={genForm.studentId} onChange={e => setGenForm({ ...genForm, studentId: e.target.value })} required
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select student</option>
                      {students.map(s => <option key={s._id} value={s._id}>{s.fullName} — {s.batchId?.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Batch</label>
                    <select value={genForm.batchId} onChange={e => setGenForm({ ...genForm, batchId: e.target.value })} required
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select batch</option>
                      {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                    {genForm.batchId && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠ Generates for all {students.filter(s => s.batchId?._id === genForm.batchId).length} students in this batch
                      </p>
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Monthly fee amount (₹)</label>
                  <input type="number" value={genForm.amount} onChange={e => setGenForm({ ...genForm, amount: e.target.value })}
                    placeholder="e.g. 3000" required
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Month</label>
                    <select value={genForm.month} onChange={e => setGenForm({ ...genForm, month: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Year</label>
                    <select value={genForm.year} onChange={e => setGenForm({ ...genForm, year: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex gap-3 justify-end mt-1">
                  <button type="button" onClick={() => { setShowGenModal(false); setError('') }}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={generating}
                    className="px-6 py-2 bg-blue-700 text-white text-sm rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50">
                    {generating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment modal */}
        {payModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {payModal.status !== 'paid' ? 'Record payment' : 'Payment history'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {payModal.studentId?.fullName} · {MONTHS[payModal.month - 1]} {payModal.year}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Fee</p>
                  <p className="font-bold text-gray-900">{fmt(payModal.amount)}</p>
                  <p className="text-xs text-emerald-600">Paid: {fmt(payModal.paidAmount)}</p>
                  {payModal.status !== 'paid' && (
                    <p className="text-xs text-red-500">Due: {fmt(payModal.amount - payModal.paidAmount)}</p>
                  )}
                </div>
              </div>

              {feePayments.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Payment history ({feePayments.length} transaction{feePayments.length !== 1 ? 's' : ''})
                  </p>
                  {feePayments.map(p => (
                    <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <span className="font-mono text-xs text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded">{p.receiptNumber}</span>
                        <span className={`text-xs ml-2 px-1.5 py-0.5 rounded font-medium ${methodColors[p.paymentMethod]}`}>{p.paymentMethod}</span>
                        {p.note && <span className="text-xs text-gray-400 ml-2">{p.note}</span>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{fmt(p.amount)}</p>
                        <p className="text-xs text-gray-400">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    🔒 Payments are permanent records
                  </p>
                </div>
              )}

              {payModal.status !== 'paid' && (
                <form onSubmit={handlePayment} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Amount (₹)</label>
                      <input type="number" value={payForm.amount}
                        onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                        max={payModal.amount - payModal.paidAmount} required
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Method</label>
                      <select value={payForm.paymentMethod}
                        onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="cash">Cash</option>
                        <option value="online">Online</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Note (optional)</label>
                    <input type="text" value={payForm.note}
                      onChange={e => setPayForm({ ...payForm, note: e.target.value })}
                      placeholder="e.g. UPI ref #123456, partial payment..."
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setPayModal(null)}
                      className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={paying}
                      className="px-6 py-2 bg-emerald-600 text-white text-sm rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
                      {paying ? 'Recording...' : 'Confirm payment'}
                    </button>
                  </div>
                </form>
              )}
              {payModal.status === 'paid' && (
                <button onClick={() => setPayModal(null)}
                  className="w-full py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 mt-2">
                  Close
                </button>
              )}
            </div>
          </div>
        )}

        {/* Student Ledger modal */}
        {ledgerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">
                      {ledgerLoading ? 'Loading...' : ledgerModal.student?.fullName}
                    </h2>
                    {!ledgerLoading && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {ledgerModal.student?.batch} · Joined {new Date(ledgerModal.student?.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setLedgerModal(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl font-light">✕</button>
                </div>

                {!ledgerLoading && ledgerModal.summary && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Total billed</p>
                      <p className="font-bold text-gray-900">{fmt(ledgerModal.summary.totalBilled)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Total paid</p>
                      <p className="font-bold text-emerald-600">{fmt(ledgerModal.summary.totalPaid)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Outstanding</p>
                      <p className="font-bold text-red-500">{fmt(ledgerModal.summary.totalBalance)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                {ledgerLoading ? (
                  <p className="text-gray-400 text-sm text-center py-8">Loading ledger...</p>
                ) : ledgerModal.ledger?.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No fee records yet for this student</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {ledgerModal.ledger?.map((entry) => (
                      <div key={entry.feeId} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900">{entry.period}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[entry.status]}`}>
                              {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">Fee: <span className="font-medium text-gray-900">{fmt(entry.amount)}</span></span>
                            <span className="text-emerald-600">Paid: <span className="font-medium">{fmt(entry.paidAmount)}</span></span>
                            {entry.balance > 0 && (
                              <span className="text-red-500">Due: <span className="font-medium">{fmt(entry.balance)}</span></span>
                            )}
                          </div>
                        </div>

                        {entry.payments.length === 0 ? (
                          <p className="text-xs text-gray-400 px-4 py-3 italic">No payments yet</p>
                        ) : (
                          <div className="divide-y divide-gray-50">
                            {entry.payments.map(p => (
                              <div key={p._id} className="flex items-center justify-between px-4 py-2.5">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{p.receiptNumber}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${methodColors[p.paymentMethod]}`}>{p.paymentMethod}</span>
                                  {p.note && <span className="text-xs text-gray-400">{p.note}</span>}
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="font-bold text-emerald-600 text-sm">{fmt(p.amount)}</span>
                                  <span className="text-xs text-gray-400">{new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                  <span className="text-xs text-gray-400">by {p.recordedBy}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default FeesPage