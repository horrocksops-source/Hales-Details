import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const COLOR_MAP = {
  white: '#ffffff',
  black: '#1a1a1a',
  silver: '#c0c0c0',
  gray: '#808080',
  grey: '#808080',
  red: '#ef4444',
  blue: '#3b82f6',
  navy: '#1e3a5f',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  brown: '#92400e',
  beige: '#d2b48c',
  gold: '#f59e0b',
  maroon: '#7f1d1d',
  purple: '#8b5cf6',
  champagne: '#f7e7ce',
  pearl: '#f0ede8',
}

function getColorHex(colorName) {
  if (!colorName) return '#64748b'
  const key = colorName.toLowerCase().trim()
  return COLOR_MAP[key] || '#64748b'
}

const BLANK_FORM = { make: '', model: '', year: '', color: '', licensePlate: '', notes: '' }

export default function MyCars() {
  const { apiFetch } = useAuth()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  async function fetchCars() {
    try {
      const d = await apiFetch('/customer/cars')
      setCars(Array.isArray(d) ? d : d.cars || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCars() }, [])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleAddCar(e) {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await apiFetch('/customer/cars', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setForm(BLANK_FORM)
      setShowForm(false)
      fetchCars()
    } catch (err) {
      setFormError(err.message || 'Failed to add car')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this vehicle?')) return
    setDeletingId(id)
    try {
      await apiFetch(`/customer/cars/${id}`, { method: 'DELETE' })
      setCars(c => c.filter(car => car.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete car')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="page-header flex justify-between items-center" style={{ marginBottom: '32px' }}>
        <div>
          <h1>My Vehicles</h1>
          <p>Manage the cars registered to your account</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? '— Cancel' : '+ Add Vehicle'}
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Add Car Form */}
      {showForm && (
        <div className="inline-form-section mb-24">
          <h3>Add a New Vehicle</h3>
          {formError && <div className="error-box">{formError}</div>}
          <form onSubmit={handleAddCar}>
            <div className="form-row">
              <div className="form-group">
                <label>Make</label>
                <input name="make" placeholder="Toyota" value={form.make} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Model</label>
                <input name="model" placeholder="Camry" value={form.model} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Year</label>
                <input name="year" type="number" placeholder="2022" min="1900" max={new Date().getFullYear() + 2} value={form.year} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input name="color" placeholder="White" value={form.color} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>License Plate</label>
                <input name="licensePlate" placeholder="ABC-1234" value={form.licensePlate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>&nbsp;</label>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%' }}>
                  {saving ? 'Saving…' : 'Add Vehicle'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea name="notes" placeholder="Any notes about this vehicle (dents, custom parts, etc.)" value={form.notes} onChange={handleChange} rows={2} />
            </div>
          </form>
        </div>
      )}

      {/* Cars Grid */}
      {loading ? (
        <div className="empty-state"><p>Loading vehicles…</p></div>
      ) : cars.length === 0 ? (
        <div className="empty-state">
          <h3>No vehicles on file</h3>
          <p>Add your first vehicle to speed up future bookings.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add a Vehicle</button>
        </div>
      ) : (
        <div className="cars-grid">
          {cars.map(car => (
            <div key={car.id} className="car-card">
              <div className="car-card-header">
                <div>
                  <div className="car-name">
                    {car.year} {car.make} {car.model}
                  </div>
                  <div className="flex items-center gap-8 mt-16" style={{ marginTop: '6px' }}>
                    {car.color && (
                      <div
                        className="color-dot"
                        style={{ background: getColorHex(car.color) }}
                        title={car.color}
                      />
                    )}
                    {car.color && (
                      <span className="text-muted text-sm" style={{ textTransform: 'capitalize' }}>{car.color}</span>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(car.id)}
                  disabled={deletingId === car.id}
                >
                  {deletingId === car.id ? '…' : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="divider" style={{ margin: '14px 0' }} />

              {car.licensePlate && (
                <div className="car-detail">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="8" width="18" height="8" rx="2" />
                    <line x1="7" y1="12" x2="7.01" y2="12" />
                    <line x1="17" y1="12" x2="17.01" y2="12" />
                  </svg>
                  {car.licensePlate}
                </div>
              )}

              {car.notes && (
                <div className="car-detail" style={{ marginTop: '6px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span style={{ fontStyle: 'italic' }}>{car.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
