import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function parseDate(str) {
  if (!str) return 0
  return new Date(str).getTime()
}

const FILTERS = ['All', 'Upcoming', 'Past']

export default function MyAppointments() {
  const { apiFetch } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    apiFetch('/customer/appointments')
      .then(d => {
        const list = Array.isArray(d) ? d : d.appointments || []
        list.sort((a, b) => parseDate(b.date) - parseDate(a.date))
        setAppointments(list)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const filtered = appointments.filter(a => {
    if (filter === 'All') return true
    const d = new Date(a.date + 'T00:00:00')
    if (filter === 'Upcoming') return d >= now && a.status !== 'cancelled'
    if (filter === 'Past') return d < now || a.status === 'completed' || a.status === 'cancelled'
    return true
  })

  return (
    <div>
      <div className="page-header flex justify-between items-center" style={{ marginBottom: '32px' }}>
        <div>
          <h1>My Appointments</h1>
          <p>Your complete detailing history</p>
        </div>
        <Link to="/book" className="btn btn-primary">+ Book Appointment</Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
            {f === 'All' && (
              <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.7 }}>
                ({appointments.length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><p>Loading appointments…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No appointments {filter !== 'All' ? `in "${filter}"` : ''}</h3>
            <p>
              {filter === 'Upcoming'
                ? 'You have no upcoming appointments.'
                : filter === 'Past'
                ? 'No past appointments yet.'
                : 'You haven\'t booked any appointments yet.'}
            </p>
            <Link to="/book" className="btn btn-primary">Book Appointment</Link>
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
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(appt => (
                  <tr key={appt.id}>
                    <td style={{ fontWeight: 600 }}>{formatDate(appt.date)}</td>
                    <td className="text-muted">{appt.time}</td>
                    <td>
                      <span className={`badge ${serviceBadge(appt.service)}`}>{appt.service}</span>
                    </td>
                    <td className="text-muted">
                      {appt.car
                        ? `${appt.car.year} ${appt.car.make} ${appt.car.model}`
                        : appt.carId
                        ? `Car #${appt.carId}`
                        : '—'}
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(appt.status)}`}>{appt.status}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#34d399' }}>
                      {appt.price != null ? `$${appt.price}` : '—'}
                    </td>
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
