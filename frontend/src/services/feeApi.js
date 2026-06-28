import API from './authApi'

export const generateMonthlyFees = (data) => API.post('/api/fees/generate', data)
export const getAllFees = (params = '') => API.get(`/api/fees${params}`)
export const getMyFees = () => API.get('/api/fees/my')
export const getFeeSummary = () => API.get('/api/fees/summary')
export const deleteFeeRecord = (id) => API.delete(`/api/fees/${id}`)