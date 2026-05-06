import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

// Inventory Summary Report
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const counts = await prisma.inventory.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    });

    const recentAssets = await prisma.inventory.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        creator: {
          select: { username: true }
        }
      }
    });

    res.json({
      summary: counts.reduce((acc: any, curr) => {
        acc[curr.type] = curr._count.id;
        return acc;
      }, {}),
      recent_activity: recentAssets
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Failed to generate summary report' });
  }
});

export default router;
