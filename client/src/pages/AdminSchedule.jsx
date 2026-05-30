import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const TIME_SLOTS = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(date) {
  return date.toISOString().split('T')[0]
}

function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

function weekLabel(weekDates) {
  const s = weekDates[0]
  const e = weekDates[6]
  if (s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString('en-US', { month: 'long' })} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
  }
  return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function serviceColor(service) {
  const s = (service || '').toLowerCase()
  if (s === 'premium') return '#a855f7'
  if (s === 'standard') return '#f59e0b'
  return '#38bdf8'
}

function statusColor(status) {
  const s = (status || '').toLowerCase()
  if (s === 'confirmed' || s === 'completed') return '#34d399'
  if (s === 'pending') return '#f59e0b'
  return '#64748b'
}

export default function AdminSchedule() {
  const { apiFetch } = useAuth()
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    apiFetch(`/admin/schedule/week?start=${toDateStr(weekStart)}`)
      .then(d => setAppointments(Array.isArray(d.appointments) ? d.appointments : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [weekStart])

  const weekDates = getWeekDates(weekStart)
  const todayStr = toDateStr(new Date())

  function prevWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }

  function nextWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  function getAppt(dateStr, slot) {
    return appointments.find(a =>
      a.date === dateStr &&
      (a.timeSlot || '').trim().toUpperCase() === slot.trim().toUpperCase()
    )
  }

  const totalBooked = appointments.filter(a => a.status !== 'cancelled').length

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Weekly Schedule</h1>
            <p style={{ color: 'var(--muted)', margin: 0 }}>{weekLabel(weekDates)}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={prevWeek}>← Prev</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(getWeekStart(new Date()))}>Today</button>
            <button className="btn btn-secondary btn-sm" onClick={nextWeek}>Next →</button>
          </div>
        </div>
      </div>

      {!loading && totalBooked > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="stat-card" style={{ padding: '12px 20px' }}>
            <div className="stat-label">This Week</div>
            <div className="stat-value blue" style={{ fontSize: 20 }}>{totalBooked}</div>
          </div>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="card"><div className="empty-state"><p>Loading…</p></div></div>
      ) : (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr>
                <th style={{
                  width: 80, padding: '14px 12px', textAlign: 'left',
                  fontSize: 11, color: 'var(--muted)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: 1,
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface)'
                }}>
                  Time
                </th>
                {weekDates.map((date, i) => {
                  const ds = toDateStr(date)
                  const isToday = ds === todayStr
                  return (
                    <th key={ds} style={{
                      padding: '14px 8px', textAlign: 'center',
                      fontSize: 13, fontWeight: 700,
                      borderBottom: '1px solid var(--border)',
                      borderLeft: '1px solid var(--border)',
                      color: isToday ? 'var(--accent)' : 'var(--text)',
                      background: isToday ? 'rgba(56,189,248,0.05)' : 'var(--surface)',
                      minWidth: 110
                    }}>
                      <div>{DAY_LABELS[i]}</div>
                      <div style={{ fontSize: 11, fontWeight: 400, color: isToday ? 'var(--accent)' : 'var(--muted)', marginTop: 2 }}>
                        {date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                      </div>
                      {isToday && (
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', margin: '4px auto 0' }} />
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot, si) => (
                <tr key={slot}>
                  <td style={{
                    padding: '10px 12px', fontSize: 12, fontWeight: 600,
                    color: 'var(--muted)', verticalAlign: 'top',
                    whiteSpace: 'nowrap',
                    borderBottom: si < TIME_SLOTS.length - 1 ? '1px solid var(--border)' : 'none',
                    background: 'var(--surface)'
                  }}>
                    {slot}
                  </td>
                  {weekDates.map((date, di) => {
                    const ds = toDateStr(date)
                    const isToday = ds === todayStr
                    const appt = getAppt(ds, slot)
                    const isCancelled = appt?.status === 'cancelled'
                    return (
                      <td key={ds} style={{
                        padding: 6, verticalAlign: 'top',
                        borderLeft: '1px solid var(--border)',
                        borderBottom: si < TIME_SLOTS.length - 1 ? '1px solid var(--border)' : 'none',
                        background: isToday ? 'rgba(56,189,248,0.03)' : 'transparent',
                        minHeight: 80, width: 'auto'
                      }}>
                        {appt && !isCancelled ? (
                          <div style={{
                            background: 'var(--surface)',
                            border: `1px solid ${serviceColor(appt.service)}55`,
                            borderLeft: `3px solid ${serviceColor(appt.service)}`,
                            borderRadius: 6, padding: '8px 10px', fontSize: 12
                          }}>
                            <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                              {appt.customer ? `${appt.customer.firstName} ${appt.customer.lastName}` : 'Customer'}
                            </div>
                            <div style={{ color: serviceColor(appt.service), fontWeight: 600, textTransform: 'capitalize', fontSize: 11, marginBottom: 3 }}>
                              {appt.service}
                            </div>
                            {appt.car && (
                              <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 3 }}>
                                {appt.car.year} {appt.car.make} {appt.car.model}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                              <span style={{ fontSize: 11, color: statusColor(appt.status), fontWeight: 600, textTransform: 'capitalize' }}>
                                {appt.status}
                              </span>
                              <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>
                                ${appt.price}
                              </span>
                            </div>
                          </div>
                        ) : appt && isCancelled ? (
                          <div style={{
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 6, padding: '8px 10px', opacity: 0.4
                          }}>
                            <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Cancelled</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                              {appt.customer ? `${appt.customer.firstName} ${appt.customer.lastName}` : ''}
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--border)', fontSize: 11 }}>
                            —
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
