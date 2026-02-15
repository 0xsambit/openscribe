import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { contentService } from './content.service';
import { generateContentSchema, updateDraftSchema, submitFeedbackSchema } from './content.types';
import { AuthenticatedRequest, authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware as any);

// POST /content/generate - Start content generation
router.post('/generate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = generateContentSchema.parse(req.body);
    const jobId = await contentService.startContentGeneration(req.user!.id, input);
    res.status(202).json({
      success: true,
      data: { jobId, message: 'Content generation started.' },
    });
  } catch (error) {
    next(error);
  }
});

const listDraftsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['draft', 'approved', 'rejected', 'published']).optional(),
});

// GET /content/drafts - List drafts
router.get('/drafts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const params = listDraftsSchema.parse(req.query);
    const result = await contentService.listDrafts(req.user!.id, params);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /content/drafts/:id - Get single draft
router.get('/drafts/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const draft = await contentService.getDraft(req.user!.id, req.params.id as string);
    res.json({ success: true, data: draft });
  } catch (error) {
    next(error);
  }
});

// PUT /content/drafts/:id - Update draft
router.put('/drafts/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateDraftSchema.parse(req.body);
    const result = await contentService.updateDraft(req.user!.id, req.params.id as string, input);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /content/drafts/:id/feedback - Submit feedback
router.post('/drafts/:id/feedback', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = submitFeedbackSchema.parse(req.body);
    const result = await contentService.submitFeedback(req.user!.id, req.params.id as string, input);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// DELETE /content/drafts/:id - Delete draft
router.delete('/drafts/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await contentService.deleteDraft(req.user!.id, req.params.id as string);
    res.json({ success: true, data: { message: 'Draft deleted' } });
  } catch (error) {
    next(error);
  }
});

export const contentController = router;
