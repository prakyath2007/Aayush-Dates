/**
 * Core price calculation formula
 * PRICE = UserDemand × 0.40 + AgentScores × 0.60 + Momentum - Decay
 *
 * @param {number} demandScore - 0-10 scale, represents user interest
 * @param {Object} agentScores - { agentId: { score: 0-100, weight: 0-1 }, ... }
 * @param {number} momentum - Recent trade velocity, -20 to +20
 * @param {number} decay - Time-based decay, 0-5
 * @returns {number} Final price
 */
export function calculatePrice(demandScore, agentScores, momentum, decay) {
  // Normalize demand score from 0-10 to 0-200 range
  const demandComponent = demandScore * 20 * 0.40;

  // Calculate weighted agent score
  const agentComponent = calculateWeightedAgentScore(agentScores) * 0.60;

  // Momentum contribution (already in -20 to +20 range)
  const momentumComponent = momentum;

  // Total price
  const price = demandComponent + agentComponent + momentumComponent - decay;

  // Ensure price stays positive and reasonable (e.g., 10-500)
  return Math.max(10, Math.min(500, price));
}

/**
 * Calculate demand score based on longs vs shorts and recent activity
 * Weights recent activity higher
 *
 * @param {number} totalLongs - Total long positions
 * @param {number} totalShorts - Total short positions
 * @param {number} recentTrades - Trades in last 24 hours
 * @returns {number} Score 0-10
 */
export function calculateDemandScore(totalLongs, totalShorts, recentTrades) {
  const totalInterest = totalLongs + totalShorts;

  if (totalInterest === 0) {
    return 5; // Neutral if no interest
  }

  // Long ratio: 0 (all shorts) to 10 (all longs)
  const longRatio = (totalLongs / totalInterest) * 10;

  // Recent activity boost: each trade adds 0.1, capped at 2 points
  const recentBoost = Math.min(recentTrades * 0.1, 2);

  // Combined score, capped at 10
  const score = Math.min(longRatio + recentBoost, 10);

  return Math.max(score, 0);
}

/**
 * Calculate momentum from price history
 * Positive slope = positive momentum (price going up)
 * Negative slope = negative momentum (price going down)
 *
 * @param {Array<{price: number, timestamp: Date}>} priceHistory - Last N prices with timestamps
 * @returns {number} Momentum -20 to +20
 */
export function calculateMomentum(priceHistory) {
  if (!priceHistory || priceHistory.length < 2) {
    return 0; // No momentum if insufficient history
  }

  // Sort by timestamp ascending (oldest first)
  const sorted = [...priceHistory].sort((a, b) => a.timestamp - b.timestamp);

  // Use last 5 prices for calculation
  const prices = sorted.slice(-5).map((p) => p.price);

  if (prices.length < 2) {
    return 0;
  }

  // Calculate linear regression slope
  // Simple approach: (latest - oldest) / time periods
  const priceChange = prices[prices.length - 1] - prices[0];
  const periods = prices.length - 1;

  // Normalize to -20 to +20 range
  // Assume each period is roughly worth 4 momentum points
  const momentum = (priceChange / periods) * 4;

  return Math.max(-20, Math.min(20, momentum));
}

/**
 * Calculate time-based decay
 * No trades in 24h = decay of 1-5 (more time = more decay, capped at 5)
 *
 * @param {number} lastTradeTimestamp - Last trade timestamp in ms
 * @param {number} currentTime - Current time in ms
 * @returns {number} Decay amount 0-5
 */
export function calculateDecay(lastTradeTimestamp, currentTime) {
  const timeSinceLastTrade = currentTime - lastTradeTimestamp;
  const DECAY_START_MS = 24 * 60 * 60 * 1000; // 24 hours
  const DECAY_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  if (timeSinceLastTrade < DECAY_START_MS) {
    return 0; // No decay within 24 hours
  }

  // Linear decay from 24h to 7d: 0 -> 5
  const decayRange = DECAY_MAX_MS - DECAY_START_MS;
  const timeInDecayRange = timeSinceLastTrade - DECAY_START_MS;

  const decay = (timeInDecayRange / decayRange) * 5;

  return Math.max(0, Math.min(5, decay));
}

/**
 * Calculate weighted average of agent scores
 * Each agent has a score (0-100) and a weight (0-1)
 *
 * @param {Object} agentScores - { agentId: { score: 0-100, weight: 0-1 }, ... }
 * @returns {number} Weighted score 0-200 (agent component after 0.60 multiplier)
 */
export function calculateWeightedAgentScore(agentScores) {
  if (!agentScores || Object.keys(agentScores).length === 0) {
    return 100; // Default middle score if no agent data
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const [agentId, agentData] of Object.entries(agentScores)) {
    const { score = 50, weight = 0 } = agentData;
    totalWeightedScore += score * weight;
    totalWeight += weight;
  }

  // Normalize weight (should sum to 1.0, but handle edge cases)
  if (totalWeight === 0) {
    return 100; // Default if weights are 0
  }

  const normalizedScore = totalWeightedScore / totalWeight;

  // Scale from 0-100 to 0-200 range (after 0.60 multiplier in main formula)
  return Math.min(normalizedScore * 2, 200);
}

/**
 * Calculate P&L for a closed position
 *
 * @param {string} positionType - 'LONG' or 'SHORT'
 * @param {number} entryPrice - Entry price
 * @param {number} exitPrice - Exit price
 * @param {number} amount - Position amount (typically 1 for single "stock")
 * @returns {number} P&L in price units
 */
export function calculatePositionPnL(positionType, entryPrice, exitPrice, amount = 1) {
  if (positionType === 'LONG') {
    return (exitPrice - entryPrice) * amount;
  } else if (positionType === 'SHORT') {
    return (entryPrice - exitPrice) * amount;
  }

  throw new Error('Invalid position type');
}

/**
 * Convert P&L from price units to tokens
 * 1 price unit = 10 tokens
 *
 * @param {number} pnl - P&L in price units
 * @returns {number} P&L in tokens (rounded)
 */
export function convertPnLToTokens(pnl) {
  return Math.round(pnl * 10);
}

/**
 * Validate agent scores object structure
 * Ensures all agents exist and weights sum to ~1.0
 *
 * @param {Object} agentScores - Agent scores object
 * @returns {boolean} True if valid
 */
export function validateAgentScores(agentScores) {
  if (!agentScores || typeof agentScores !== 'object') {
    return false;
  }

  let totalWeight = 0;
  const REQUIRED_AGENTS = [
    'intent',
    'social',
    'activity',
    'compatibility',
    'health',
    'market_maker',
    'sentiment',
    'trust',
    'news',
  ];

  for (const agent of REQUIRED_AGENTS) {
    if (!agentScores[agent]) {
      console.warn(`Missing agent score for: ${agent}`);
      return false;
    }

    const { score, weight } = agentScores[agent];
    if (typeof score !== 'number' || score < 0 || score > 100) {
      console.warn(`Invalid score for agent ${agent}: ${score}`);
      return false;
    }

    if (typeof weight !== 'number' || weight < 0 || weight > 1) {
      console.warn(`Invalid weight for agent ${agent}: ${weight}`);
      return false;
    }

    totalWeight += weight;
  }

  // Check weights sum to ~1.0 (allow small floating point variance)
  if (Math.abs(totalWeight - 1.0) > 0.01) {
    console.warn(`Agent weights sum to ${totalWeight}, expected 1.0`);
    return false;
  }

  return true;
}

/**
 * Agent weight configuration (reference)
 */
export const AGENT_WEIGHTS = {
  intent: 0.18,
  social: 0.12,
  activity: 0.15,
  compatibility: 0.14,
  health: 0.08,
  market_maker: 0.10,
  sentiment: 0.08,
  trust: 0.07,
  news: 0.08,
};

/**
 * Verify agent weights configuration
 */
export function verifyAgentWeights() {
  const total = Object.values(AGENT_WEIGHTS).reduce((sum, w) => sum + w, 0);
  if (Math.abs(total - 1.0) > 0.001) {
    throw new Error(`Agent weights do not sum to 1.0: ${total}`);
  }
  return true;
}

// Verify on module load
verifyAgentWeights();
