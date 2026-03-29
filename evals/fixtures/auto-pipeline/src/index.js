const express = require('express');
const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'taskflow' });
});

// Task routes
app.get('/tasks', (req, res) => {
  res.json({ data: [] });
});

app.post('/tasks', (req, res) => {
  const { title, description, status = 'pending' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  res.status(201).json({ data: { id: 1, title, description, status } });
});

app.put('/tasks/:id', (req, res) => {
  const { id } = req.params;
  res.json({ data: { id: parseInt(id), ...req.body } });
});

app.delete('/tasks/:id', (req, res) => {
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`TaskFlow running on port ${PORT}`));
}

module.exports = app;
