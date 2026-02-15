import { Router, Response, NextFunction } from 'express';
import { analysisService } from '../analysis/analysis.service';
import { AuthenticatedRequest, authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware as any);

// GET /analytics/engagement
router.get('/engagement', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const metrics = await analysisService.getEngagementAnalytics(req.user!.id);
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
});

// GET /analytics/topics
router.get('/topics', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const topics = await analysisService.getTopicAnalytics(req.user!.id);
    res.json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
});

export const analyticsController = router;
