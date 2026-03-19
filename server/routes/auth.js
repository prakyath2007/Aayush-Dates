import express from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';
import { evaluateAllAgents } from '../agents/index.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'lovemarket-dev-secret';

/**
 * Generate JWT token
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * POST /api/auth/signup
 * Create new user + profile, initialize tokens, run initial evaluation
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, age, location } = req.body;

    // Validation
    if (!email || !password || !name || !age) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        balance: 500, // Initialize with 500 tokens
      },
    });

    // Create profile
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        age: parseInt(age),
        location,
        bio: '',
        photos: [],
        interests: [],
        verified: false,
      },
    });

    // Run initial agent evaluation
    const agentScores = evaluateAllAgents(profile, {
      volume24h: 0,
      recentTrades: 0,
      totalLongs: 0,
      totalShorts: 0,
    });

    // Calculate composite score
    const avgScore = Math.round(
      Object.values(agentScores).reduce((sum, agent) => sum + agent.score, 0) / 9
    );

    // Store agent scores
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        agentScores: agentScores,
        compositeScore: avgScore,
        currentPrice: 50, // Start at $50
      },
    });

    // Generate token
    const token = generateToken(user.id);

    // Return response (exclude password)
    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({
      token,
      user: userWithoutPassword,
      profile: {
        ...profile,
        agentScores,
        compositeScore: avgScore,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Signup failed' });
  }
});

/**
 * POST /api/auth/login
 * Validate credentials, generate JWT, trigger onOpenTick
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const passwordValid = await bcryptjs.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // TODO: Trigger onOpenTick here (market opening, price updates, etc.)
    // For now, just generate token

    // Generate token
    const token = generateToken(user.id);

    // Return response (exclude password)
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      token,
      user: userWithoutPassword,
      profile: user.profile,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user + profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Exclude password
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      user: userWithoutPassword,
      profile: user.profile,
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
