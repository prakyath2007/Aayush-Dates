export const AGENTS = [
  {
    id: 'intent',
    name: 'Intent Agent',
    shortName: 'Intent',
    domain: 'Engagement Quality',
    weight: 0.18,
    color: '#ff2d78',
    icon: 'zap',
    description: 'Analyzes response times, message quality, and conversation depth to gauge genuine dating intent and engagement level.'
  },
  {
    id: 'social',
    name: 'Social Agent',
    shortName: 'Social',
    domain: 'Social Presence',
    weight: 0.12,
    color: '#00d4ff',
    icon: 'share-2',
    description: 'Verifies Instagram, LinkedIn, and web presence authenticity. Cross-references profiles for consistency and legitimacy.'
  },
  {
    id: 'activity',
    name: 'Activity Agent',
    shortName: 'Activity',
    domain: 'User Engagement',
    weight: 0.15,
    color: '#00ff88',
    icon: 'activity',
    description: 'Tracks in-app engagement metrics including swipes, messages, and time spent. Detects inactivity decay and engagement trends.'
  },
  {
    id: 'compatibility',
    name: 'Compatibility Agent',
    shortName: 'Compatibility',
    domain: 'Preference Alignment',
    weight: 0.14,
    color: '#a855f7',
    icon: 'heart',
    description: 'Cross-checks stated preferences against actual behavior patterns to identify genuine matches vs. fantasy preferences.'
  },
  {
    id: 'health',
    name: 'Health Agent',
    shortName: 'Health',
    domain: 'Lifestyle Verification',
    weight: 0.08,
    color: '#ff8c00',
    icon: 'heart-pulse',
    description: 'Verifies lifestyle claims through Strava, fitness apps, and wellness data. Assesses health-conscious behavior patterns.'
  },
  {
    id: 'market_maker',
    name: 'Market Maker Agent',
    shortName: 'Market',
    domain: 'Market Integrity',
    weight: 0.10,
    color: '#ffd700',
    icon: 'trending-up',
    description: 'Detects whale manipulation, pump-and-dump schemes, and artificial volatility. Ensures fair market pricing and transparency.'
  },
  {
    id: 'sentiment',
    name: 'Sentiment Agent',
    shortName: 'Sentiment',
    domain: 'Tone Analysis',
    weight: 0.08,
    color: '#22d3ee',
    icon: 'smile',
    description: 'Performs NLP analysis on bio text and messages to detect tone, positivity, and emotional maturity indicators.'
  },
  {
    id: 'trust',
    name: 'Trust Agent',
    shortName: 'Trust',
    domain: 'Verification Status',
    weight: 0.07,
    color: '#818cf8',
    icon: 'shield-check',
    description: 'Verifies education, employment, and photo authenticity. Maintains trust score based on identity verification level.'
  },
  {
    id: 'news',
    name: 'News Agent',
    shortName: 'News',
    domain: 'Market Dynamics',
    weight: 0.08,
    color: '#f472b6',
    icon: 'newspaper',
    description: 'Monitors external trends, dating market dynamics, and seasonal patterns. Identifies emerging opportunities and risks.'
  }
]
