import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const ticketSchema = z.object({
  asset_tag: z.string().optional(),
  issue_description: z.string().min(5, "Description must be at least 5 characters"),
  issue_type: z.enum(["H/W", "S/W"]),
});

const updateTicketSchema = z.object({
  status: z.enum(["Open", "In Progress", "Closed"]),
});

// GET all tickets
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { role, userId } = req.user!;
    
    // Admins see all, users see only theirs
    const userRole = role?.toUpperCase();
    const where = (userRole === 'ADMIN' || userRole === 'SUPERADMIN') ? {} : { created_by: userId };
    
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        creator: {
          select: { username: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    // Format to flatten creator username for easier frontend use
    const formatted = tickets.map(t => ({
      ...t,
      username: t.creator?.username || 'Unknown'
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// POST create ticket
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.user!;
    const { asset_tag, ...data } = ticketSchema.parse(req.body);
    
    const ticket = await prisma.ticket.create({
      data: {
        ...data,
        asset_tag,
        created_by: userId
      }
    });
    
    res.status(201).json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Ticket creation error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// PUT update ticket (status)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;
    const { status } = updateTicketSchema.parse(req.body);
    
    const ticket = await prisma.ticket.findUnique({ where: { id: Number(id) } });
    
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    // Only admin or the creator can update? 
    // Actually, usually only admin/support updates status.
    // For this simple system, let's allow admins and the creator (to close it?).
    const userRole = role?.toUpperCase();
    
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN' && ticket.created_by !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const updatedData: any = { status };
    if (status === 'Closed') {
      updatedData.resolved_at = new Date();
    } else {
      updatedData.resolved_at = null; // Re-opened
    }
    
    const updatedTicket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: updatedData
    });
    
    res.json(updatedTicket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// DELETE ticket
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user!;
    const userRole = role?.toUpperCase();
    
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await prisma.ticket.delete({ where: { id: Number(id) } });
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

export default router;
