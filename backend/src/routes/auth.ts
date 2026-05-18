import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { encodePassword, encodeUsername, decodeString } from '../utils/encoding';



const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    const encodedInputPassword = encodePassword(password);
    const encodedUsername = encodeUsername(username);
    
    // Search for user by either plaintext or encoded username
    let user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { username: encodedUsername } });
    }
    
    // Log the comparison for debugging purposes
    if (user) {
      console.log(`Auth Check [${username}]:`);
      console.log(`- DB Password:      "${user.password}"`);
      console.log(`- Encoded Input:    "${encodedInputPassword}"`);
      console.log(`- Plaintext Input:  "${password}"`);
    } else {
      console.log(`Auth Check: User "${username}" not found.`);
    }

    const isPasswordMatch = user && (
      user.password === encodedInputPassword || 
      user.password === password ||
      decodeString(user.password).trim() === password.trim()
    );
    
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`Login Success: ${user.username}, Role: ${user.role}, Permitted: ${user.permitted_type}`);

    const token = jwt.sign(
      { userId: user.user_id, username: user.username, role: user.role, permitted_type: user.permitted_type }, 
      process.env.JWT_SECRET || 'supersecretkey', 
      { expiresIn: '1d' }
    );
    res.json({ token, user: { id: user.user_id, username: user.username, role: user.role, permitted_type: user.permitted_type } });


  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors?.[0]?.message || 'Validation failed' });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/signup', authenticate, requireAdmin, async (req, res) => {
  console.log('Signup request received:', req.body);
  try {
    const { username, password } = loginSchema.parse(req.body);
    const { role = 'USER', permitted_type = 'ALL' } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }



    // Role restriction: Only ADMIN can create ADMIN or SUPERADMIN (since SUPERADMIN is view-only)
    const requesterRole = req.user?.role?.toUpperCase();
    const requestedRole = role.toUpperCase();

    if ((requestedRole === 'ADMIN' || requestedRole === 'SUPERADMIN') && requesterRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only Admins can create administrative accounts' });
    }

    const adminUsername = req.user?.username;

    await prisma.user.create({
      data: {
        username,
        password: encodePassword(password),
        role: requestedRole,
        permitted_type,
        created_by: req.user?.userId,
        created_by_name: adminUsername
      }
    });



    res.status(201).json({ message: 'Account created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed: ' + error.errors.map(e => `${e.path}: ${e.message}`).join(', ') });
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  res.json(req.user);
});

export default router;
