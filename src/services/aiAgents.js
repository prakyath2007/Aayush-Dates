import { AGENTS } from '../data/agents'

/**
 * AI Agent Scoring System
 * Each agent evaluates a profile based on different criteria.
 * Scores are 0-100, signals are BUY/HOLD/SELL, trends show momentum.
 */

// Helper: hash a string to a consistent number (for deterministic "randomness")
function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit int
  }
  return Math.abs(hash)
}

// Helper: clamp value between min and max
function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val))
}

// Helper: get signal from score
function getSignal(score) {
  if (score >= 70) return 'BUY'
  if (score >= 40) return 'HOLD'
  return 'SELL'
}

// Helper: get trend from score (slight variation)
function getTrend(score, seed) {
  const base = (score - 50) / 25  // -2 to +2
  const noise = ((hashCode(seed + 'trend') % 100) - 50) / 50  // -1 to +1
  return Math.round((base + noise) * 10) / 10
}

/**
 * INTENT AGENT (weight: 0.18)
 * Evaluates dating intent signals — bio quality, looking-for clarity, profile completeness
 */
function scoreIntent(profile) {
  let score = 50
  const seed = profile.id + 'intent'

  // Bio quality: longer, more detailed bios score higher
  if (profile.bio) {
    const bioLength = profile.bio.length
    if (bioLength > 200) score += 20
    else if (bioLength > 100) score += 15
    else if (bioLength > 50) score += 10
    else score += 5
  }

  // Has looking-for defined
  if (profile.lookingFor) score += 10

  // Profile completeness
  const fields = [profile.job, profile.education, profile.location, profile.height, profile.company]
  const filled = fields.filter(Boolean).length
  score += filled * 4

  // Interest diversity
  if (profile.interests && profile.interests.length >= 5) score += 8
  else if (profile.interests && profile.interests.length >= 3) score += 5

  // Deterministic noise based on profile id
  score += (hashCode(seed) % 11) - 5

  return clamp(Math.round(score), 10, 98)
}

/**
 * SOCIAL AGENT (weight: 0.12)
 * Verifies social presence — connected accounts, verification
 */
function scoreSocial(profile) {
  let score = 40
  const seed = profile.id + 'social'

  // Connected apps
  if (profile.instagram) score += 15
  if (profile.linkedin) score += 18
  if (profile.strava) score += 10

  // Verified profile
  if (profile.verified) score += 15

  // Has connected apps array
  if (profile.connectedApps && profile.connectedApps.length > 0) {
    score += profile.connectedApps.length * 8
  }

  score += (hashCode(seed) % 9) - 4
  return clamp(Math.round(score), 10, 98)
}

/**
 * ACTIVITY AGENT (weight: 0.15)
 * Tracks engagement level — profile recency, data richness
 */
function scoreActivity(profile) {
  let score = 55
  const seed = profile.id + 'activity'

  // Has price history (active in market)
  if (profile.priceHistory && profile.priceHistory.length > 10) score += 15
  else if (profile.priceHistory && profile.priceHistory.length > 5) score += 8

  // Volume indicates activity
  if (profile.volume24h > 100) score += 12
  else if (profile.volume24h > 50) score += 8
  else if (profile.volume24h > 20) score += 4

  // Profile has been updated (has price movement)
  if (profile.priceChange && Math.abs(profile.priceChange) > 2) score += 10

  score += (hashCode(seed) % 13) - 6
  return clamp(Math.round(score), 10, 98)
}

/**
 * COMPATIBILITY AGENT (weight: 0.14)
 * Analyzes preference alignment — interests overlap, demographic fit
 */
function scoreCompatibility(profile) {
  let score = 50
  const seed = profile.id + 'compat'

  // Interest diversity (more interests = more matchable)
  if (profile.interests) {
    score += Math.min(profile.interests.length * 3, 20)
  }

  // Has clear preferences
  if (profile.lookingFor) score += 12

  // Age in prime range
  if (profile.age >= 22 && profile.age <= 35) score += 8
  else if (profile.age >= 18 && profile.age <= 45) score += 4

  // Location filled (can match geographically)
  if (profile.location) score += 6

  score += (hashCode(seed) % 11) - 5
  return clamp(Math.round(score), 10, 98)
}

/**
 * HEALTH AGENT (weight: 0.08)
 * Evaluates health/fitness signals — Strava, fitness interests
 */
function scoreHealth(profile) {
  let score = 45
  const seed = profile.id + 'health'

  // Strava connected = big signal
  if (profile.strava) score += 25

  // Fitness-related interests
  const fitnessInterests = ['Fitness', 'Hiking', 'Yoga', 'Sports', 'Dancing']
  if (profile.interests) {
    const fitnessCount = profile.interests.filter(i => fitnessInterests.includes(i)).length
    score += fitnessCount * 7
  }

  // Height filled (body awareness)
  if (profile.height) score += 5

  score += (hashCode(seed) % 11) - 5
  return clamp(Math.round(score), 10, 98)
}

/**
 * MARKET MAKER AGENT (weight: 0.10)
 * Analyzes market health — organic trading, no manipulation
 */
function scoreMarketMaker(profile) {
  let score = 60
  const seed = profile.id + 'mm'

  // Healthy long/short ratio
  const longs = profile.totalLongs || profile.bankOfUsers?.totalLongs || 0
  const shorts = profile.totalShorts || profile.bankOfUsers?.totalShorts || 0
  const total = longs + shorts
  if (total > 0) {
    const ratio = longs / total
    if (ratio > 0.3 && ratio < 0.9) score += 15 // Healthy market
    else score -= 5 // Too one-sided
  }

  // Volume indicates liquidity
  if (profile.volume24h > 50) score += 10
  else if (profile.volume24h > 20) score += 5

  // Price stability (not too volatile)
  if (profile.priceHistory && profile.priceHistory.length > 5) {
    const prices = profile.priceHistory.slice(-5)
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    const volatility = prices.reduce((sum, p) => sum + Math.abs(p - avg), 0) / prices.length
    if (volatility < avg * 0.1) score += 10 // Low volatility
  }

  score += (hashCode(seed) % 9) - 4
  return clamp(Math.round(score), 10, 98)
}

/**
 * SENTIMENT AGENT (weight: 0.08)
 * Analyzes bio tone, warmth, authenticity
 */
function scoreSentiment(profile) {
  let score = 50
  const seed = profile.id + 'sentiment'

  if (profile.bio) {
    const bio = profile.bio.toLowerCase()

    // Positive words
    const positiveWords = ['love', 'passion', 'adventure', 'enjoy', 'fun', 'happy', 'curious', 'creative', 'kind', 'warm', 'genuine', 'authentic']
    const positiveCount = positiveWords.filter(w => bio.includes(w)).length
    score += positiveCount * 5

    // Humor indicators
    if (bio.includes('😂') || bio.includes('😄') || bio.includes('haha') || bio.includes('lol')) score += 5

    // Red flag words
    const redFlags = ['drama', 'toxic', 'boring', 'waste', 'don\'t bother', 'swipe left if']
    const redCount = redFlags.filter(w => bio.includes(w)).length
    score -= redCount * 8

    // Bio length sweetspot
    if (profile.bio.length > 80 && profile.bio.length < 500) score += 8
  }

  score += (hashCode(seed) % 11) - 5
  return clamp(Math.round(score), 10, 98)
}

/**
 * TRUST AGENT (weight: 0.07)
 * Evaluates verification level and profile authenticity
 */
function scoreTrust(profile) {
  let score = 40
  const seed = profile.id + 'trust'

  // Verified
  if (profile.verified) score += 20

  // Connected socials (each adds trust)
  if (profile.instagram) score += 12
  if (profile.linkedin) score += 15
  if (profile.strava) score += 8

  // Education and job filled (verifiable claims)
  if (profile.education) score += 8
  if (profile.company) score += 8
  if (profile.job) score += 5

  // Photo (if photo_url exists)
  if (profile.photoUrl || profile.photo_url || profile.avatar) score += 5

  score += (hashCode(seed) % 9) - 4
  return clamp(Math.round(score), 10, 98)
}

/**
 * NEWS AGENT (weight: 0.08)
 * External factors — location trends, seasonal patterns, market conditions
 */
function scoreNews(profile) {
  let score = 50
  const seed = profile.id + 'news'

  // Hot locations get a boost
  const hotLocations = ['San Francisco', 'New York', 'Los Angeles', 'Miami', 'Austin', 'Seattle', 'Chicago', 'Denver']
  if (profile.location) {
    const isHot = hotLocations.some(loc => profile.location.toLowerCase().includes(loc.toLowerCase()))
    if (isHot) score += 15
  }

  // Tech workers get seasonal boost
  const techJobs = ['engineer', 'developer', 'designer', 'product', 'data', 'software']
  if (profile.job) {
    const isTech = techJobs.some(j => profile.job.toLowerCase().includes(j))
    if (isTech) score += 8
  }

  // New listings get a novelty boost
  if (profile.totalVolume === 0 || !profile.totalVolume) score += 10

  score += (hashCode(seed) % 13) - 6
  return clamp(Math.round(score), 10, 98)
}

/**
 * Run all 9 AI agents on a profile and return scores.
 */
export function scoreProfile(profile) {
  const scorers = {
    intent: scoreIntent,
    social: scoreSocial,
    activity: scoreActivity,
    compatibility: scoreCompatibility,
    health: scoreHealth,
    market_maker: scoreMarketMaker,
    sentiment: scoreSentiment,
    trust: scoreTrust,
    news: scoreNews,
  }

  const agentScores = {}
  let compositeScore = 0

  for (const agent of AGENTS) {
    const scorer = scorers[agent.id]
    if (!scorer) continue

    const score = scorer(profile)
    const signal = getSignal(score)
    const trend = getTrend(score, profile.id + agent.id)

    agentScores[agent.id] = {
      score,
      signal,
      trend,
      confidence: clamp(0.5 + (score - 50) / 100, 0.2, 0.95),
      detail: generateDetail(agent.id, score, profile)
    }

    compositeScore += score * agent.weight
  }

  return {
    agentScores,
    compositeScore: Math.round(compositeScore)
  }
}

/**
 * Generate a human-readable detail string for each agent.
 */
function generateDetail(agentId, score, profile) {
  const details = {
    intent: score > 70
      ? `Strong dating intent detected. Profile shows genuine interest in meaningful connections.`
      : score > 50
      ? `Moderate engagement signals. Profile could benefit from more detail.`
      : `Low intent signals. Limited profile information available.`,
    social: score > 70
      ? `Well-verified social presence. Multiple platforms connected and consistent.`
      : score > 50
      ? `Partial social verification. Consider connecting more accounts.`
      : `Limited social verification. Trust score could improve with more connections.`,
    activity: score > 70
      ? `Highly active user with consistent engagement patterns.`
      : score > 50
      ? `Moderate activity levels. Regular but not daily engagement.`
      : `Low activity detected. Engagement has been declining.`,
    compatibility: score > 70
      ? `Strong match potential. Diverse interests and clear preferences.`
      : score > 50
      ? `Moderate compatibility signals. Some preference alignment detected.`
      : `Limited compatibility data. More information needed for accurate matching.`,
    health: score > 70
      ? `Active fitness lifestyle confirmed via connected health apps.`
      : score > 50
      ? `Some health-positive signals detected from interests.`
      : `No fitness data available. Consider connecting Strava.`,
    market_maker: score > 70
      ? `Healthy market dynamics. Organic price discovery with balanced trading.`
      : score > 50
      ? `Moderate market health. Some concentration in trading patterns.`
      : `Low liquidity. Market needs more participants for fair pricing.`,
    sentiment: score > 70
      ? `Bio conveys warmth, authenticity, and positive energy.`
      : score > 50
      ? `Neutral tone detected. Bio could be more engaging.`
      : `Bio tone may need improvement. Consider a warmer, more authentic approach.`,
    trust: score > 70
      ? `High trust score. Multiple verification points confirmed.`
      : score > 50
      ? `Moderate trust level. Additional verification would improve score.`
      : `Low verification. Connecting LinkedIn and Instagram recommended.`,
    news: score > 70
      ? `Favorable external factors. Location and timing trends are positive.`
      : score > 50
      ? `Neutral market conditions. No major external factors detected.`
      : `Some headwinds detected. Market conditions may affect valuation.`,
  }

  return details[agentId] || `Score: ${score}/100`
}

/**
 * Score all profiles and return them with agent scores attached.
 */
export function scoreAllProfiles(profiles) {
  return profiles.map(profile => {
    // If profile already has agentScores, keep them (from DB)
    if (profile.agentScores && Object.keys(profile.agentScores).length > 0) {
      return profile
    }

    // Otherwise, compute scores
    const { agentScores, compositeScore } = scoreProfile(profile)
    return {
      ...profile,
      agentScores,
      compositeScore,
    }
  })
}

/**
 * Calculate the price for a profile based on agent scores and demand.
 * PRICE = UserDemand × 0.40 + AgentScores × 0.60 + Momentum - Decay
 */
export function calculatePrice(profile) {
  const { compositeScore } = scoreProfile(profile)

  const demandScore = profile.demandScore || profile.bankOfUsers?.demandScore || 50
  const userDemand = demandScore // 0-100

  // Base price from formula
  const basePrice = (userDemand * 0.40 + compositeScore * 0.60) * 2 // Scale to ~$100-200 range

  // Momentum: recent price trend
  let momentum = 0
  if (profile.priceHistory && profile.priceHistory.length > 2) {
    const recent = profile.priceHistory.slice(-3)
    momentum = (recent[2] - recent[0]) / recent[0] * 10
  }

  // Decay: penalize inactive profiles
  const decay = 0 // Would use timestamp comparison in production

  const finalPrice = Math.max(10, Math.round((basePrice + momentum - decay) * 100) / 100)
  return finalPrice
}
