import React, { useState } from 'react';
import {
  User,
  Settings,
  Shield,
  Eye,
  EyeOff,
  Instagram,
  Linkedin,
  Activity,
  LogOut,
  ChevronRight,
  Bell,
  Lock,
  HelpCircle,
  Edit3,
  Camera,
} from 'lucide-react';
import { CircularGauge, PriceChart, AgentCard, TokenDisplay } from '../components/index.jsx';
import { AGENTS } from '../data/agents';
import { formatPrice, formatPct, computeCompositeScore } from '../utils/helpers';

export default function ProfileScreen({ user, tokens }) {
  const [showAiBreakdown, setShowAiBreakdown] = useState(true);
  const [anonymousMode, setAnonymousMode] = useState(false);

  // Mock current price (IPO price + random growth)
  const currentPrice = user.ipoPrice * (1 + (Math.random() * 0.5 - 0.1));
  const priceChange = ((currentPrice - user.ipoPrice) / user.ipoPrice) * 100;
  const daysOnMarket = Math.floor(Math.random() * 180) + 30;
  const totalLongs = Math.floor(Math.random() * 500) + 50;

  // Generate mock agent scores based on user data
  const generateAgentScores = () => {
    return AGENTS.map((agent) => {
      let score = Math.random() * 40 + 40; // Base 40-80

      // Boost scores based on user data
      if (
        agent.name === 'Social Presence' &&
        user.connectedApps &&
        user.connectedApps.length > 0
      ) {
        score += 20;
      }
      if (agent.name === 'Education' && user.education) {
        score += 15;
      }
      if (agent.name === 'Career Growth' && user.company) {
        score += 18;
      }
      if (agent.name === 'Personality' && user.interests && user.interests.length > 3) {
        score += 12;
      }
      if (agent.name === 'Reliability' && user.job) {
        score += 10;
      }

      return {
        ...agent,
        score: Math.min(100, Math.round(score)),
      };
    });
  };

  const agentScores = generateAgentScores();
  const compositeScore = Math.round(
    agentScores.reduce((sum, agent) => sum + agent.score, 0) / agentScores.length
  );

  return (
    <div className="w-full max-w-[430px] mx-auto bg-[#06060b] min-h-screen pb-24">
      {/* Profile Header */}
      <div className="relative bg-gradient-to-b from-white/5 to-transparent pt-8 pb-6 px-6 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff2d78] to-[#00d4ff] flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-[#ff2d78]/30">
                {user.name?.charAt(0) || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 w-5 h-5 bg-[#00d4ff] rounded-full flex items-center justify-center hover:bg-[#00d4ff]/80 transition-all">
                <Camera className="w-3 h-3 text-[#06060b]" />
              </button>
            </div>

            {/* User info */}
            <div>
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-gray-400 text-sm">
                {user.age} • {user.location}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {user.job} @ {user.company}
              </p>
            </div>
          </div>

          <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <Edit3 className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Education badge */}
        {user.education && (
          <p className="text-gray-400 text-xs mt-4">{user.education}</p>
        )}
      </div>

      <div className="p-6 space-y-8">
        {/* Market Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur border border-white/10 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-2">IPO Price</p>
            <p className="text-white font-bold text-lg">
              {formatPrice(user.ipoPrice)}
            </p>
            <p className="text-gray-500 text-xs mt-1">Launch price</p>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur border border-white/10 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-2">Current Price</p>
            <p className="text-white font-bold text-lg">
              {formatPrice(currentPrice)}
            </p>
            <p
              className={`text-xs mt-1 font-semibold ${
                priceChange >= 0 ? 'text-[#00ff88]' : 'text-[#ff2d78]'
              }`}
            >
              {priceChange >= 0 ? '+' : ''}{formatPct(priceChange / 100)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur border border-white/10 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-2">Days on Market</p>
            <p className="text-white font-bold text-lg">{daysOnMarket}</p>
            <p className="text-gray-500 text-xs mt-1">trading period</p>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur border border-white/10 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-2">Total Longs</p>
            <p className="text-[#ff2d78] font-bold text-lg">{totalLongs}</p>
            <p className="text-gray-500 text-xs mt-1">positions held</p>
          </div>
        </div>

        {/* AI Transparency Section - THE INNOVATIVE FEATURE */}
        <div className="border border-[#00d4ff]/30 rounded-xl p-6 bg-gradient-to-br from-[#00d4ff]/10 via-transparent to-transparent backdrop-blur">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#00d4ff]" />
                Your AI Score
              </h2>
              <p className="text-gray-400 text-xs mt-1">
                See exactly how you're being evaluated
              </p>
            </div>
            <button
              onClick={() => setShowAiBreakdown(!showAiBreakdown)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              {showAiBreakdown ? (
                <Eye className="w-5 h-5 text-[#00d4ff]" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          {/* Composite Score Gauge */}
          <div className="flex justify-center mb-8">
            <CircularGauge score={compositeScore} size={140} />
          </div>

          {/* Agent Breakdown */}
          {showAiBreakdown && (
            <div className="space-y-3">
              <p className="text-gray-400 text-xs uppercase font-semibold">
                Agent Evaluation Breakdown
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {agentScores.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-3 hover:border-[#00d4ff]/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${agent.color}20` }}>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agent.color }} />
                        </div>
                        <span className="text-white text-sm font-medium">
                          {agent.name}
                        </span>
                      </div>
                      <span className="text-[#00d4ff] font-bold text-sm">
                        {agent.score}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#ff2d78] to-[#00d4ff]"
                        style={{ width: `${agent.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-4 border-t border-white/10">
                <p className="text-gray-500 text-xs">
                  <span className="text-[#00d4ff]">💡 Tip:</span> Complete your
                  profile and connect your social apps to improve your score.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Connected Apps */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Connected Apps</h3>
          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:border-[#ff2d78]/50 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-[#ff2d78]" />
                <div>
                  <p className="text-white font-medium">Instagram</p>
                  <p className="text-gray-500 text-xs">
                    {user.connectedApps?.includes('instagram')
                      ? 'Connected'
                      : 'Not connected'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:border-[#00d4ff]/50 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <Linkedin className="w-5 h-5 text-[#00d4ff]" />
                <div>
                  <p className="text-white font-medium">LinkedIn</p>
                  <p className="text-gray-500 text-xs">
                    {user.connectedApps?.includes('linkedin')
                      ? 'Connected'
                      : 'Not connected'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:border-[#00ff88]/50 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-[#00ff88]" />
                <div>
                  <p className="text-white font-medium">Strava</p>
                  <p className="text-gray-500 text-xs">
                    {user.connectedApps?.includes('strava')
                      ? 'Connected'
                      : 'Not connected'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Settings List */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Settings</h3>
          <div className="space-y-1 border border-white/10 rounded-lg overflow-hidden">
            {/* Anonymous Mode */}
            <button className="w-full bg-white/5 hover:bg-white/10 transition-all p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-gray-400" />
                <p className="text-white font-medium">Anonymous Mode</p>
              </div>
              <div
                className={`w-10 h-6 rounded-full transition-all ${
                  anonymousMode
                    ? 'bg-[#00d4ff]'
                    : 'bg-white/20'
                }`}
                onClick={() => setAnonymousMode(!anonymousMode)}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                    anonymousMode ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`}
                />
              </div>
            </button>

            {/* Notifications */}
            <button className="w-full bg-white/5 hover:bg-white/10 transition-all p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-white font-medium">Notifications</p>
                  <p className="text-gray-500 text-xs">Push, email & SMS</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            {/* Privacy */}
            <button className="w-full bg-white/5 hover:bg-white/10 transition-all p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-white font-medium">Privacy</p>
                  <p className="text-gray-500 text-xs">Manage your data</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            {/* Help & Support */}
            <button className="w-full bg-white/5 hover:bg-white/10 transition-all p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-white font-medium">Help & Support</p>
                  <p className="text-gray-500 text-xs">FAQ & contact us</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            {/* Log Out */}
            <button className="w-full bg-white/5 hover:bg-white/10 transition-all p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-[#ff2d78]" />
                <p className="text-[#ff2d78] font-medium">Log Out</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Interests Display */}
        {user.interests && user.interests.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Your Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-[#ff2d78]/20 to-[#00d4ff]/20 border border-[#00d4ff]/30 rounded-full px-4 py-2 text-white text-sm font-medium"
                >
                  {interest}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Token Display (Optional footer) */}
      {tokens && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#06060b] to-transparent p-6 flex items-center justify-between border-t border-white/10">
          <p className="text-gray-400 text-sm">Your Balance</p>
          <p className="text-[#00ff88] font-bold text-lg">{formatPrice(tokens)}</p>
        </div>
      )}
    </div>
  );
}
