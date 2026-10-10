// Starts the Express app. Nothing about files or templates is decided here.
import express from 'express';
import cors from 'cors';
import routes from './routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' })); // requests are small; images are never uploaded
app.use('/api', routes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route' }));

// Last stop for every error. HttpError carries its own status.
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
