import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { LogoutPage } from './pages/LogoutPage'
import { CrudPage } from './pages/CrudPage'
import { QuestionBankPage } from './pages/instructor/QuestionBankPage'
import { SessionPage } from './pages/instructor/SessionPage'
import { LecturerDashboardPage } from './pages/instructor/LecturerDashboardPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { StudentPortalPage } from './pages/student/StudentPortalPage'
import { PreExamPage } from './pages/student/PreExamPage'
import { VivaRoomPage } from './pages/student/VivaRoomPage'
import { StudentReportPage } from './pages/student/StudentReportPage'
import './css/index.css'

function ProtectedRoutes() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />

  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={session.role === 'STUDENT' ? <StudentPortalPage /> : session.role === 'ADMIN' ? <AdminDashboardPage /> : <LecturerDashboardPage />} />
        <Route path="/lecturer/dashboard" element={<LecturerDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/subjects" element={<CrudPage resourceKey="subjects" />} />
        <Route path="/users" element={<CrudPage resourceKey="users" />} />
        <Route path="/exams" element={<CrudPage resourceKey="exams" />} />
        <Route path="/questions" element={<QuestionBankPage />} />
        <Route path="/sessions" element={<SessionPage />} />
        <Route path="/student/pre-check" element={<PreExamPage />} />
        <Route path="/student/exam" element={<VivaRoomPage />} />
        <Route path="/student/report" element={<StudentReportPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DataProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
        </DataProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
