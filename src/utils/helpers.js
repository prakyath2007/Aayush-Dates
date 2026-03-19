// Price formatting: 167.32 -> "$167.32"
export function formatPrice(num) {
  if (typeof num !== 'number') return '$0.00'
  return '$' + num.toFixed(2)
}

// Change formatting: 1.47 -> "+1.47", -0.89 -> "-0.89"
export function formatChange(num) {
  if (typeof num !== 'number') return '0.00'
  const sign = num > 0 ? '+' : ''
  return sign + num.toFixed(2)
}

// Percentage formatting: 0.89 -> "+0.89%", -2.3 -> "-2.3%"
export function formatPct(num) {
  if (typeof num !== 'number') return '0%'
  const sign = num > 0 ? '+' : ''
  return sign + num.toFixed(2) + '%'
}

// Relative time: timestamp -> "2m ago", "1h ago", "3d ago"
export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'unknown'

  const now = new Date()
  const date = new Date(timestamp)
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) {
    return 'just now'
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return minutes === 1 ? '1m ago' : minutes + 'm ago'
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return hours === 1 ? '1h ago' : hours + 'h ago'
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return days === 1 ? '1d ago' : days + 'd ago'
  }

  const weeks = Math.floor(days / 7)
  if (weeks < 4) {
    return weeks === 1 ? '1w ago' : weeks + 'w ago'
  }

  const months = Math.floor(days / 30)
  if (months < 12) {
    return months === 1 ? '1mo ago' : months + 'mo ago'
  }

  const years = Math.floor(months / 12)
  return years === 1 ? '1y ago' : years + 'y ago'
}

// Compute composite score from agent scores and agents array
export function computeCompositeScore(agentScores, agents) {
  if (!agentScores || !agents) return 0

  let totalWeightedScore = 0
  let totalWeight = 0

  agents.forEach(agent => {
    const agentScore = agentScores[agent.id]
    if (agentScore) {
      totalWeightedScore += agentScore.score * agent.weight
      totalWeight += agent.weight
    }
  })

  if (totalWeight === 0) return 0
  return Math.round(totalWeightedScore / totalWeight)
}

// Get signal color: 'BUY' -> '#00ff88', 'SELL' -> '#ff2d78', 'HOLD' -> '#ffd700'
export function getSignalColor(signal) {
  switch (signal) {
    case 'BUY':
      return '#00ff88'
    case 'SELL':
      return '#ff2d78'
    case 'HOLD':
      return '#ffd700'
    default:
      return '#555570'
  }
}

// Get trend icon: 4.2 -> 'up', -2.8 -> 'down', 0 -> 'neutral'
export function getTrendIcon(trend) {
  if (typeof trend !== 'number') return 'neutral'
  if (trend > 0.5) return 'up'
  if (trend < -0.5) return 'down'
  return 'neutral'
}

// Clamp value between min and max
export function clamp(value, min, max) {
  if (value < min) return min
  if (value > max) return max
  return value
}

// Random number between min and max (inclusive)
export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Format market cap: "31.6K" -> 31600, "1.2M" -> 1200000
export function parseMarketCap(marketCapStr) {
  if (typeof marketCapStr !== 'string') return 0
  const trimmed = marketCapStr.trim().toUpperCase()

  if (trimmed.includes('K')) {
    return parseFloat(trimmed) * 1000
  }
  if (trimmed.includes('M')) {
    return parseFloat(trimmed) * 1000000
  }
  if (trimmed.includes('B')) {
    return parseFloat(trimmed) * 1000000000
  }

  return parseFloat(trimmed)
}

// Format number to market cap string: 31600 -> "31.6K", 1200000 -> "1.2M"
export function formatMarketCap(num) {
  if (typeof num !== 'number' || num === 0) return '$0'

  if (num >= 1000000) {
    return '$' + (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return '$' + (num / 1000).toFixed(1) + 'K'
  }

  return '$' + num.toFixed(0)
}

// Check if value is within percentage range of target
export function isWithinPercentage(value, target, percentageRange) {
  const lowerBound = target * (1 - percentageRange / 100)
  const upperBound = target * (1 + percentageRange / 100)
  return value >= lowerBound && value <= upperBound
}

// Convert price change to percentage: (182.45 - 165.20) / 165.20 * 100
export function calculatePercentageChange(currentPrice, previousPrice) {
  if (previousPrice === 0) return 0
  return ((currentPrice - previousPrice) / previousPrice) * 100
}

// Get status badge color for verification level
export function getVerificationColor(verified, connectedApps = []) {
  if (!verified) return '#555570'
  if (connectedApps.length >= 3) return '#00ff88' // High verification
  if (connectedApps.length >= 2) return '#00d4ff' // Medium verification
  return '#ffd700' // Basic verification
}

// Sort profiles by given criteria
export function sortProfiles(profiles, sortBy = 'price') {
  const sorted = [...profiles]

  switch (sortBy) {
    case 'price':
      return sorted.sort((a, b) => b.currentPrice - a.currentPrice)
    case 'price-asc':
      return sorted.sort((a, b) => a.currentPrice - b.currentPrice)
    case 'trend':
      return sorted.sort((a, b) => b.priceChangePct - a.priceChangePct)
    case 'volume':
      return sorted.sort((a, b) => b.volume24h - a.volume24h)
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'age':
      return sorted.sort((a, b) => a.age - b.age)
    default:
      return sorted
  }
}

// Interpolate color between two hex colors
export function interpolateColor(color1, color2, factor) {
  const c1 = parseInt(color1.slice(1), 16)
  const c2 = parseInt(color2.slice(1), 16)

  const r1 = (c1 >> 16) & 255
  const g1 = (c1 >> 8) & 255
  const b1 = c1 & 255

  const r2 = (c2 >> 16) & 255
  const g2 = (c2 >> 8) & 255
  const b2 = c2 & 255

  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)

  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

// Debounce function
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function
export function throttle(func, limit) {
  let inThrottle
  return function throttledFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
