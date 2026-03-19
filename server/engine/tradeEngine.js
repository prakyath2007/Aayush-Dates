import { prisma } from '../utils/db.js';

const TOKEN_COST = 100;
const MAX_POSITION_PER_PERSON = 300;

/**
 * Execute a trade (LONG or SHORT) on a profile
 * Creates Position, logs Trade, updates Profile demand metrics, deducts tokens
 * @param {string} userId - User ID
 * @param {string} profileId - Profile ID
 * @param {string} type - 'LONG' or 'SHORT'
 * @param {number} tokenCost - Optional override for token cost (default: TOKEN_COST)
 * @returns {Promise<{position, trade, newBalance}>}
 */
export async function executeTrade(userId, profileId, type, tokenCost = TOKEN_COST) {
  if (!['LONG', 'SHORT'].includes(type)) {
    throw new Error('Type must be LONG or SHORT');
  }

  if (tokenCost < 0) {
    throw new Error('Token cost must be positive');
  }

  // Check user has enough tokens
  const userBalance = await getUserTokenBalance(userId);
  if (userBalance < tokenCost) {
    throw new Error(`Insufficient tokens. Balance: ${userBalance}, Required: ${tokenCost}`);
  }

  // Check position limit per profile
  const existingPosition = await prisma.position.findFirst({
    where: {
      userId,
      profileId,
      isOpen: true,
    },
  });

  if (existingPosition) {
    throw new Error('User already has an open position on this profile');
  }

  // Get current profile price
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { agentScores: true },
  });

  if (!profile) {
    throw new Error('Profile not found');
  }

  const entryPrice = profile.currentPrice || 100;

  // Create position
  const position = await prisma.position.create({
    data: {
      userId,
      profileId,
      type,
      amount: 1, // Each position is for 1 unit of the profile "stock"
      entryPrice,
      currentPrice: entryPrice,
      isOpen: true,
      openedAt: new Date(),
      unrealizedPnL: 0,
    },
  });

  // Create trade record
  const trade = await prisma.trade.create({
    data: {
      userId,
      profileId,
      positionId: position.id,
      type,
      price: entryPrice,
      timestamp: new Date(),
      tokensDelta: -tokenCost, // Negative because tokens are spent
      status: 'EXECUTED',
    },
  });

  // Deduct tokens from user
  const tokenLedger = await prisma.tokenLedger.create({
    data: {
      userId,
      tradeId: trade.id,
      amount: -tokenCost,
      reason: `TRADE_${type}`,
      timestamp: new Date(),
    },
  });

  // Update profile demand metrics
  const profileUpdate = {};
  if (type === 'LONG') {
    profileUpdate.totalLongs = (profile.totalLongs || 0) + 1;
  } else {
    profileUpdate.totalShorts = (profile.totalShorts || 0) + 1;
  }
  profileUpdate.volume24h = (profile.volume24h || 0) + 1;

  // Recalculate demand score based on new longs/shorts
  const totalLongs = profileUpdate.totalLongs || profile.totalLongs || 0;
  const totalShorts = profileUpdate.totalShorts || profile.totalShorts || 0;
  const recentTrades = profileUpdate.volume24h || profile.volume24h || 0;
  profileUpdate.demandScore = calculateDemandScoreLocal(totalLongs, totalShorts, recentTrades);

  const updatedProfile = await prisma.profile.update({
    where: { id: profileId },
    data: profileUpdate,
  });

  // Get new balance
  const newBalance = await getUserTokenBalance(userId);

  return {
    position,
    trade,
    newBalance,
  };
}

/**
 * Close an open position and calculate P&L
 * @param {string} userId - User ID
 * @param {string} positionId - Position ID
 * @returns {Promise<{position, trade, pnl, newBalance}>}
 */
export async function closePosition(userId, positionId) {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: { profile: true },
  });

  if (!position) {
    throw new Error('Position not found');
  }

  if (position.userId !== userId) {
    throw new Error('Unauthorized: Position belongs to another user');
  }

  if (!position.isOpen) {
    throw new Error('Position is already closed');
  }

  const currentPrice = position.profile.currentPrice || position.entryPrice;
  let pnl;

  if (position.type === 'LONG') {
    pnl = (currentPrice - position.entryPrice) * position.amount;
  } else {
    // SHORT: profit when price goes down
    pnl = (position.entryPrice - currentPrice) * position.amount;
  }

  // Convert price-based P&L to tokens (scaled conversion)
  const pnlInTokens = Math.round(pnl * 10); // 1 price unit = 10 tokens

  // Close position
  const closedPosition = await prisma.position.update({
    where: { id: positionId },
    data: {
      isOpen: false,
      closedAt: new Date(),
      currentPrice,
      unrealizedPnL: pnl,
    },
  });

  // Log trade for close
  const trade = await prisma.trade.create({
    data: {
      userId,
      profileId: position.profileId,
      positionId,
      type: `CLOSE_${position.type}`,
      price: currentPrice,
      timestamp: new Date(),
      tokensDelta: pnlInTokens,
      status: 'EXECUTED',
    },
  });

  // Credit tokens back (original cost + P&L)
  await prisma.tokenLedger.create({
    data: {
      userId,
      tradeId: trade.id,
      amount: TOKEN_COST + pnlInTokens, // Return original + gains
      reason: 'POSITION_CLOSE',
      timestamp: new Date(),
    },
  });

  const newBalance = await getUserTokenBalance(userId);

  return {
    position: closedPosition,
    trade,
    pnl,
    pnlInTokens,
    newBalance,
  };
}

/**
 * Get all open positions for a user with current values and unrealized P&L
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getPortfolio(userId) {
  const positions = await prisma.position.findMany({
    where: {
      userId,
      isOpen: true,
    },
    include: {
      profile: {
        select: {
          id: true,
          name: true,
          bio: true,
          photos: true,
          currentPrice: true,
          previousPrice: true,
        },
      },
    },
    orderBy: {
      openedAt: 'desc',
    },
  });

  // Enrich with current P&L
  const enriched = positions.map((pos) => {
    const currentPrice = pos.profile.currentPrice || pos.entryPrice;
    let unrealizedPnL;

    if (pos.type === 'LONG') {
      unrealizedPnL = (currentPrice - pos.entryPrice) * pos.amount;
    } else {
      unrealizedPnL = (pos.entryPrice - currentPrice) * pos.amount;
    }

    return {
      ...pos,
      currentPrice,
      unrealizedPnL,
      unrealizedPnLInTokens: Math.round(unrealizedPnL * 10),
      percentageGain: ((unrealizedPnL / (pos.entryPrice * pos.amount)) * 100).toFixed(2),
    };
  });

  return enriched;
}

/**
 * Get recent closed trades for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of trades to return (default: 50)
 * @returns {Promise<Array>}
 */
export async function getTradeHistory(userId, limit = 50) {
  const trades = await prisma.trade.findMany({
    where: {
      userId,
    },
    include: {
      profile: {
        select: {
          id: true,
          name: true,
          photos: true,
        },
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
  });

  return trades;
}

/**
 * Get current token balance for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
export async function getUserTokenBalance(userId) {
  const result = await prisma.tokenLedger.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  return result._sum.amount || 0;
}

/**
 * Internal helper to calculate demand score (local version without db calls)
 * Weights recent activity higher
 * @param {number} totalLongs
 * @param {number} totalShorts
 * @param {number} recentTrades
 * @returns {number} 0-10 scale
 */
function calculateDemandScoreLocal(totalLongs, totalShorts, recentTrades) {
  const netInterest = totalLongs - totalShorts;
  const totalInterest = totalLongs + totalShorts;

  // Avoid division by zero
  if (totalInterest === 0) {
    return 5; // Neutral score
  }

  // Long ratio with recent trade boost
  const longRatio = (totalLongs / totalInterest) * 10;
  const recentBoost = Math.min(recentTrades * 0.1, 2); // Boost up to 2 points based on recent activity

  const score = Math.min(longRatio + recentBoost, 10);
  return Math.max(score, 0);
}

/**
 * Initialize daily token allocation for a user
 * @param {string} userId - User ID
 * @param {number} amount - Token amount (default: 500)
 * @returns {Promise<Object>}
 */
export async function initializeDailyTokenAllocation(userId, amount = 500) {
  const allocation = await prisma.tokenLedger.create({
    data: {
      userId,
      amount,
      reason: 'DAILY_ALLOCATION',
      timestamp: new Date(),
    },
  });

  return allocation;
}
