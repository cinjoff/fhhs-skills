import express, { Request, Response, NextFunction } from 'express';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction): void => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// In-memory store (no database layer)
interface Item {
  id: string;
  name: string;
  createdAt: string;
}

const items: Item[] = [];

// Health check
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// List items
app.get('/items', (_req: Request, res: Response): void => {
  res.json({ items });
});

// Create item
app.post('/items', (req: Request, res: Response): void => {
  const { name } = req.body as { name: string };
  const item: Item = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() };
  items.push(item);
  res.status(201).json(item);
});

// Delete item
app.delete('/items/:id', (req: Request, res: Response): void => {
  const idx = items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  items.splice(idx, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;
