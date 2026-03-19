import React, { useState, useCallback, useEffect } from 'react'
import { Heart, TrendingUp, Briefcase, Users, User, Bot, X, ChevronUp, Zap } from 'lucide-react'
import OnboardingFlow from './screens/onboarding/OnboardingFlow'
import DiscoverScreen from './screens/DiscoverScreen'
import MarketScreen from './screens/MarketScreen'
import PortfolioScreen from './screens/PortfolioScreen'
import CommunityScreen from './screens/CommunityScreen'
import ProfileScreen from './screens/ProfileScreen'
import { Toast } from './components/index.jsx'
import { TOKEN_CONFIG } from './data/market'
import { AGENTS } from './data/agents'
import { getProfiles } from './services/api'

export default function App() {
  // Onboarding flow
  const [onboarded, setOnboarded] = useState(false)
  const [userData, setUserData] = useState(null)

  // Global state
  const [activeTab, setActiveTab] = useState('discover')
  const [tokens, setTokens] = useState(TOKEN_CONFIG.dailyAllocation)
  const [positions, setPositions] = useState([])
  const [tradeHistory, setTradeHistory] = useState([])
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false })
  const [showAgentPanel, setShowAgentPanel] = useState(false)

  // Profiles from Supabase
  const [profiles, setProfiles] = useState([])
  const [profilesLoading, setProfilesLoading] = useState(true)

  // Fetch profiles from Supabase on mount and after onboarding
  useEffect(() => {
    if (onboarded) {
      loadProfiles()
    }
  }, [onboarded])

  const loadProfiles = async () => {
    setProfilesLoading(true)
    try {
      const data = await getProfiles()
      setProfiles(data)
    } catch (err) {
      console.warn('Failed to load profiles:', err)
    } finally {
      setProfilesLoading(false)
    }
  }

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback((user) => {
    setUserData(user)
    setOnboarded(true)
  }, [])

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, visible: true })
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }))
    }, 3000)
  }, [])

  // Handle trade (LONG or SHORT)
  const handleTrade = useCallback((profileId, type) => {
    const profile = profiles.find(p => p.id === profileId)
    if (!profile) return

    const cost = type === 'LONG' ? TOKEN_CONFIG.longCost : TOKEN_CONFIG.shortCost

    if (tokens < cost) {
      showToast('Not enough $LOVE tokens', 'error')
      return
    }

    // Deduct tokens
    setTokens(prev => prev - cost)

    // Add position
    const newPosition = {
      profileId,
      type,
      entryPrice: profile.currentPrice,
      amount: 1,
      timestamp: Date.now()
    }
    setPositions(prev => [...prev, newPosition])

    // Show success toast
    showToast(`Went ${type} on ${profile.name}! -${cost} $LOVE`, 'success')
  }, [tokens, showToast])

  // Handle closing a trade
  const handleCloseTrade = useCallback((positionIndex) => {
    const position = positions[positionIndex]
    if (!position) return

    const profile = profiles.find(p => p.id === position.profileId)
    if (!profile) return

    const currentPrice = profile.currentPrice
    const priceDifference = currentPrice - position.entryPrice

    // Calculate P&L based on position type
    const pnl = position.type === 'LONG'
      ? priceDifference * position.amount
      : -priceDifference * position.amount

    // Calculate tokens to return
    const tokensReturned = Math.floor((position.entryPrice * position.amount / 100) + pnl)

    // Move position to trade history
    const tradeRecord = {
      profileId: position.profileId,
      type: position.type,
      entryPrice: position.entryPrice,
      closePrice: currentPrice,
      pnl,
      timestamp: Date.now()
    }

    setPositions(prev => prev.filter((_, i) => i !== positionIndex))
    setTradeHistory(prev => [...prev, tradeRecord])
    setTokens(prev => prev + tokensReturned)

    // Show result toast
    const pnlType = pnl >= 0 ? 'success' : 'error'
    const pnlStr = pnl >= 0 ? `+${Math.floor(pnl)}` : `${Math.floor(pnl)}`
    showToast(`Closed ${position.type} on ${profile.name}! ${pnlStr} $LOVE`, pnlType)
  }, [positions, showToast])

  // Handle pass
  const handlePass = useCallback((profileId) => {
    const profile = profiles.find(p => p.id === profileId)
    const name = profile ? profile.name : profileId
    showToast(`Passed on ${name}`, 'info')
  }, [showToast])

  // If not onboarded, show onboarding flow
  if (!onboarded) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />
  }

  // Main app layout
  return (
    <div className="flex flex-col min-h-screen max-w-[430px] mx-auto relative bg-[#06060b]">
      {/* Content area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {profilesLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="flex gap-1 justify-center mb-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <p className="text-sm text-gray-400">Loading market data...</p>
            </div>
          </div>
        )}
        {!profilesLoading && activeTab === 'discover' && (
          <DiscoverScreen
            profiles={profiles}
            tokens={tokens}
            onTrade={handleTrade}
            onPass={handlePass}
          />
        )}
        {!profilesLoading && activeTab === 'market' && (
          <MarketScreen
            profiles={profiles}
            tokens={tokens}
            onTrade={handleTrade}
          />
        )}
        {!profilesLoading && activeTab === 'portfolio' && (
          <PortfolioScreen
            profiles={profiles}
            tokens={tokens}
            positions={positions}
            tradeHistory={tradeHistory}
            onCloseTrade={handleCloseTrade}
          />
        )}
        {!profilesLoading && activeTab === 'community' && (
          <CommunityScreen
            profiles={profiles}
            tokens={tokens}
          />
        )}
        {!profilesLoading && activeTab === 'profile' && (
          <ProfileScreen
            user={userData}
            tokens={tokens}
          />
        )}
      </div>

      {/* AI Agent Floating Button */}
      <button
        onClick={() => setShowAgentPanel(!showAgentPanel)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 animate-pulse border border-pink-300/30"
      >
        <Bot className="w-6 h-6 text-white" />
      </button>

      {/* AI Agent Panel */}
      {showAgentPanel && (
        <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setShowAgentPanel(false)}
          />

          {/* Panel */}
          <div className="relative z-50 bg-gradient-to-t from-slate-900 via-slate-900/95 to-slate-800/80 border-t border-pink-500/30 rounded-t-2xl p-6 max-h-[40vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-pink-500" />
                <h2 className="text-xl font-bold text-white">AI Agents</h2>
              </div>
              <button
                onClick={() => setShowAgentPanel(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-6">
              Your AI agents are always working to find you the best matches
            </p>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 gap-3">
              {AGENTS.map((agent, idx) => (
                <div
                  key={agent.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-pink-500/30 transition-colors"
                >
                  {/* Colored dot */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: agent.color }}
                  />

                  {/* Agent info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">
                        {agent.shortName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {agent.domain}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {Math.round(agent.weight * 100)}% weight
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 max-w-[430px] mx-auto">
        <div className="relative">
          {/* Glass morphism background */}
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md border-t border-pink-500/20" />

          {/* Navigation tabs */}
          <div className="relative flex items-center justify-around h-20 px-2 safe-area-bottom">
            {[
              { id: 'discover', icon: Heart, label: 'Discover' },
              { id: 'market', icon: TrendingUp, label: 'Market' },
              { id: 'portfolio', icon: Briefcase, label: 'Portfolio' },
              { id: 'community', icon: Users, label: 'Community' },
              { id: 'profile', icon: User, label: 'Profile' }
            ].map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-transparent bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text'
                      : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    isActive
                      ? 'text-pink-500'
                      : 'text-gray-500'
                  }`} />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, visible: false }))}
        />
      )}
    </div>
  )
}
