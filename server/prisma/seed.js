// ============================================================================
// Database Seed — Creates mock profiles for development
// ============================================================================
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'

const prisma = new PrismaClient()

const AGENT_IDS = ['intent', 'social', 'activity', 'compatibility', 'health', 'market_maker', 'sentiment', 'trust', 'news']

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

function randomSignal(score) {
  if (score >= 70) return 'BUY'
  if (score <= 35) return 'SELL'
  return 'HOLD'
}

function generatePriceHistory(basePrice, days = 30) {
  const history = []
  let price = basePrice * 0.8 // Start lower
  const now = new Date()

  for (let i = days; i >= 0; i--) {
    const change = (Math.random() - 0.45) * 8 // Slight upward bias
    price = Math.max(20, Math.min(400, price + change))
    history.push({
      price: Math.round(price * 100) / 100,
      volume: Math.floor(randomBetween(5, 80)),
      tickType: 'daily',
      timestamp: new Date(now.getTime() - i * 86400000)
    })
  }
  return history
}

const MOCK_PROFILES = [
  {
    name: 'Sarah Chen',
    age: 26,
    location: 'San Francisco, CA',
    height: "5'6\"",
    education: 'Stanford University',
    job: 'Product Manager',
    company: 'Stripe',
    bio: 'Building the future of fintech by day, exploring hidden coffee shops by night. Passionate about travel, photography, and making meaningful connections.',
    interests: JSON.stringify(['Travel', 'Coffee', 'Photography', 'Tech', 'Hiking', 'Art']),
    instagram: true,
    linkedin: true,
    strava: false,
    ipoPrice: 120,
    currentPrice: 167.32,
  },
  {
    name: 'Marcus Johnson',
    age: 28,
    location: 'New York, NY',
    height: "6'1\"",
    education: 'NYU Stern',
    job: 'Investment Analyst',
    company: 'Goldman Sachs',
    bio: 'Finance professional who lives for the markets and weekend basketball. Looking for someone to share rooftop dinners and spontaneous adventures.',
    interests: JSON.stringify(['Sports', 'Finance', 'Cooking', 'Music', 'Travel']),
    instagram: true,
    linkedin: true,
    strava: true,
    ipoPrice: 110,
    currentPrice: 182.45,
  },
  {
    name: 'Priya Sharma',
    age: 25,
    location: 'Austin, TX',
    height: "5'4\"",
    education: 'UT Austin',
    job: 'UX Designer',
    company: 'Meta',
    bio: 'Designing beautiful experiences and chasing sunsets. Yoga lover, amateur chef, and always up for a good book recommendation.',
    interests: JSON.stringify(['Yoga', 'Art', 'Cooking', 'Reading', 'Music', 'Fashion']),
    instagram: true,
    linkedin: false,
    strava: false,
    ipoPrice: 100,
    currentPrice: 134.80,
  },
  {
    name: 'Jake Williams',
    age: 30,
    location: 'Los Angeles, CA',
    height: "5'11\"",
    education: 'UCLA',
    job: 'Creative Director',
    company: 'Independent',
    bio: 'Creative soul navigating LA. I make films, collect vinyl, and believe the best conversations happen over street tacos.',
    interests: JSON.stringify(['Movies', 'Music', 'Art', 'Photography', 'Travel', 'Cooking']),
    instagram: true,
    linkedin: false,
    strava: false,
    ipoPrice: 95,
    currentPrice: 112.90,
  },
  {
    name: 'Emma Rodriguez',
    age: 27,
    location: 'Miami, FL',
    height: "5'7\"",
    education: 'University of Miami',
    job: 'Marketing Director',
    company: 'Spotify',
    bio: 'Music is my love language. When I am not building campaigns, you will find me at live shows, on the beach, or trying to perfect my arepas recipe.',
    interests: JSON.stringify(['Music', 'Dancing', 'Cooking', 'Travel', 'Fashion', 'Fitness']),
    instagram: true,
    linkedin: true,
    strava: true,
    ipoPrice: 130,
    currentPrice: 198.20,
  },
  {
    name: 'Alex Park',
    age: 24,
    location: 'Seattle, WA',
    height: "5'9\"",
    education: 'University of Washington',
    job: 'Software Engineer',
    company: 'Amazon',
    bio: 'Full-stack developer and weekend hiker. I love building things, exploring the PNW, and competitive board game nights.',
    interests: JSON.stringify(['Tech', 'Hiking', 'Gaming', 'Coffee', 'Reading', 'Cooking']),
    instagram: false,
    linkedin: true,
    strava: true,
    ipoPrice: 105,
    currentPrice: 141.55,
  },
  {
    name: 'Olivia Kim',
    age: 29,
    location: 'Chicago, IL',
    height: "5'5\"",
    education: 'Northwestern University',
    job: 'Data Scientist',
    company: 'Airbnb',
    bio: 'I find patterns in data and joy in jazz bars. Curious mind, warm heart, and an opinion on the best deep dish in Chicago.',
    interests: JSON.stringify(['Tech', 'Music', 'Cooking', 'Travel', 'Art', 'Wine']),
    instagram: true,
    linkedin: true,
    strava: false,
    ipoPrice: 115,
    currentPrice: 156.70,
  },
  {
    name: 'Daniel Torres',
    age: 31,
    location: 'Denver, CO',
    height: "6'0\"",
    education: 'Colorado State University',
    job: 'Physical Therapist',
    company: 'UCHealth',
    bio: 'Helping people move better is my calling. When the clinic closes, I am skiing, climbing, or training for my next marathon.',
    interests: JSON.stringify(['Fitness', 'Hiking', 'Sports', 'Dogs', 'Cooking', 'Travel']),
    instagram: true,
    linkedin: false,
    strava: true,
    ipoPrice: 100,
    currentPrice: 128.40,
  },
]

async function seed() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.notification.deleteMany()
  await prisma.watchlist.deleteMany()
  await prisma.tokenLedger.deleteMany()
  await prisma.trade.deleteMany()
  await prisma.position.deleteMany()
  await prisma.priceHistory.deleteMany()
  await prisma.agentScore.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.user.deleteMany()

  console.log('  Cleared existing data')

  // Create a demo user account
  const demoPasswordHash = await bcrypt.hash('demo123', 10)
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@lovemarket.app',
      passwordHash: demoPasswordHash,
    }
  })

  // Create demo user's profile
  await prisma.profile.create({
    data: {
      userId: demoUser.id,
      name: 'Demo User',
      age: 25,
      location: 'San Francisco, CA',
      height: "5'10\"",
      education: 'UC Berkeley',
      job: 'Founder',
      company: 'LoveMarket',
      bio: 'Building the future of dating.',
      interests: JSON.stringify(['Tech', 'Travel', 'Coffee', 'Music']),
      instagram: true,
      linkedin: true,
      strava: false,
      ipoPrice: 100,
      currentPrice: 100,
    }
  })

  // Give demo user tokens
  await prisma.tokenLedger.create({
    data: {
      userId: demoUser.id,
      amount: 500,
      reason: 'initial_allocation',
      balance: 500,
    }
  })

  console.log('  Created demo user (demo@lovemarket.app / demo123)')

  // Create mock profiles (each needs a user account)
  for (const profileData of MOCK_PROFILES) {
    const passwordHash = await bcrypt.hash('password123', 10)
    const user = await prisma.user.create({
      data: {
        email: `${profileData.name.toLowerCase().replace(' ', '.')}@lovemarket.app`,
        passwordHash,
      }
    })

    // Compute some market metrics
    const totalLongs = Math.floor(randomBetween(20, 300))
    const totalShorts = Math.floor(randomBetween(5, 100))
    const volume24h = Math.floor(randomBetween(10, 80))
    const demandScore = Math.min(10, (totalLongs / (totalLongs + totalShorts)) * 10 + Math.random() * 2)

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        ...profileData,
        previousPrice: profileData.currentPrice * (1 - Math.random() * 0.05),
        allTimeHigh: profileData.currentPrice * (1 + Math.random() * 0.2),
        allTimeLow: profileData.ipoPrice * (0.7 + Math.random() * 0.2),
        volume24h,
        totalVolume: volume24h * Math.floor(randomBetween(20, 50)),
        marketCap: profileData.currentPrice * (totalLongs + 50),
        totalLongs,
        totalShorts,
        uniqueViewers: Math.floor(randomBetween(50, 500)),
        demandScore: Math.round(demandScore * 10) / 10,
        compositeScore: Math.round(randomBetween(45, 85)),
      }
    })

    // Create agent scores for this profile
    for (const agentId of AGENT_IDS) {
      const score = Math.round(randomBetween(35, 92))
      await prisma.agentScore.create({
        data: {
          profileId: profile.id,
          agentId,
          score,
          signal: randomSignal(score),
          trend: Math.round(randomBetween(-5, 8) * 10) / 10,
          confidence: Math.round(randomBetween(0.4, 0.95) * 100) / 100,
          details: JSON.stringify({
            breakdown: `Mock ${agentId} evaluation`,
            factors: ['Factor A', 'Factor B'],
          }),
        }
      })
    }

    // Create price history
    const priceHistory = generatePriceHistory(profileData.ipoPrice)
    for (const point of priceHistory) {
      await prisma.priceHistory.create({
        data: {
          profileId: profile.id,
          ...point,
        }
      })
    }

    console.log(`  Created profile: ${profileData.name} ($${profileData.currentPrice})`)
  }

  console.log('')
  console.log('Seed complete!')
  console.log('')
  console.log('Demo account:')
  console.log('  Email:    demo@lovemarket.app')
  console.log('  Password: demo123')
  console.log('  Tokens:   500')
  console.log('')
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
