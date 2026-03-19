import cron from 'node-cron';
import { prisma } from '../utils/db.js';
import {
  calculatePrice,
  calculateDemandScore,
  calculateMomentum,
  calculateDecay,
  calculateWeightedAgentScore,
} from './priceCalculator.js';
import { initializeDailyTokenAllocation } from './tradeEngine.js';

const DAILY_TOKEN_ALLOCATION = 500;
const ON_OPEN_TICK_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes
const VOLUME_THRESHOLD = 20;

// Track last on-open tick per user
const userLastOnOpenTick = new Map();

/**
 * Run daily tick: recalculate prices, apply decay, allocate daily tokens
 * Runs at midnight (00:00)
 */
export async function runDailyTick() {
  const tickStartTime = new Date();

  try {
    // Get all active profiles
    const profiles = await prisma.profile.findMany({
      where: { isActive: true },
      include: {
        agentScores: true,
        trades: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
            },
          },
        },
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
    });

    // Update each profile
    for (const profile of profiles) {
      // Calculate metrics
      const demandScore = calculateDemandScore(
        profile.totalLongs || 0,
        profile.totalShorts || 0,
        profile.trades.length
      );

      const agentScoresObj = profile.agentScores.reduce((acc, score) => {
        acc[score.agentId] = {
          score: score.score,
          weight: score.weight,
        };
        return acc;
      }, {});

      const momentum = calculateMomentum(profile.priceHistory);
      const decay = calculateDecay(
        profile.lastTradeTimestamp ? profile.lastTradeTimestamp.getTime() : Date.now(),
        tickStartTime.getTime()
      );

      // Calculate new price
      const newPrice = calculatePrice(demandScore, agentScoresObj, momentum, decay);

      // Save to price history
      await prisma.priceHistory.create({
        data: {
          profileId: profile.id,
          price: newPrice,
          timestamp: tickStartTime,
        },
      });

      // Update profile
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          previousPrice: profile.currentPrice,
          currentPrice: newPrice,
          lastPriceUpdate: tickStartTime,
        },
      });
    }

    // Allocate daily tokens to all users
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const user of allUsers) {
      await initializeDailyTokenAllocation(user.id, DAILY_TOKEN_ALLOCATION);
    }

    // Log tick
    await prisma.tickLog.create({
      data: {
        tickType: 'DAILY',
        profilesUpdated: profiles.length,
        timestamp: tickStartTime,
      },
    });

    console.log(`[DAILY TICK] ${tickStartTime.toISOString()} - Updated ${profiles.length} profiles, allocated tokens to ${allUsers.length} users`);
  } catch (error) {
    console.error('[DAILY TICK ERROR]', error);

    // Log failed tick
    await prisma.tickLog.create({
      data: {
        tickType: 'DAILY',
        profilesUpdated: 0,
        error: error.message,
        timestamp: tickStartTime,
      },
    }).catch((logErr) => console.error('Failed to log tick error:', logErr));
  }
}

/**
 * Run on-open tick: lightweight update when user opens app
 * Only updates profiles visible to user, throttled per user
 * @param {string} userId - User ID
 */
export async function runOnOpenTick(userId) {
  const now = Date.now();
  const lastTick = userLastOnOpenTick.get(userId);

  // Throttle: max once per 5 minutes
  if (lastTick && now - lastTick < ON_OPEN_TICK_THROTTLE_MS) {
    return;
  }

  try {
    // Get profiles visible to this user (for simplicity: all active profiles)
    // In production, you'd fetch based on location, preferences, etc.
    const profiles = await prisma.profile.findMany({
      where: {
        isActive: true,
        userId: { not: userId }, // Don't include own profile
      },
      include: {
        agentScores: true,
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 3,
        },
      },
      take: 100, // Limit for performance
    });

    const tickTime = new Date();

    // Update demand scores and prices
    for (const profile of profiles) {
      const demandScore = calculateDemandScore(
        profile.totalLongs || 0,
        profile.totalShorts || 0,
        profile.volume24h || 0
      );

      const agentScoresObj = profile.agentScores.reduce((acc, score) => {
        acc[score.agentId] = {
          score: score.score,
          weight: score.weight,
        };
        return acc;
      }, {});

      const momentum = calculateMomentum(profile.priceHistory);
      const decay = calculateDecay(
        profile.lastTradeTimestamp ? profile.lastTradeTimestamp.getTime() : Date.now(),
        tickTime.getTime()
      );

      const newPrice = calculatePrice(demandScore, agentScoresObj, momentum, decay);

      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          currentPrice: newPrice,
          demandScore,
          lastPriceUpdate: tickTime,
        },
      });
    }

    // Update throttle timestamp
    userLastOnOpenTick.set(userId, now);

    // Log tick
    await prisma.tickLog.create({
      data: {
        tickType: 'ON_OPEN',
        profilesUpdated: profiles.length,
        userId,
        timestamp: tickTime,
      },
    });

    console.log(`[ON_OPEN TICK] User ${userId} - Updated ${profiles.length} profiles`);
  } catch (error) {
    console.error('[ON_OPEN TICK ERROR]', error);
  }
}

/**
 * Run hourly tick: high-frequency update for volatile profiles
 * Only updates profiles with >20 trades in last hour
 */
export async function runHourlyTick() {
  const tickTime = new Date();
  const oneHourAgo = new Date(tickTime.getTime() - 60 * 60 * 1000);

  try {
    // Find profiles with high volume in last hour
    const highVolumeProfiles = await prisma.profile.findMany({
      where: { isActive: true },
      include: {
        agentScores: true,
        trades: {
          where: {
            timestamp: { gte: oneHourAgo },
          },
        },
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
    });

    // Filter to only those meeting threshold
    const volatilesProfiles = highVolumeProfiles.filter(
      (p) => p.trades.length >= VOLUME_THRESHOLD
    );

    if (volatilesProfiles.length === 0) {
      console.log('[HOURLY TICK] No high-volume profiles found');
      return;
    }

    // Update volatile profiles
    for (const profile of volatilesProfiles) {
      const demandScore = calculateDemandScore(
        profile.totalLongs || 0,
        profile.totalShorts || 0,
        profile.trades.length
      );

      const agentScoresObj = profile.agentScores.reduce((acc, score) => {
        acc[score.agentId] = {
          score: score.score,
          weight: score.weight,
        };
        return acc;
      }, {});

      const momentum = calculateMomentum(profile.priceHistory);
      const decay = calculateDecay(
        profile.lastTradeTimestamp ? profile.lastTradeTimestamp.getTime() : tickTime.getTime(),
        tickTime.getTime()
      );

      const newPrice = calculatePrice(demandScore, agentScoresObj, momentum, decay);

      // Save to price history
      await prisma.priceHistory.create({
        data: {
          profileId: profile.id,
          price: newPrice,
          timestamp: tickTime,
        },
      });

      // Update profile
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          currentPrice: newPrice,
          lastPriceUpdate: tickTime,
        },
      });
    }

    // Log tick
    await prisma.tickLog.create({
      data: {
        tickType: 'HOURLY',
        profilesUpdated: volatilesProfiles.length,
        timestamp: tickTime,
      },
    });

    console.log(`[HOURLY TICK] ${tickTime.toISOString()} - Updated ${volatilesProfiles.length} high-volume profiles`);
  } catch (error) {
    console.error('[HOURLY TICK ERROR]', error);

    await prisma.tickLog.create({
      data: {
        tickType: 'HOURLY',
        profilesUpdated: 0,
        error: error.message,
        timestamp: tickTime,
      },
    }).catch((logErr) => console.error('Failed to log tick error:', logErr));
  }
}

/**
 * Start cron scheduler for automated ticks
 * Daily: 00:00
 * Hourly: Top of each hour
 */
export function startTickScheduler() {
  // Daily tick at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('[SCHEDULER] Running daily tick...');
    runDailyTick().catch((err) => console.error('Daily tick failed:', err));
  });

  // Hourly tick at the top of each hour
  cron.schedule('0 * * * *', () => {
    console.log('[SCHEDULER] Running hourly tick...');
    runHourlyTick().catch((err) => console.error('Hourly tick failed:', err));
  });

  console.log('[SCHEDULER] Tick scheduler started - Daily: 00:00 UTC, Hourly: every hour');
}

/**
 * Manual trigger for daily tick (useful for testing or recovery)
 * @param {Date} customTime - Optional custom timestamp for testing
 */
export async function triggerDailyTickManual(customTime) {
  console.log('[MANUAL TRIGGER] Running manual daily tick...');
  return runDailyTick(customTime);
}

/**
 * Manual trigger for hourly tick (useful for testing or recovery)
 */
export async function triggerHourlyTickManual() {
  console.log('[MANUAL TRIGGER] Running manual hourly tick...');
  return runHourlyTick();
}

/**
 * Clear throttle for a user (useful for testing)
 * @param {string} userId - User ID
 */
export function clearUserThrottle(userId) {
  userLastOnOpenTick.delete(userId);
}
