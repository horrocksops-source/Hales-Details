const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { sequelize, User, Car, Appointment } = require('../db');
const router = express.Router();

const SERVICE_PRICES = {
  light: 100,
  standard: 150,
  premium: 250,
};

// Helper: get Monday of the week containing a given date
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper: format date as YYYY-MM-DD
const toDateStr = (date) => date.toISOString().split('T')[0];

// ── Dashboard ─────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const today = toDateStr(now);

    // This calendar month bounds
    const monthStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    // This Mon-Sun week bounds
    const weekStartDate = getWeekStart(now);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekStart = toDateStr(weekStartDate);
    const weekEnd = toDateStr(weekEndDate);

    // Revenue total (completed)
    const revenueTotalResult = await Appointment.findAll({
      where: { status: 'completed' },
      attributes: [[fn('SUM', col('price')), 'total']],
      raw: true,
    });
    const revenueTotal = parseFloat(revenueTotalResult[0]?.total || 0);

    // Revenue this month (completed)
    const revenueMonthResult = await Appointment.findAll({
      where: {
        status: 'completed',
        date: { [Op.between]: [monthStart, monthEnd] },
      },
      attributes: [[fn('SUM', col('price')), 'total']],
      raw: true,
    });
    const revenueThisMonth = parseFloat(revenueMonthResult[0]?.total || 0);

    // Revenue this week (completed)
    const revenueWeekResult = await Appointment.findAll({
      where: {
        status: 'completed',
        date: { [Op.between]: [weekStart, weekEnd] },
      },
      attributes: [[fn('SUM', col('price')), 'total']],
      raw: true,
    });
    const revenueThisWeek = parseFloat(revenueWeekResult[0]?.total || 0);

    // Appointments this month (non-cancelled)
    const appointmentsThisMonth = await Appointment.count({
      where: {
        status: { [Op.ne]: 'cancelled' },
        date: { [Op.between]: [monthStart, monthEnd] },
      },
    });

    // Appointments this week (non-cancelled)
    const appointmentsThisWeek = await Appointment.count({
      where: {
        status: { [Op.ne]: 'cancelled' },
        date: { [Op.between]: [weekStart, weekEnd] },
      },
    });

    // Average appointments per week over last 8 weeks (week by week)
    let weeklyTotals = [];
    for (let i = 0; i < 8; i++) {
      const ws = new Date(weekStartDate);
      ws.setDate(ws.getDate() - i * 7);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const count = await Appointment.count({
        where: {
          status: { [Op.ne]: 'cancelled' },
          date: { [Op.between]: [toDateStr(ws), toDateStr(we)] },
        },
      });
      weeklyTotals.push(count);
    }
    const avgPerWeek = weeklyTotals.reduce((s, c) => s + c, 0) / 8;

    // Popular service (most completed)
    const serviceBreakdown = await Appointment.findAll({
      where: { status: 'completed' },
      attributes: ['service', [fn('COUNT', col('id')), 'count']],
      group: ['service'],
      order: [[literal('"count"'), 'DESC']],
      raw: true,
    });
    const popularService = serviceBreakdown.length > 0 ? serviceBreakdown[0].service : null;

    // Upcoming count (pending+confirmed from today)
    const upcomingCount = await Appointment.count({
      where: {
        status: { [Op.in]: ['pending', 'confirmed'] },
        date: { [Op.gte]: today },
      },
    });

    // Pending count
    const pendingCount = await Appointment.count({
      where: { status: 'pending' },
    });

    // Recent completed (last 5)
    const recentCompleted = await Appointment.findAll({
      where: { status: 'completed' },
      include: [
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Car, as: 'car' },
      ],
      order: [['date', 'DESC']],
      limit: 5,
    });

    // Upcoming appointments (next 10 pending/confirmed)
    const upcomingAppointments = await Appointment.findAll({
      where: {
        status: { [Op.in]: ['pending', 'confirmed'] },
        date: { [Op.gte]: today },
      },
      include: [
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Car, as: 'car' },
      ],
      order: [
        ['date', 'ASC'],
        ['timeSlot', 'ASC'],
      ],
      limit: 10,
    });

    return res.json({
      revenueTotal,
      revenueThisMonth,
      revenueThisWeek,
      appointmentsThisMonth,
      appointmentsThisWeek,
      avgPerWeek: parseFloat(avgPerWeek.toFixed(2)),
      popularService,
      upcomingCount,
      pendingCount,
      recentCompleted,
      upcomingAppointments,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── All Appointments ──────────────────────────────────────────────────────────
// GET /api/admin/appointments?status=&date=
router.get('/appointments', async (req, res) => {
  try {
    const { status, date } = req.query;
    const where = {};

    if (status) where.status = status;
    if (date) where.date = date;

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Car, as: 'car' },
      ],
      order: [
        ['date', 'DESC'],
        ['timeSlot', 'ASC'],
      ],
    });

    return res.json(appointments);
  } catch (err) {
    console.error('Admin appointments error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Update Appointment ────────────────────────────────────────────────────────
// PUT /api/admin/appointments/:id
router.put('/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const { status, adminNotes } = req.body;
    const updates = {};

    if (status) {
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      updates.status = status;

      // When marking completed, ensure price is set based on service
      if (status === 'completed' && (!appointment.price || parseFloat(appointment.price) === 0)) {
        updates.price = SERVICE_PRICES[appointment.service] || appointment.price;
      }
    }

    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    await appointment.update(updates);

    const updated = await Appointment.findByPk(appointment.id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Car, as: 'car' },
      ],
    });

    return res.json(updated);
  } catch (err) {
    console.error('Update appointment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Week Schedule ─────────────────────────────────────────────────────────────
// GET /api/admin/schedule/week?start=YYYY-MM-DD
router.get('/schedule/week', async (req, res) => {
  try {
    const { start } = req.query;
    if (!start) return res.status(400).json({ error: 'start query parameter required (YYYY-MM-DD)' });

    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const appointments = await Appointment.findAll({
      where: { date: { [Op.between]: [start, toDateStr(endDate)] } },
      include: [
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Car, as: 'car' },
      ],
      order: [['date', 'ASC'], ['timeSlot', 'ASC']],
    });

    return res.json({ start, end: toDateStr(endDate), appointments });
  } catch (err) {
    console.error('Week schedule error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Schedule ──────────────────────────────────────────────────────────────────
// GET /api/admin/schedule?date=YYYY-MM-DD
router.get('/schedule', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });
    }

    const appointments = await Appointment.findAll({
      where: { date },
      include: [
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Car, as: 'car' },
      ],
      order: [['timeSlot', 'ASC']],
    });

    return res.json({ date, appointments });
  } catch (err) {
    console.error('Schedule error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Customers ─────────────────────────────────────────────────────────────────
// GET /api/admin/customers
router.get('/customers', async (req, res) => {
  try {
    const customers = await User.findAll({
      where: { role: 'customer' },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    // Attach appointment count and total spent
    const result = await Promise.all(
      customers.map(async (customer) => {
        const appointmentCount = await Appointment.count({
          where: { customerId: customer.id },
        });

        const spentResult = await Appointment.findAll({
          where: { customerId: customer.id, status: 'completed' },
          attributes: [[fn('SUM', col('price')), 'total']],
          raw: true,
        });

        const totalSpent = parseFloat(spentResult[0]?.total || 0);

        return { ...customer.toJSON(), appointmentCount, totalSpent };
      })
    );

    return res.json(result);
  } catch (err) {
    console.error('Customers list error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/customers/:id
router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await User.findOne({
      where: { id: req.params.id, role: 'customer' },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdAt'],
      include: [
        { model: Car, as: 'cars' },
        {
          model: Appointment,
          as: 'appointments',
          include: [{ model: Car, as: 'car' }],
          order: [['date', 'DESC']],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.json(customer);
  } catch (err) {
    console.error('Customer detail error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
