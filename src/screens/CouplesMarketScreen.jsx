import React, { useState, useEffect } from 'react';
import {
  Heart,
  Link as LinkIcon,
  TrendingUp,
  Users,
  ArrowRight,
  Plus,
  Check,
  X,
  Coins,
  Trophy,
  ChevronDown,
  Flame,
  Zap,
} from 'lucide-react';
import { TOKEN_CONFIG } from '../data/market';

const CouplesMarketScreen = ({ profiles = [], tokens = 1000, onBet, positions = [] }) => {
  const [pairs, setPairs] = useState([]);
  const [activeBets, setActiveBets] = useState([]);
  const [resolvedBets, setResolvedBets] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState([null, null]);
  const [compatibilityPreview, setCompatibilityPreview] = useState(null);

  // Generate mock pairs from profiles
  useEffect(() => {
    if (profiles.length < 2) return;

    const generatePairs = () => {
      const newPairs = [];
      for (let i = 0; i < Math.min(4, Math.floor(profiles.length / 2)); i++) {
        const idx1 = Math.floor(Math.random() * profiles.length);
        let idx2 = Math.floor(Math.random() * profiles.length);
        while (idx2 === idx1) {
          idx2 = Math.floor(Math.random() * profiles.length);
        }

        const profile1 = profiles[idx1];
        const profile2 = profiles[idx2];
        const sharedInterests =
          profile1.interests?.filter((int) => profile2.interests?.includes(int)).length || 0;
        const locationMatch = profile1.location === profile2.location ? 20 : 0;
        const compatibility = Math.min(100, (sharedInterests * 15 + locationMatch + Math.random() * 30));
        const odds = Math.round(40 + compatibility * 0.6);

        newPairs.push({
          id: `pair-${i}`,
          profile1,
          profile2,
          compatibility: Math.round(compatibility),
          odds,
          totalBets: Math.floor(Math.random() * 500) + 50,
          yesBets: Math.floor(Math.random() * 400) + 20,
          noBets: Math.floor(Math.random() * 200) + 10,
          status: 'active',
        });
      }
      return newPairs;
    };

    setPairs(generatePairs());
  }, [profiles]);

  // Mock resolved bets
  useEffect(() => {
    setResolvedBets([
      {
        id: 'resolved-1',
        profile1: { name: 'Emma', age: 26 },
        profile2: { name: 'James', age: 28 },
        betDirection: 'YES',
        stake: 100,
        payout: 250,
        result: 'won',
      },
      {
        id: 'resolved-2',
        profile1: { name: 'Sophie', age: 24 },
        profile2: { name: 'Alex', age: 27 },
        betDirection: 'NO',
        stake: 75,
        payout: 0,
        result: 'lost',
      },
    ]);
  }, []);

  const calculateCompatibility = (p1, p2) => {
    const sharedInterests = p1.interests?.filter((int) => p2.interests?.includes(int)).length || 0;
    const locationMatch = p1.location === p2.location ? 20 : 0;
    return Math.min(100, (sharedInterests * 15 + locationMatch + Math.random() * 30));
  };

  const handleProfileSelect = (index, profileId) => {
    const newSelected = [...selectedProfiles];
    newSelected[index] = profiles.find((p) => p.id === profileId);
    setSelectedProfiles(newSelected);

    if (newSelected[0] && newSelected[1]) {
      const compat = calculateCompatibility(newSelected[0], newSelected[1]);
      setCompatibilityPreview({
        compatibility: Math.round(compat),
        odds: Math.round(40 + compat * 0.6),
      });
    }
  };

  const handleCreatePair = () => {
    if (selectedProfiles[0] && selectedProfiles[1] && tokens >= 25) {
      // Mock creation
      setShowCreateModal(false);
      setSelectedProfiles([null, null]);
      setCompatibilityPreview(null);
      // In real app, would call API
    }
  };

  const handleBet = (pairId, direction, amount) => {
    if (tokens >= amount) {
      const newBet = {
        id: `bet-${Date.now()}`,
        pairId,
        direction,
        stake: amount,
        multiplier: Math.random() * 1.5 + 1.5,
        timestamp: new Date(),
        status: 'active',
      };
      setActiveBets([...activeBets, newBet]);
      if (onBet) onBet(pairId, direction, amount);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0a0a12' }}
    >
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#e8475f' }}>
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Couples Market</h1>
            <LinkIcon className="w-5 h-5" style={{ color: '#3ecfcf' }} />
          </div>
        </div>
        <p className="text-gray-400 text-sm ml-11">Predict who's going to match</p>
      </div>

      {/* Scroll Container */}
      <div className="px-4 pb-20 space-y-6">
        {/* Featured Pairs Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: '#3ecfcf' }} />
            <h2 className="text-lg font-semibold text-white">Featured Pairs</h2>
          </div>

          <div className="space-y-3">
            {pairs.map((pair) => (
              <div
                key={pair.id}
                className="rounded-2xl p-4 border-2 backdrop-blur-sm transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: 'rgba(15, 15, 23, 0.8)',
                  borderImage: `linear-gradient(135deg, #3ecfcf 0%, #e8475f 100%) 1`,
                }}
              >
                {/* Pair Avatars & Names */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-1">
                    {/* Profile 1 */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-semibold text-sm"
                        style={{
                          background: `linear-gradient(135deg, #3ecfcf 0%, #e8475f 100%)`,
                          borderColor: '#3ecfcf',
                        }}
                      >
                        {pair.profile1.name?.[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-300">
                        {pair.profile1.name}
                      </span>
                      <span className="text-xs text-gray-500">{pair.profile1.age}</span>
                    </div>

                    {/* Heart Link */}
                    <div className="flex-1 flex justify-center">
                      <div className="flex items-center gap-1">
                        <div className="h-px flex-1" style={{ backgroundColor: '#3ecfcf' }} />
                        <Heart
                          className="w-4 h-4"
                          style={{ color: '#e8475f', fill: '#e8475f' }}
                        />
                        <div className="h-px flex-1" style={{ backgroundColor: '#3ecfcf' }} />
                      </div>
                    </div>

                    {/* Profile 2 */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-semibold text-sm"
                        style={{
                          background: `linear-gradient(135deg, #e8475f 0%, #f0b429 100%)`,
                          borderColor: '#e8475f',
                        }}
                      >
                        {pair.profile2.name?.[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-300">
                        {pair.profile2.name}
                      </span>
                      <span className="text-xs text-gray-500">{pair.profile2.age}</span>
                    </div>
                  </div>
                </div>

                {/* Compatibility Score */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-gray-400">Compatibility</span>
                    <span className="text-sm font-bold text-white">{pair.compatibility}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-700 overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${pair.compatibility}%`,
                        background: `linear-gradient(90deg, #34d399 0%, #3ecfcf 100%)`,
                      }}
                    />
                  </div>
                </div>

                {/* Odds */}
                <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-400">Likelihood to Match</span>
                    <span className="text-lg font-bold" style={{ color: '#3ecfcf' }}>
                      {pair.odds}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {pair.totalBets} total bets • {pair.yesBets} YES • {pair.noBets} NO
                  </div>
                </div>

                {/* Cost Info */}
                <div className="flex items-center justify-center gap-2 mb-4 text-xs text-gray-400">
                  <Coins className="w-3 h-3" style={{ color: '#f0b429' }} />
                  <span>50 $EVO per bet</span>
                </div>

                {/* Bet Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleBet(pair.id, 'YES', 50)}
                    disabled={tokens < 50}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: '#34d399',
                      color: '#0a0a12',
                    }}
                  >
                    Bet YES
                  </button>
                  <button
                    onClick={() => handleBet(pair.id, 'NO', 50)}
                    disabled={tokens < 50}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: '#e8475f',
                      color: 'white',
                    }}
                  >
                    Bet NO
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create a Pair Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" style={{ color: '#3ecfcf' }} />
            <h2 className="text-lg font-semibold text-white">Suggest a Match</h2>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed transition-all hover:scale-[1.02] active:scale-95"
            style={{
              borderColor: '#3ecfcf',
              backgroundColor: 'rgba(62, 207, 207, 0.05)',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" style={{ color: '#3ecfcf' }} />
              <span className="font-semibold text-white">Create Pair Suggestion</span>
            </div>
            <div className="text-xs text-gray-400 mt-2">25 $EVO to create</div>
          </button>
        </div>

        {/* Active Bets Section */}
        {activeBets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5" style={{ color: '#e8475f' }} />
              <h2 className="text-lg font-semibold text-white">Active Bets</h2>
              <span className="text-sm text-gray-400">({activeBets.length})</span>
            </div>

            <div className="space-y-3">
              {activeBets.map((bet) => {
                const pair = pairs.find((p) => p.id === bet.pairId);
                return (
                  <div
                    key={bet.id}
                    className="rounded-xl p-3 border border-gray-700"
                    style={{ backgroundColor: 'rgba(15, 15, 23, 0.6)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="px-2 py-1 rounded text-xs font-bold"
                          style={{
                            backgroundColor: bet.direction === 'YES' ? '#34d399' : '#e8475f',
                            color: bet.direction === 'YES' ? '#0a0a12' : 'white',
                          }}
                        >
                          {bet.direction}
                        </div>
                        {pair && (
                          <span className="text-sm font-semibold text-white">
                            {pair.profile1.name} × {pair.profile2.name}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-300">${bet.stake}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Potential payout: {(bet.stake * bet.multiplier).toFixed(0)} $EVO</span>
                      <span className="font-semibold" style={{ color: '#f0b429' }}>
                        {bet.multiplier.toFixed(1)}x
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resolved History Section */}
        {resolvedBets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5" style={{ color: '#f0b429' }} />
              <h2 className="text-lg font-semibold text-white">Resolved Bets</h2>
            </div>

            <div className="space-y-3">
              {resolvedBets.map((bet) => (
                <div
                  key={bet.id}
                  className="rounded-xl p-3 border border-gray-700"
                  style={{ backgroundColor: 'rgba(15, 15, 23, 0.6)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div>
                        {bet.result === 'won' ? (
                          <Check
                            className="w-5 h-5"
                            style={{ color: '#34d399' }}
                          />
                        ) : (
                          <X className="w-5 h-5" style={{ color: '#ef4444' }} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {bet.profile1.name} × {bet.profile2.name}
                        </div>
                        <div className="text-xs text-gray-400">Bet {bet.betDirection}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-sm font-bold"
                        style={{ color: bet.result === 'won' ? '#34d399' : '#ef4444' }}
                      >
                        {bet.result === 'won' ? '+' : '-'}${Math.abs(bet.payout - bet.stake)}
                      </div>
                      <div className="text-xs text-gray-500">Payout: ${bet.payout}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Pair Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end z-50">
          <div
            className="w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            style={{ backgroundColor: '#0a0a12' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Suggest a Match</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Profile Selection */}
            <div className="space-y-4 mb-6">
              {/* First Profile */}
              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-2">
                  Select First Person
                </label>
                <div className="relative">
                  <select
                    value={selectedProfiles[0]?.id || ''}
                    onChange={(e) => handleProfileSelect(0, e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gray-500 outline-none appearance-none"
                  >
                    <option value="">Choose a profile...</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}, {profile.age}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Second Profile */}
              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-2">
                  Select Second Person
                </label>
                <div className="relative">
                  <select
                    value={selectedProfiles[1]?.id || ''}
                    onChange={(e) => handleProfileSelect(1, e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gray-500 outline-none appearance-none"
                  >
                    <option value="">Choose a profile...</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}, {profile.age}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Compatibility Preview */}
            {compatibilityPreview && (
              <div
                className="rounded-xl p-4 mb-6 border border-gray-700"
                style={{ backgroundColor: 'rgba(62, 207, 207, 0.1)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-300">Predicted Match Rate</span>
                  <span className="text-2xl font-bold" style={{ color: '#3ecfcf' }}>
                    {compatibilityPreview.compatibility}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-700 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${compatibilityPreview.compatibility}%`,
                      background: `linear-gradient(90deg, #34d399 0%, #3ecfcf 100%)`,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-3">
                  Odds: {compatibilityPreview.odds}% likely to match
                </div>
              </div>
            )}

            {/* Cost Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4" style={{ color: '#f0b429' }} />
                <span className="text-sm font-semibold text-gray-300">Creation Cost</span>
              </div>
              <span className="text-lg font-bold text-white">25 $EVO</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-lg border border-gray-700 text-white font-semibold transition-all hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePair}
                disabled={!selectedProfiles[0] || !selectedProfiles[1] || tokens < 25}
                className="flex-1 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{ backgroundColor: '#34d399', color: '#0a0a12' }}
              >
                Create Pair (25 $EVO)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouplesMarketScreen;
