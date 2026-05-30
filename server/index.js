require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const { sequelize, User } = require('./db');
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

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ alter: true });
    console.log('Database synced');

    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Gavin's Detailing server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
