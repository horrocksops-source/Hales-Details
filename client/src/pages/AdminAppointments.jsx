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

const STATUS_FILTERS = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled']

export default function AdminAppointments() {
  const { apiFetch } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const [actionLoading, setActionLoading] = useState(null)

  async function fetchAppointments() {
    try {
      const d = await apiFetch('/admin/appointments')
      const list = Array.isArray(d) ? d : d.appointments || []
      list.sort((a, b) => new Date(b.date) - new Date(a.date))
      setAppointments(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAppointments() }, [])

  async function updateStatus(id, status) {
    setActionLoading(`${id}-${status}`)
    try {
      await apiFetch(`/admin/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      fetchAppointments()
    } catch (err) {
      alert(err.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = appointments.filter(a => {
    if (filter === 'All') return true
    return a.status?.toLowerCase() === filter.toLowerCase()
  })

  const counts = {}
  STATUS_FILTERS.forEach(f => {
    if (f === 'All') counts[f] = appointments.length
    else counts[f] = appointments.filter(a => a.status?.toLowerCase() === f.toLowerCase()).length
  })

  return (
    <div>
      <div className="page-header">
        <h1>Appointments</h1>
        <p>Manage and update all appointment statuses</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="filter-tabs">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
            <span style={{ marginLeft: '5px', fontSize: '11px', opacity: 0.7 }}>
              ({counts[f] || 0})
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><p>Loading appointments…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No {filter !== 'All' ? filter.toLowerCase() : ''} appointments</h3>
            <p>Nothing here yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Service</th>
                  <th>Car</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(appt => {
                  const status = appt.status?.toLowerCase()
                  const isPending = status === 'pending'
                  const isConfirmed = status === 'confirmed'
                  const isCancelled = status === 'cancelled'

                  return (
                    <tr key={appt.id}>
                      <td style={{ fontWeight: 600 }}>{formatDate(appt.date)}</td>
                      <td className="text-muted">{appt.time}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {appt.customer
                            ? `${appt.customer.firstName} ${appt.customer.lastName}`
                            : appt.customerName || '—'}
                        </div>
                        {appt.customer?.email && (
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{appt.customer.email}</div>
                        )}
                      </td>
                      <td className="text-muted">
                        {appt.customer?.phone || '—'}
                      </td>
                      <td>
                        <span className={`badge ${serviceBadge(appt.service)}`}>{appt.service}</span>
                      </td>
                      <td className="text-muted">
                        {appt.car
                          ? `${appt.car.year} ${appt.car.make} ${appt.car.model}`
                          : '—'}
                      </td>
                      <td>
                        <span className={`badge ${statusBadge(appt.status)}`}>{appt.status}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#34d399' }}>
                        {appt.price != null ? `$${appt.price}` : '—'}
                      </td>
                      <td>
                        <div className="flex gap-8">
                          {isPending && (
                            <button
                              className="btn btn-success btn-sm"
                              disabled={actionLoading !== null}
                              onClick={() => updateStatus(appt.id, 'confirmed')}
                            >
                              {actionLoading === `${appt.id}-confirmed` ? '…' : 'Confirm'}
                            </button>
                          )}
                          {isConfirmed && (
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={actionLoading !== null}
                              onClick={() => updateStatus(appt.id, 'completed')}
                            >
                              {actionLoading === `${appt.id}-completed` ? '…' : 'Complete'}
                            </button>
                          )}
                          {!isCancelled && (
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={actionLoading !== null}
                              onClick={() => {
                                if (confirm('Cancel this appointment?')) updateStatus(appt.id, 'cancelled')
                              }}
                            >
                              {actionLoading === `${appt.id}-cancelled` ? '…' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
