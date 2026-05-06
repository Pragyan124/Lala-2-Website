import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        creator: true
      }
    });
    
    const formatted = users.map(u => ({
      user_id: u.user_id,
      username: u.username,
      role: u.role,
      permitted_type: u.permitted_type,
      division: u.division,
      dco: u.dco,
      created_at: u.created_at,
      creator_name: u.creator?.username || 'System'
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/bulk', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { users } = req.body;
    const adminId = req.user?.userId;

    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'Expected an array of users' });
    }

    const results = await prisma.$transaction(async (tx) => {
      const createdUsers = [];
      for (const item of users) {
        if (!item.username) throw new Error('Missing username for user item');
        
        const requestedRole = item.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : (item.role?.toUpperCase() === 'SUPERADMIN' ? 'SUPERADMIN' : 'USER');
        
        // Role restriction: Only SUPERADMIN can create ADMIN or SUPERADMIN
        const requesterRole = (req as any).user?.role?.toUpperCase();
        const roleToAssign = (requestedRole === 'ADMIN' || requestedRole === 'SUPERADMIN') && requesterRole !== 'SUPERADMIN' ? 'USER' : requestedRole;

        const newUser = await tx.user.upsert({
          where: { username: item.username },
          update: {
            role: roleToAssign,
            division: item.division || null,
            dco: item.dco || 'Guwahati',
            modified_by: adminId,
            modified_by_name: req.user?.username,
          },
          create: {
            username: item.username,
            password: item.password || item.username,
            role: roleToAssign,
            division: item.division || null,
            dco: item.dco || 'Guwahati',
            created_by: adminId,
            created_by_name: req.user?.username,
          }
        });
        createdUsers.push(newUser);
      }
      return createdUsers;
    });

    res.status(201).json({ success: true, count: results.length });
  } catch (error: any) {
    console.error('Bulk user upload error:', error);
    res.status(400).json({ error: 'Failed to bulk create users', details: error.message });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { username, role, division, dco, permitted_type } = req.body;
    const adminId = req.user?.userId;

    // Role restriction: Only SUPERADMIN can create ADMIN or SUPERADMIN
    const requesterRole = req.user?.role?.toUpperCase();
    const requestedRole = role?.toUpperCase();

    const currentTarget = await prisma.user.findUnique({ where: { user_id: Number(id) } });
    
    let finalRole = currentTarget?.role;
    if (requestedRole && requestedRole !== currentTarget?.role) {
      if ((requestedRole === 'ADMIN' || requestedRole === 'SUPERADMIN') && requesterRole !== 'SUPERADMIN') {
        return res.status(403).json({ error: 'Only SuperAdmins can promote users to administrative roles' });
      }
      finalRole = requestedRole;
    }

    const updated = await prisma.user.update({
      where: { user_id: Number(id) },
      data: {
        username,
        role: finalRole,
        permitted_type: permitted_type || currentTarget?.permitted_type,
        division,
        dco,
        modified_by: adminId,
        modified_by_name: req.user?.username,
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = Number(id);
    
    // Prevent self-deletion
    if (userId === (req as any).user?.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Use a transaction to safely handle references before deletion
    await prisma.$transaction([
      prisma.inventory.updateMany({
        where: { created_by: userId },
        data: { created_by: null }
      }),
      prisma.machine.updateMany({
        where: { created_by: userId },
        data: { created_by: null }
      }),
      prisma.network.updateMany({
        where: { created_by: userId },
        data: { created_by: null }
      }),
      prisma.printer.updateMany({
        where: { created_by: userId },
        data: { created_by: null }
      }),
      prisma.user.updateMany({
        where: { created_by: userId },
        data: { created_by: null }
      }),
      prisma.user.updateMany({
        where: { modified_by: userId },
        data: { modified_by: null }
      }),
      prisma.user.delete({
        where: { user_id: userId }
      })
    ]);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(400).json({ error: 'Failed to delete user', details: error.message });
  }
});

export default router;
