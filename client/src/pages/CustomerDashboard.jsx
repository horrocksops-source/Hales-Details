import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function serviceBadgeColor(service) {
  if (!service) return 'gray'
  const s = service.toLowerCase()
  if (s === 'premium') return 'purple'
  if (s === 'standard') return 'amber'
  return 'blue'
}

function statusBadgeColor(status) {
  if (!status) return 'gray'
  const s = status.toLowerCase()
  if (s === 'confirmed') return 'green'
  if (s === 'completed') return 'green'
  if (s === 'pending') return 'amber'
  if (s === 'cancelled') return 'gray'
  return 'gray'
}

function formatDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(str) {
  if (!str) return ''
  // handle "14:00" style
  const [h, m] = str.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m || '00'} ${ampm}`
}

export default function CustomerDashboard() {
  const { user, apiFetch } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/customer/dashboard')
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Loading your details…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="page-header"><h1>Dashboard</h1></div>
        <div className="error-box">{error}</div>
      </div>
    )
  }

  const upcoming = data?.upcomingAppointments || []
  const recent = data?.recentAppointments || []
  const totalSpent = data?.totalSpent ?? 0
  const carsCount = data?.carsCount ?? 0

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user?.firstName} 👋</h1>
        <p>Here's what's going on with your vehicles</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value green">${Number(totalSpent).toLocaleString()}</div>
          <div className="stat-sub">All time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Upcoming</div>
          <div className="stat-value blue">{upcoming.length}</div>
          <div className="stat-sub">Appointments scheduled</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cars on File</div>
          <div className="stat-value blue">{carsCount}</div>
          <div className="stat-sub">Registered vehicles</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value purple">{data?.completedCount ?? recent.length}</div>
          <div className="stat-sub">Past detailings</div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="card mb-24">
        <div className="card-header">
          <h2>Upcoming Appointments</h2>
          <Link to="/book" className="btn btn-primary btn-sm">+ Book Now</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="empty-state">
            <h3>No upcoming appointments</h3>
            <p>Ready for a fresh detail? Schedule your next service.</p>
            <Link to="/book" className="btn btn-primary">Book Your First Detailing</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Service</th>
                  <th>Car</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map(appt => (
                  <tr key={appt.id}>
                    <td style={{ fontWeight: 600 }}>{formatDate(appt.date)}</td>
                    <td className="text-muted">{formatTime(appt.time)}</td>
                    <td><span className={`badge ${serviceBadgeColor(appt.service)}`}>{appt.service}</span></td>
                    <td className="text-muted">
                      {appt.car
                        ? `${appt.car.year} ${appt.car.make} ${appt.car.model}`
                        : '—'}
                    </td>
                    <td><span className={`badge ${statusBadgeColor(appt.status)}`}>{appt.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Detailings */}
      <div className="card">
        <div className="card-header">
          <h2>Recent Detailings</h2>
          <Link to="/appointments" className="text-muted text-sm">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 20px' }}>
            <h3>No completed detailings yet</h3>
            <p>Your detailing history will appear here.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Car</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 6).map(appt => (
                  <tr key={appt.id}>
                    <td style={{ fontWeight: 600 }}>{formatDate(appt.date)}</td>
                    <td><span className={`badge ${serviceBadgeColor(appt.service)}`}>{appt.service}</span></td>
                    <td className="text-muted">
                      {appt.car
                        ? `${appt.car.year} ${appt.car.make} ${appt.car.model}`
                        : '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#34d399' }}>${appt.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
