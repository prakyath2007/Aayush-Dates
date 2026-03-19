import React, { useState } from 'react';
import {
  Users,
  Heart,
  TrendingUp,
  Star,
  Trophy,
  Crown,
  ChevronRight,
  Eye,
  BarChart3,
} from 'lucide-react';
import { CommunityCard, MarketCard, MiniSparkline, BottomSheet } from '../components/index.jsx';
import { COMMUNITIES, COUPLES_MARKET } from '../data/market';
import { formatPrice, formatPct } from '../utils/helpers';

export default function CommunityScreen({ profiles = [], tokens }) {
  const [selectedCouple, setSelectedCouple] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  // Mock leaderboard data
  const leaderboard = [
    { id: 1, username: '@alex_trader', return: 142.5 },
    { id: 2, username: '@heart_stonks', return: 118.3 },
    { id: 3, username: '@cupid_cards', return: 97.2 },
    { id: 4, username: '@lovebets_pro', return: 64.8 },
    { id: 5, username: '@match_maker', return: 52.1 },
  ];

  // Top profiles by volume
  const trendingProfiles = profiles.slice(0, 3).map((profile) => ({
    ...profile,
    volume: Math.floor(Math.random() * 50000) + 10000,
  }));

  const getMedalColor = (position) => {
    if (position === 0) return 'bg-yellow-500';
    if (position === 1) return 'bg-gray-400';
    if (position === 2) return 'bg-orange-500';
    return 'bg-gray-700';
  };

  return (
    <div className="w-full max-w-[430px] mx-auto bg-[#0a0a12] min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a12]/95 backdrop-blur border-b border-white/10 p-6">
        <h1 className="text-3xl font-bold text-white">Community</h1>
        <p className="text-gray-400 text-sm mt-1">See who's trending in love</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Couples Market Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#e8475f]" />
              Who's Going to Match?
            </h2>
            <Eye className="w-4 h-4 text-gray-500" />
          </div>

          <div className="space-y-3">
            {COUPLES_MARKET.slice(0, 4).map((couple) => {
              const profile1 = profiles.find((p) => p.id === couple.pair.profile1);
              const profile2 = profiles.find((p) => p.id === couple.pair.profile2);

              return (
                <div
                  key={couple.id}
                  onClick={() => setSelectedCouple(couple)}
                  className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur border border-white/10 rounded-lg p-4 hover:border-[#e8475f]/50 cursor-pointer transition-all group"
                >
                  {/* Profile avatars and names */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e8475f] to-[#3ecfcf] flex items-center justify-center text-white font-bold text-sm">
                        {profile1?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">
                          {profile1?.name}
                        </p>
                        <p className="text-gray-500 text-xs">{profile1?.job}</p>
                      </div>
                    </div>
                    <Heart className="w-4 h-4 text-[#e8475f]" />
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-white text-sm font-semibold text-right">
                          {profile2?.name}
                        </p>
                        <p className="text-gray-500 text-xs text-right">
                          {profile2?.job}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3ecfcf] to-[#34d399] flex items-center justify-center text-white font-bold text-sm">
                        {profile2?.name?.charAt(0)}
                      </div>
                    </div>
                  </div>

                  {/* Probability bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-xs font-medium">
                        Match Probability
                      </span>
                      <span className="text-[#34d399] text-sm font-bold">
                        {Math.round(couple.probability * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#e8475f] to-[#3ecfcf]"
                        style={{ width: `${Math.round(couple.probability * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Odds and reasoning */}
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-xs">{couple.reasoning}</p>
                    <span className="text-[#3ecfcf] font-bold text-sm">
                      {couple.odds}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Communities List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#3ecfcf]" />
              Friend Groups
            </h2>
          </div>

          <div className="space-y-3">
            {COMMUNITIES.map((community) => (
              <div
                key={community.id}
                onClick={() => setSelectedCommunity(community)}
                className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur border border-white/10 rounded-lg p-4 hover:border-[#3ecfcf]/50 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">{community.name}</h3>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-gray-500 text-xs">Members</p>
                    <p className="text-white font-bold">
                      {community.members}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Sentiment</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          community.sentiment === 'bullish'
                            ? 'bg-[#34d399]'
                            : 'bg-[#ef4444]'
                        }`}
                      />
                      <p
                        className={`font-bold text-sm capitalize ${
                          community.sentiment === 'bullish'
                            ? 'text-[#34d399]'
                            : 'text-[#ef4444]'
                        }`}
                      >
                        {community.sentiment}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Volume</p>
                    <p className="text-white font-bold text-sm">
                      {formatPrice(community.totalVolume)}
                    </p>
                  </div>
                </div>

                <p className="text-gray-400 text-xs line-clamp-2">
                  {community.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top Traders This Week
            </h2>
          </div>

          <div className="space-y-2">
            {leaderboard.map((trader, index) => (
              <div
                key={trader.id}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full ${getMedalColor(
                      index
                    )} flex items-center justify-center text-white font-bold text-xs`}
                  >
                    {index + 1}
                  </div>
                  <p className="text-white font-medium text-sm">
                    {trader.username}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#34d399]" />
                  <p className="text-[#34d399] font-bold text-sm">
                    +{trader.return}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Now */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-[#e8475f]" />
              Trending Now
            </h2>
          </div>

          <div className="grid gap-3">
            {trendingProfiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur border border-white/10 rounded-lg p-3 flex items-center justify-between hover:border-[#e8475f]/50 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e8475f] to-[#3ecfcf] flex items-center justify-center text-white font-bold">
                    {profile.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {profile.name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatPrice(profile.currentPrice)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs mb-1">24h Volume</p>
                  <p className="text-[#3ecfcf] font-bold text-sm">
                    {formatPrice(profile.volume)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom sheets */}
      <BottomSheet isOpen={!!selectedCouple} onClose={() => setSelectedCouple(null)} title="Match Details">
        {selectedCouple && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Probability</span>
                <span className="text-[#34d399] font-bold">
                  {Math.round(selectedCouple.probability * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Odds Multiplier</span>
                <span className="text-[#3ecfcf] font-bold">
                  {selectedCouple.odds}
                </span>
              </div>
              <p className="text-gray-400 text-sm">Analysis</p>
              <p className="text-white text-sm">{selectedCouple.reasoning}</p>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet isOpen={!!selectedCommunity} onClose={() => setSelectedCommunity(null)} title={selectedCommunity?.name || 'Community'}>
        {selectedCommunity && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <p className="text-gray-400 text-sm">
                {selectedCommunity.description}
              </p>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
                <div>
                  <p className="text-gray-500 text-xs">Total Members</p>
                  <p className="text-white font-bold text-lg mt-1">
                    {selectedCommunity.members}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Trading Volume</p>
                  <p className="text-[#3ecfcf] font-bold text-lg mt-1">
                    {formatPrice(selectedCommunity.totalVolume)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Sentiment</p>
                  <p className={`font-bold text-lg mt-1 capitalize ${
                    selectedCommunity.sentiment === 'bullish' ? 'text-[#34d399]' : 'text-[#ef4444]'
                  }`}>
                    {selectedCommunity.sentiment}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
