import { Router } from 'express';
export function habiticaRoutes(): Router {
  const router = Router();
  router.get('/stats', (_req, res) => res.json({ success: true, data: null, message: 'Configure HABITICA_USER_ID e HABITICA_API_TOKEN no .env' }));
  return router;
}
