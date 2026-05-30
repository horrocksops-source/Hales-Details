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

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const colors = ['#38bdf8', '#34d399', '#a855f7', '#f59e0b', '#f87171']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.map((item, i) => {
        const pct = Math.max((item.count / max) * 100, 4)
        const color = colors[i % colors.length]
        return (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Rank */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: i < 3 ? color : 'var(--surface-elevated)',
              border: `1px solid ${i < 3 ? color : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800,
              color: i < 3 ? '#0a0a12' : 'var(--muted)',
              flexShrink: 0,
            }}>
              {i + 1}
            </div>

            {/* Name */}
            <div style={{
              width: 150, fontSize: 13, fontWeight: 600,
              color: 'var(--text)', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {item.firstName} {item.lastName}
            </div>

            {/* Bar */}
            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <div style={{
                height: 38,
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${color}cc, ${color})`,
                borderRadius: 7,
                display: 'flex', alignItems: 'center',
                paddingLeft: 12,
                fontWeight: 800, fontSize: 15,
                color: '#0a0a12',
                boxShadow: `0 0 12px ${color}44`,
                transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                minWidth: 38,
              }}>
                {item.count}
              </div>
            </div>

            {/* Revenue */}
            <div style={{
              width: 80, textAlign: 'right', fontSize: 13,
              color: '#34d399', fontWeight: 700, flexShrink: 0,
            }}>
              ${item.revenue.toLocaleString()}
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

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Leaderboard</h1>
            <p style={{ color: 'var(--muted)', margin: 0 }}>Top customers by appointments — {monthLabel(month)}</p>
          </div>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ width: 180 }}
          />
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Summary stats */}
      {!loading && data.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
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

      <div className="card">
        <div className="card-header" style={{ marginBottom: 24 }}>
          <h2>Rankings</h2>
          <span className="text-muted text-sm">by appointment count</span>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading…</p></div>
        ) : data.length === 0 ? (
          <div className="empty-state">
            <h3>No appointments in {monthLabel(month)}</h3>
            <p>Try selecting a different month.</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 28, flexShrink: 0 }} />
              <div style={{ width: 150, fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>Customer</div>
              <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Appointments</div>
              <div style={{ width: 80, textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>Revenue</div>
            </div>

            <BarChart data={data} />
          </>
        )}
      </div>
    </div>
  )
}
