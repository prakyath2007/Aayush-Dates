'use client'

import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  BarChart3,
  Zap,
  Eye,
  ChevronDown,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Users
} from 'lucide-react'
import {
  MarketCard,
  PriceChart,
  VolumeChart,
  CircularGauge,
  AgentCard,
  SignalBadge,
  TokenDisplay,
  BottomSheet,
  NewsCard
} from '../components/index.jsx'
import { AGENTS } from '../data/agents.js'
import { TOKEN_CONFIG, MARKET_NEWS } from '../data/market.js'
import {
  formatPrice,
  formatPct,
  formatChange,
  formatMarketCap,
  computeCompositeScore
} from '../utils/helpers.js'

// Color palette
const COLORS = {
  primaryCoral: '#e8475f',
  tealAccent: '#3ecfcf',
  gainGreen: '#34d399',
  lossRed: '#ef4444',
  gold: '#f0b429',
  background: '#0a0a12'
}

// Ticker banner that scrolls continuously
function TickerBanner({ profiles = [] }) {
  const tickerItems = profiles.map(p => ({
    id: p.id,
    name: p.name,
    price: p.currentPrice,
    changePct: p.priceChangePct
  }))

  // Duplicate for seamless loop
  const duplicatedItems = [...tickerItems, ...tickerItems]

  return (
    <div className="relative w-full overflow-hidden border-b border-white/10 py-3" style={{ backgroundColor: 'rgba(10, 10, 18, 0.6)' }}>
      <style>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .ticker-scroll {
          animation: ticker-scroll 60s linear infinite;
        }

        .ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="ticker-scroll flex gap-8 px-4 whitespace-nowrap">
        {duplicatedItems.map((item, idx) => {
          const isPositive = item.changePct >= 0
          const changeColor = isPositive ? COLORS.gainGreen : COLORS.lossRed

          return (
            <div
              key={`${item.id}-${idx}`}
              className="flex items-center gap-3 flex-shrink-0"
            >
              <span className="font-mono text-sm font-semibold" style={{ color: COLORS.tealAccent }}>
                {item.name}
              </span>
              <span className="font-mono text-xs text-gray-400">
                {formatPrice(item.price)}
              </span>
              <span className="font-mono text-xs" style={{ color: changeColor }}>
                {formatPct(item.changePct)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Filter tabs
function FilterTabs({ activeTab, onTabChange }) {
  const tabs = ['All', 'Trending', 'New IPOs', 'Watchlist']

  return (
    <div className="flex gap-2 px-4 py-4 border-b border-white/10 overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 rounded-xl font-mono text-sm whitespace-nowrap transition-all ${
            activeTab === tab
              ? 'border text-white'
              : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'
          }`}
          style={{
            backgroundColor: activeTab === tab ? `${COLORS.tealAccent}20` : undefined,
            borderColor: activeTab === tab ? `${COLORS.tealAccent}50` : undefined,
            color: activeTab === tab ? COLORS.tealAccent : undefined
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// Search bar
function SearchBar({ value, onChange }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 px-4 py-3 border border-white/10 rounded-xl" style={{ backgroundColor: 'rgba(20, 18, 30, 0.8)' }}>
        <Search size={18} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search profiles..."
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500 font-mono"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 hover:bg-white/10 rounded transition-all"
          >
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )
}

// Market overview stats
function MarketOverview({ profiles }) {
  const totalMarketCap = profiles.reduce((sum, p) => {
    const mc = parseFloat(p.marketCap.replace('K', '')) * 1000
    return sum + mc
  }, 0)

  const total24hVolume = profiles.reduce((sum, p) => sum + p.volume24h, 0)

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {/* Total Market Cap - Teal */}
        <div className="p-3 rounded-lg border border-white/10" style={{ backgroundColor: 'rgba(20, 18, 30, 0.8)' }}>
          <p className="text-xs text-gray-500 mb-1">Total Market Cap</p>
          <p className="font-mono font-bold text-sm" style={{ color: COLORS.tealAccent }}>
            {formatMarketCap(totalMarketCap)}
          </p>
        </div>

        {/* 24h Volume - Green */}
        <div className="p-3 rounded-lg border border-white/10" style={{ backgroundColor: 'rgba(20, 18, 30, 0.8)' }}>
          <p className="text-xs text-gray-500 mb-1">24h Volume</p>
          <p className="font-mono font-bold text-sm" style={{ color: COLORS.gainGreen }}>
            {total24hVolume.toLocaleString()}
          </p>
        </div>

        {/* Active Traders - Coral */}
        <div className="p-3 rounded-lg border border-white/10" style={{ backgroundColor: 'rgba(20, 18, 30, 0.8)' }}>
          <p className="text-xs text-gray-500 mb-1">Active Traders</p>
          <p className="font-mono font-bold text-sm" style={{ color: COLORS.primaryCoral }}>
            {profiles.length}
          </p>
        </div>
      </div>
    </div>
  )
}

// Trading bottom sheet
function TradingBottomSheet({ isOpen, onClose, profile, tokens, onTrade }) {
  if (!profile) return null

  const compositeScore = computeCompositeScore(profile.agentScores, AGENTS)
  const isPositive = profile.priceChangePct >= 0
  const changeColor = isPositive ? COLORS.gainGreen : COLORS.lossRed

  const [expandedAgent, setExpandedAgent] = useState(null)
  const [isTrading, setIsTrading] = useState(false)

  const handleTrade = async (type) => {
    setIsTrading(true)
    await onTrade?.(profile.id, type)
    setTimeout(() => {
      setIsTrading(false)
      onClose()
    }, 800)
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={profile.name}>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-full flex-shrink-0 border border-white/20"
              style={{
                background: profile.avatar,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg">
                {profile.name}, {profile.age}
              </h3>
              <p className="text-xs text-gray-400">
                {profile.job} @ {profile.company}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <p className="font-mono font-bold text-lg" style={{ color: COLORS.tealAccent }}>
                  {formatPrice(profile.currentPrice)}
                </p>
                <p
                  className="font-mono text-sm flex items-center gap-1"
                  style={{ color: changeColor }}
                >
                  {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {formatPct(profile.priceChangePct)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Composite Score Badge */}
        <div className="flex justify-center">
          <CircularGauge score={compositeScore} size={100} color={COLORS.tealAccent} label="Composite" />
        </div>

        {/* Price Chart */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase text-gray-400 tracking-wider">
            Price History
          </h4>
          <div className="rounded-lg bg-black/30 border border-white/10 p-4" style={{ height: '180px' }}>
            <PriceChart priceHistory={profile.priceHistory} height={160} />
          </div>
        </div>

        {/* Volume Chart */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase text-gray-400 tracking-wider">
            Volume
          </h4>
          <div className="rounded-lg bg-black/30 border border-white/10 p-4" style={{ height: '80px' }}>
            <VolumeChart
              volumeHistory={profile.volumeHistory}
              priceHistory={profile.priceHistory}
              height={60}
            />
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-gray-500">All-Time High</p>
            <p className="font-mono font-bold text-sm mt-1" style={{ color: COLORS.gainGreen }}>
              {formatPrice(profile.allTimeHigh)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-gray-500">All-Time Low</p>
            <p className="font-mono font-bold text-sm mt-1" style={{ color: COLORS.lossRed }}>
              {formatPrice(profile.allTimeLow)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-gray-500">Market Cap</p>
            <p className="font-mono font-bold text-sm mt-1" style={{ color: COLORS.tealAccent }}>
              {profile.marketCap}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-gray-500">24h Volume</p>
            <p className="font-mono font-bold text-sm mt-1" style={{ color: COLORS.primaryCoral }}>
              {profile.volume24h.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Bank of Users Stats */}
        <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users size={16} />
            Bank of Users
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-500">Total Longs</p>
              <p className="font-mono font-bold" style={{ color: COLORS.gainGreen }}>
                {profile.bankOfUsers.totalLongs.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Total Shorts</p>
              <p className="font-mono font-bold" style={{ color: COLORS.primaryCoral }}>
                {profile.bankOfUsers.totalShorts.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Demand Score</p>
              <p className="font-mono font-bold" style={{ color: COLORS.tealAccent }}>
                {profile.bankOfUsers.demandScore}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Unique Viewers</p>
              <p className="font-mono font-bold text-blue-400">
                {profile.bankOfUsers.uniqueViewers.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Conversion Rate</p>
              <p className="font-mono font-bold" style={{ color: COLORS.gold }}>
                {profile.bankOfUsers.conversionRate}%
              </p>
            </div>
            <div>
              <p className="text-gray-500">Avg Hold Time</p>
              <p className="font-mono font-bold text-purple-400">
                {profile.bankOfUsers.avgHoldTime}
              </p>
            </div>
          </div>
        </div>

        {/* Trading Buttons */}
        <div className="grid grid-cols-2 gap-3 sticky bottom-4">
          <button
            onClick={() => handleTrade('LONG')}
            disabled={isTrading || tokens < TOKEN_CONFIG.longCost}
            className="px-4 py-3 rounded-lg font-mono font-semibold text-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            style={{
              backgroundColor: `${COLORS.gainGreen}20`,
              borderColor: `${COLORS.gainGreen}50`,
              color: COLORS.gainGreen,
              border: `1px solid ${COLORS.gainGreen}50`
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <span>LONG</span>
              <span className="text-xs opacity-70">
                {TOKEN_CONFIG.longCost} $EVO
              </span>
            </div>
          </button>
          <button
            onClick={() => handleTrade('SHORT')}
            disabled={isTrading || tokens < TOKEN_CONFIG.shortCost}
            className="px-4 py-3 rounded-lg font-mono font-semibold text-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            style={{
              backgroundColor: `${COLORS.primaryCoral}20`,
              borderColor: `${COLORS.primaryCoral}50`,
              color: COLORS.primaryCoral,
              border: `1px solid ${COLORS.primaryCoral}50`
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <span>SHORT</span>
              <span className="text-xs opacity-70">
                {TOKEN_CONFIG.shortCost} $EVO
              </span>
            </div>
          </button>
        </div>

        {/* Agent Scores */}
        <div className="space-y-3 mt-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity size={16} />
            AI Agent Analysis
          </h4>
          <div className="space-y-2">
            {AGENTS.map((agent, idx) => {
              const agentScore = profile.agentScores[agent.id]
              if (!agentScore) return null

              return (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  agentScore={agentScore}
                  expanded={expandedAgent === agent.id}
                  onToggle={() =>
                    setExpandedAgent(expandedAgent === agent.id ? null : agent.id)
                  }
                  index={idx}
                />
              )
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}

// Main Market Screen
export default function MarketScreen({ profiles = [], tokens = 1500, onTrade = () => {} }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)

  // Filter profiles based on search and tab
  const filteredProfiles = useMemo(() => {
    let results = profiles

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.company.toLowerCase().includes(query) ||
        p.job.toLowerCase().includes(query)
      )
    }

    // Apply tab filter
    if (activeTab === 'Trending') {
      results = results.sort((a, b) => b.priceChangePct - a.priceChangePct).slice(0, 6)
    } else if (activeTab === 'New IPOs') {
      // Mock: profiles with lowest all-time history (newer profiles)
      results = results.sort((a, b) => a.allTimeLow - b.allTimeLow).slice(0, 4)
    } else if (activeTab === 'Watchlist') {
      // Mock: empty for now, but user could add favorites
      results = []
    }

    return results
  }, [searchQuery, activeTab])

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile)
    setIsBottomSheetOpen(true)
  }

  const handleTrade = async (profileId, type) => {
    // Call parent callback
    await onTrade?.(profileId, type)
  }

  return (
    <div className="w-full max-w-[430px] mx-auto bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 py-6 border-b border-white/10 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Market</h1>
        <TokenDisplay tokens={tokens} compact={false} />
      </div>

      {/* Ticker Banner */}
      <TickerBanner profiles={profiles} />

      {/* Filter Tabs */}
      <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Search Bar */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Market Overview */}
      <MarketOverview profiles={profiles} />

      {/* Profile Listings */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map(profile => (
            <MarketCard
              key={profile.id}
              profile={profile}
              onClick={() => handleProfileSelect(profile)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Search size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No profiles found</p>
          </div>
        )}
      </div>

      {/* News Section */}
      <div className="px-4 py-6 border-t border-white/10 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap size={20} style={{ color: COLORS.gold }} />
          Market News
        </h2>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {MARKET_NEWS.slice(0, 4).map(news => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      </div>

      {/* Trading Bottom Sheet */}
      <TradingBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        profile={selectedProfile}
        tokens={tokens}
        onTrade={handleTrade}
      />
    </div>
  )
}
