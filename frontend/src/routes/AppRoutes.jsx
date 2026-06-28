import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import PublicLayout from '../layouts/PublicLayout'
import LandingPage from '../pages/Public/LandingPage'
import LoginPage from '../pages/Public/LoginPage'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import BatchesPage from '../pages/Admin/BatchesPage'
import StudentsPage from '../pages/Admin/StudentsPage'
import TeacherDashboard from '../pages/Teacher/TeacherDashboard'
import StudentDashboard from '../pages/Student/StudentDashboard'
import AttendancePage from '../pages/Admin/AttendancePage'
import FeesPage from '../pages/Admin/FeesPage'
import InquiriesPage from '../pages/Admin/InquiriesPage'
import TeachersPage from '../pages/Admin/TeachersPage'
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
        <Route path="/admin/batches" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <BatchesPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/students" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <StudentsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/attendance" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AttendancePage />
          </ProtectedRoute>
        } />
        <Route path="/admin/fees" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <FeesPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/inquiries" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <InquiriesPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/teachers" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <TeachersPage />
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