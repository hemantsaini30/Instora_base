import API from './authApi'

export const getAvailableTeachers  = ()             => API.get('/api/doubts/available-teachers')
export const createDoubSessions    = (data)         => API.post('/api/doubts/sessions', data)
export const getMySessionsStudent  = ()             => API.get('/api/doubts/sessions/mine')
export const getSessionsForTeacher = ()             => API.get('/api/doubts/sessions/teacher')
export const getMessages           = (id)           => API.get(`/api/doubts/sessions/${id}/messages`)
export const sendMessage           = (id, data)     => API.post(`/api/doubts/sessions/${id}/messages`, data)
export const toggleSave            = (id)           => API.patch(`/api/doubts/sessions/${id}/save`)
export const resolveSession        = (id)           => API.patch(`/api/doubts/sessions/${id}/resolve`)