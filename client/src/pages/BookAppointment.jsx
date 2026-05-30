import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const SERVICES = [
  {
    name: 'Light',
    price: 100,
    description: 'Exterior wash, tire shine, windows cleaned. Perfect for routine maintenance.',
    tag: 'blue',
  },
  {
    name: 'Standard',
    price: 150,
    description: 'Everything in Light + interior vacuum, dashboard and console wipe-down.',
    tag: 'amber',
  },
  {
    name: 'Premium',
    price: 250,
    description: 'Everything in Standard + clay bar treatment, machine polish, leather conditioning.',
    tag: 'purple',
    featured: true,
  },
]

const ALL_SLOTS = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM']

function today() {
  return new Date().toISOString().split('T')[0]
}

function StepProgress({ current }) {
  const steps = ['Select Service', 'Date & Time', 'Review & Confirm']
  return (
    <div className="step-progress">
      {steps.map((label, i) => {
        const num = i + 1
        const isDone = num < current
        const isActive = num === current
        return (
          <React.Fragment key={label}>
            <div className="step-item">
              <div className={`step-circle ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : num}
              </div>
              <span className={`step-label ${isActive ? 'active' : ''}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className="step-connector" />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default function BookAppointment() {
  const { apiFetch } = useAuth()
  const [step, setStep] = useState(1)

  // Step 1
  const [selectedService, setSelectedService] = useState(null)

  // Step 2
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [cars, setCars] = useState([])
  const [selectedCar, setSelectedCar] = useState('')
  const [notes, setNotes] = useState('')

  // Step 3 / confirmation
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/customer/cars')
      .then(d => setCars(Array.isArray(d) ? d : d.cars || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!date) {
      setSlots([])
      setSelectedSlot('')
      return
    }
    setSlotsLoading(true)
    setSelectedSlot('')
    apiFetch(`/customer/slots?date=${date}`)
      .then(d => setSlots(Array.isArray(d) ? d : d.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [date])

  async function handleConfirm() {
    setError('')
    setSubmitting(true)
    try {
      const body = {
        service: selectedService.name,
        price: selectedService.price,
        date,
        time: selectedSlot,
        notes,
      }
      if (selectedCar) body.carId = selectedCar
      const result = await apiFetch('/customer/appointments', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setConfirmed(result.appointment || result)
    } catch (err) {
      setError(err.message || 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Confirmed screen ─────────────────────────────────────
  if (confirmed) {
    return (
      <div>
        <div className="page-header">
          <h1>Booking Confirmed</h1>
          <p>Your appointment has been successfully booked</p>
        </div>
        <div className="card confirmation-card" style={{ maxWidth: 520 }}>
          <div className="confirmation-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>You're all set!</h2>
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '24px', fontSize: '14px' }}>
            We'll reach out to confirm your appointment details.
          </p>

          <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
            <div className="review-row">
              <span className="review-label">Service</span>
              <span className="review-value">{confirmed.service || selectedService?.name}</span>
            </div>
            <div className="review-row">
              <span className="review-label">Price</span>
              <span className="review-value text-green">${confirmed.price || selectedService?.price}</span>
            </div>
            <div className="review-row">
              <span className="review-label">Date</span>
              <span className="review-value">{confirmed.date || date}</span>
            </div>
            <div className="review-row">
              <span className="review-label">Time</span>
              <span className="review-value">{confirmed.time || selectedSlot}</span>
            </div>
            <div className="review-row">
              <span className="review-label">Status</span>
              <span className="badge amber">{confirmed.status || 'pending'}</span>
            </div>
          </div>

          <div className="flex gap-12" style={{ justifyContent: 'center' }}>
            <Link to="/appointments" className="btn btn-primary">View My Appointments</Link>
            <button className="btn btn-secondary" onClick={() => {
              setConfirmed(null)
              setStep(1)
              setSelectedService(null)
              setDate('')
              setSelectedSlot('')
              setSelectedCar('')
              setNotes('')
            }}>
              Book Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Book Appointment</h1>
        <p>Schedule your next premium detailing service</p>
      </div>

      <StepProgress current={step} />

      {/* ── Step 1: Select Service ── */}
      {step === 1 && (
        <div>
          <div className="card">
            <div className="card-header">
              <h2>Choose Your Service</h2>
            </div>
            <div className="service-cards-grid">
              {SERVICES.map(svc => (
                <div
                  key={svc.name}
                  className={`service-card ${selectedService?.name === svc.name ? 'selected' : ''}`}
                  onClick={() => setSelectedService(svc)}
                >
                  {selectedService?.name === svc.name && (
                    <div className="check-mark">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h3>{svc.name}</h3>
                    {svc.featured && <span className="badge purple">Popular</span>}
                  </div>
                  <div className="price">${svc.price}</div>
                  <p>{svc.description}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                className="btn btn-primary"
                disabled={!selectedService}
                onClick={() => setStep(2)}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Date & Time ── */}
      {step === 2 && (
        <div className="card">
          <div className="card-header">
            <h2>Pick a Date & Time</h2>
            <span className={`badge ${selectedService?.name === 'premium' ? 'purple' : selectedService?.name === 'standard' ? 'amber' : 'blue'}`}>
              {selectedService?.name} — ${selectedService?.price}
            </span>
          </div>

          <div className="form-group">
            <label>Appointment Date</label>
            <input
              type="date"
              min={today()}
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          {date && (
            <div className="form-group">
              <label>Available Time Slots</label>
              {slotsLoading ? (
                <p className="text-muted text-sm">Checking availability…</p>
              ) : (
                <div className="time-slots-grid">
                  {ALL_SLOTS.map(slot => {
                    const taken = Array.isArray(slots)
                      ? slots.some(s => s === slot || s.time === slot || s.label === slot)
                      : false
                    return (
                      <button
                        key={slot}
                        className={`time-slot ${taken ? 'taken' : selectedSlot === slot ? 'selected' : ''}`}
                        onClick={() => !taken && setSelectedSlot(slot)}
                      >
                        {slot}
                        {taken && <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.7 }}>Taken</div>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="divider" />

          <div className="form-group">
            <label>Vehicle (Optional)</label>
            <select value={selectedCar} onChange={e => setSelectedCar(e.target.value)}>
              <option value="">No specific vehicle / Will specify later</option>
              {cars.map(car => (
                <option key={car.id} value={car.id}>
                  {car.year} {car.make} {car.model} {car.licensePlate ? `(${car.licensePlate})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea
              placeholder="Any special requests, areas of concern, or information about your vehicle…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-between" style={{ marginTop: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button
              className="btn btn-primary"
              disabled={!date || !selectedSlot}
              onClick={() => setStep(3)}
            >
              Review Booking →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Confirm ── */}
      {step === 3 && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="card-header">
            <h2>Review Your Booking</h2>
          </div>

          <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
            <div className="review-row">
              <span className="review-label">Service</span>
              <div className="flex items-center gap-8">
                <span className={`badge ${serviceBadgeColor(selectedService?.name)}`}>{selectedService?.name}</span>
              </div>
            </div>
            <div className="review-row">
              <span className="review-label">Price</span>
              <span className="review-value" style={{ color: '#34d399', fontSize: '18px' }}>${selectedService?.price}</span>
            </div>
            <div className="review-row">
              <span className="review-label">Date</span>
              <span className="review-value">{date}</span>
            </div>
            <div className="review-row">
              <span className="review-label">Time</span>
              <span className="review-value">{selectedSlot}</span>
            </div>
            <div className="review-row">
              <span className="review-label">Vehicle</span>
              <span className="review-value">
                {selectedCar
                  ? (() => {
                      const car = cars.find(c => String(c.id) === String(selectedCar))
                      return car ? `${car.year} ${car.make} ${car.model}` : 'Selected'
                    })()
                  : 'Not specified'}
              </span>
            </div>
            {notes && (
              <div className="review-row">
                <span className="review-label">Notes</span>
                <span className="review-value" style={{ maxWidth: '240px', textAlign: 'right', fontSize: '13px' }}>{notes}</span>
              </div>
            )}
          </div>

          {error && <div className="error-box">{error}</div>}

          <div className="flex justify-between">
            <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
            <button
              className="btn btn-primary"
              disabled={submitting}
              onClick={handleConfirm}
            >
              {submitting ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function serviceBadgeColor(name) {
  if (!name) return 'gray'
  const s = name.toLowerCase()
  if (s === 'premium') return 'purple'
  if (s === 'standard') return 'amber'
  return 'blue'
}
