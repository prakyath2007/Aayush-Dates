import React, { useState, useCallback, useEffect } from 'react'
import { Heart, TrendingUp, Briefcase, Users, User, Bot, X, Zap, MessageCircle, Bell } from 'lucide-react'
import OnboardingFlow from './screens/onboarding/OnboardingFlow'
import DiscoverScreen from './screens/DiscoverScreen'
import MarketScreen from './screens/MarketScreen'
import PortfolioScreen from './screens/PortfolioScreen'
import CommunityScreen from './screens/CommunityScreen'
import ProfileScreen from './screens/ProfileScreen'
import ChatScreen from './screens/ChatScreen'
import EditProfileScreen from './screens/EditProfileScreen'
import CouplesMarketScreen from './screens/CouplesMarketScreen'
import { Toast } from './components/index.jsx'
import { TOKEN_CONFIG } from './data/market'
import { AGENTS } from './data/agents'
import { getProfiles, executeTrade, closeTrade, getPortfolio } from './services/api'
import { scoreAllProfiles } from './services/aiAgents'
import { usePriceTicker, useTokenReset } from './services/priceTicker'
import { useNotifications, requestBrowserNotifications } from './services/notificationService'

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
  const [editingProfile, setEditingProfile] = useState(false)

  // Profiles from Supabase
  const [profiles, setProfiles] = useState([])
  const [profilesLoading, setProfilesLoading] = useState(true)

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, visible: true })
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }))
    }, 3000)
  }, [])

  // Real-time price ticking
  usePriceTicker(profiles, setProfiles)

  // Daily token reset
  useTokenReset(tokens, setTokens, showToast)

  // Notifications
  const { notifications, unreadCount, addNotification } = useNotifications()

  // Request browser notification permission after onboarding
  useEffect(() => {
    if (onboarded) {
      requestBrowserNotifications()
    }
  }, [onboarded])

  // Fetch profiles from Supabase on mount and after onboarding
  useEffect(() => {
    if (onboarded) {
      loadProfiles()
      loadPortfolio()
    }
  }, [onboarded])

  const loadProfiles = async () => {
    setProfilesLoading(true)
    try {
      const data = await getProfiles()
      // Run AI agent scoring on profiles that don't have scores
      const scoredProfiles = scoreAllProfiles(data)
      setProfiles(scoredProfiles)
    } catch (err) {
      console.warn('Failed to load profiles:', err)
    } finally {
      setProfilesLoading(false)
    }
  }

  // Load portfolio from Supabase after onboarding
  const loadPortfolio = async () => {
    try {
      const portfolio = await getPortfolio()
      // Update local state with positions from Supabase
      if (portfolio.positions) {
        setPositions(portfolio.positions.map(pos => ({
          id: pos.positionId,
          profileId: pos.profileId,
          profileName: pos.profileName,
          type: pos.type?.toUpperCase(),
          entryPrice: pos.entryPrice,
          amount: pos.amount,
          timestamp: Date.now()
        })))
      }
      // Update token balance if available
      if (portfolio.availableTokens !== undefined) {
        setTokens(portfolio.availableTokens)
      }
    } catch (err) {
      console.warn('Failed to load portfolio:', err)
    }
  }

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback((user) => {
    setUserData(user)
    setOnboarded(true)
  }, [])

  // Handle trade (LONG or SHORT)
  const handleTrade = useCallback(async (profileId, type) => {
    const profile = profiles.find(p => p.id === profileId)
    if (!profile) return

    const cost = type === 'LONG' ? TOKEN_CONFIG.longCost : TOKEN_CONFIG.shortCost

    if (tokens < cost) {
      showToast('Not enough $EVO tokens', 'error')
      return
    }

    // Optimistically update local state
    setTokens(prev => prev - cost)
    const newPosition = {
      profileId,
      profileName: profile.name,
      type,
      entryPrice: profile.currentPrice,
      amount: 1,
      timestamp: Date.now()
    }
    setPositions(prev => [...prev, newPosition])
    showToast(`Went ${type} on ${profile.name}! -${cost} $EVO`, 'success')

    // Add notification
    addNotification(
      `${type} Position Opened`,
      `You went ${type} on ${profile.name} at $${profile.currentPrice?.toFixed(2)}`,
      'trade'
    )

    // If going LONG, this unlocks chat with that profile
    if (type === 'LONG') {
      addNotification(
        'New Match Unlocked!',
        `You can now chat with ${profile.name}`,
        'match'
      )
    }

    // Try to persist to Supabase in background
    try {
      await executeTrade(profileId, type.toLowerCase(), 1)
    } catch (err) {
      console.warn('Trade not persisted to DB:', err.message)
    }
  }, [tokens, profiles, showToast, addNotification])

  // Handle closing a trade
  const handleCloseTrade = useCallback(async (positionIndex) => {
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
      profileName: position.profileName || profile.name,
      type: position.type,
      entryPrice: position.entryPrice,
      closePrice: currentPrice,
      pnl,
      timestamp: Date.now()
    }

    setPositions(prev => prev.filter((_, i) => i !== positionIndex))
    setTradeHistory(prev => [...prev, tradeRecord])
    setTokens(prev => prev + tokensReturned)

    const pnlType = pnl >= 0 ? 'success' : 'error'
    const pnlStr = pnl >= 0 ? `+${Math.floor(pnl)}` : `${Math.floor(pnl)}`
    showToast(`Closed ${position.type} on ${profile.name}! ${pnlStr} $EVO`, pnlType)

    // Persist to Supabase
    try {
      if (position.id) {
        await closeTrade(position.id)
      }
    } catch (err) {
      console.warn('Close not persisted to DB:', err.message)
    }
  }, [positions, profiles, showToast])

  // Handle pass
  const handlePass = useCallback((profileId) => {
    const profile = profiles.find(p => p.id === profileId)
    const name = profile ? profile.name : profileId
    showToast(`Passed on ${name}`, 'info')
  }, [profiles, showToast])

  // Handle couples market bet
  const handleCouplesBet = useCallback((pairId, direction, amount) => {
    if (tokens < amount) {
      showToast('Not enough $EVO tokens', 'error')
      return
    }
    setTokens(prev => prev - amount)
    showToast(`Bet ${direction} on couple! -${amount} $EVO`, 'success')
    addNotification('Couples Bet Placed', `You bet ${direction} for ${amount} $EVO`, 'trade')
  }, [tokens, showToast, addNotification])

  // Handle profile save
  const handleProfileSave = useCallback((updatedUser) => {
    setUserData(updatedUser)
    setEditingProfile(false)
    showToast('Profile updated!', 'success')
  }, [showToast])

  // If not onboarded, show onboarding flow
  if (!onboarded) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />
  }

  // If editing profile, show edit screen
  if (editingProfile) {
    return (
      <EditProfileScreen
        user={userData}
        onSave={handleProfileSave}
        onBack={() => setEditingProfile(false)}
      />
    )
  }

  // Compute unread chat count (mock)
  const longPositionIds = positions.filter(p => p.type === 'LONG').map(p => p.profileId)

  // Main app layout
  return (
    <div className="flex flex-col min-h-screen max-w-[430px] mx-auto relative bg-[#0a0a12]">
      {/* Content area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {profilesLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="flex gap-1 justify-center mb-3">
                <div className="w-2 h-2 bg-[#e8475f] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[#3ecfcf] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-[#a855f7] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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
        {!profilesLoading && activeTab === 'chat' && (
          <ChatScreen
            profiles={profiles}
            positions={positions}
          />
        )}
        {!profilesLoading && activeTab === 'community' && (
          <CommunityScreen
            profiles={profiles}
            tokens={tokens}
          />
        )}
        {!profilesLoading && activeTab === 'couples' && (
          <CouplesMarketScreen
            profiles={profiles}
            tokens={tokens}
            positions={positions}
            onBet={handleCouplesBet}
          />
        )}
        {!profilesLoading && activeTab === 'profile' && (
          <ProfileScreen
            user={userData}
            tokens={tokens}
            onEditProfile={() => setEditingProfile(true)}
          />
        )}
      </div>

      {/* AI Agent Floating Button */}
      <button
        onClick={() => setShowAgentPanel(!showAgentPanel)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-[#e8475f] to-[#3ecfcf] flex items-center justify-center shadow-lg shadow-[#e8475f]/20 hover:shadow-xl transition-all hover:scale-105 border border-[#e8475f]/20"
      >
        <Bot className="w-6 h-6 text-white" />
      </button>

      {/* Notification Badge on AI Button */}
      {unreadCount > 0 && (
        <div className="fixed bottom-[132px] right-3 z-40 w-5 h-5 rounded-full bg-[#e8475f] flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
        </div>
      )}

      {/* AI Agent Panel */}
      {showAgentPanel && (
        <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setShowAgentPanel(false)}
          />

          {/* Panel */}
          <div className="relative z-50 bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a]/95 to-[#1a1a2e]/80 border-t border-[#3ecfcf]/20 rounded-t-2xl p-6 max-h-[40vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#3ecfcf]" />
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
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#0f0f1a]/50 border border-white/10 hover:border-[#3ecfcf]/30 transition-colors"
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
          <div className="absolute inset-0 bg-[#0a0a12]/90 backdrop-blur-md border-t border-[#e8475f]/15" />

          {/* Navigation tabs */}
          <div className="relative flex items-center justify-around h-20 px-1 safe-area-bottom">
            {[
              { id: 'discover', icon: Heart, label: 'Discover' },
              { id: 'market', icon: TrendingUp, label: 'Market' },
              { id: 'chat', icon: MessageCircle, label: 'Chat' },
              { id: 'portfolio', icon: Briefcase, label: 'Portfolio' },
              { id: 'couples', icon: Users, label: 'Couples' },
              { id: 'profile', icon: User, label: 'Profile' }
            ].map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-transparent bg-gradient-to-r from-[#e8475f] to-[#3ecfcf] bg-clip-text'
                      : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${
                      isActive
                        ? 'text-[#e8475f]'
                        : 'text-gray-500'
                    }`} />
                    {/* Chat unread badge */}
                    {tab.id === 'chat' && longPositionIds.length > 0 && !isActive && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#e8475f] rounded-full" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{tab.label}</span>
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
