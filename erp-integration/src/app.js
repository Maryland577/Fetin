require('dotenv').config();
const express = require('express');
const routes = require('./routes');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', erp: process.env.ACTIVE_ERP });
});

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.response?.status || 500).json({
    error: err.message,
    details: err.response?.data || null,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ERP Integration running on http://localhost:${PORT}`);
  console.log(`Active ERP: ${process.env.ACTIVE_ERP || 'omie'}`);
});
