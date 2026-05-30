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
  try {
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return str
  }
}

function formatDateShort(str) {
  if (!str) return '—'
  try {
    const d = new Date(str + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return str
  }
}

export default function AdminCustomers() {
  const { apiFetch } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiFetch('/admin/customers')
      .then(d => setCustomers(Array.isArray(d) ? d : d.customers || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function viewCustomer(id) {
    if (selectedId === id) {
      setSelectedId(null)
      setDetail(null)
      return
    }
    setSelectedId(id)
    setDetail(null)
    setDetailLoading(true)
    try {
      const d = await apiFetch(`/admin/customers/${id}`)
      setDetail(d)
    } catch (err) {
      alert(err.message)
      setSelectedId(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const filtered = customers.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="page-header flex justify-between items-center" style={{ marginBottom: '32px' }}>
        <div>
          <h1>Customers</h1>
          <p>View and manage all registered customers</p>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>
          {customers.length} total
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Search */}
      <div className="mb-16">
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '360px' }}
        />
      </div>

      {/* Customers Table */}
      <div className="card mb-24">
        {loading ? (
          <div className="empty-state"><p>Loading customers…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>{search ? 'No customers match your search' : 'No customers yet'}</h3>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Appointments</th>
                  <th>Total Spent</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(customer => (
                  <React.Fragment key={customer.id}>
                    <tr
                      onClick={() => viewCustomer(customer.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'var(--surface-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#38bdf8',
                            flexShrink: 0,
                          }}>
                            {customer.firstName?.[0]}{customer.lastName?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {customer.firstName} {customer.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted">{customer.email}</td>
                      <td className="text-muted">{customer.phone || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{customer.appointmentCount ?? customer.appointments?.length ?? 0}</td>
                      <td style={{ fontWeight: 700, color: '#34d399' }}>
                        ${Number(customer.totalSpent || 0).toLocaleString()}
                      </td>
                      <td className="text-muted">{formatDate(customer.createdAt)}</td>
                      <td>
                        <button
                          className={`btn btn-sm ${selectedId === customer.id ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={e => { e.stopPropagation(); viewCustomer(customer.id) }}
                        >
                          {selectedId === customer.id ? 'Close' : 'View'}
                        </button>
                      </td>
                    </tr>

                    {/* Inline Detail Panel */}
                    {selectedId === customer.id && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0, background: 'transparent' }}>
                          <div className="customer-detail-panel">
                            {detailLoading ? (
                              <p className="text-muted text-sm">Loading details…</p>
                            ) : detail ? (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                {/* Cars */}
                                <div>
                                  <h3>
                                    Vehicles
                                    <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '13px', marginLeft: '6px' }}>
                                      ({(detail.cars || []).length})
                                    </span>
                                  </h3>
                                  {(detail.cars || []).length === 0 ? (
                                    <p className="text-muted text-sm">No vehicles on file</p>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {(detail.cars || []).map(car => (
                                        <div key={car.id} style={{
                                          background: 'var(--surface)',
                                          border: '1px solid var(--border)',
                                          borderRadius: '8px',
                                          padding: '10px 14px',
                                          fontSize: '13px',
                                        }}>
                                          <div style={{ fontWeight: 600 }}>{car.year} {car.make} {car.model}</div>
                                          <div className="text-muted" style={{ fontSize: '12px' }}>
                                            {car.color && <span>{car.color} · </span>}
                                            {car.licensePlate && <span>{car.licensePlate}</span>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Appointments */}
                                <div>
                                  <h3>
                                    Appointments
                                    <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '13px', marginLeft: '6px' }}>
                                      ({(detail.appointments || []).length})
                                    </span>
                                  </h3>
                                  {(detail.appointments || []).length === 0 ? (
                                    <p className="text-muted text-sm">No appointments yet</p>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {(detail.appointments || []).slice(0, 6).map(appt => (
                                        <div key={appt.id} style={{
                                          background: 'var(--surface)',
                                          border: '1px solid var(--border)',
                                          borderRadius: '8px',
                                          padding: '10px 14px',
                                          fontSize: '13px',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                        }}>
                                          <div>
                                            <div style={{ fontWeight: 600 }}>{formatDateShort(appt.date)} · {appt.time}</div>
                                            <div className="flex items-center gap-8" style={{ marginTop: '4px' }}>
                                              <span className={`badge ${serviceBadge(appt.service)}`}>{appt.service}</span>
                                              <span className={`badge ${statusBadge(appt.status)}`}>{appt.status}</span>
                                            </div>
                                          </div>
                                          <div style={{ fontWeight: 700, color: '#34d399' }}>
                                            ${appt.price}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
