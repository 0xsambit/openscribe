import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

// Add request ID to each request
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
  next();
}

// Morgan request logger
export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    skip: (req) => req.url === '/api/v1/health',
  }
);
