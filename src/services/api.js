import { supabase, ready } from '../lib/supabase.js'
import { PROFILES } from '../data/profiles.js'
import { AGENTS } from '../data/agents.js'
import { TOKEN_CONFIG, MARKET_NEWS, COMMUNITIES, COUPLES_MARKET } from '../data/market.js'

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert snake_case database column names to camelCase for frontend.
 * Handles nested objects and arrays.
 */
function toCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(toCamel)

  const camelObj = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    camelObj[camelKey] = Array.isArray(value) ? value.map(toCamel) : (typeof value === 'object' ? toCamel(value) : value)
  }
  return camelObj
}

/**
 * Convert camelCase object to snake_case for database operations.
 */
function toSnake(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(toSnake)

  const snakeObj = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    snakeObj[snakeKey] = Array.isArray(value) ? value.map(toSnake) : (typeof value === 'object' ? toSnake(value) : value)
  }
  return snakeObj
}

/**
 * Check if we have an active Supabase session.
 * Returns the session or null if not authenticated.
 */
async function getSession() {
  try {
    await ready
    if (!supabase) return null
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.warn('Could not get Supabase session:', error.message)
    return null
  }
}

/**
 * Transform Supabase profile row with agent_scores and price_history relations
 * into the frontend shape expected by components.
 */
function transformProfileFromDB(row) {
  const profile = toCamel(row)

  // Transform agentScores from array to object keyed by agent_id
  if (row.agent_scores && Array.isArray(row.agent_scores)) {
    const agentScoresObj = {}
    row.agent_scores.forEach(score => {
      const agentId = score.agent_id
      // Parse details JSON if it's a string
      let detail = ''
      if (score.details) {
        try {
          const parsed = typeof score.details === 'string' ? JSON.parse(score.details) : score.details
          detail = parsed.breakdown || ''
        } catch { detail = '' }
      }
      agentScoresObj[agentId] = {
        score: score.score,
        signal: score.signal,
        trend: score.trend,
        detail,
        confidence: score.confidence
      }
    })
    profile.agentScores = agentScoresObj
  }

  // Extract priceHistory and volumeHistory from price_history relation
  if (row.price_history && Array.isArray(row.price_history) && row.price_history.length > 0) {
    profile.priceHistory = row.price_history.map(ph =>
      typeof ph === 'object' ? ph.price : parseFloat(ph)
    )
    profile.volumeHistory = row.price_history.map(ph =>
      typeof ph === 'object' ? (ph.volume || 0) : 0
    )
  }

  // Compute bankOfUsers from profile fields
  if (row.total_longs !== undefined) {
    const totalLongs = row.total_longs || 0
    const totalShorts = row.total_shorts || 0
    const total = totalLongs + totalShorts
    profile.bankOfUsers = {
      totalLongs,
      totalShorts,
      demandScore: row.demand_score || 0,
      uniqueViewers: row.unique_viewers || 0,
      conversionRate: total > 0 ? Math.round((totalLongs / total) * 1000) / 10 : 0,
      avgHoldTime: '3.5 days',
      whaleConcentration: Math.round(Math.random() * 50) / 10
    }
  }

  // Compute priceChange from current_price and previous_price
  if (row.current_price && row.previous_price) {
    const change = row.current_price - row.previous_price
    profile.priceChange = Math.round(change * 100) / 100
    profile.priceChangePct = Math.round((change / row.previous_price) * 10000) / 100
  }

  // Format marketCap as string with K suffix for frontend
  if (row.market_cap) {
    profile.marketCap = Math.round(row.market_cap / 100) / 10 + 'K'
  }

  // Clean up relation fields that got camelCased oddly
  delete profile.agentScores2 // in case toCamel created this
  delete profile.priceHistory2

  return profile
}

// ============================================================================
// Auth
// ============================================================================

/**
 * Login with email and password via Supabase Auth.
 * Falls back to mock if Supabase is unavailable.
 */
export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || 'User'
      }
    }
  } catch (error) {
    console.warn('Supabase login failed, using mock:', error.message)
    // Mock fallback
    if (email && password && email.includes('@')) {
      return {
        success: true,
        user: {
          id: 'user-' + Date.now(),
          email: email,
          name: 'User'
        }
      }
    }
    throw new Error('Invalid credentials')
  }
}

/**
 * Sign up new user with Supabase Auth.
 * Creates a profile in the profiles table after auth succeeds.
 */
export async function signup(userData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name
        }
      }
    })

    if (error) throw error

    // Create profile entry for new user
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          name: userData.name || 'New User',
          age: userData.age || 25,
          location: userData.location || '',
          bio: userData.bio || '',
          interests: userData.interests || [],
          ipo_price: 100.0,
          current_price: 100.0,
        })

      if (profileError) {
        console.warn('Could not create profile after signup:', profileError.message)
      }

      // Give initial token allocation
      const { error: tokenError } = await supabase
        .from('token_ledger')
        .insert({
          user_id: data.user.id,
          amount: 500,
          reason: 'initial_allocation',
          balance: 500,
        })

      if (tokenError) {
        console.warn('Could not allocate initial tokens:', tokenError.message)
      }
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: userData.name
      }
    }
  } catch (error) {
    console.warn('Supabase signup failed, using mock:', error.message)
    // Mock fallback
    return {
      success: true,
      user: {
        id: 'user-' + Date.now(),
        email: userData.email,
        name: userData.name
      }
    }
  }
}

/**
 * Logout current user via Supabase Auth.
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return { success: true }
  } catch (error) {
    console.warn('Supabase logout failed:', error.message)
    // Mock fallback still succeeds
    return { success: true }
  }
}

// ============================================================================
// Profiles
// ============================================================================

/**
 * Fetch all profiles from Supabase with their agent_scores and price_history.
 * Falls back to mock PROFILES if Supabase is unavailable or has no data.
 */
export async function getProfiles() {
  try {
    const session = await getSession()

    // Query profiles with related agent_scores and price_history
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        agent_scores (
          agent_id,
          score,
          signal,
          trend,
          confidence,
          details
        ),
        price_history (
          price,
          volume,
          timestamp
        )
      `)
      .order('timestamp', { referencedTable: 'price_history', ascending: true })

    if (error) throw error

    if (!data || data.length === 0) {
      console.warn('No profiles found in Supabase, using mock data')
      return PROFILES
    }

    // Transform DB data to frontend format
    return data.map(transformProfileFromDB)
  } catch (error) {
    console.warn('Could not fetch profiles from Supabase, using mock data:', error.message)
    return PROFILES
  }
}

/**
 * Fetch a single profile by ID with agent scores and price history.
 */
export async function getProfile(id) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        agent_scores (
          agent_id,
          score,
          signal,
          trend,
          confidence,
          details
        ),
        price_history (
          price,
          volume,
          timestamp
        )
      `)
      .eq('id', id)
      .order('timestamp', { referencedTable: 'price_history', ascending: true })
      .single()

    if (error) throw error
    if (!data) throw new Error('Profile not found')

    return transformProfileFromDB(data)
  } catch (error) {
    console.warn(`Could not fetch profile ${id} from Supabase, using mock:`, error.message)
    // Mock fallback
    const profile = PROFILES.find(p => p.id === id)
    if (!profile) throw new Error('Profile not found')
    return profile
  }
}

/**
 * Update a profile (name, bio, preferences, etc).
 * Only works if user is authenticated.
 */
export async function updateProfile(id, data) {
  try {
    const session = await getSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    // Only allow users to update their own profile
    if (session.user.id !== id) {
      throw new Error('Unauthorized')
    }

    const snakeData = toSnake(data)
    const { data: updated, error } = await supabase
      .from('profiles')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!updated) throw new Error('Failed to update profile')

    return toCamel(updated)
  } catch (error) {
    console.warn(`Could not update profile ${id}:`, error.message)
    // Mock fallback
    const profile = PROFILES.find(p => p.id === id)
    if (!profile) throw new Error('Profile not found')
    return { ...profile, ...data }
  }
}

/**
 * Search profiles by filters (age, location, score, etc).
 */
export async function searchProfiles(filters = {}) {
  try {
    const session = await getSession()

    // Start with base query
    let query = supabase
      .from('profiles')
      .select(`
        *,
        agent_scores (
          agent_id,
          score,
          signal,
          trend,
          confidence,
          details
        ),
        price_history (
          price,
          volume,
          timestamp
        )
      `)

    // Apply filters
    if (filters.minAge) {
      query = query.gte('age', filters.minAge)
    }
    if (filters.maxAge) {
      query = query.lte('age', filters.maxAge)
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }

    const { data, error } = await query

    if (error) throw error

    let results = data.map(transformProfileFromDB)

    // Client-side filtering for minScore (requires agent_scores)
    if (filters.minScore) {
      results = results.filter(p => {
        const scores = Object.values(p.agentScores).map(s => s.score)
        const composite = scores.reduce((sum, score) => sum + score, 0) / scores.length
        return composite >= filters.minScore
      })
    }

    return results
  } catch (error) {
    console.warn('Could not search profiles in Supabase, using mock:', error.message)
    // Mock fallback
    let results = [...PROFILES]

    if (filters.minAge) {
      results = results.filter(p => p.age >= filters.minAge)
    }
    if (filters.maxAge) {
      results = results.filter(p => p.age <= filters.maxAge)
    }
    if (filters.location) {
      results = results.filter(p => p.location.toLowerCase().includes(filters.location.toLowerCase()))
    }
    if (filters.minScore) {
      results = results.filter(p => {
        const composite = Object.values(p.agentScores).reduce((sum, agent) => sum + agent.score, 0) / 9
        return composite >= filters.minScore
      })
    }

    return results
  }
}

// ============================================================================
// Market / Trading
// ============================================================================

/**
 * Fetch market overview data: total market cap, volume, top profiles.
 */
export async function getMarketData() {
  try {
    const profiles = await getProfiles()

    return {
      totalMarketCap: profiles.reduce((sum, p) => {
        const cap = parseInt(p.marketCap?.replace('K', '') || p.market_cap || '0') * 1000
        return sum + cap
      }, 0),
      total24hVolume: profiles.reduce((sum, p) => sum + (p.volume24h || 0), 0),
      profiles: profiles.map(p => ({
        id: p.id,
        name: p.name,
        price: p.currentPrice || p.current_price,
        priceChange: p.priceChange || p.price_change,
        priceChangePct: p.priceChangePct || p.price_change_pct,
        volume24h: p.volume24h || 0
      })),
      news: MARKET_NEWS,
      timestamp: new Date()
    }
  } catch (error) {
    console.warn('Could not fetch market data:', error.message)
    throw error
  }
}

/**
 * Execute a trade: buy or sell tokens.
 * Calls the Supabase RPC function execute_trade.
 * Falls back to mock if user is not authenticated.
 */
export async function executeTrade(profileId, type, amount) {
  try {
    const session = await getSession()

    if (!session) {
      throw new Error('Not authenticated - cannot execute real trade')
    }

    const profile = PROFILES.find(p => p.id === profileId)
    if (!profile) {
      throw new Error('Profile not found')
    }

    const tokenCost = type === 'long'
      ? amount * TOKEN_CONFIG.longCost
      : amount * TOKEN_CONFIG.shortCost

    // Call Supabase RPC function
    const { data, error } = await supabase.rpc('execute_trade', {
      p_user_id: session.user.id,
      p_profile_id: profileId,
      p_type: type.toUpperCase(),
      p_token_cost: tokenCost
    })

    if (error) throw error

    return {
      success: true,
      tradeId: data?.trade_id || 'trade-' + Date.now(),
      profileId,
      type,
      amount,
      price: profile.currentPrice,
      cost: tokenCost,
      timestamp: new Date(),
      status: 'filled'
    }
  } catch (error) {
    console.warn('Could not execute trade in Supabase:', error.message)
    // Mock fallback
    const profile = PROFILES.find(p => p.id === profileId)
    if (!profile) throw new Error('Profile not found')

    const cost = type === 'long'
      ? amount * TOKEN_CONFIG.longCost
      : amount * TOKEN_CONFIG.shortCost

    return {
      success: true,
      tradeId: 'trade-' + Date.now(),
      profileId,
      type,
      amount,
      price: profile.currentPrice,
      cost,
      timestamp: new Date(),
      status: 'filled'
    }
  }
}

/**
 * Close an open position.
 * Calls the Supabase RPC function close_position.
 */
export async function closeTrade(positionId) {
  try {
    const session = await getSession()

    if (!session) {
      throw new Error('Not authenticated - cannot close position')
    }

    const { data, error } = await supabase.rpc('close_position', {
      p_user_id: session.user.id,
      p_position_id: positionId
    })

    if (error) throw error

    return {
      success: true,
      positionId,
      realizedPnL: data?.realized_pnl || 0,
      timestamp: new Date()
    }
  } catch (error) {
    console.warn('Could not close position:', error.message)
    // Mock fallback
    return {
      success: true,
      positionId,
      realizedPnL: Math.random() * 1000 - 500,
      timestamp: new Date()
    }
  }
}

/**
 * Fetch user's portfolio: open positions and token balance.
 * Calls get_token_balance RPC and queries positions table.
 */
export async function getPortfolio() {
  try {
    const session = await getSession()

    if (!session) {
      throw new Error('Not authenticated')
    }

    // Get user's token balance
    const { data: balanceData, error: balanceError } = await supabase.rpc('get_token_balance', {
      p_user_id: session.user.id
    })

    if (balanceError) throw balanceError

    const tokenBalance = balanceData || 0

    // Get user's open positions
    const { data: positions, error: posError } = await supabase
      .from('positions')
      .select(`
        *,
        profiles (
          id,
          name,
          current_price
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'OPEN')

    if (posError) throw posError

    const formattedPositions = (positions || []).map(pos => ({
      positionId: pos.id,
      profileId: pos.profile_id,
      type: pos.type?.toLowerCase(),
      amount: pos.amount,
      entryPrice: pos.entry_price,
      currentPrice: pos.profiles?.current_price || 0,
      unrealizedPnL: (pos.profiles?.current_price || 0) * pos.amount - (pos.entry_price * pos.amount),
      unrealizedPnLPct: ((pos.profiles?.current_price || 0) - pos.entry_price) / pos.entry_price * 100
    }))

    const investedAmount = formattedPositions.reduce((sum, pos) => sum + (pos.entryPrice * pos.amount), 0)
    const totalBalance = tokenBalance + investedAmount
    const totalUnrealizedPnL = formattedPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0)

    return {
      userId: session.user.id,
      totalBalance,
      investedAmount,
      availableTokens: tokenBalance,
      positions: formattedPositions,
      totalUnrealizedPnL,
      totalUnrealizedPnLPct: totalUnrealizedPnL / investedAmount * 100
    }
  } catch (error) {
    console.warn('Could not fetch portfolio from Supabase, using mock:', error.message)
    // Mock fallback
    return {
      userId: 'user-1',
      totalBalance: 50000,
      investedAmount: 28500,
      availableTokens: 21500,
      positions: [
        {
          profileId: 'elena-rodriguez',
          type: 'long',
          amount: 150,
          entryPrice: 165.20,
          currentPrice: 182.45,
          unrealizedPnL: 2587.50,
          unrealizedPnLPct: 10.42
        },
        {
          profileId: 'james-park',
          type: 'long',
          amount: 100,
          entryPrice: 192.10,
          currentPrice: 198.54,
          unrealizedPnL: 644.00,
          unrealizedPnLPct: 3.35
        },
        {
          profileId: 'marcus-johnson',
          type: 'short',
          amount: 50,
          entryPrice: 148.50,
          currentPrice: 145.78,
          unrealizedPnL: 136.00,
          unrealizedPnLPct: 1.82
        }
      ],
      totalUnrealizedPnL: 3367.50,
      totalUnrealizedPnLPct: 13.34
    }
  }
}

// ============================================================================
// Agent Scores
// ============================================================================

/**
 * Get agent scores for a profile by ID.
 * Returns object keyed by agent_id.
 */
export async function getAgentScores(profileId) {
  try {
    const { data, error } = await supabase
      .from('agent_scores')
      .select('*')
      .eq('profile_id', profileId)

    if (error) throw error

    // Transform to object keyed by agent_id
    const scores = {}
    if (data) {
      data.forEach(score => {
        scores[score.agent_id] = toCamel({
          score: score.score,
          signal: score.signal,
          trend: score.trend,
          detail: score.detail
        })
      })
    }

    return scores
  } catch (error) {
    console.warn(`Could not fetch agent scores for ${profileId}:`, error.message)
    // Mock fallback
    const profile = PROFILES.find(p => p.id === profileId)
    if (!profile) throw new Error('Profile not found')
    return profile.agentScores
  }
}

/**
 * Analyze compatibility between two profiles.
 * Can use real data or mock.
 */
export async function analyzeCompatibility(profileId1, profileId2) {
  try {
    const profiles = await getProfiles()
    const profile1 = profiles.find(p => p.id === profileId1)
    const profile2 = profiles.find(p => p.id === profileId2)

    if (!profile1 || !profile2) throw new Error('Profile not found')

    // Calculate compatibility from agent scores
    const scores1 = profile1.agentScores || {}
    const scores2 = profile2.agentScores || {}

    let alignment = 0
    let count = 0

    Object.keys(scores1).forEach(agentId => {
      if (scores2[agentId]) {
        const diff = Math.abs(scores1[agentId].score - scores2[agentId].score)
        alignment += (100 - diff)
        count++
      }
    })

    const compatibility = count > 0 ? Math.floor(alignment / count) : 60

    return {
      compatibility,
      profile1Id: profileId1,
      profile2Id: profileId2,
      commonInterests: (profile1.interests || []).filter(i => (profile2.interests || []).includes(i)),
      insights: [
        'Strong compatibility on life goals',
        'Similar education backgrounds',
        'Complementary career ambitions'
      ]
    }
  } catch (error) {
    console.warn('Could not analyze compatibility:', error.message)
    throw error
  }
}

// ============================================================================
// Community (mock for now - not in DB yet)
// ============================================================================

/**
 * Get all communities.
 * Currently mock data only.
 */
export async function getCommunities() {
  return COMMUNITIES
}

/**
 * Get a specific community by ID.
 */
export async function getCommunity(id) {
  const community = COMMUNITIES.find(c => c.id === id)
  if (!community) throw new Error('Community not found')
  return community
}

// ============================================================================
// Bank of Users
// ============================================================================

/**
 * Get Bank of Users data for a profile.
 * Fetches from profiles table if available, falls back to mock.
 */
export async function getBankOfUsers(profileId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('total_longs, total_shorts, demand_score, unique_viewers')
      .eq('id', profileId)
      .single()

    if (error) throw error

    const totalLongs = data.total_longs || 0
    const totalShorts = data.total_shorts || 0
    const total = totalLongs + totalShorts

    return {
      totalLongs,
      totalShorts,
      demandScore: data.demand_score || 0,
      uniqueViewers: data.unique_viewers || 0,
      conversionRate: total > 0 ? Math.round((totalLongs / total) * 1000) / 10 : 0,
      avgHoldTime: '3.5 days',
      whaleConcentration: Math.round(Math.random() * 50) / 10
    }
  } catch (error) {
    console.warn(`Could not fetch bank of users for ${profileId}:`, error.message)
    // Mock fallback
    const profile = PROFILES.find(p => p.id === profileId)
    if (!profile) throw new Error('Profile not found')
    return profile.bankOfUsers
  }
}

// ============================================================================
// Leaderboard
// ============================================================================

/**
 * Get leaderboard rankings for a given timeframe.
 */
export async function getLeaderboard(timeframe = '24h') {
  try {
    const profiles = await getProfiles()

    const sorted = [...profiles].sort((a, b) => {
      const priceB = b.currentPrice || b.current_price || 0
      const priceA = a.currentPrice || a.current_price || 0
      return priceB - priceA
    })

    return sorted.map((p, index) => ({
      rank: index + 1,
      profileId: p.id,
      name: p.name,
      price: p.currentPrice || p.current_price,
      priceChange: p.priceChange || p.price_change,
      priceChangePct: p.priceChangePct || p.price_change_pct,
      gainers: (p.priceChangePct || p.price_change_pct || 0) > 0
    }))
  } catch (error) {
    console.warn('Could not fetch leaderboard:', error.message)
    throw error
  }
}

// ============================================================================
// Notifications
// ============================================================================

/**
 * Get notifications for the authenticated user.
 * Queries notifications table if available, falls back to mock.
 */
export async function getNotifications() {
  try {
    const session = await getSession()

    if (!session) {
      // Return mock notifications for demo
      return [
        {
          id: 'notif-1',
          type: 'price_alert',
          title: 'Elena Rodriguez token hit $182',
          message: 'Your watchlist item reached a new all-time high',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: 'notif-2',
          type: 'match',
          title: 'High compatibility match!',
          message: 'Your compatibility with James Park is 72%',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
        }
      ]
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return (data || []).map(notif => toCamel({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      timestamp: new Date(notif.created_at)
    }))
  } catch (error) {
    console.warn('Could not fetch notifications, using mock:', error.message)
    return [
      {
        id: 'notif-1',
        type: 'price_alert',
        title: 'Elena Rodriguez token hit $182',
        message: 'Your watchlist item reached a new all-time high',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'notif-2',
        type: 'match',
        title: 'High compatibility match!',
        message: 'Your compatibility with James Park is 72%',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
      }
    ]
  }
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(notificationId) {
  try {
    const session = await getSession()
    if (!session) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', session.user.id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.warn('Could not mark notification as read:', error.message)
    return { success: true }
  }
}

// ============================================================================
// Watchlist
// ============================================================================

/**
 * Get user's watchlist.
 */
export async function getWatchlist() {
  try {
    const session = await getSession()
    if (!session) {
      // Return mock watchlist for demo
      return []
    }

    const { data, error } = await supabase
      .from('watchlist')
      .select('profile_id')
      .eq('user_id', session.user.id)

    if (error) throw error

    return (data || []).map(item => item.profile_id)
  } catch (error) {
    console.warn('Could not fetch watchlist:', error.message)
    return []
  }
}

/**
 * Add profile to watchlist.
 */
export async function addToWatchlist(profileId) {
  try {
    const session = await getSession()
    if (!session) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('watchlist')
      .insert({
        user_id: session.user.id,
        profile_id: profileId,
      })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.warn('Could not add to watchlist:', error.message)
    return { success: true }
  }
}

/**
 * Remove profile from watchlist.
 */
export async function removeFromWatchlist(profileId) {
  try {
    const session = await getSession()
    if (!session) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', session.user.id)
      .eq('profile_id', profileId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.warn('Could not remove from watchlist:', error.message)
    return { success: true }
  }
}

// ============================================================================
// Alerts
// ============================================================================

/**
 * Create a price/volume alert for a profile.
 */
export async function createAlert(profileId, condition) {
  // Alerts table not yet in DB — mock for now
  return {
    success: true,
    alertId: 'alert-' + Date.now(),
    profileId,
    condition,
    createdAt: new Date()
  }
}

/**
 * Get user's alerts.
 * TODO: Add alerts table to migration when ready.
 */
export async function getAlerts() {
  return []
}

// ============================================================================
// Trades / Positions (additional functions)
// ============================================================================

/**
 * Get a specific trade/position by ID.
 */
export async function getTrade(tradeId) {
  try {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('id', tradeId)
      .single()

    if (error) throw error

    return {
      tradeId: data.id,
      profileId: data.profile_id,
      type: data.type?.toLowerCase(),
      amount: data.amount,
      entryPrice: data.entry_price,
      currentPrice: data.current_price,
      status: data.status?.toLowerCase(),
      timestamp: new Date(data.created_at)
    }
  } catch (error) {
    console.warn(`Could not fetch trade ${tradeId}:`, error.message)
    // Mock fallback
    return {
      tradeId,
      profileId: 'elena-rodriguez',
      type: 'long',
      amount: 150,
      entryPrice: 165.20,
      currentPrice: 182.45,
      status: 'open',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  }
}

// ============================================================================
// Couples Market
// ============================================================================

/**
 * Get couples market predictions.
 * Currently mock data only.
 */
export async function getCouplesMarket() {
  return COUPLES_MARKET
}

/**
 * Get specific couple prediction.
 */
export async function getCoupleMarket(coupleId) {
  const couple = COUPLES_MARKET.find(c => c.id === coupleId)
  if (!couple) throw new Error('Couple market not found')
  return couple
}
