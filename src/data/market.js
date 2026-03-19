export const TOKEN_CONFIG = {
  dailyAllocation: 500,
  longCost: 100,
  shortCost: 100,
  maxPerPerson: 300,
  dividendRate: 0.05
}

export const MARKET_NEWS = [
  {
    id: 'news-1',
    type: 'trending',
    headline: 'Tech founders see 23% price surge this week',
    detail: 'Demand for engineer and founder profiles hitting all-time high. Series A news cycles correlate with 12% premium.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    icon: 'trending-up'
  },
  {
    id: 'news-2',
    type: 'alert',
    headline: 'Whale alert: 3 accounts control 18% of James Park token',
    detail: 'Concentration risk detected. Consider diversification. Market Maker agent raised concern.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    icon: 'alert-triangle'
  },
  {
    id: 'news-3',
    type: 'insight',
    headline: 'Healthcare professionals trending bullish',
    detail: 'Physicians and nurses see +8.4% avg price growth YTD. Supply scarcity driving demand.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    icon: 'bar-chart-2'
  },
  {
    id: 'news-4',
    type: 'trending',
    headline: 'Designer tokens outperform engineers 2:1',
    detail: 'Creative profile premiums expanding. Elena Rodriguez token hits all-time high.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    icon: 'trending-up'
  },
  {
    id: 'news-5',
    type: 'insight',
    headline: 'Verified profiles show 34% lower volatility',
    detail: 'Trust agent data reveals verification status correlates strongly with price stability.',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    icon: 'shield-check'
  },
  {
    id: 'news-6',
    type: 'alert',
    headline: 'Seasonal surge: Spring dating market expanding fast',
    detail: 'Historical patterns show 15-20% market expansion March-May. New supply increasing.',
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
    icon: 'calendar'
  },
  {
    id: 'news-7',
    type: 'trending',
    headline: 'West Coast vs East Coast: geographic arbitrage?',
    detail: 'SF/LA profiles command 8-12% premium. Boston/NYC profiles see increased demand.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    icon: 'map'
  },
  {
    id: 'news-8',
    type: 'insight',
    headline: 'Wellness profiles in unprecedented demand',
    detail: 'Fitness-focused, yoga, meditation habits correlate with +6.2% price premium.',
    timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000),
    icon: 'heart'
  }
]

export const COMMUNITIES = [
  {
    id: 'community-1',
    name: 'Tech Alliance',
    members: 1247,
    sentiment: 'bullish',
    topPick: 'elena-rodriguez',
    totalVolume: 15420,
    description: 'Engineers, PMs, designers, and founders trading with each other'
  },
  {
    id: 'community-2',
    name: 'Healthcare Collective',
    members: 584,
    sentiment: 'bullish',
    topPick: 'sophie-williams',
    totalVolume: 8932,
    description: 'Doctors, nurses, and health-focused traders'
  },
  {
    id: 'community-3',
    name: 'Founders\' Table',
    members: 312,
    sentiment: 'bullish',
    topPick: 'james-park',
    totalVolume: 12156,
    description: 'Founders, VCs, and serial entrepreneurs'
  },
  {
    id: 'community-4',
    name: 'Creative Minds',
    members: 678,
    sentiment: 'bullish',
    topPick: 'elena-rodriguez',
    totalVolume: 9387,
    description: 'Designers, artists, and creative professionals'
  }
]

export const COUPLES_MARKET = [
  {
    id: 'couple-1',
    pair: {
      profile1: 'elena-rodriguez',
      profile2: 'james-park'
    },
    probability: 0.68,
    odds: '1.47x',
    reasoning: 'High compatibility scores, both intellectual, ambitious. Both seek serious relationships.'
  },
  {
    id: 'couple-2',
    pair: {
      profile1: 'sarah-chen',
      profile2: 'ryan-kim'
    },
    probability: 0.62,
    odds: '1.61x',
    reasoning: 'SF tech scene alignment, similar education level, complementary interests.'
  },
  {
    id: 'couple-3',
    pair: {
      profile1: 'priya-patel',
      profile2: 'marcus-johnson'
    },
    probability: 0.55,
    odds: '1.82x',
    reasoning: 'Wellness interest overlap, LA/SF proximity, mutual growth orientation.'
  }
]
