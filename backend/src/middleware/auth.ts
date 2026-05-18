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
    
    // SUPERADMIN is now view-only, so only ADMIN can perform administrative edits.
    if (role !== 'ADMIN') {
      console.log(`Forbidden: User ${user?.username} has role ${user?.role}, expected ADMIN for modification access.`);
      return res.status(403).json({ error: 'Forbidden: View-only role cannot perform this action.' });
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
    

    // Only ADMIN has full modification access. 
    // SUPERADMIN is now view-only and should not pass this check for write operations.
    if (role === 'ADMIN' || (permittedType !== 'ALL' && permittedType !== 'NONE' && permittedType !== '')) {
      return next();
    }
    
    console.log(`Forbidden: User ${user?.username} (Role: ${role}) does not have inventory modification access.`);
    return res.status(403).json({ error: 'Forbidden: Modification access denied for this role.' });


  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
