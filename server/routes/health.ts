import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'noklity-api',
    timestamp: new Date().toISOString()
  });
});

export default router;
