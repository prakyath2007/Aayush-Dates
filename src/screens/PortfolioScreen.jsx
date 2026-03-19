import React, { useState, useMemo } from 'react';
import {
  PositionCard,
  MiniSparkline,
  TokenDisplay,
  BottomSheet,
  PriceChart,
  CircularGauge,
} from '../components/index.jsx';
import { TOKEN_CONFIG } from '../data/market';
import {
  formatPrice,
  formatPct,
  formatChange,
  formatMarketCap,
} from '../utils/helpers';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  X,
  ChevronRight,
  Eye,
} from 'lucide-react';

const PortfolioScreen = ({
  profiles = [],
  tokens,
  positions,
  tradeHistory,
  onCloseTrade,
}) => {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showChart, setShowChart] = useState(false);

  // Generate mock portfolio performance data
  const portfolioData = useMemo(() => {
    const data = [];
    let value = 10000;
    for (let i = 0; i < 30; i++) {
      const change = (Math.random() - 0.5) * 400; // ±2% of 10000
      value = Math.max(value + change, 5000); // prevent negative
      data.push({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
          .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          .split(' ')
          .join('/'),
        value: Math.round(value),
      });
    }
    return data;
  }, []);

  // Calculate portfolio summary metrics
  const portfolioSummary = useMemo(() => {
    let totalValue = tokens; // available tokens
    let totalInvested = 0;
    let totalUnrealized = 0;

    positions.forEach((position) => {
      const profile = profiles.find((p) => p.id === position.profileId);
      if (!profile) return;

      const currentPrice = profile.currentPrice;
      const entryPrice = position.entryPrice;
      const positionValue = position.amount * currentPrice;
      const investedAmount = position.amount * entryPrice;
      const unrealizedPnL =
        position.type === 'LONG'
          ? positionValue - investedAmount
          : investedAmount - positionValue;

      totalValue += positionValue;
      totalInvested += investedAmount;
      totalUnrealized += unrealizedPnL;
    });

    return {
      totalValue,
      totalInvested,
      totalUnrealized,
      unrealizedPct: totalInvested > 0 ? (totalUnrealized / totalInvested) * 100 : 0,
    };
  }, [tokens, positions]);

  // Calculate estimated daily dividends
  const estimatedDailyDividend = useMemo(() => {
    let profitableValue = 0;

    positions.forEach((position) => {
      const profile = profiles.find((p) => p.id === position.profileId);
      if (!profile) return;

      const currentPrice = profile.currentPrice;
      const entryPrice = position.entryPrice;
      const positionValue = position.amount * currentPrice;
      const investedAmount = position.amount * entryPrice;

      if (position.type === 'LONG' && currentPrice > entryPrice) {
        profitableValue += positionValue;
      } else if (position.type === 'SHORT' && currentPrice < entryPrice) {
        profitableValue += investedAmount;
      }
    });

    return profitableValue * (TOKEN_CONFIG.dividendRate || 0.02);
  }, [positions]);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-[#0a0a12] via-[#0a0a12] to-transparent px-4 pt-4 pb-3">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-sm text-gray-400 mt-1">Track your positions</p>
      </div>

      <div className="px-4 pb-20">
        {/* Portfolio Summary Card */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#0f0f1a] to-[#0a0a12] backdrop-blur-xl border border-white/8 p-5 space-y-4 shadow-2xl">
          {/* Top row: Value and Tokens */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-medium">
                Portfolio Value
              </p>
              <p className="text-3xl font-bold font-mono text-white">
                {formatPrice(portfolioSummary.totalValue)}
              </p>
            </div>
            <TokenDisplay tokens={tokens} compact />
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

          {/* Bottom row: Unrealized P&L and Invested */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-medium">
                Unrealized P&L
              </p>
              <div className="flex items-center gap-2">
                <p
                  className={`text-xl font-bold font-mono ${
                    portfolioSummary.totalUnrealized >= 0
                      ? 'text-[#34d399]'
                      : 'text-[#ef4444]'
                  }`}
                >
                  {formatPrice(portfolioSummary.totalUnrealized)}
                </p>
                <span
                  className={`text-sm font-mono ${
                    portfolioSummary.unrealizedPct >= 0
                      ? 'text-[#34d399]'
                      : 'text-[#ef4444]'
                  }`}
                >
                  {formatPct(portfolioSummary.unrealizedPct)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-medium">
                Total Invested
              </p>
              <p className="text-xl font-bold font-mono text-white">
                {formatPrice(portfolioSummary.totalInvested)}
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Performance Chart */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 size={20} className="text-[#3ecfcf]" />
              Performance
            </h2>
            <button
              onClick={() => setShowChart(!showChart)}
              className="text-xs text-[#3ecfcf] hover:text-[#34d399] transition-colors font-medium"
            >
              {showChart ? 'Hide' : 'View'}
            </button>
          </div>
          {showChart && (
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#0f0f1a] to-[#0a0a12] backdrop-blur-xl border border-white/8 p-4 overflow-hidden shadow-2xl">
              <PriceChart priceHistory={portfolioData.map(d => d.value)} height={200} />
            </div>
          )}
        </div>

        {/* Open Positions Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity size={20} className="text-[#e8475f]" />
            Open Positions
            {positions.length > 0 && (
              <span className="ml-auto text-sm font-normal text-gray-400">
                {positions.length}
              </span>
            )}
          </h2>

          {positions.length === 0 ? (
            <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/8 border-dashed p-8 text-center">
              <Eye size={32} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 mb-4">No open positions yet.</p>
              <p className="text-sm text-gray-500">
                Go to Market to start trading!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position, index) => {
                const profile = profiles.find(
                  (p) => p.id === position.profileId
                );
                if (!profile) return null;

                const currentPrice = profile.currentPrice;
                const entryPrice = position.entryPrice;
                const positionValue = position.amount * currentPrice;
                const investedAmount = position.amount * entryPrice;
                const unrealizedPnL =
                  position.type === 'LONG'
                    ? positionValue - investedAmount
                    : investedAmount - positionValue;
                const unrealizedPct =
                  investedAmount > 0
                    ? (unrealizedPnL / investedAmount) * 100
                    : 0;
                const isProfit = unrealizedPnL >= 0;

                return (
                  <div
                    key={index}
                    className="rounded-xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-lg border border-white/10 p-4 hover:border-white/20 transition-all duration-300 shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{profile.name}</h3>
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${
                              position.type === 'LONG'
                                ? 'bg-[#34d399]/20 text-[#34d399]'
                                : 'bg-[#e8475f]/20 text-[#e8475f]'
                            }`}
                          >
                            {position.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {position.amount.toFixed(2)} @ {formatPrice(entryPrice)}
                        </p>
                      </div>
                      <button
                        onClick={() => onCloseTrade(index)}
                        className="ml-2 p-2 rounded-lg bg-white/5 hover:bg-[#ef4444]/30 text-gray-400 hover:text-[#ef4444] transition-all duration-300"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Current: {formatPrice(currentPrice)}
                        </p>
                        <p className="text-sm font-mono text-gray-400">
                          Position: {formatPrice(positionValue)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold font-mono ${
                            isProfit ? 'text-[#34d399]' : 'text-[#ef4444]'
                          }`}
                        >
                          {isProfit ? '+' : ''}{formatPrice(unrealizedPnL)}
                        </p>
                        <p
                          className={`text-sm font-mono ${
                            isProfit ? 'text-[#34d399]' : 'text-[#ef4444]'
                          }`}
                        >
                          {isProfit ? '+' : ''}
                          {formatPct(unrealizedPct)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dividends Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-[#3ecfcf]" />
            Dividends
          </h2>

          <div className="rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#0f0f1a] to-[#0a0a12] backdrop-blur-lg border border-white/8 p-5 shadow-2xl">
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                Earn{' '}
                <span className="text-[#34d399] font-bold">
                  {formatPct(TOKEN_CONFIG.dividendRate * 100)}
                </span>{' '}
                daily on profitable positions
              </p>
              <p className="text-xs text-gray-500">
                Dividends accrue automatically on holdings that are in profit.
              </p>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-medium">
                Est. Daily Earnings
              </p>
              <p className="text-2xl font-bold font-mono text-[#34d399]">
                +{formatPrice(estimatedDailyDividend)}
              </p>
            </div>
          </div>
        </div>

        {/* Trade History Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-[#3ecfcf]" />
            Trade History
            {tradeHistory.length > 0 && (
              <span className="ml-auto text-sm font-normal text-gray-400">
                {tradeHistory.length}
              </span>
            )}
          </h2>

          {tradeHistory.length === 0 ? (
            <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/8 border-dashed p-8 text-center">
              <Clock size={32} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No trades completed yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tradeHistory.map((trade, index) => {
                const profile = profiles.find(
                  (p) => p.id === trade.profileId
                );
                if (!profile) return null;

                const isProfit = trade.pnl >= 0;
                const pnlPct =
                  ((trade.closePrice - trade.entryPrice) / trade.entryPrice) *
                  100;

                return (
                  <div
                    key={index}
                    className={`rounded-xl p-4 border transition-all duration-300 shadow-lg ${
                      isProfit
                        ? 'bg-gradient-to-br from-[#34d399]/5 to-[#34d399]/0 border-[#34d399]/20 hover:border-[#34d399]/40'
                        : 'bg-gradient-to-br from-[#ef4444]/5 to-[#ef4444]/0 border-[#ef4444]/20 hover:border-[#ef4444]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{profile.name}</h3>
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${
                              trade.type === 'LONG'
                                ? 'bg-[#34d399]/20 text-[#34d399]'
                                : 'bg-[#e8475f]/20 text-[#e8475f]'
                            }`}
                          >
                            {trade.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Closed{' '}
                          {new Date(trade.timestamp).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold font-mono ${
                            isProfit ? 'text-[#34d399]' : 'text-[#ef4444]'
                          }`}
                        >
                          {isProfit ? '+' : ''}{formatPrice(trade.pnl)}
                        </p>
                        <p
                          className={`text-sm font-mono ${
                            isProfit ? 'text-[#34d399]' : 'text-[#ef4444]'
                          }`}
                        >
                          {isProfit ? '+' : ''}
                          {formatPct(pnlPct)}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>{formatPrice(trade.entryPrice)} → {formatPrice(trade.closePrice)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioScreen;
