'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Chart } from 'chart.js/auto'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Coins,
  MapPin,
  X,
  Heart,
  ArrowDown,
  Zap,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  Shield,
  BarChart3,
  Activity,
  CheckCircle
} from 'lucide-react'
import { useAnimatedValue } from '../hooks/useAnimatedValue'
import {
  formatPrice,
  formatPct,
  formatChange,
  getSignalColor,
  formatRelativeTime,
  getTrendIcon
} from '../utils/helpers'

// chart.js/auto handles registration automatically

// ============================================================================
// 1. CircularGauge - SVG circular progress ring with animated value
// ============================================================================
export function CircularGauge({ score = 0, size = 80, color = '#3ecfcf', label, delay = 0 }) {
  const animatedScore = useAnimatedValue(score, 1000, delay)
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius

  // Background: 0-100% of circumference
  const bgDashArray = circumference
  const bgDashOffset = 0

  // Foreground: animated based on score
  const scorePct = Math.min(100, Math.max(0, animatedScore)) / 100
  const fgDashArray = circumference * scorePct
  const fgDashOffset = circumference * (1 - scorePct)

  // Glow filter - softer
  const glowId = `glow-${Math.random()}`

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Foreground ring (animated) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={fgDashArray}
          strokeDashoffset={fgDashOffset}
          style={{
            transition: 'stroke-dasharray 0.1s ease-out, stroke-dashoffset 0.1s ease-out',
            filter: `url(#${glowId})`
          }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* Center text - subtle glow */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dy="0.3em"
          className="font-bold text-sm"
          fill={color}
          style={{
            fontSize: size * 0.28,
            textShadow: `0 0 4px ${color}44`
          }}
        >
          {Math.round(animatedScore)}
        </text>
      </svg>

      {label && (
        <div className="text-xs uppercase font-semibold text-gray-500 tracking-widest">
          {label}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 2. PriceChart - Chart.js line chart with gradient fill and dark tooltip
// ============================================================================
export function PriceChart({ priceHistory = [], height = 200 }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !priceHistory.length) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    // Create gradient with new teal
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#3ecfcf40')
    gradient.addColorStop(1, 'transparent')

    // Data labels (every 5th: D1, D6, D11, etc)
    const labels = priceHistory.map((_, i) => {
      return i % 5 === 0 ? `D${i + 1}` : ''
    })

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Price',
            data: priceHistory,
            borderColor: '#3ecfcf',
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBorderWidth: 2,
            pointHoverBorderColor: '#3ecfcf',
            pointHoverBackgroundColor: 'rgba(10,10,18,0.95)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(15,15,23,0.98)',
            borderColor: '#3ecfcf',
            borderWidth: 1,
            titleFont: {
              family: 'system-ui, -apple-system, sans-serif',
              size: 12,
              weight: 'bold'
            },
            bodyFont: {
              family: 'system-ui, -apple-system, sans-serif',
              size: 11
            },
            padding: 8,
            displayColors: false,
            callbacks: {
              label: function (context) {
                return formatPrice(context.parsed.y)
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: true,
              color: 'rgba(255,255,255,0.03)',
              drawBorder: false
            },
            ticks: {
              color: 'rgba(255,255,255,0.4)',
              font: {
                family: 'system-ui, -apple-system, sans-serif',
                size: 10
              }
            }
          },
          y: {
            display: true,
            position: 'right',
            grid: {
              display: true,
              color: 'rgba(255,255,255,0.03)',
              drawBorder: false
            },
            ticks: {
              color: 'rgba(255,255,255,0.4)',
              font: {
                family: 'system-ui, -apple-system, sans-serif',
                size: 10
              },
              callback: function (value) {
                return '$' + value.toFixed(0)
              }
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeOutQuart'
        }
      }
    })

    chartRef.current = chart

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [priceHistory, height])

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

// ============================================================================
// 3. VolumeChart - Chart.js bar chart (gain green for up, loss red for down)
// ============================================================================
export function VolumeChart({ volumeHistory = [], priceHistory = [], height = 40 }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !volumeHistory.length) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    // Determine bar colors based on price direction
    const barColors = volumeHistory.map((vol, i) => {
      if (i === 0) return '#34d399'
      return priceHistory[i] >= priceHistory[i - 1] ? '#34d399' : '#ef4444'
    })

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: volumeHistory.map((_, i) => i),
        datasets: [
          {
            label: 'Volume',
            data: volumeHistory,
            backgroundColor: barColors,
            borderRadius: 2,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'x',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false, grid: { display: false } },
          y: { display: false, grid: { display: false } }
        },
        animation: {
          duration: 1200,
          easing: 'easeOutQuart'
        }
      }
    })

    chartRef.current = chart

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [volumeHistory, priceHistory, height])

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

// ============================================================================
// 4. MiniSparkline - Tiny SVG polyline chart
// ============================================================================
export function MiniSparkline({ data = [], color = '#3ecfcf', width = 80, height = 24 }) {
  if (!data || data.length === 0) {
    return <div style={{ width, height }} className="bg-gray-800 rounded" />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  // Create polyline points
  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ============================================================================
// 5. SignalBadge - BUY/SELL/HOLD badge
// ============================================================================
export function SignalBadge({ signal = 'HOLD' }) {
  let bgColor = 'rgba(240, 180, 41, 0.15)'
  let textColor = '#f0b429'

  if (signal === 'BUY') {
    bgColor = 'rgba(52, 211, 153, 0.15)'
    textColor = '#34d399'
  } else if (signal === 'SELL') {
    bgColor = 'rgba(239, 68, 68, 0.15)'
    textColor = '#ef4444'
  }

  return (
    <div
      className="px-2 py-1 rounded-md text-xs font-semibold uppercase letter-spacing"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        letterSpacing: '0.05em'
      }}
    >
      {signal}
    </div>
  )
}

// ============================================================================
// 6. TokenDisplay - Coins icon with $EVO token count (gold styling)
// ============================================================================
export function TokenDisplay({ tokens = 0, compact = false }) {
  const isLow = tokens < 500
  const glowStyle = isLow ? { textShadow: '0 0 8px rgba(239, 68, 68, 0.5)' } : {}

  if (compact) {
    return (
      <div className="flex items-center gap-1" style={glowStyle}>
        <Coins size={16} className="text-yellow-500" />
        <span className="text-sm font-semibold">{tokens}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-900/40 border border-gray-800/60" style={glowStyle}>
      <Coins size={20} className="text-yellow-500 flex-shrink-0" />
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-500 uppercase">$EVO</span>
        <span className="font-bold text-sm text-white">{tokens.toLocaleString()}</span>
      </div>
    </div>
  )
}

// ============================================================================
// 7. SwipeCard - Premium Hinge-like dating card
// ============================================================================
export function SwipeCard({ profile, onLike, onPass, onAnalyze, style = {} }) {
  if (!profile) return null

  return (
    <div
      className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing flex flex-col shadow-2xl transition-all"
      style={{
        height: '580px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        ...style
      }}
    >
      {/* Avatar/Image Area - 65% of card */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          background: profile.avatar,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Name & Age Overlay - Bottom of image with gradient */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 pt-16">
          <h2 className="text-4xl font-bold text-white">
            {profile.name}, {profile.age}
          </h2>
          {profile.tagline && (
            <p className="text-sm italic text-gray-300 mt-2 max-w-xs">{profile.tagline}</p>
          )}
        </div>
      </div>

      {/* Info Section - 35% of card */}
      <div className="p-5 space-y-3 bg-gradient-to-b from-gray-950/40 to-gray-950/80 flex flex-col justify-between">
        {/* Job & Location */}
        <div className="space-y-2">
          {profile.job && (
            <div className="text-sm text-gray-200">
              <span className="font-semibold">{profile.job}</span>
              {profile.company && <span className="text-gray-500"> @ {profile.company}</span>}
            </div>
          )}

          {profile.location && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin size={14} className="flex-shrink-0" />
              <span>{profile.location}</span>
            </div>
          )}
        </div>

        {/* Interests/Tags as pills */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.interests.slice(0, 3).map((interest, idx) => (
              <span
                key={idx}
                className="px-3 py-1 text-xs rounded-full bg-gray-800/50 border border-gray-700/50 text-gray-300"
              >
                {interest}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3 justify-center">
          <button
            onClick={onPass}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 hover:opacity-80"
            title="Pass"
            style={{
              backgroundColor: 'rgba(107, 114, 128, 0.2)',
              border: '1px solid rgba(107, 114, 128, 0.3)'
            }}
          >
            <X size={20} className="text-gray-400" />
          </button>

          <button
            onClick={onLike}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 hover:opacity-80"
            title="Like"
            style={{
              backgroundColor: 'rgba(232, 71, 95, 0.15)',
              border: '1px solid rgba(232, 71, 95, 0.3)'
            }}
          >
            <Heart size={20} className="text-rose-500 fill-rose-500" />
          </button>

          <button
            onClick={onAnalyze}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 hover:opacity-80"
            title="Analyze"
            style={{
              backgroundColor: 'rgba(232, 71, 95, 0.1)',
              border: '1px solid rgba(232, 71, 95, 0.25)'
            }}
          >
            <ArrowDown size={20} className="text-rose-600" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 8. ProfileHeader - Cleaner profile intro header
// ============================================================================
export function ProfileHeader({ profile }) {
  if (!profile) return null

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10" style={{ backgroundColor: 'rgba(15,15,23,0.5)' }}>
      {/* Avatar Circle */}
      <div
        className="w-14 h-14 rounded-full flex-shrink-0 border border-white/15"
        style={{
          background: profile.avatar,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white text-sm truncate">
            {profile.name}, {profile.age}
          </h3>
          {profile.verified && (
            <Shield size={14} className="text-green-500 flex-shrink-0" />
          )}
        </div>
        <div className="text-xs text-gray-500">
          {profile.job} {profile.company && `@ ${profile.company}`}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 9. MarketCard - Profile card in market view with sparkline
// ============================================================================
export function MarketCard({ profile, onClick, compact = false }) {
  if (!profile) return null

  const isPositive = profile.priceChangePct >= 0
  const changeColor = isPositive ? '#34d399' : '#ef4444'

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="p-3 rounded-lg border border-white/10 hover:border-cyan-500/40 cursor-pointer transition-all active:scale-95"
        style={{ backgroundColor: 'rgba(15,15,23,0.5)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex-shrink-0"
            style={{
              background: profile.avatar,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{profile.name}</p>
            <p className="text-xs text-gray-500">{profile.company}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-semibold text-sm text-cyan-400">
              {formatPrice(profile.currentPrice)}
            </p>
            <p className="text-xs" style={{ color: changeColor }}>
              {formatPct(profile.priceChangePct)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl border border-white/10 hover:border-cyan-500/40 cursor-pointer transition-all active:scale-95 space-y-3"
      style={{ backgroundColor: 'rgba(15,15,23,0.5)' }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex-shrink-0"
          style={{
            background: profile.avatar,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        {/* Name & Company */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm">{profile.name}</h4>
          <p className="text-xs text-gray-500">{profile.company}</p>
        </div>

        {/* Price & Change */}
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-lg text-cyan-400">
            {formatPrice(profile.currentPrice)}
          </p>
          <p className="text-xs" style={{ color: changeColor }}>
            {formatPct(profile.priceChangePct)}
          </p>
        </div>
      </div>

      {/* Sparkline */}
      <MiniSparkline data={profile.priceHistory || []} color="#3ecfcf" width="100%" height="20" />
    </div>
  )
}

// ============================================================================
// 10. AgentCard - Agent score card with expand animation
// ============================================================================
export function AgentCard({ agent, agentScore, expanded, onToggle, index = 0 }) {
  if (!agent || !agentScore) return null

  const animationDelay = index * 100

  return (
    <div
      className="border border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/20 transition-all active:scale-95"
      onClick={onToggle}
      style={{
        backgroundColor: 'rgba(15,15,23,0.5)',
        animation: `slideUp 0.5s ease-out ${animationDelay}ms forwards`,
        opacity: 0
      }}
    >
      <div className="flex items-start gap-4">
        {/* Gauge */}
        <div className="flex-shrink-0">
          <CircularGauge
            score={agentScore.score}
            size={48}
            color={agent.color}
            delay={animationDelay}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-white text-sm">{agent.shortName}</h4>
              <p className="text-xs text-gray-500">{agent.domain}</p>
            </div>
            <SignalBadge signal={agentScore.signal} />
          </div>

          {/* Weight & Trend */}
          <div className="flex items-center gap-4 mt-2">
            <div className="text-xs text-gray-600">
              {(agent.weight * 100).toFixed(0)}%
            </div>
            <div className="flex items-center gap-1 text-xs">
              {getTrendIcon(agentScore.trend) === 'up' && (
                <TrendingUp size={12} className="text-green-500" />
              )}
              {getTrendIcon(agentScore.trend) === 'down' && (
                <TrendingDown size={12} className="text-red-500" />
              )}
              {getTrendIcon(agentScore.trend) === 'neutral' && (
                <Minus size={12} className="text-gray-500" />
              )}
              <span style={{ color: agentScore.trend > 0 ? '#34d399' : agentScore.trend < 0 ? '#ef4444' : '#888' }}>
                {formatChange(agentScore.trend)}
              </span>
              <span className="text-gray-600">7d</span>
            </div>
          </div>
        </div>

        {/* Expand Chevron */}
        <ChevronDown
          size={18}
          className="text-gray-500 flex-shrink-0 transition-transform"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10 animate-fadeIn">
          <p className="text-sm text-gray-300 leading-relaxed">{agentScore.detail}</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 11. PositionCard - Trading position (long/short)
// ============================================================================
export function PositionCard({ position, currentPrice, onClose }) {
  if (!position) return null

  const profileName = position.profileName || 'Unknown'
  const isLong = position.type === 'LONG'
  const entryPrice = position.entryPrice || 0
  const profitLoss = currentPrice - entryPrice
  const profitLossPct = entryPrice > 0 ? (profitLoss / entryPrice) * 100 : 0
  const isProfit = profitLoss > 0

  return (
    <div className="p-4 rounded-xl border border-white/10 space-y-3" style={{ backgroundColor: 'rgba(15,15,23,0.5)' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h4 className="font-semibold text-white text-sm flex-1">{profileName}</h4>
        <div
          className="px-2 py-1 rounded-md text-xs font-semibold uppercase"
          style={{
            backgroundColor: isLong ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isLong ? '#34d399' : '#ef4444'
          }}
        >
          {isLong ? 'LONG' : 'SHORT'}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-all"
          title="Close position"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Prices */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">Entry: {formatPrice(entryPrice)}</span>
        <span className="text-gray-300">Current: {formatPrice(currentPrice)}</span>
      </div>

      {/* P&L */}
      <div
        className="p-3 rounded-lg bg-white/5 border"
        style={{
          borderColor: isProfit ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)'
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">P&L</span>
          <div className="text-right">
            <p className="font-semibold text-sm" style={{ color: isProfit ? '#34d399' : '#ef4444' }}>
              {isProfit ? '+' : ''}{formatPrice(profitLoss)}
            </p>
            <p className="text-xs" style={{ color: isProfit ? '#34d399' : '#ef4444' }}>
              {isProfit ? '+' : ''}{formatPct(profitLossPct)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 12. NewsCard - Market news item
// ============================================================================
export function NewsCard({ news }) {
  if (!news) return null

  let IconComponent = Zap
  let iconColor = '#f0b429'

  if (news.type === 'alert') {
    IconComponent = AlertTriangle
    iconColor = '#ef4444'
  } else if (news.type === 'insight') {
    IconComponent = Lightbulb
    iconColor = '#3ecfcf'
  }

  const borderColor = {
    trending: 'rgba(52, 211, 153, 0.2)',
    alert: 'rgba(239, 68, 68, 0.2)',
    insight: 'rgba(62, 207, 207, 0.2)'
  }[news.type] || 'rgba(255, 255, 255, 0.1)'

  return (
    <div
      className="p-4 rounded-xl border-l-4 space-y-2 hover:border-l-white/40 transition-colors cursor-pointer"
      style={{
        backgroundColor: 'rgba(15,15,23,0.5)',
        borderColor,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        borderRightColor: 'rgba(255,255,255,0.1)',
        borderTopColor: 'rgba(255,255,255,0.1)'
      }}
    >
      <div className="flex items-start gap-3">
        <IconComponent size={18} style={{ color: iconColor }} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm leading-snug">{news.headline}</h4>
          <p className="text-xs text-gray-500 leading-relaxed mt-1">{news.detail}</p>
          <p className="text-xs text-gray-700 mt-2">{formatRelativeTime(news.timestamp)}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 13. CommunityCard - Community/group card
// ============================================================================
export function CommunityCard({ community }) {
  if (!community) return null

  const sentimentColor = community.sentiment === 'bullish' ? '#34d399' : '#ef4444'

  return (
    <div className="p-4 rounded-xl border border-white/10 space-y-3 cursor-pointer hover:border-cyan-500/40 transition-all active:scale-95" style={{ backgroundColor: 'rgba(15,15,23,0.5)' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-white text-sm">{community.name}</h4>
          <p className="text-xs text-gray-500 mt-1">{community.members.toLocaleString()} members</p>
        </div>
        <div
          className="px-2 py-1 rounded-md text-xs font-semibold uppercase whitespace-nowrap"
          style={{
            backgroundColor: `${sentimentColor}15`,
            color: sentimentColor
          }}
        >
          {community.sentiment.toUpperCase()}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
        <div className="text-xs">
          <p className="text-gray-600">Top Pick</p>
          <p className="text-white font-semibold">{community.topPick}</p>
        </div>
        <div className="text-xs">
          <p className="text-gray-600">Volume</p>
          <p className="text-white font-semibold">{community.totalVolume.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 14. BottomSheet - Slide-up modal from bottom
// ============================================================================
export function BottomSheet({ isOpen, onClose, title, children }) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
          style={{
            animation: isOpen ? 'fadeIn 0.2s ease-out' : 'fadeOut 0.2s ease-out'
          }}
        />
      )}

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 rounded-t-3xl max-w-[430px] mx-auto w-full"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,30,0.95) 0%, rgba(15,15,23,0.98) 100%)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Handle Bar - wider */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-16 h-1.5 bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10">
          <h2 className="font-bold text-white text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
            title="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </>
  )
}

// ============================================================================
// 15. Toast - Notification toast
// ============================================================================
export function Toast({ message, type = 'success', visible }) {
  let bgColor = 'bg-green-900/30'
  let textColor = 'text-green-300'
  let borderColor = 'border-green-500/40'
  let Icon = CheckCircle

  if (type === 'error') {
    bgColor = 'bg-red-900/30'
    textColor = 'text-red-300'
    borderColor = 'border-red-500/40'
    Icon = AlertTriangle
  } else if (type === 'info') {
    bgColor = 'bg-blue-900/30'
    textColor = 'text-blue-300'
    borderColor = 'border-blue-500/40'
    Icon = Lightbulb
  }

  return (
    <div
      className={`${bgColor} ${borderColor} ${textColor} fixed top-4 left-4 right-4 max-w-[430px] mx-auto border rounded-lg p-4 flex items-center gap-3 z-50 transition-all`}
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(-120%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        opacity: visible ? 1 : 0
      }}
    >
      <Icon size={20} className="flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
    </div>
  )
}

// ============================================================================
// Styles & Animations
// ============================================================================
const styles = `
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.glass-card {
  background: rgba(15, 15, 23, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

.letter-spacing {
  letter-spacing: 0.05em;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* Color system for Evolve */
:root {
  --primary-coral: #e8475f;
  --accent-teal: #3ecfcf;
  --gain-green: #34d399;
  --loss-red: #ef4444;
  --gold: #f0b429;
  --bg-dark: #0a0a12;
  --text-primary: #f0f0f5;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
}
`

// Add styles to document if in browser
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
