import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export interface AuthRequest extends Request {
  user?: { userId: number; username: string; role: string; permitted_type: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; username: string; role: string; permitted_type: string };
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    const role = user?.role?.toUpperCase();
    
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      console.log(`Forbidden: User ${user?.username} has role ${user?.role}, expected ADMIN or SUPERADMIN`);
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const requireSuperAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    
    if (user?.role?.toUpperCase() !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Forbidden: SuperAdmin access required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const requireInventoryAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    const role = user?.role?.toUpperCase();
    const permittedType = (user?.permitted_type || '').toUpperCase();
    

    // Admin/SuperAdmin always have access
    // Users with a specific permitted_type (not 'ALL' or 'NONE') have access to modify their type
    if (role === 'ADMIN' || role === 'SUPERADMIN' || (permittedType !== 'ALL' && permittedType !== 'NONE' && permittedType !== '')) {
      return next();
    }
    
    console.log(`Forbidden: User ${user?.username} does not have inventory modification access.`);
    return res.status(403).json({ error: 'Forbidden' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
