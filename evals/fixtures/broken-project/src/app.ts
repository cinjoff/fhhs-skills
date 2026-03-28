import express, { Request, Response } from 'express';
import { getUser, getUserItems, fetchExternalData } from './broken-api';

const app = express();
app.use(express.json());

app.get('/user/:id', async (req: Request, res: Response): Promise<void> => {
  const user = await getUser(req.params.id);
  res.json(user);
});

app.get('/user/:id/items', async (req: Request, res: Response): Promise<void> => {
  const items = await getUserItems(req.params.id);
  res.json({ items });
});

app.get('/external', async (_req: Request, res: Response): Promise<void> => {
  const data = await fetchExternalData();
  res.json(data);
});

export default app;
