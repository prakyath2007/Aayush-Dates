import express from 'express';
import { prisma } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';
import { evaluateAllAgents } from '../agents/index.js';

const router = express.Router();

/**
 * Mock trade engine functions
 * TODO: Replace with real trade logic
 */
function calculateTradePrice(profile, type) {
  // For now, use currentPrice with slight variance based on type
  const basePrice = profile.currentPrice || 50;
  const variance = type === 'LONG' ? 1.02 : 0.98; // LONG slightly more expensive
  return Math.round(basePrice * variance * 100) / 100;
}

function calculateMarketImpact(profile, type, positionSize) {
  // Simulate market impact (larger trades move price more)
  return Math.round((positionSize / 1000) * 2 * 100) / 100;
}

/**
 * GET /api/market/profiles
 * Returns all active profiles with current prices
 * Query: ?sort=price|trend|volume|new&limit=50
 */
router.get('/profiles', async (req, res) => {
  try {
    const { sort = 'price', limit = 50 } = req.query;

    // Fetch all active profiles with stats
    let profiles = await prisma.profile.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { longPositions: true, shortPositions: true },
        },
      },
      take: parseInt(limit),
    });

    // Enrich with agent scores and sorting
    profiles = profiles.map((profile) => {
      const agents = evaluateAllAgents(profile, {
        volume24h: profile.volume24h || 0,
        recentTrades: 0,
        totalLongs: profile._count.longPositions || 0,
        totalShorts: profile._count.shortPositions || 0,
      });

      return {
        id: profile.id,
        userId: profile.user.id,
        name: profile.user.name,
        age: profile.age,
        location: profile.location,
        currentPrice: profile.currentPrice || 50,
        priceChange24h: profile.priceChange24h || 0,
        compositeScore: profile.compositeScore || 50,
        volume24h: profile.volume24h || 0,
        longCount: profile._count.longPositions,
        shortCount: profile._count.shortPositions,
        agentScores: {
          intent: agents.intent.score,
          social: agents.social.score,
          activity: agents.activity.score,
          compatibility: agents.compatibility.score,
          health: agents.health.score,
          market_maker: agents.market_maker.score,
          sentiment: agents.sentiment.score,
          trust: agents.trust.score,
          news: agents.news.score,
        },
        verified: profile.verified,
        createdAt: profile.createdAt,
      };
    });

    // Sort by requested criteria
    if (sort === 'price') {
      profiles.sort((a, b) => b.currentPrice - a.currentPrice);
    } else if (sort === 'trend') {
      profiles.sort((a, b) => b.priceChange24h - a.priceChange24h);
    } else if (sort === 'volume') {
      profiles.sort((a, b) => b.volume24h - a.volume24h);
    } else if (sort === 'new') {
      profiles.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    return res.json({
      count: profiles.length,
      profiles,
    });
  } catch (error) {
    console.error('Get profiles error:', error);
    return res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

/**
 * GET /api/market/profile/:id
 * Returns full profile detail with all agent scores and price history
 */
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
        _count: {
          select: { longPositions: true, shortPositions: true },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get detailed agent evaluations
    const agentScores = evaluateAllAgents(profile, {
      volume24h: profile.volume24h || 0,
      recentTrades: 0,
      totalLongs: profile._count.longPositions || 0,
      totalShorts: profile._count.shortPositions || 0,
    });

    // Get price history (last 30 days)
    const priceHistory = await prisma.priceHistory.findMany({
      where: { profileId: id },
      orderBy: { timestamp: 'desc' },
      take: 30,
    });

    return res.json({
      profile: {
        id: profile.id,
        userId: profile.user.id,
        name: profile.user.name,
        age: profile.age,
        location: profile.location,
        bio: profile.bio,
        photos: profile.photos,
        interests: profile.interests,
        education: profile.education,
        occupation: profile.occupation,
        currentPrice: profile.currentPrice || 50,
        priceChange24h: profile.priceChange24h || 0,
        compositeScore: profile.compositeScore || 50,
        volume24h: profile.volume24h || 0,
        volume7d: profile.volume7d || 0,
        longCount: profile._count.longPositions,
        shortCount: profile._count.shortPositions,
        verified: profile.verified,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      agentScores: {
        intent: agentScores.intent,
        social: agentScores.social,
        activity: agentScores.activity,
        compatibility: agentScores.compatibility,
        health: agentScores.health,
        market_maker: agentScores.market_maker,
        sentiment: agentScores.sentiment,
        trust: agentScores.trust,
        news: agentScores.news,
      },
      priceHistory: priceHistory.slice(0, 30).map((ph) => ({
        price: ph.price,
        timestamp: ph.timestamp,
      })),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * POST /api/market/trade
 * Execute trade (LONG or SHORT)
 */
router.post('/trade', authenticate, async (req, res) => {
  try {
    const { profileId, type, positionSize = 1 } = req.body;

    if (!profileId || !type) {
      return res.status(400).json({ error: 'profileId and type required' });
    }

    if (!['LONG', 'SHORT'].includes(type)) {
      return res.status(400).json({ error: 'type must be LONG or SHORT' });
    }

    // Get profile
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get user balance
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate trade price
    const tradePrice = calculateTradePrice(profile, type);
    const totalCost = tradePrice * positionSize;

    // Check balance
    if (user.balance < totalCost) {
      return res.status(400).json({
        error: 'Insufficient balance',
        required: totalCost,
        available: user.balance,
      });
    }

    // Create position
    const position = await prisma.position.create({
      data: {
        userId: req.user.id,
        profileId,
        type,
        positionSize,
        entryPrice: tradePrice,
        currentPrice: tradePrice,
        status: 'OPEN',
      },
    });

    // Deduct balance
    await prisma.user.update({
      where: { id: req.user.id },
      data: { balance: user.balance - totalCost },
    });

    // Record trade
    await prisma.trade.create({
      data: {
        userId: req.user.id,
        profileId,
        type,
        positionSize,
        price: tradePrice,
        totalValue: totalCost,
      },
    });

    // Update profile stats
    const currentProfile = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    const marketImpact = calculateMarketImpact(profile, type, positionSize);
    const newPrice = type === 'LONG'
      ? (currentProfile.currentPrice || 50) + marketImpact
      : Math.max(1, (currentProfile.currentPrice || 50) - marketImpact);

    await prisma.profile.update({
      where: { id: profileId },
      data: {
        currentPrice: newPrice,
        volume24h: (currentProfile.volume24h || 0) + totalCost,
      },
    });

    return res.status(201).json({
      position: {
        id: position.id,
        type: position.type,
        positionSize: position.positionSize,
        entryPrice: position.entryPrice,
        totalCost,
        status: position.status,
        createdAt: position.createdAt,
      },
      newBalance: user.balance - totalCost,
      profileNewPrice: newPrice,
    });
  } catch (error) {
    console.error('Trade error:', error);
    return res.status(500).json({ error: 'Trade failed' });
  }
});

/**
 * POST /api/market/close/:positionId
 * Close position and calculate P&L
 */
router.post('/close/:positionId', authenticate, async (req, res) => {
  try {
    const { positionId } = req.params;

    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: {
        profile: true,
      },
    });

    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }

    if (position.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (position.status !== 'OPEN') {
      return res.status(400).json({ error: 'Position not open' });
    }

    const exitPrice = position.profile.currentPrice || 50;
    const totalEntryValue = position.entryPrice * position.positionSize;
    const totalExitValue = exitPrice * position.positionSize;

    let pnl;
    if (position.type === 'LONG') {
      pnl = totalExitValue - totalEntryValue;
    } else {
      pnl = totalEntryValue - totalExitValue;
    }

    // Close position
    await prisma.position.update({
      where: { id: positionId },
      data: {
        status: 'CLOSED',
        exitPrice,
        pnl,
      },
    });

    // Return capital + profit/loss
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { balance: user.balance + totalExitValue + pnl },
    });

    return res.json({
      positionId,
      type: position.type,
      entryPrice: position.entryPrice,
      exitPrice,
      positionSize: position.positionSize,
      pnl,
      newBalance: user.balance + totalExitValue + pnl,
      returnPercentage: ((pnl / totalEntryValue) * 100).toFixed(2),
    });
  } catch (error) {
    console.error('Close position error:', error);
    return res.status(500).json({ error: 'Failed to close position' });
  }
});

/**
 * GET /api/market/portfolio
 * Get user's portfolio with all open positions
 */
router.get('/portfolio', authenticate, async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      where: {
        userId: req.user.id,
        status: 'OPEN',
      },
      include: {
        profile: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    const enrichedPositions = positions.map((pos) => {
      const currentValue = pos.profile.currentPrice * pos.positionSize;
      const entryValue = pos.entryPrice * pos.positionSize;
      let unrealizedPnl;
      if (pos.type === 'LONG') {
        unrealizedPnl = currentValue - entryValue;
      } else {
        unrealizedPnl = entryValue - currentValue;
      }

      return {
        id: pos.id,
        profileId: pos.profileId,
        profileName: pos.profile.user.name,
        type: pos.type,
        positionSize: pos.positionSize,
        entryPrice: pos.entryPrice,
        currentPrice: pos.profile.currentPrice,
        entryValue,
        currentValue,
        unrealizedPnl,
        unrealizedReturn: ((unrealizedPnl / entryValue) * 100).toFixed(2),
        createdAt: pos.createdAt,
      };
    });

    const totalValue = enrichedPositions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalPnl = enrichedPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);

    return res.json({
      positions: enrichedPositions,
      summary: {
        totalValue,
        totalUnrealizedPnl: totalPnl,
        totalReturn: ((totalPnl / totalValue) * 100).toFixed(2),
      },
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    return res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

/**
 * GET /api/market/history
 * Get user's trade history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.user.id },
      include: {
        profile: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const enrichedTrades = trades.map((trade) => ({
      id: trade.id,
      profileId: trade.profileId,
      profileName: trade.profile.user.name,
      type: trade.type,
      positionSize: trade.positionSize,
      price: trade.price,
      totalValue: trade.totalValue,
      createdAt: trade.createdAt,
    }));

    return res.json({ trades: enrichedTrades });
  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({ error: 'Failed to fetch trade history' });
  }
});

/**
 * GET /api/market/ticker
 * Returns top 10 profiles as ticker data
 */
router.get('/ticker', async (req, res) => {
  try {
    const profiles = await prisma.profile.findMany({
      include: {
        user: { select: { name: true } },
      },
      orderBy: { volume24h: 'desc' },
      take: 10,
    });

    const ticker = profiles.map((p) => ({
      symbol: `$${p.user.name.toUpperCase().substring(0, 4)}`,
      name: p.user.name,
      price: p.currentPrice || 50,
      change: p.priceChange24h || 0,
      changePercent: ((p.priceChange24h / (p.currentPrice || 50)) * 100).toFixed(2),
      volume: p.volume24h || 0,
    }));

    return res.json({ ticker });
  } catch (error) {
    console.error('Get ticker error:', error);
    return res.status(500).json({ error: 'Failed to fetch ticker' });
  }
});

/**
 * GET /api/market/news
 * Returns recent market events/news
 */
router.get('/news', async (req, res) => {
  try {
    // Mock news events
    const news = [
      {
        id: '1',
        title: 'Market opens strong',
        description: 'Summer dating season boost begins',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        impact: 'POSITIVE',
      },
      {
        id: '2',
        title: 'Top profiles trending',
        description: 'Newly verified profiles showing strong gains',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        impact: 'POSITIVE',
      },
      {
        id: '3',
        title: 'Market correction expected',
        description: 'Some overvalued profiles showing signs of decline',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
        impact: 'NEUTRAL',
      },
    ];

    return res.json({ news });
  } catch (error) {
    console.error('Get news error:', error);
    return res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;
