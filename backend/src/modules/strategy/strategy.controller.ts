import { Router, Response, NextFunction } from 'express';
import { strategyService } from './strategy.service';
import { generateStrategySchema } from './strategy.types';
import { AuthenticatedRequest, authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware as any);

// POST /strategy/generate - Start strategy generation
router.post('/generate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = generateStrategySchema.parse(req.body);
    const jobId = await strategyService.startStrategyGeneration(req.user!.id, input);
    res.status(202).json({
      success: true,
      data: { jobId, message: 'Strategy generation started.' },
    });
  } catch (error) {
    next(error);
  }
});

// GET /strategy/current - Get active strategy
router.get('/current', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const strategy = await strategyService.getCurrentStrategy(req.user!.id);
    res.json({ success: true, data: strategy });
  } catch (error) {
    next(error);
  }
});

// GET /strategy - List all strategies
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const strategies = await strategyService.listStrategies(req.user!.id);
    res.json({ success: true, data: strategies });
  } catch (error) {
    next(error);
  }
});

export const strategyController = router;
