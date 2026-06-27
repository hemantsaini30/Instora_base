import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import PublicLayout from '../layouts/PublicLayout'
import LandingPage from '../pages/Public/LandingPage'
import LoginPage from '../pages/Public/LoginPage'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import TeacherDashboard from '../pages/Teacher/TeacherDashboard'
import StudentDashboard from '../pages/Student/StudentDashboard'

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/teacher/dashboard" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes