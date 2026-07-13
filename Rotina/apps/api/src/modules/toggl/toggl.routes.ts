import { Router } from 'express';
export function togglRoutes(): Router {
  const router = Router();
  router.get('/atual', (_req, res) => res.json({ success: true, data: null, message: 'Configure TOGGL_API_TOKEN no .env' }));
  return router;
}
