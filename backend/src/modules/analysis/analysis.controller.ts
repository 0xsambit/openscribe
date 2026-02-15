import { Router, Response, NextFunction } from 'express';
import { analysisService } from './analysis.service';
import { AuthenticatedRequest, authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware as any);

// POST /analysis/style - Start writing style analysis
router.post('/style', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const jobId = await analysisService.startStyleAnalysis(req.user!.id);
    res.status(202).json({
      success: true,
      data: { jobId, message: 'Style analysis started. Poll GET /analysis/style/:jobId for results.' },
    });
  } catch (error) {
    next(error);
  }
});

// GET /analysis/style/:jobId - Get style analysis results
router.get('/style/:jobId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await analysisService.getJobResult(req.user!.id, req.params.jobId as string);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /analysis/topics - Start topic extraction
router.post('/topics', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const jobId = await analysisService.startTopicExtraction(req.user!.id);
    res.status(202).json({
      success: true,
      data: { jobId, message: 'Topic extraction started. Poll GET /analysis/style/:jobId for results.' },
    });
  } catch (error) {
    next(error);
  }
});

export const analysisController = router;
