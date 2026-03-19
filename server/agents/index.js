import { prisma } from '../utils/db.js';

/**
 * Agent: Intent - Evaluates profile completeness and engagement signals
 */
const intent = {
  evaluate(profile, context) {
    let score = 0;
    let details = [];

    // Bio length (0-30 points)
    const bioLength = profile.bio ? profile.bio.length : 0;
    const bioScore = Math.min(30, (bioLength / 500) * 30);
    score += bioScore;
    if (bioScore < 10) details.push('Incomplete bio');

    // Photos count (0-30 points)
    const photoCount = profile.photos ? profile.photos.length : 0;
    const photoScore = Math.min(30, (photoCount / 5) * 30);
    score += photoScore;
    if (photoCount < 2) details.push('Few photos');

    // Interests count (0-25 points)
    const interestCount = profile.interests ? profile.interests.length : 0;
    const interestScore = Math.min(25, (interestCount / 10) * 25);
    score += interestScore;
    if (interestCount < 3) details.push('Few interests');

    // Profile filled fields (0-15 points)
    const filledFields = [
      profile.education,
      profile.occupation,
      profile.location,
      profile.age,
    ].filter(Boolean).length;
    const fieldScore = (filledFields / 4) * 15;
    score += fieldScore;

    const signal = score >= 75 ? 'BUY' : score >= 50 ? 'HOLD' : 'SELL';
    const trend = bioScore > 20 && photoScore > 20 ? 'UP' : 'STABLE';
    const confidence = Math.min(95, 50 + (bioLength / 1000) * 45);

    return {
      score: Math.round(score),
      signal,
      trend,
      confidence: Math.round(confidence),
      details: details.length > 0 ? details : ['Profile well-maintained'],
    };
  },
};

/**
 * Agent: Social - Evaluates connected apps and social reach
 */
const social = {
  evaluate(profile, context) {
    let score = 40; // Base score
    let details = [];

    // Connected apps (each ~25 points, up to 75 total)
    const connectedApps = [];
    if (profile.instagramHandle) connectedApps.push('Instagram');
    if (profile.linkedinUrl) connectedApps.push('LinkedIn');
    if (profile.stravaId) connectedApps.push('Strava');
    if (profile.spotifyHandle) connectedApps.push('Spotify');

    const appScore = connectedApps.length * 15;
    score += Math.min(appScore, 60);

    if (connectedApps.length === 0) {
      score = 25;
      details.push('No social connections');
    } else {
      details.push(`Connected: ${connectedApps.join(', ')}`);
    }

    // Cross-platform bonus (high diversity = better)
    if (connectedApps.length >= 3) {
      score = Math.min(100, score + 10);
      details.push('Multi-platform presence');
    }

    const signal = score >= 75 ? 'BUY' : score >= 50 ? 'HOLD' : 'SELL';
    const trend = connectedApps.length > 2 ? 'UP' : 'STABLE';
    const confidence = 60 + connectedApps.length * 10;

    return {
      score: Math.min(100, score),
      signal,
      trend,
      confidence: Math.min(95, confidence),
      details,
    };
  },
};

/**
 * Agent: Activity - Evaluates recent profile updates and trading volume
 */
const activity = {
  evaluate(profile, context) {
    let score = 50;
    let details = [];

    // Recent profile update (within 7 days = +20 points)
    const now = new Date();
    const lastUpdated = profile.updatedAt ? new Date(profile.updatedAt) : null;
    const daysSinceUpdate = lastUpdated
      ? Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24))
      : null;

    if (daysSinceUpdate !== null) {
      if (daysSinceUpdate <= 7) {
        score += 20;
        details.push(`Updated ${daysSinceUpdate} days ago`);
      } else if (daysSinceUpdate <= 30) {
        score += 10;
        details.push(`Updated ${daysSinceUpdate} days ago`);
      } else {
        score -= 10;
        details.push('Profile outdated');
      }
    }

    // Trading volume (context.volume24h)
    const volume = context.volume24h || 0;
    if (volume > 100000) {
      score += 20;
      details.push(`High volume: $${volume.toLocaleString()}`);
    } else if (volume > 10000) {
      score += 10;
      details.push(`Good volume: $${volume.toLocaleString()}`);
    } else if (volume === 0) {
      score -= 15;
      details.push('No recent trades');
    }

    // Recent trades count
    const recentTrades = context.recentTrades || 0;
    if (recentTrades > 5) {
      score += 15;
      details.push(`${recentTrades} trades in 24h`);
    }

    const signal = score >= 70 ? 'BUY' : score >= 45 ? 'HOLD' : 'SELL';
    const trend = volume > 50000 ? 'UP' : 'STABLE';
    const confidence = 70 + Math.min(20, volume / 10000);

    return {
      score: Math.min(100, Math.max(0, score)),
      signal,
      trend,
      confidence: Math.min(95, confidence),
      details: details.length > 0 ? details : ['Normal activity'],
    };
  },
};

/**
 * Agent: Compatibility - Evaluates match potential (stub for now)
 */
const compatibility = {
  evaluate(profile, context) {
    // Without real user data, this is probabilistic
    const baseScore = 45;
    const variance = Math.random() * 30;
    const score = Math.min(100, baseScore + variance);

    // Simple heuristics based on profile spread
    const interests = profile.interests ? profile.interests.length : 0;
    const bonus = interests > 8 ? 15 : interests > 5 ? 8 : 0;
    const finalScore = Math.min(100, score + bonus);

    const signal = finalScore >= 75 ? 'BUY' : finalScore >= 55 ? 'HOLD' : 'SELL';
    const trend = 'NEUTRAL';
    const confidence = 45 + Math.random() * 20;

    return {
      score: Math.round(finalScore),
      signal,
      trend,
      confidence: Math.round(confidence),
      details: ['Compatibility depends on user preferences'],
    };
  },
};

/**
 * Agent: Health - Evaluates fitness/wellness indicators
 */
const health = {
  evaluate(profile, context) {
    let score = 50;
    let details = [];

    // Strava connection (+30)
    if (profile.stravaId) {
      score += 30;
      details.push('Strava connected (fitness tracker)');
    }

    // Fitness keywords in interests/bio
    const combinedText =
      `${profile.bio || ''} ${(profile.interests || []).join(' ')}`.toLowerCase();
    const fitnessKeywords = [
      'yoga',
      'gym',
      'fitness',
      'running',
      'hiking',
      'cycling',
      'pilates',
      'crossfit',
      'sports',
    ];
    const fitnessMatches = fitnessKeywords.filter((kw) =>
      combinedText.includes(kw)
    ).length;

    if (fitnessMatches > 0) {
      score += Math.min(25, fitnessMatches * 8);
      details.push(`${fitnessMatches} fitness interests`);
    } else {
      details.push('Limited fitness indicators');
    }

    // Wellness keywords
    const wellnessKeywords = ['meditation', 'wellness', 'nutrition', 'sleep'];
    const wellnessMatches = wellnessKeywords.filter((kw) =>
      combinedText.includes(kw)
    ).length;

    if (wellnessMatches > 0) {
      score += wellnessMatches * 5;
      details.push(`${wellnessMatches} wellness interests`);
    }

    const signal = score >= 75 ? 'BUY' : score >= 50 ? 'HOLD' : 'SELL';
    const trend = fitnessMatches > 2 ? 'UP' : 'STABLE';
    const confidence = 65 + fitnessMatches * 5;

    return {
      score: Math.min(100, score),
      signal,
      trend,
      confidence: Math.min(95, confidence),
      details,
    };
  },
};

/**
 * Agent: MarketMaker - Detects market manipulation
 */
const market_maker = {
  evaluate(profile, context) {
    let score = 70; // Start optimistic
    let details = [];

    const totalLongs = context.totalLongs || 0;
    const totalShorts = context.totalShorts || 0;
    const totalTrades = totalLongs + totalShorts;

    if (totalTrades === 0) {
      score = 60;
      details.push('No trades yet');
    } else {
      const ratio = totalLongs / (totalShorts || 1);

      // Check for extreme ratios
      if (ratio > 10 || ratio < 0.1) {
        score -= 30;
        details.push(`Extreme ratio detected: ${ratio.toFixed(2)}:1`);
      } else if (ratio > 5 || ratio < 0.2) {
        score -= 15;
        details.push(`High ratio: ${ratio.toFixed(2)}:1`);
      } else {
        score += 15;
        details.push(`Healthy ratio: ${ratio.toFixed(2)}:1`);
      }

      // Higher volume = more stable
      if (totalTrades > 1000) {
        score += 10;
      }
    }

    const signal = score >= 70 ? 'BUY' : score >= 50 ? 'HOLD' : 'SELL';
    const trend = totalTrades > 500 ? 'UP' : 'STABLE';
    const confidence = Math.min(90, 60 + totalTrades / 100);

    return {
      score: Math.min(100, Math.max(0, score)),
      signal,
      trend,
      confidence: Math.round(confidence),
      details,
    };
  },
};

/**
 * Agent: Sentiment - Analyzes bio text for sentiment
 */
const sentiment = {
  evaluate(profile, context) {
    let score = 50;
    const details = [];

    const bio = profile.bio || '';
    const bioLength = bio.length;

    // Length bonus (longer = more engaged)
    if (bioLength > 500) {
      score += 20;
      details.push('Detailed bio');
    } else if (bioLength > 200) {
      score += 10;
      details.push('Moderate bio length');
    } else if (bioLength > 50) {
      score += 5;
    } else {
      score -= 10;
      details.push('Short bio');
    }

    // Positivity keywords
    const positiveKeywords = [
      'love',
      'happy',
      'joy',
      'amazing',
      'wonderful',
      'adventure',
      'passion',
      'creative',
      'laugh',
      'fun',
      'positive',
      'smile',
    ];
    const positiveMatches = positiveKeywords.filter((kw) =>
      bio.toLowerCase().includes(kw)
    ).length;

    // Negativity keywords
    const negativeKeywords = [
      'hate',
      'angry',
      'sad',
      'depressed',
      'miserable',
      'toxic',
      'drama',
    ];
    const negativeMatches = negativeKeywords.filter((kw) =>
      bio.toLowerCase().includes(kw)
    ).length;

    score += positiveMatches * 8;
    score -= negativeMatches * 10;

    if (positiveMatches > 2) {
      details.push('Positive tone');
    }
    if (negativeMatches > 0) {
      details.push('Negative keywords detected');
    }

    const signal = score >= 75 ? 'BUY' : score >= 50 ? 'HOLD' : 'SELL';
    const trend = positiveMatches > negativeMatches ? 'UP' : 'STABLE';
    const confidence = Math.min(90, 50 + bioLength / 100);

    return {
      score: Math.min(100, Math.max(0, score)),
      signal,
      trend,
      confidence: Math.round(confidence),
      details: details.length > 0 ? details : ['Neutral sentiment'],
    };
  },
};

/**
 * Agent: Trust - Evaluates profile authenticity and verification
 */
const trust = {
  evaluate(profile, context) {
    let score = 50;
    const details = [];

    // Connected apps (each +10 trust points)
    const connectedApps = [
      profile.instagramHandle,
      profile.linkedinUrl,
      profile.stravaId,
    ].filter(Boolean).length;
    score += connectedApps * 10;

    // Profile age (days since creation)
    const createdAt = profile.createdAt ? new Date(profile.createdAt) : null;
    if (createdAt) {
      const now = new Date();
      const daysOld = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

      if (daysOld > 180) {
        score += 20;
        details.push(`Long-standing profile (${daysOld} days)`);
      } else if (daysOld > 30) {
        score += 10;
        details.push(`Established profile (${daysOld} days)`);
      } else if (daysOld < 7) {
        score -= 15;
        details.push('New profile');
      }
    }

    // Filled profile fields
    const filledFields = [
      profile.education,
      profile.occupation,
      profile.verified,
      profile.photos && profile.photos.length > 0,
    ].filter(Boolean).length;
    score += filledFields * 8;

    // Verification badge
    if (profile.verified) {
      score += 15;
      details.push('Verified user');
    }

    // Photo verification
    if (profile.photos && profile.photos.length >= 3) {
      score += 10;
      details.push('Multiple photos');
    }

    const signal = score >= 75 ? 'BUY' : score >= 55 ? 'HOLD' : 'SELL';
    const trend = profile.verified ? 'UP' : 'STABLE';
    const confidence = Math.min(95, 60 + connectedApps * 10);

    return {
      score: Math.min(100, Math.max(0, score)),
      signal,
      trend,
      confidence: Math.round(confidence),
      details: details.length > 0 ? details : ['Moderate trust level'],
    };
  },
};

/**
 * Agent: News - External market dynamics and seasonal trends
 */
const news = {
  evaluate(profile, context) {
    let score = 60;
    const details = [];

    // Seasonal boost (summer = dating market boom)
    const month = new Date().getMonth();
    if (month >= 4 && month <= 8) {
      score += 15;
      details.push('Summer dating season boost');
    } else if (month === 11 || month === 0) {
      score += 10;
      details.push('Holiday season dating uptick');
    }

    // Random market dynamics (simulated trending)
    const trendingBoost = Math.random() * 20;
    score += trendingBoost;

    // Market volatility indicator (simulate with random range)
    const volatility = Math.random() * 0.3 + 0.7;
    const adjustedScore = score * volatility;

    // Profile age news boost (older = "vintage"/interesting)
    if (
      profile.createdAt &&
      new Date(profile.createdAt).getTime() < Date.now() - 90 * 24 * 60 * 60 * 1000
    ) {
      details.push('Veteran profile (stable investment)');
    }

    const signal = adjustedScore >= 75 ? 'BUY' : adjustedScore >= 50 ? 'HOLD' : 'SELL';
    const trend = trendingBoost > 10 ? 'UP' : 'STABLE';
    const confidence = Math.min(85, 50 + Math.random() * 30);

    return {
      score: Math.round(Math.min(100, adjustedScore)),
      signal,
      trend,
      confidence: Math.round(confidence),
      details: details.length > 0 ? details : ['Market dynamics neutral'],
    };
  },
};

/**
 * All 9 agents exported
 */
const agents = {
  intent,
  social,
  activity,
  compatibility,
  health,
  market_maker,
  sentiment,
  trust,
  news,
};

/**
 * Evaluate all agents for a profile
 * @param {Object} profile - Profile object from database
 * @param {Object} context - Trade context (volume24h, recentTrades, totalLongs, totalShorts, etc.)
 * @returns {Object} - { [agentId]: { score, signal, trend, confidence, details } }
 */
export function evaluateAllAgents(profile, context = {}) {
  const results = {};

  Object.entries(agents).forEach(([agentId, agent]) => {
    results[agentId] = agent.evaluate(profile, context);
  });

  return results;
}

export { agents };
