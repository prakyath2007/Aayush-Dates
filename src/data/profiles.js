export const PROFILES = [
  {
    id: 'sarah-chen',
    name: 'Sarah Chen',
    age: 26,
    tagline: 'Building products by day, exploring by night',
    job: 'Senior Product Manager',
    company: 'Stripe',
    education: 'Stanford MBA',
    location: 'San Francisco, CA',
    height: "5'7\"",
    weight: '130 lbs',
    ethnicity: 'East Asian',
    religion: 'Spiritual',
    interests: ['Hiking', 'Coffee', 'Startups', 'Photography', 'Yoga', 'Travel'],
    lookingFor: 'Long-term relationship',
    bio: 'Stanford MBA turned PM at Stripe. Obsessed with great product design and even better coffee. Weekend hiker, photography enthusiast, and apparently very good at talking about startups (ask me anything). Looking for someone who can appreciate a well-crafted user experience both in apps and in life. Not into games—literally or figuratively.',
    verified: true,
    connectedApps: ['instagram', 'linkedin', 'strava'],
    avatar: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

    currentPrice: 167.32,
    priceChange: 1.47,
    priceChangePct: 0.89,
    allTimeHigh: 167.32,
    allTimeLow: 124.50,
    marketCap: '31.6K',
    volume24h: 189,

    priceHistory: [124.5, 126.2, 125.8, 128.4, 130.1, 132.5, 131.2, 134.8, 136.5, 138.2, 139.1, 141.3, 143.5, 142.8, 145.2, 147.1, 148.9, 150.2, 152.1, 154.5, 156.3, 157.8, 159.2, 161.5, 162.8, 164.2, 165.1, 166.3, 167.0, 167.32],
    volumeHistory: [45, 52, 48, 61, 55, 72, 68, 85, 79, 91, 88, 102, 115, 98, 121, 134, 127, 142, 156, 168, 175, 182, 188, 195, 201, 208, 214, 219, 224, 189],

    agentScores: {
      intent: { score: 91, signal: 'BUY', trend: 4.2, detail: 'Quick response times, thoughtful messages, shows genuine interest in deeper connections.' },
      social: { score: 87, signal: 'BUY', trend: 1.1, detail: 'Consistent across Instagram (15K followers), LinkedIn (Stanford alumni verified), Strava active.' },
      activity: { score: 78, signal: 'BUY', trend: -2.8, detail: 'Daily app usage, responsive to matches. Slight engagement decay over past week—likely busy at work.' },
      compatibility: { score: 83, signal: 'BUY', trend: 0.5, detail: 'States "long-term" but behavior shows casual dating experience. Aligns well with goal-oriented matches.' },
      health: { score: 72, signal: 'HOLD', trend: 0, detail: 'Strava shows consistent yoga and hiking. No recent intense fitness activity—moderate lifestyle.' },
      market_maker: { score: 95, signal: 'BUY', trend: 1.0, detail: 'Organic price discovery. No whale concentration. Fair and healthy market participation.' },
      sentiment: { score: 89, signal: 'BUY', trend: 2.1, detail: 'Bio tone is warm, authentic, slightly witty. Messages show emotional intelligence and humor.' },
      trust: { score: 94, signal: 'BUY', trend: 0, detail: 'Stanford verified, Stripe employment confirmed, photo authenticity high. Fully verified profile.' },
      news: { score: 76, signal: 'HOLD', trend: 3.5, detail: 'SF tech scene attracts high-value profiles. Seasonal uptrend for educated professionals.' }
    },

    bankOfUsers: {
      totalLongs: 189,
      totalShorts: 23,
      demandScore: 88,
      uniqueViewers: 412,
      conversionRate: 45.9,
      avgHoldTime: '4.2 days',
      whaleConcentration: 3.2
    }
  },

  {
    id: 'marcus-johnson',
    name: 'Marcus Johnson',
    age: 28,
    tagline: 'Engineer by day, bassist by night',
    job: 'Senior Software Engineer',
    company: 'Apple',
    education: 'Georgia Tech',
    location: 'Cupertino, CA',
    height: "6'1\"",
    weight: '185 lbs',
    ethnicity: 'African American',
    religion: 'Non-religious',
    interests: ['Music', 'Gaming', 'Basketball', 'Tech', 'Cooking', 'Vinyl Records'],
    lookingFor: 'Casual to serious',
    bio: 'Apple engineer working on cool stuff I can\'t talk about. Bass player in an indie band—we actually have Spotify followers (barely). Love cooking elaborate meals that probably taste better than they look. Basketball court is my second office. Looking for someone who appreciates good music, better food, and can beat me at Elden Ring.',
    verified: true,
    connectedApps: ['instagram', 'spotify'],
    avatar: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',

    currentPrice: 145.78,
    priceChange: -0.82,
    priceChangePct: -0.56,
    allTimeHigh: 152.43,
    allTimeLow: 118.20,
    marketCap: '28.9K',
    volume24h: 156,

    priceHistory: [135.2, 136.8, 138.1, 139.5, 140.2, 141.5, 140.8, 142.1, 143.8, 144.2, 145.9, 147.1, 148.5, 149.2, 150.1, 151.8, 152.43, 151.5, 150.2, 149.1, 148.3, 147.5, 146.8, 146.1, 145.5, 145.9, 145.2, 146.0, 145.9, 145.78],
    volumeHistory: [38, 42, 45, 49, 52, 58, 55, 62, 68, 72, 78, 85, 91, 95, 102, 108, 115, 112, 109, 105, 101, 98, 94, 91, 88, 92, 89, 93, 95, 156],

    agentScores: {
      intent: { score: 74, signal: 'HOLD', trend: -3.1, detail: 'Moderate response times. Messages are friendly but less intentional than power users. Seems open but not actively seeking.' },
      social: { score: 81, signal: 'BUY', trend: 0.8, detail: 'Strong Instagram presence (12K followers, musician posts), Spotify verified, Apple employment visible on LinkedIn.' },
      activity: { score: 84, signal: 'BUY', trend: 1.4, detail: 'Consistent daily usage, solid engagement rate. Slightly more active on weekends (band practice schedule?).' },
      compatibility: { score: 72, signal: 'HOLD', trend: -1.2, detail: 'Says "casual to serious" but behavior leans casual. Has swiped left on serious-only profiles multiple times.' },
      health: { score: 68, signal: 'HOLD', trend: 0.3, detail: 'Basketball 2-3x week but inconsistent. No recent serious fitness goals tracked.' },
      market_maker: { score: 82, signal: 'BUY', trend: -0.5, detail: 'Stable price action. Some volatility from weekend activity spikes but healthy market fundamentals.' },
      sentiment: { score: 85, signal: 'BUY', trend: 1.6, detail: 'Bio shows humor and self-awareness. Messages are warm and engaging. Positive overall tone.' },
      trust: { score: 88, signal: 'BUY', trend: 0, detail: 'Georgia Tech verified, Apple employment confirmed. Photo authenticity good. Minor concern: profile older than 6 months.' },
      news: { score: 68, signal: 'HOLD', trend: -2.3, detail: 'Tech scene saturation in Cupertino means moderate demand. Musician profiles trending up but niche appeal.' }
    },

    bankOfUsers: {
      totalLongs: 156,
      totalShorts: 34,
      demandScore: 71,
      uniqueViewers: 298,
      conversionRate: 38.2,
      avgHoldTime: '3.1 days',
      whaleConcentration: 2.8
    }
  },

  {
    id: 'elena-rodriguez',
    name: 'Elena Rodriguez',
    age: 24,
    tagline: 'Designing dreams, one pixel at a time',
    job: 'Senior UX Designer',
    company: 'Figma',
    education: 'RISD',
    location: 'New York, NY',
    height: "5'5\"",
    weight: '118 lbs',
    ethnicity: 'Latina',
    religion: 'Catholic',
    interests: ['Design', 'Art', 'Museums', 'Indie Films', 'Wine Tasting', 'Traveling'],
    lookingFor: 'Serious relationship',
    bio: 'RISD grad now designing the future at Figma. I spend my days making digital experiences beautiful and my nights getting lost in museums and indie films. Wine enthusiast (no, not a snob—I just have preferences). Art is my love language. Looking for someone who gets that design is everywhere, including in how we build relationships. Bonus points if you can discuss color theory without me wanting to scream.',
    verified: true,
    connectedApps: ['instagram', 'linkedin', 'behance'],
    avatar: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',

    currentPrice: 182.45,
    priceChange: 3.21,
    priceChangePct: 1.79,
    allTimeHigh: 182.45,
    allTimeLow: 135.60,
    marketCap: '35.2K',
    volume24h: 267,

    priceHistory: [135.6, 138.2, 140.5, 143.1, 145.8, 148.2, 150.1, 152.5, 154.8, 157.2, 159.5, 161.8, 163.2, 165.1, 167.5, 169.8, 171.2, 173.5, 175.1, 176.8, 178.2, 179.5, 180.2, 181.1, 181.8, 182.1, 182.3, 182.4, 182.35, 182.45],
    volumeHistory: [52, 58, 62, 68, 75, 82, 88, 95, 102, 108, 115, 122, 128, 135, 142, 148, 155, 162, 168, 175, 181, 188, 194, 201, 208, 215, 221, 235, 251, 267],

    agentScores: {
      intent: { score: 94, signal: 'BUY', trend: 5.8, detail: 'Exceptionally high engagement. Thoughtful messages, quick responses, shows clear intent for serious dating.' },
      social: { score: 92, signal: 'BUY', trend: 2.4, detail: 'Strong Instagram (18K followers, design aesthetic), Behance portfolio verified, LinkedIn active. High credibility.' },
      activity: { score: 88, signal: 'BUY', trend: 3.2, detail: 'Consistently high daily engagement. Recent uptick suggests actively seeking serious connection. Best-in-class activity.' },
      compatibility: { score: 86, signal: 'BUY', trend: 1.8, detail: 'States serious intent and behavior matches perfectly. Shows preference for like-minded creatives and intellectuals.' },
      health: { score: 79, signal: 'BUY', trend: 0.9, detail: 'Regular yoga classes, museum walks (Strava). Balanced wellness approach. No extreme fitness pursuit.' },
      market_maker: { score: 93, signal: 'BUY', trend: 2.1, detail: 'Rapid price discovery with organic demand. No whale concentration. Hot demand driving healthy uptrend.' },
      sentiment: { score: 96, signal: 'BUY', trend: 3.3, detail: 'Bio is witty, thoughtful, and articulate. Messages show emotional depth and genuine communication style.' },
      trust: { score: 91, signal: 'BUY', trend: 0.2, detail: 'RISD verified, Figma employment confirmed, Behance portfolio authentic. Very high trust profile.' },
      news: { score: 84, signal: 'BUY', trend: 4.2, detail: 'NYC creative scene trending. Female designer profiles in high demand. Strong seasonal uptrend.' }
    },

    bankOfUsers: {
      totalLongs: 267,
      totalShorts: 18,
      demandScore: 95,
      uniqueViewers: 521,
      conversionRate: 68.3,
      avgHoldTime: '5.8 days',
      whaleConcentration: 1.2
    }
  },

  {
    id: 'james-park',
    name: 'James Park',
    age: 30,
    tagline: 'Serial entrepreneur, occasional golfer',
    job: 'Founder & CEO',
    company: 'Park Labs',
    education: 'MIT',
    location: 'Austin, TX',
    height: "5'11\"",
    weight: '178 lbs',
    ethnicity: 'Korean American',
    religion: 'Non-religious',
    interests: ['Startups', 'Golf', 'Science', 'Investing', 'Philosophy', 'Travel'],
    lookingFor: 'Long-term relationship',
    bio: 'MIT alum, 2x founder. Currently scaling Park Labs (we raised $12M Series A last year—obligatory humblebrag). I think deeply about problems most people ignore. Golf is my meditation. Philosophy nerd. Looking for an intellectual equal who doesn\'t take themselves too seriously. Warning: I work a lot, but I\'m present when I\'m present. If you\'re looking for someone to show up fully, that\'s me.',
    verified: true,
    connectedApps: ['linkedin', 'crunchbase'],
    avatar: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',

    currentPrice: 198.54,
    priceChange: 2.89,
    priceChangePct: 1.47,
    allTimeHigh: 198.54,
    allTimeLow: 142.10,
    marketCap: '39.8K',
    volume24h: 312,

    priceHistory: [142.1, 145.8, 148.5, 151.2, 154.1, 157.3, 160.2, 162.8, 165.5, 168.1, 170.8, 173.5, 176.2, 178.9, 181.5, 184.2, 186.8, 189.2, 191.5, 193.8, 195.2, 196.5, 197.1, 197.8, 198.2, 198.5, 198.4, 198.3, 198.2, 198.54],
    volumeHistory: [48, 55, 62, 68, 75, 82, 89, 96, 103, 110, 117, 124, 131, 138, 145, 152, 159, 166, 173, 180, 187, 194, 201, 208, 215, 222, 229, 245, 280, 312],

    agentScores: {
      intent: { score: 82, signal: 'BUY', trend: -1.5, detail: 'Good engagement but sometimes slow response (busy CEO). Shows genuine interest but availability varies.' },
      social: { score: 89, signal: 'BUY', trend: 0.6, detail: 'Strong LinkedIn presence (founder verification), Crunchbase profile, media mentions verified. Credible.' },
      activity: { score: 76, signal: 'HOLD', trend: -2.8, detail: 'Sporadic activity due to startup demands. When engaged, very engaged. Unpredictable patterns.' },
      compatibility: { score: 88, signal: 'BUY', trend: 1.1, detail: 'Seeks intellectual peer. Behavior shows preference for ambitious, educated women. Stated intent aligns well.' },
      health: { score: 81, signal: 'BUY', trend: 0.5, detail: 'Regular golf, occasional gym. Not obsessive but maintains baseline fitness. Balanced approach.' },
      market_maker: { score: 76, signal: 'HOLD', trend: 2.3, detail: 'Some volatility from unpredictable activity spikes. Status as "unicorn founder" creates whale concentration risk (8.1%).' },
      sentiment: { score: 84, signal: 'BUY', trend: 1.8, detail: 'Bio shows intellectual humor and self-awareness. Messages are thoughtful but sometimes brief (time constraint).' },
      trust: { score: 96, signal: 'BUY', trend: 0.3, detail: 'MIT verified, CEO verified via company filings, media profile confirms identity. Highest trust tier.' },
      news: { score: 88, signal: 'BUY', trend: 2.9, detail: 'Austin tech scene booming. Founder profiles in extreme demand. Series A news created significant bump.' }
    },

    bankOfUsers: {
      totalLongs: 312,
      totalShorts: 22,
      demandScore: 92,
      uniqueViewers: 684,
      conversionRate: 72.1,
      avgHoldTime: '6.2 days',
      whaleConcentration: 8.1
    }
  },

  {
    id: 'priya-patel',
    name: 'Priya Patel',
    age: 27,
    tagline: 'Data scientist, wellness enthusiast',
    job: 'Senior Data Scientist',
    company: 'Netflix',
    education: 'UC Berkeley',
    location: 'Los Angeles, CA',
    height: "5'6\"",
    weight: '125 lbs',
    ethnicity: 'Indian American',
    religion: 'Hindu',
    interests: ['Data Science', 'Yoga', 'Cooking', 'Travel', 'Meditation', 'Hiking'],
    lookingFor: 'Long-term relationship',
    bio: 'Berkeley alum building recommendation algorithms at Netflix. I like data because it doesn\'t lie—though context matters. Yoga and meditation are non-negotiable in my life. I cook elaborate Indian meals and believe food is culture. Looking for someone who appreciates depth—in conversations, in growth, in connections. Bonus if you can explain your own biases.',
    verified: true,
    connectedApps: ['instagram', 'linkedin', 'strava'],
    avatar: 'linear-gradient(135deg, #f77737 0%, #fdb462 100%)',

    currentPrice: 156.89,
    priceChange: 1.23,
    priceChangePct: 0.79,
    allTimeHigh: 160.12,
    allTimeLow: 128.45,
    marketCap: '30.4K',
    volume24h: 178,

    priceHistory: [128.45, 130.2, 132.5, 134.8, 136.5, 138.2, 140.1, 141.8, 143.5, 145.2, 147.1, 148.9, 150.5, 152.1, 153.8, 155.2, 156.5, 157.2, 158.1, 159.2, 160.12, 159.8, 159.2, 158.5, 157.8, 157.1, 156.5, 156.8, 156.9, 156.89],
    volumeHistory: [42, 48, 54, 61, 68, 75, 82, 88, 95, 102, 108, 115, 121, 128, 134, 141, 147, 154, 160, 167, 173, 179, 184, 189, 193, 196, 199, 201, 202, 178],

    agentScores: {
      intent: { score: 89, signal: 'BUY', trend: 2.4, detail: 'Very responsive, thoughtful messages. Shows clear intention for serious, meaningful connection.' },
      social: { score: 84, signal: 'BUY', trend: 1.2, detail: 'Instagram shows wellness focus (9K followers), LinkedIn verified, Strava active. Consistent authentic presence.' },
      activity: { score: 85, signal: 'BUY', trend: 1.9, detail: 'Daily consistent engagement. Evening messaging pattern (likely after work). Stable high activity.' },
      compatibility: { score: 81, signal: 'BUY', trend: 0.7, detail: 'Seeks intellectually aligned partner. Behavior shows preference for ambitious, introspective types.' },
      health: { score: 91, signal: 'BUY', trend: 2.1, detail: 'Exceptional: daily yoga logged, regular hiking, meditation tracked. Top-tier wellness commitment.' },
      market_maker: { score: 88, signal: 'BUY', trend: 1.3, detail: 'Stable price discovery. Organic demand growth. Fair market participation, no whale concentration.' },
      sentiment: { score: 92, signal: 'BUY', trend: 2.8, detail: 'Bio is thoughtful and articulate. Messages show emotional intelligence and depth of thinking.' },
      trust: { score: 92, signal: 'BUY', trend: 0.1, detail: 'Berkeley verified, Netflix employment confirmed, Strava profile authentic. High trust score.' },
      news: { score: 82, signal: 'BUY', trend: 1.6, detail: 'LA tech scene strong. Data scientist profiles trending. Wellness focus resonates with current market.' }
    },

    bankOfUsers: {
      totalLongs: 178,
      totalShorts: 21,
      demandScore: 84,
      uniqueViewers: 389,
      conversionRate: 52.1,
      avgHoldTime: '4.8 days',
      whaleConcentration: 2.1
    }
  },

  {
    id: 'alex-morgan',
    name: 'Alex Morgan',
    age: 25,
    tagline: 'Marketing strategy, weekend adventurer',
    job: 'Marketing Director',
    company: 'Nike',
    education: 'Northwestern',
    location: 'Portland, OR',
    height: "5'8\"",
    weight: '128 lbs',
    ethnicity: 'White/Mixed',
    religion: 'Agnostic',
    interests: ['Marketing', 'Hiking', 'Rock Climbing', 'Coffee Culture', 'Podcasts', 'Sustainability'],
    lookingFor: 'Serious relationship',
    bio: 'Northwestern marketing grad driving strategy at Nike. I believe in purposeful brands and purposeful living. Weekends = mountains (climbing, hiking, trail running). Coffee snob who actually makes good coffee. Sustainability matters to me—both in business and life. Looking for someone who\'s ambitious but not ambitious about the wrong things. Should enjoy long hikes and better conversations.',
    verified: true,
    connectedApps: ['instagram', 'linkedin'],
    avatar: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',

    currentPrice: 134.56,
    priceChange: -0.45,
    priceChangePct: -0.33,
    allTimeHigh: 138.90,
    allTimeLow: 105.20,
    marketCap: '26.1K',
    volume24h: 124,

    priceHistory: [105.2, 108.5, 111.2, 114.1, 117.5, 120.2, 122.8, 125.1, 127.5, 129.8, 131.5, 133.2, 134.8, 135.9, 136.8, 137.5, 138.9, 138.2, 137.5, 136.8, 136.1, 135.4, 135.1, 134.8, 134.6, 134.7, 134.5, 134.6, 134.5, 134.56],
    volumeHistory: [35, 40, 45, 50, 56, 62, 68, 74, 81, 87, 93, 99, 105, 111, 117, 123, 128, 125, 122, 119, 116, 113, 110, 108, 106, 107, 105, 106, 105, 124],

    agentScores: {
      intent: { score: 87, signal: 'BUY', trend: 1.8, detail: 'Good engagement and responsiveness. Shows clear intent for serious relationship building.' },
      social: { score: 79, signal: 'HOLD', trend: 0.4, detail: 'Instagram present (7K followers), LinkedIn verified. New profile (3 months)—lower historical data.' },
      activity: { score: 82, signal: 'BUY', trend: -0.5, detail: 'Strong engagement when active. Weekend-heavy pattern (outdoor schedule). Consistent but seasonal.' },
      compatibility: { score: 84, signal: 'BUY', trend: 0.9, detail: 'Seeks ambitious-but-balanced partner. Values sustainability and purpose. Clear preference alignment.' },
      health: { score: 88, signal: 'BUY', trend: 1.4, detail: 'Rock climbing and trail running logged regularly. Exceptional outdoor fitness. Top-tier wellness.' },
      market_maker: { score: 81, signal: 'BUY', trend: 0.2, detail: 'New profile = some discovery volatility. Fundamentals sound. Smaller whale concentration (3.8%).' },
      sentiment: { score: 86, signal: 'BUY', trend: 1.2, detail: 'Bio shows values-driven thinking. Messages are warm and authentic. Good emotional tone.' },
      trust: { score: 83, signal: 'BUY', trend: -0.2, detail: 'Northwestern verified, Nike employment confirmed. Newer profile means less verification history.' },
      news: { score: 75, signal: 'HOLD', trend: 0.8, detail: 'Portland tech/marketing scene moderate. Sustainability focus trending. New profile creates uncertainty.' }
    },

    bankOfUsers: {
      totalLongs: 124,
      totalShorts: 16,
      demandScore: 72,
      uniqueViewers: 267,
      conversionRate: 41.2,
      avgHoldTime: '3.4 days',
      whaleConcentration: 3.8
    }
  },

  {
    id: 'sophie-williams',
    name: 'Sophie Williams',
    age: 29,
    tagline: 'Doctor who believes in work-life balance',
    job: 'Emergency Medicine Physician',
    company: 'Mass General',
    education: 'Johns Hopkins',
    location: 'Boston, MA',
    height: "5'9\"",
    weight: '142 lbs',
    ethnicity: 'White',
    religion: 'Christian',
    interests: ['Medicine', 'Painting', 'Reading', 'Cooking', 'Running', 'Volunteering'],
    lookingFor: 'Long-term relationship',
    bio: 'Johns Hopkins grad, Emergency Medicine physician at Mass General. I save lives during the day and paint badly at night (it\'s therapeutic). I believe in presence—when I\'m with you, I\'m really with you. Book lover, amateur chef, marathon runner. My schedule is chaotic but my values are clear: growth, authenticity, and showing up. Looking for someone who understands that saving lives makes you value life differently.',
    verified: true,
    connectedApps: ['instagram', 'strava'],
    avatar: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',

    currentPrice: 175.42,
    priceChange: 0.88,
    priceChangePct: 0.50,
    allTimeHigh: 178.91,
    allTimeLow: 145.30,
    marketCap: '34.1K',
    volume24h: 201,

    priceHistory: [145.3, 147.8, 150.2, 152.5, 154.8, 157.1, 159.5, 161.2, 163.5, 165.8, 167.2, 169.5, 171.2, 172.8, 174.1, 175.5, 176.8, 177.5, 178.2, 178.91, 178.5, 177.8, 177.1, 176.5, 175.9, 175.5, 175.4, 175.3, 175.2, 175.42],
    volumeHistory: [48, 54, 61, 68, 75, 82, 89, 96, 103, 110, 117, 124, 131, 138, 145, 152, 159, 166, 173, 180, 187, 194, 201, 208, 215, 220, 224, 228, 231, 201],

    agentScores: {
      intent: { score: 92, signal: 'BUY', trend: 3.2, detail: 'Exceptionally high intent. Thoughtful engagement despite busy schedule. Shows serious relationship pursuit.' },
      social: { score: 86, signal: 'BUY', trend: 1.1, detail: 'Instagram present but lower activity (busy schedule), Strava verified with consistent runs. Authentic profile.' },
      activity: { score: 79, signal: 'HOLD', trend: -1.5, detail: 'Sporadic due to ER shift work. When active, highly engaged. Unpredictable but genuine patterns.' },
      compatibility: { score: 85, signal: 'BUY', trend: 0.8, detail: 'Seeks partner who understands demanding career. Values: growth, authenticity. Clear alignment markers.' },
      health: { score: 94, signal: 'BUY', trend: 2.1, detail: 'Marathon training logged, consistent runs on Strava. Exceptional fitness commitment and discipline.' },
      market_maker: { score: 87, signal: 'BUY', trend: 1.6, detail: 'Stable price discovery despite activity volatility. Organic demand growth. Healthy market dynamics.' },
      sentiment: { score: 91, signal: 'BUY', trend: 2.4, detail: 'Bio is warm, authentic, deeply thoughtful. Messages show emotional maturity and genuine connection-seeking.' },
      trust: { score: 95, signal: 'BUY', trend: 0.2, detail: 'Johns Hopkins verified, Mass General physician verification high. Medical license confirmed. Top tier trust.' },
      news: { score: 86, signal: 'BUY', trend: 2.8, detail: 'Healthcare professionals in high demand. Boston medical community prestige factor. Strong uptrend.' }
    },

    bankOfUsers: {
      totalLongs: 201,
      totalShorts: 19,
      demandScore: 86,
      uniqueViewers: 447,
      conversionRate: 58.7,
      avgHoldTime: '5.1 days',
      whaleConcentration: 2.3
    }
  },

  {
    id: 'ryan-kim',
    name: 'Ryan Kim',
    age: 26,
    tagline: 'VC analyst, coffee aficionado',
    job: 'Investment Associate',
    company: 'a16z',
    education: 'Wharton',
    location: 'San Francisco, CA',
    height: "5'10\"",
    weight: '170 lbs',
    ethnicity: 'Korean American',
    religion: 'Non-religious',
    interests: ['Venture Capital', 'Technology', 'Coffee', 'Reading', 'Golf', 'Traveling'],
    lookingFor: 'Serious relationship',
    bio: 'Wharton alum, a16z analyst evaluating tomorrow\'s unicorns. I believe the best investments are in people who challenge you. Coffee nerd (yes, there\'s a difference between coffee AND coffee). Avid reader of everything from startups to philosophy. Golf is where I think clearly. Looking for someone ambitious, intellectually curious, and comfortable with someone who thinks about markets and incentives probably too much.',
    verified: true,
    connectedApps: ['linkedin', 'instagram'],
    avatar: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

    currentPrice: 163.21,
    priceChange: 1.12,
    priceChangePct: 0.69,
    allTimeHigh: 167.89,
    allTimeLow: 129.75,
    marketCap: '31.8K',
    volume24h: 195,

    priceHistory: [129.75, 132.4, 135.1, 137.8, 140.5, 143.2, 145.8, 148.5, 151.1, 153.8, 156.2, 158.5, 160.8, 162.1, 163.5, 164.8, 165.9, 166.5, 167.1, 167.89, 167.5, 167.0, 166.5, 166.1, 165.6, 165.2, 164.8, 164.2, 163.5, 163.21],
    volumeHistory: [41, 47, 53, 59, 65, 72, 79, 86, 93, 100, 107, 114, 121, 128, 135, 142, 149, 156, 163, 170, 177, 184, 191, 197, 202, 207, 211, 214, 215, 195],

    agentScores: {
      intent: { score: 85, signal: 'BUY', trend: 1.5, detail: 'Good engagement, thoughtful messages. Shows genuine interest in serious relationship building.' },
      social: { score: 88, signal: 'BUY', trend: 0.9, detail: 'LinkedIn strong (venture capital credentials), Instagram present (10K followers), verified a16z connection.' },
      activity: { score: 83, signal: 'BUY', trend: 0.6, detail: 'Consistent engagement with some deal-driven busy periods. Active but strategic with time.' },
      compatibility: { score: 82, signal: 'BUY', trend: 0.4, detail: 'Seeks ambitious intellectual peer. Behavior shows preference for high-performing, curious partners.' },
      health: { score: 75, signal: 'HOLD', trend: 0.2, detail: 'Golf regularly but inconsistent gym schedule. Moderate fitness, not a primary focus.' },
      market_maker: { score: 85, signal: 'BUY', trend: 0.8, detail: 'Organic price discovery. Some volatility from deal cycles but fundamentals sound. Fair market.' },
      sentiment: { score: 88, signal: 'BUY', trend: 1.3, detail: 'Bio shows intellectual humor and self-awareness. Messages are warm and genuinely thoughtful.' },
      trust: { score: 93, signal: 'BUY', trend: 0.1, detail: 'Wharton verified, a16z employment confirmed via LinkedIn verification. High trust tier.' },
      news: { score: 79, signal: 'HOLD', trend: 0.5, detail: 'VC profile appeal moderate. SF tech scene strong. Similar profiles have more volatility.' }
    },

    bankOfUsers: {
      totalLongs: 195,
      totalShorts: 28,
      demandScore: 80,
      uniqueViewers: 421,
      conversionRate: 48.5,
      avgHoldTime: '4.5 days',
      whaleConcentration: 3.5
    }
  }
]
