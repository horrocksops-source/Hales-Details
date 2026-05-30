import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(month) {
  if (!month) return ''
  const [y, m] = month.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const MEDALS = {
  0: { color: '#f59e0b', label: '1st', height: 140, glow: '#f59e0b66' },
  1: { color: '#94a3b8', label: '2nd', height: 100, glow: '#94a3b844' },
  2: { color: '#b45309', label: '3rd', height: 80,  glow: '#b4530944' },
}

const ORDER = [1, 0, 2] // left=2nd, center=1st, right=3rd

function Avatar({ name, color, size = 56 }) {
  const initials = name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${color}22`,
      border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 800, color,
      flexShrink: 0,
      boxShadow: `0 0 16px ${color}55`,
    }}>
      {initials}
    </div>
  )
}

function Podium({ data }) {
  const top3 = ORDER.map(i => data[i] || null)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
      {top3.map((item, idx) => {
        const rank = ORDER[idx]
        const medal = MEDALS[rank]
        if (!item) return <div key={idx} style={{ width: 160 }} />

        return (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 160 }}>
            {/* Card above podium */}
            <div style={{
              background: 'var(--surface)',
              border: `1px solid ${medal.color}55`,
              borderRadius: 14,
              padding: '16px 12px',
              textAlign: 'center',
              marginBottom: 8,
              width: '100%',
              boxShadow: `0 4px 24px ${medal.glow}`,
            }}>
              <Avatar name={`${item.firstName} ${item.lastName}`} color={medal.color} size={52} />
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginTop: 10, marginBottom: 2 }}>
                {item.firstName} {item.lastName}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: medal.color, lineHeight: 1 }}>
                {item.count}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>appointments</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>
                ${item.revenue.toLocaleString()}
              </div>
            </div>

            {/* Podium block */}
            <div style={{
              width: '100%',
              height: medal.height,
              background: `linear-gradient(180deg, ${medal.color}33 0%, ${medal.color}11 100%)`,
              border: `1px solid ${medal.color}55`,
              borderBottom: 'none',
              borderRadius: '10px 10px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 900,
              color: medal.color,
              boxShadow: `inset 0 1px 0 ${medal.color}44`,
            }}>
              {medal.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminLeaderboard() {
  const { apiFetch } = useAuth()
  const [month, setMonth] = useState(currentMonth)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    apiFetch(`/admin/leaderboard?month=${month}`)
      .then(d => setData(Array.isArray(d.leaderboard) ? d.leaderboard : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [month])

  const totalAppts = data.reduce((s, d) => s + d.count, 0)
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const rest = data.slice(3)

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Leaderboard</h1>
            <p style={{ color: 'var(--muted)', margin: 0 }}>{monthLabel(month)}</p>
          </div>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 180 }} />
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {!loading && data.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <div className="stat-card" style={{ padding: '14px 20px' }}>
            <div className="stat-label">Active Customers</div>
            <div className="stat-value blue" style={{ fontSize: 22 }}>{data.length}</div>
          </div>
          <div className="stat-card" style={{ padding: '14px 20px' }}>
            <div className="stat-label">Total Appointments</div>
            <div className="stat-value blue" style={{ fontSize: 22 }}>{totalAppts}</div>
          </div>
          <div className="stat-card" style={{ padding: '14px 20px' }}>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value green" style={{ fontSize: 22 }}>${totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card"><div className="empty-state"><p>Loading…</p></div></div>
      ) : data.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>No appointments in {monthLabel(month)}</h3>
            <p>Try selecting a different month.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Podium */}
          <Podium data={data} />

          {/* 4th place and below */}
          {rest.length > 0 && (
            <div className="card">
              <div className="card-header" style={{ marginBottom: 16 }}>
                <h2>Rankings</h2>
                <span className="text-muted text-sm">4th place and below</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {rest.map((item, i) => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '10px 12px', borderRadius: 8,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    marginBottom: 6,
                  }}>
                    <div style={{ width: 28, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
                      {i + 4}
                    </div>
                    <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>
                      {item.firstName} {item.lastName}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8' }}>
                      {item.count} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>appts</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', width: 80, textAlign: 'right' }}>
                      ${item.revenue.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
