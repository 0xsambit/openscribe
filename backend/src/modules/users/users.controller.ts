import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { usersService } from './users.service';
import { AuthenticatedRequest, authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware as any);

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  linkedinUrl: z.string().url().optional(),
});

const updatePreferencesSchema = z.object({
  writingStyle: z.any().optional(),
  preferredTopics: z.array(z.string()).optional(),
  tonePreference: z.string().optional(),
  postingFrequency: z.number().min(1).max(14).optional(),
  targetAudience: z.string().optional(),
});

// GET /users/me
router.get('/me', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await usersService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

// PUT /users/me
router.put('/me', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateProfileSchema.parse(req.body);
    const profile = await usersService.updateProfile(req.user!.id, input);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

// PUT /users/me/preferences
router.put('/me/preferences', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = updatePreferencesSchema.parse(req.body);
    const result = await usersService.updatePreferences(req.user!.id, input);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export const usersController = router;
