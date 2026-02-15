import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { linkedInService } from './linkedin.service';
import { AuthenticatedRequest, authMiddleware } from '../../middleware/auth.middleware';
import { env } from '../../config/env';

const router = Router();
router.use(authMiddleware as any);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.csv', '.json'].includes(ext)) {
      cb(new Error('Only CSV and JSON files are allowed'));
      return;
    }
    cb(null, true);
  },
});

const listPostsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['postedAt', 'likesCount', 'commentsCount', 'sharesCount']).default('postedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// POST /linkedin/upload
router.post('/upload', upload.single('file'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileType = ext === '.csv' ? 'csv' : 'json';
    const content = req.file.buffer.toString('utf-8');

    const result = await linkedInService.importPosts(req.user!.id, content, fileType as 'csv' | 'json');
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /linkedin/posts
router.get('/posts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const params = listPostsSchema.parse(req.query);
    const result = await linkedInService.listPosts(req.user!.id, params);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /linkedin/posts/:id
router.get('/posts/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const post = await linkedInService.getPost(req.user!.id, req.params.id as string);
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
});

// DELETE /linkedin/posts/:id
router.delete('/posts/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await linkedInService.deletePost(req.user!.id, req.params.id as string);
    res.json({ success: true, data: { message: 'Post deleted' } });
  } catch (error) {
    next(error);
  }
});

export const linkedInController = router;
