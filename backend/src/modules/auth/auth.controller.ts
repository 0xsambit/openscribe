import { Router, Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.types';
import { AuthenticatedRequest, authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const result = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
router.post(
  '/logout',
  authMiddleware as any,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      await authService.logout(refreshToken, req.user!.id);
      res.json({ success: true, data: { message: 'Logged out successfully' } });
    } catch (error) {
      next(error);
    }
  }
);

export const authController = router;
