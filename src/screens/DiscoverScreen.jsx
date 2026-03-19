import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  SwipeCard,
  CircularGauge,
  AgentCard,
  BottomSheet,
  PriceChart,
  VolumeChart,
  MiniSparkline,
  SignalBadge,
  TokenDisplay,
} from '../components/index.jsx';
import { AGENTS } from '../data/agents';
import { useSwipe } from '../hooks/useSwipe';
import { formatPrice, formatPct, formatChange, computeCompositeScore, getSignalColor } from '../utils/helpers';
import { Heart, TrendingUp, TrendingDown, Users, Zap } from 'lucide-react';

const DiscoverScreen = ({ profiles = [], tokens, onTrade, onPass }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [swipeFeedback, setSwipeFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisRevealed, setAnalysisRevealed] = useState(false);
  const swipeTimeoutRef = useRef(null);

  const currentProfile = profiles[currentIndex];
  const { onTouchStart, onTouchEnd, swipeDirection, swiping } = useSwipe();

  // Compute composite score for current profile
  const compositeScore = currentProfile ? computeCompositeScore(currentProfile.agentScores, AGENTS) : 0;

  // Handle swipe action
  const handleSwipeComplete = useCallback(() => {
    if (!swipeDirection) return;

    const isLong = swipeDirection === 'right';
    const tradeType = isLong ? 'LONG' : 'SHORT';

    // Show visual feedback
    setSwipeFeedback(tradeType);
    setIsLoading(true);

    // Clear previous timeout
    if (swipeTimeoutRef.current) {
      clearTimeout(swipeTimeoutRef.current);
    }

    // Trigger callback and advance
    swipeTimeoutRef.current = setTimeout(() => {
      onTrade(currentProfile.id, tradeType);
      setCurrentIndex((prev) => (prev + 1) % profiles.length);
      setSwipeFeedback(null);
      setIsLoading(false);
    }, 600);
  }, [swipeDirection, currentProfile, onTrade]);

  // Watch for swipe completion
  useEffect(() => {
    if (swipeDirection && !swiping) {
      handleSwipeComplete();
    }
  }, [swipeDirection, swiping, handleSwipeComplete]);

  // Handle pass action
  const handlePass = useCallback(() => {
    onPass(currentProfile.id);
    setCurrentIndex((prev) => (prev + 1) % profiles.length);
  }, [currentProfile, onPass]);

  // Handle analysis reveal animation
  useEffect(() => {
    if (showAnalysis && !analysisRevealed) {
      const timer = setTimeout(() => {
        setAnalysisRevealed(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showAnalysis, analysisRevealed]);

  // Reset analysis reveal when modal opens
  useEffect(() => {
    if (showAnalysis) {
      setAnalysisRevealed(false);
    }
  }, [showAnalysis, currentIndex]);

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="text-center">
          <p className="text-cyan-400 mb-4">No more profiles available</p>
          <button
            onClick={() => setCurrentIndex(0)}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-lg text-white font-semibold hover:opacity-90 transition"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-gradient-to-b from-slate-950 to-slate-900 min-h-screen flex flex-col pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 relative z-20">
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
          Discover
        </h1>
        <div className="flex items-center gap-2">
          <TokenDisplay tokens={tokens} />
        </div>
      </div>

      {/* Profile Index Indicator */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          {profiles.slice(0, 3).map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all ${
                idx === currentIndex % 3
                  ? 'w-6 bg-gradient-to-r from-pink-500 to-cyan-500'
                  : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-slate-400">
          {(currentIndex % profiles.length) + 1} / {profiles.length}
        </span>
      </div>

      {/* Swipe Cards Container */}
      <div className="flex-1 px-3 flex items-center justify-center relative overflow-hidden">
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="w-full h-full flex items-center justify-center relative"
        >
          {/* Card Stack Effect */}
          {[2, 1, 0].map((offset) => {
            const index = (currentIndex + offset) % profiles.length;
            const profile = profiles[index];
            const isActive = offset === 0;
            const scale = 1 - offset * 0.03;
            const yOffset = offset * 8;

            return (
              <div
                key={profile.id}
                className="absolute w-full"
                style={{
                  transform: `scale(${scale}) translateY(${yOffset}px)`,
                  zIndex: 10 - offset,
                  opacity: offset === 0 ? 1 : 0.6,
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
              >
                {isActive ? (
                  <div
                    style={{
                      transform: swiping
                        ? `translateX(${swipeDirection === 'right' ? 150 : -150}px) rotate(${
                            swipeDirection === 'right' ? 20 : -20
                          }deg) opacity(0.5)`
                        : 'none',
                      transition: swiping ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    className="w-full"
                  >
                    <SwipeCard profile={profile} />
                  </div>
                ) : (
                  <SwipeCard profile={profile} />
                )}
              </div>
            );
          })}

          {/* Swipe Feedback Overlay */}
          {swipeFeedback && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
              <div
                className={`text-6xl font-bold font-serif tracking-wider ${
                  swipeFeedback === 'LONG'
                    ? 'text-green-400 drop-shadow-[0_0_20px_rgba(0,255,136,0.5)]'
                    : 'text-pink-500 drop-shadow-[0_0_20px_rgba(255,45,120,0.5)]'
                } animate-pulse`}
              >
                {swipeFeedback === 'LONG' ? '↗ LONG' : '↙ SHORT'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons — Pass or Trade */}
      <div className="px-4 flex items-center justify-center gap-4 mt-4">
        {/* Pass Button */}
        <button
          onClick={handlePass}
          disabled={isLoading}
          className="flex-1 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 transition border border-slate-700 hover:border-pink-500/40 text-base font-bold text-slate-300 hover:text-pink-400 active:scale-95"
        >
          Pass
        </button>

        {/* Trade Button — opens detail panel with long/short */}
        <button
          onClick={() => setShowAnalysis(true)}
          disabled={isLoading}
          className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#00d4ff] to-[#a855f7] hover:opacity-90 disabled:opacity-50 transition text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-cyan-500/20"
        >
          <TrendingUp size={18} />
          Trade
        </button>
      </div>

      {/* Analysis Bottom Sheet */}
      <BottomSheet
        isOpen={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        title="She Into You?"
        className="bg-slate-900 border-t border-cyan-500/20"
      >
        <div className="space-y-6 pb-8">
          {/* Loading State */}
          {!analysisRevealed && (
            <div className="text-center py-8">
              <div className="mb-4 flex justify-center">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
              <p className="text-slate-300 text-sm">Analyzing attraction signals...</p>
            </div>
          )}

          {analysisRevealed && (
            <>
              {/* Composite Score Gauge */}
              <div className="flex flex-col items-center gap-3 pt-4">
                <div className="w-32 h-32">
                  <CircularGauge score={compositeScore} label="Attraction Index" />
                </div>
                <p className="text-sm text-slate-400">
                  <span className="font-semibold" style={{ color: compositeScore >= 70 ? '#00ff88' : compositeScore >= 50 ? '#ffd700' : '#ff2d78' }}>
                    {compositeScore.toFixed(0)}%
                  </span>
                  {' match probability'}
                </p>
              </div>

              {/* Price Chart */}
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/10">
                <h3 className="text-sm font-semibold text-cyan-400 mb-3">Price Action</h3>
                <div className="h-40 bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/50">
                  <PriceChart priceHistory={currentProfile.priceHistory} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-xs text-slate-500">Current Price</p>
                    <p className="text-lg font-bold text-white">{formatPrice(currentProfile.currentPrice)}</p>
                  </div>
                  <div
                    className={`text-right ${
                      currentProfile.priceChangePct >= 0 ? 'text-green-400' : 'text-pink-500'
                    }`}
                  >
                    <p className="text-xs text-slate-500">24h Change</p>
                    <p className="text-lg font-bold flex items-center justify-end gap-1">
                      {currentProfile.priceChangePct >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {formatPct(currentProfile.priceChangePct)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank of Users Stats */}
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/10">
                <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <Users size={16} />
                  Bank of Users
                </h3>
                <div className="space-y-3">
                  {/* Longs vs Shorts */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-400">Longs</span>
                        <span className="text-sm font-semibold text-green-400">
                          {currentProfile.bankOfUsers.totalLongs}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                          style={{
                            width: `${
                              (currentProfile.bankOfUsers.totalLongs /
                                (currentProfile.bankOfUsers.totalLongs +
                                  currentProfile.bankOfUsers.totalShorts)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-400">Shorts</span>
                        <span className="text-sm font-semibold text-pink-400">
                          {currentProfile.bankOfUsers.totalShorts}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-red-400 transition-all"
                          style={{
                            width: `${
                              (currentProfile.bankOfUsers.totalShorts /
                                (currentProfile.bankOfUsers.totalLongs +
                                  currentProfile.bankOfUsers.totalShorts)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Demand Score */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-400">Demand Score</span>
                      <span className="text-sm font-semibold text-cyan-400">
                        {currentProfile.bankOfUsers.demandScore.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all"
                        style={{
                          width: `${Math.min((currentProfile.bankOfUsers.demandScore / 10) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Unique Viewers */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
                    <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-slate-500">Unique Viewers</p>
                      <p className="text-lg font-bold text-cyan-400">
                        {currentProfile.bankOfUsers.uniqueViewers}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-slate-500">Market Cap</p>
                      <p className="text-lg font-bold text-pink-400">
                        {formatPrice(currentProfile.currentPrice * (currentProfile.bankOfUsers.totalLongs + 50))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Agent Cards */}
              <div>
                <h3 className="text-sm font-semibold text-cyan-400 mb-3">AI Agent Analysis</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
                  {AGENTS.map((agent, idx) => {
                    const agentScore = currentProfile.agentScores[agent.id];
                    return (
                      <div
                        key={agent.id}
                        style={{
                          animation: `slideInUp 0.3s ease-out forwards`,
                          animationDelay: `${idx * 50}ms`,
                        }}
                      >
                        <AgentCard agent={agent} agentScore={agentScore} index={idx} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trade Action Buttons — LONG or SHORT */}
              <div className="pt-4 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 text-center mb-3">
                  100 tokens per trade • {tokens} available
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAnalysis(false);
                      setSwipeFeedback('SHORT');
                      setIsLoading(true);
                      if (swipeTimeoutRef.current) clearTimeout(swipeTimeoutRef.current);
                      swipeTimeoutRef.current = setTimeout(() => {
                        onTrade(currentProfile.id, 'SHORT');
                        setCurrentIndex((prev) => (prev + 1) % profiles.length);
                        setSwipeFeedback(null);
                        setIsLoading(false);
                      }, 600);
                    }}
                    disabled={tokens < 100}
                    className="flex-1 py-4 rounded-xl bg-gradient-to-r from-pink-600 to-red-600 hover:opacity-90 disabled:opacity-40 transition text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95"
                  >
                    <TrendingDown size={18} />
                    Short
                  </button>
                  <button
                    onClick={() => {
                      setShowAnalysis(false);
                      setSwipeFeedback('LONG');
                      setIsLoading(true);
                      if (swipeTimeoutRef.current) clearTimeout(swipeTimeoutRef.current);
                      swipeTimeoutRef.current = setTimeout(() => {
                        onTrade(currentProfile.id, 'LONG');
                        setCurrentIndex((prev) => (prev + 1) % profiles.length);
                        setSwipeFeedback(null);
                        setIsLoading(false);
                      }, 600);
                    }}
                    disabled={tokens < 100}
                    className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 disabled:opacity-40 transition text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95"
                  >
                    <TrendingUp size={18} />
                    Long
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </BottomSheet>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thumb-slate-700::-webkit-scrollbar-thumb {
          background-color: rgb(51, 65, 85);
          border-radius: 2px;
        }
        .scrollbar-track-slate-800::-webkit-scrollbar-track {
          background-color: rgb(30, 41, 59);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default DiscoverScreen;
