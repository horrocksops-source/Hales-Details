const express = require('express');
const { Op } = require('sequelize');
const { User, Car, Appointment } = require('../db');
const router = express.Router();

const ALL_SLOTS = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'];

const SERVICE_PRICES = {
  light: 100,
  standard: 150,
  premium: 250,
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
// GET /api/customer/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const customerId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const upcoming = await Appointment.findAll({
      where: {
        customerId,
        status: { [Op.in]: ['pending', 'confirmed'] },
        date: { [Op.gte]: today },
      },
      include: [{ model: Car, as: 'car' }],
      order: [
        ['date', 'ASC'],
        ['timeSlot', 'ASC'],
      ],
      limit: 5,
    });

    const recent = await Appointment.findAll({
      where: { customerId, status: 'completed' },
      include: [{ model: Car, as: 'car' }],
      order: [['date', 'DESC']],
      limit: 5,
    });

    const completedAll = await Appointment.findAll({
      where: { customerId, status: 'completed' },
      attributes: ['price'],
    });

    const totalSpent = completedAll.reduce((sum, a) => sum + parseFloat(a.price), 0);

    return res.json({ upcoming, recent, totalSpent });
  } catch (err) {
    console.error('Customer dashboard error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Cars ──────────────────────────────────────────────────────────────────────
// GET /api/customer/cars
router.get('/cars', async (req, res) => {
  try {
    const cars = await Car.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    return res.json(cars);
  } catch (err) {
    console.error('Get cars error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/customer/cars
router.post('/cars', async (req, res) => {
  try {
    const { make, model, year, color, licensePlate, notes } = req.body;

    if (!make || !model || !year) {
      return res.status(400).json({ error: 'make, model, and year are required' });
    }

    const car = await Car.create({
      userId: req.user.id,
      make,
      model,
      year,
      color: color || null,
      licensePlate: licensePlate || null,
      notes: notes || null,
    });

    return res.status(201).json(car);
  } catch (err) {
    console.error('Create car error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/customer/cars/:id
router.delete('/cars/:id', async (req, res) => {
  try {
    const car = await Car.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    await car.destroy();
    return res.json({ message: 'Car deleted successfully' });
  } catch (err) {
    console.error('Delete car error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Appointments ──────────────────────────────────────────────────────────────
// GET /api/customer/appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: { customerId: req.user.id },
      include: [{ model: Car, as: 'car' }],
      order: [['date', 'DESC']],
    });
    return res.json(appointments);
  } catch (err) {
    console.error('Get appointments error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/customer/appointments
router.post('/appointments', async (req, res) => {
  try {
    const { carId, service, date, timeSlot, notes } = req.body;

    if (!service || !date || !timeSlot) {
      return res.status(400).json({ error: 'service, date, and timeSlot are required' });
    }

    if (!SERVICE_PRICES[service]) {
      return res.status(400).json({ error: 'service must be light, standard, or premium' });
    }

    if (!ALL_SLOTS.includes(timeSlot)) {
      return res.status(400).json({ error: `timeSlot must be one of: ${ALL_SLOTS.join(', ')}` });
    }

    // If a car is provided, verify it belongs to this user
    if (carId) {
      const car = await Car.findOne({ where: { id: carId, userId: req.user.id } });
      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }
    }

    // Check slot availability — no other non-cancelled appointment on same date+timeSlot
    const conflict = await Appointment.findOne({
      where: {
        date,
        timeSlot,
        status: { [Op.ne]: 'cancelled' },
      },
    });

    if (conflict) {
      return res.status(409).json({ error: 'That time slot is already booked' });
    }

    const price = SERVICE_PRICES[service];

    const appointment = await Appointment.create({
      customerId: req.user.id,
      carId: carId || null,
      service,
      price,
      date,
      timeSlot,
      status: 'pending',
      notes: notes || null,
    });

    const full = await Appointment.findByPk(appointment.id, {
      include: [{ model: Car, as: 'car' }],
    });

    return res.status(201).json(full);
  } catch (err) {
    console.error('Create appointment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Slots ─────────────────────────────────────────────────────────────────────
// GET /api/customer/slots?date=YYYY-MM-DD
router.get('/slots', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });
    }

    const booked = await Appointment.findAll({
      where: {
        date,
        status: { [Op.ne]: 'cancelled' },
      },
      attributes: ['timeSlot'],
    });

    const bookedSlots = booked.map((a) => a.timeSlot);

    const slots = ALL_SLOTS.map((slot) => ({
      slot,
      available: !bookedSlots.includes(slot),
    }));

    return res.json({ date, slots });
  } catch (err) {
    console.error('Get slots error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
