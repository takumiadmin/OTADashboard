import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import uploadRoutes from './routes/uploadbin.js';
import scheduleRoutes from './routes/scheduleupdates.js';
import diagnosticRoutes from './routes/diagnostics.js';
import changepwdRoutes from './routes/changepassword.js';
import adminRoutes from './routes/admin.js';
import devicesRoutes from './routes/devices.js';
import geofenceRoutes from './routes/geofence.js';
import listoftoolsRoutes from './routes/listoftools.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://13.232.2.134',
  'http://13.232.2.134:5173',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', uploadRoutes);
app.use('/api/updates', scheduleRoutes);
app.use('/api/diagnostics', diagnosticRoutes);
app.use('/api/changepwd', changepwdRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/geofence', geofenceRoutes);
app.use('/api/listoftools', listoftoolsRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
