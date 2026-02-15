import { Router, Response, NextFunction } from 'express';
import { apiKeysService } from './api-keys.service';
import { createApiKeySchema, updateApiKeySchema } from './api-keys.types';
import { AuthenticatedRequest, authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

// POST /api-keys
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = createApiKeySchema.parse(req.body);
    const result = await apiKeysService.addKey(req.user!.id, input);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api-keys
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const keys = await apiKeysService.listKeys(req.user!.id);
    res.json({ success: true, data: keys });
  } catch (error) {
    next(error);
  }
});

// PUT /api-keys/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateApiKeySchema.parse(req.body);
    const result = await apiKeysService.updateKey(req.user!.id, req.params.id as string, input);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// DELETE /api-keys/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await apiKeysService.deleteKey(req.user!.id, req.params.id as string);
    res.json({ success: true, data: { message: 'API key deleted' } });
  } catch (error) {
    next(error);
  }
});

export const apiKeysController = router;
