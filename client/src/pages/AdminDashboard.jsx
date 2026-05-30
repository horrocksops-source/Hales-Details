import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

function serviceBadge(service) {
  if (!service) return 'gray'
  const s = service.toLowerCase()
  if (s === 'premium') return 'purple'
  if (s === 'standard') return 'amber'
  return 'blue'
}

function statusBadge(status) {
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
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminDashboard() {
  const { apiFetch } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(null)

  async function fetchData() {
    try {
      const d = await apiFetch('/admin/dashboard')
      setData(d)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  async function handleConfirm(id) {
    setConfirming(id)
    try {
      await apiFetch(`/admin/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'confirmed' }),
      })
      fetchData()
    } catch (err) {
      alert(err.message)
    } finally {
      setConfirming(null)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1>Admin Dashboard</h1><p>Loading…</p></div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="page-header"><h1>Admin Dashboard</h1></div>
        <div className="error-box">{error}</div>
      </div>
    )
  }

  const stats = data?.stats || {}
  const upcoming = data?.upcomingAppointments || []
  const recent = data?.recentlyCompleted || []

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Business overview and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value green">${Number(stats.totalRevenue || 0).toLocaleString()}</div>
          <div className="stat-sub">All time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Month</div>
          <div className="stat-value blue">${Number(stats.monthRevenue || 0).toLocaleString()}</div>
          <div className="stat-sub">Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Week</div>
          <div className="stat-value blue">${Number(stats.weekRevenue || 0).toLocaleString()}</div>
          <div className="stat-sub">Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Month Appointments</div>
          <div className="stat-value blue">{stats.monthAppointments ?? 0}</div>
          <div className="stat-sub">This month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Week Appointments</div>
          <div className="stat-value blue">{stats.weekAppointments ?? 0}</div>
          <div className="stat-sub">This week</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg / Week</div>
          <div className="stat-value blue">{stats.avgPerWeek ?? '—'}</div>
          <div className="stat-sub">Appointments</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Popular Service</div>
          <div className="stat-value purple" style={{ fontSize: '18px', paddingTop: '4px' }}>
            {stats.popularService || '—'}
          </div>
          <div className="stat-sub">Most booked</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value amber">{stats.pendingCount ?? 0}</div>
          <div className="stat-sub">Need confirmation</div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="card mb-24">
        <div className="card-header">
          <h2>Upcoming Appointments</h2>
          {stats.pendingCount > 0 && (
            <span className="badge amber">{stats.pendingCount} pending</span>
          )}
        </div>
        {upcoming.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px' }}>
            <h3>No upcoming appointments</h3>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Car</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {upcoming.slice(0, 10).map(appt => (
                  <tr key={appt.id}>
                    <td style={{ fontWeight: 600 }}>{formatDate(appt.date)}</td>
                    <td className="text-muted">{appt.time}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {appt.customer
                          ? `${appt.customer.firstName} ${appt.customer.lastName}`
                          : appt.customerName || '—'}
                      </div>
                    </td>
                    <td className="text-muted">
                      {appt.car
                        ? `${appt.car.year} ${appt.car.make} ${appt.car.model}`
                        : '—'}
                    </td>
                    <td>
                      <span className={`badge ${serviceBadge(appt.service)}`}>{appt.service}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(appt.status)}`}>{appt.status}</span>
                    </td>
                    <td>
                      {appt.status === 'pending' && (
                        <button
                          className="btn btn-success btn-sm"
                          disabled={confirming === appt.id}
                          onClick={() => handleConfirm(appt.id)}
                        >
                          {confirming === appt.id ? '…' : 'Confirm'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recently Completed */}
      <div className="card">
        <div className="card-header">
          <h2>Recently Completed</h2>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px' }}>
            <h3>No completed appointments yet</h3>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 8).map(appt => (
                  <tr key={appt.id}>
                    <td style={{ fontWeight: 600 }}>{formatDate(appt.date)}</td>
                    <td>
                      {appt.customer
                        ? `${appt.customer.firstName} ${appt.customer.lastName}`
                        : appt.customerName || '—'}
                    </td>
                    <td>
                      <span className={`badge ${serviceBadge(appt.service)}`}>{appt.service}</span>
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
