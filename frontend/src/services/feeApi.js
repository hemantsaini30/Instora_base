import API from './authApi'

export const getAllFees = (params = '') => API.get(`/api/fees${params}`)
export const getMyFees = () => API.get('/api/fees/my')
export const createFeeRecord = (data) => API.post('/api/fees', data)
export const recordPayment = (id, data) => API.patch(`/api/fees/${id}/pay`, data)
export const getFeeSummary = () => API.get('/api/fees/summary')
export const deleteFeeRecord = (id) => API.delete(`/api/fees/${id}`)