import API from './authApi'

export const markAttendance = (data) => API.post('/api/attendance', data)
export const getAttendanceByBatchAndDate = (batchId, date) =>
  API.get(`/api/attendance?batchId=${batchId}&date=${date}`)
export const getAttendanceByStudent = (studentId) =>
  API.get(`/api/attendance/student/${studentId}`)
export const getBatchAttendanceSummary = (batchId) =>
  API.get(`/api/attendance/summary/${batchId}`)
export const getDatewiseAttendance = (batchId) =>
  API.get(`/api/attendance/datewise/${batchId}`)