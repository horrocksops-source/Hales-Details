import React from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'
import BookAppointment from './pages/BookAppointment.jsx'
import MyCars from './pages/MyCars.jsx'
import MyAppointments from './pages/MyAppointments.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminSchedule from './pages/AdminSchedule.jsx'
import AdminAppointments from './pages/AdminAppointments.jsx'
import AdminCustomers from './pages/AdminCustomers.jsx'

function Layout() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

function AdminLayout() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Customer routes */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<CustomerDashboard />} />
        <Route path="/book" element={<BookAppointment />} />
        <Route path="/cars" element={<MyCars />} />
        <Route path="/appointments" element={<MyAppointments />} />
      </Route>

      {/* Admin routes */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/schedule" element={<AdminSchedule />} />
        <Route path="/admin/appointments" element={<AdminAppointments />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
