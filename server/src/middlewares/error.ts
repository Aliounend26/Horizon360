import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/asyncHandler';

export function notFound(req: Request, res: Response) {
  res.status(404).json({ message: `Route non trouvée: ${req.originalUrl}` });
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: 'Cette valeur existe déjà (conflit unique).' });
  }
  console.error(err);
  res.status(500).json({ message: err?.message || 'Erreur serveur interne' });
}
