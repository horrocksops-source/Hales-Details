require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const { sequelize, User, Car, Appointment } = require('./db');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const adminRoutes = require('./routes/admin');
const { authenticate, requireAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/customer', authenticate, customerRoutes);
app.use('/api/admin', authenticate, requireAdmin, adminRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: "Gavin's Detailing API" }));

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Seed admin user ───────────────────────────────────────────────────────────
const seedAdmin = async () => {
  try {
    const existing = await User.findOne({ where: { role: 'admin' } });
    if (!existing) {
      const hashed = await bcrypt.hash('admin123', 10);
      await User.create({
        firstName: 'Gavin',
        lastName: 'Smith',
        email: 'admin@gavinsdetailing.com',
        password: hashed,
        role: 'admin',
      });
      console.log('Admin user seeded: admin@gavinsdetailing.com / admin123');
    }
  } catch (err) {
    console.error('Seed admin error:', err);
  }
};

// ── Seed Ryan (test leaderboard data) ────────────────────────────────────────
const seedCustomer = async (firstName, lastName, email, count) => {
  try {
    const hashed = await bcrypt.hash('password123', 10);
    let user = await User.findOne({ where: { email } });
    if (!user) user = await User.create({ firstName, lastName, email, password: hashed, role: 'customer', phone: '555-0100' });
    let car = await Car.findOne({ where: { userId: user.id } });
    if (!car) car = await Car.create({ userId: user.id, make: 'Honda', model: 'Civic', year: 2021, color: 'Black' });
    const services = ['light', 'standard', 'premium'];
    const prices = { light: 100, standard: 150, premium: 250 };
    const slots = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'];
    const statuses = ['completed', 'confirmed', 'pending'];
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    let created = 0;
    for (let i = 0; i < count; i++) {
      const day = String(i + 1).padStart(2, '0');
      const existing = await Appointment.findOne({ where: { customerId: user.id, date: `${year}-${month}-${day}` } });
      if (!existing) {
        const service = services[i % 3];
        await Appointment.create({ customerId: user.id, carId: car.id, service, price: prices[service], date: `${year}-${month}-${day}`, timeSlot: slots[i % 5], status: statuses[i % 3] });
        created++;
      }
    }
    if (created > 0) console.log(`${firstName} seeded with ${created} appointments`);
  } catch (err) {
    console.error(`Seed ${firstName} error:`, err);
  }
};

const seedRyan = async () => {
  await seedCustomer('Ryan', 'Johnson', 'ryan@test.com', 20);
  await seedCustomer('Jake', 'Williams', 'jake@test.com', 14);
  await seedCustomer('Mia', 'Torres', 'mia@test.com', 9);
};

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ alter: true });
    console.log('Database synced');

    await seedAdmin();
    await seedRyan();

    app.listen(PORT, () => {
      console.log(`Gavin's Detailing server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
