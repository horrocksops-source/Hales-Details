import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const TIME_SLOTS = [
  { label: '8:00 AM',  value: '8:00 AM' },
  { label: '10:00 AM', value: '10:00 AM' },
  { label: '12:00 PM', value: '12:00 PM' },
  { label: '2:00 PM',  value: '2:00 PM' },
  { label: '4:00 PM',  value: '4:00 PM' },
]

function today() {
  return new Date().toISOString().split('T')[0]
}

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

function formatDateLabel(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

// Match a schedule entry to a time slot
function matchSlot(schedule, slotValue) {
  return schedule.find(entry => {
    const t = (entry.time || '').trim().toUpperCase()
    const s = slotValue.trim().toUpperCase()
    return t === s || t.startsWith(s.split(' ')[0])
  })
}

export default function AdminSchedule() {
  const { apiFetch } = useAuth()
  const [date, setDate] = useState(today())
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!date) return
    setLoading(true)
    setError('')
    apiFetch(`/admin/schedule?date=${date}`)
      .then(d => setSchedule(Array.isArray(d) ? d : d.schedule || d.appointments || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [date])

  const bookedCount = schedule.filter(e => e.status !== 'cancelled').length

  return (
    <div>
      <div className="page-header flex justify-between items-center" style={{ marginBottom: '32px' }}>
        <div>
          <h1>Daily Schedule</h1>
          <p>View all appointments for a specific day</p>
        </div>
      </div>

      {/* Date Picker */}
      <div className="card mb-24" style={{ padding: '20px 24px' }}>
        <div className="flex items-center gap-16" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 200px' }}>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{formatDateLabel(date)}</div>
            {!loading && (
              <div className="text-muted text-sm">
                {bookedCount === 0
                  ? 'No appointments scheduled'
                  : `${bookedCount} of ${TIME_SLOTS.length} slots booked`}
              </div>
            )}
          </div>
          {bookedCount > 0 && (
            <div className="flex items-center gap-12" style={{ marginLeft: 'auto' }}>
              <div className="stat-card" style={{ padding: '12px 20px', minWidth: '80px', textAlign: 'center' }}>
                <div className="stat-label">Booked</div>
                <div className="stat-value blue" style={{ fontSize: '20px' }}>{bookedCount}</div>
              </div>
              <div className="stat-card" style={{ padding: '12px 20px', minWidth: '80px', textAlign: 'center' }}>
                <div className="stat-label">Open</div>
                <div className="stat-value green" style={{ fontSize: '20px' }}>{TIME_SLOTS.length - bookedCount}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Schedule Grid */}
      <div className="card">
        <div className="card-header">
          <h2>Schedule</h2>
          <span className="text-muted text-sm">5 time slots available</span>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading schedule…</p></div>
        ) : (
          <div className="schedule-grid">
            {TIME_SLOTS.map(slot => {
              const booking = matchSlot(schedule, slot.value)
              const isCancelled = booking?.status === 'cancelled'
              const isBooked = booking && !isCancelled

              return (
                <div key={slot.value} className="schedule-row">
                  <div className="schedule-time-label">{slot.label}</div>
                  <div className={`schedule-slot ${isBooked ? 'booked' : ''} ${!booking || isCancelled ? 'available' : ''}`}>
                    {isBooked ? (
                      <div className="booking-info" style={{ width: '100%' }}>
                        <div className="flex items-center justify-between">
                          <div className="booking-customer">
                            {booking.customer
                              ? `${booking.customer.firstName} ${booking.customer.lastName}`
                              : booking.customerName || 'Customer'}
                          </div>
                          <div className="flex items-center gap-8">
                            <span className={`badge ${serviceBadge(booking.service)}`}>{booking.service}</span>
                            <span className={`badge ${statusBadge(booking.status)}`}>{booking.status}</span>
                          </div>
                        </div>
                        <div className="booking-meta">
                          {booking.car && (
                            <span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '4px' }}>
                                <path d="M5 17H3a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2l3-4h8l3 4h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
                                <circle cx="7.5" cy="17.5" r="2.5" />
                                <circle cx="16.5" cy="17.5" r="2.5" />
                              </svg>
                              {booking.car.year} {booking.car.make} {booking.car.model}
                            </span>
                          )}
                          {booking.price && (
                            <span style={{ color: '#34d399', fontWeight: 700 }}>${booking.price}</span>
                          )}
                          {booking.customer?.phone && (
                            <span>{booking.customer.phone}</span>
                          )}
                        </div>
                        {booking.notes && (
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', fontStyle: 'italic' }}>
                            "{booking.notes}"
                          </div>
                        )}
                      </div>
                    ) : isCancelled ? (
                      <div className="flex items-center gap-8">
                        <span className="badge gray">Cancelled</span>
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          {booking.customer
                            ? `${booking.customer.firstName} ${booking.customer.lastName}`
                            : 'Customer'}
                        </span>
                      </div>
                    ) : (
                      'Available'
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
