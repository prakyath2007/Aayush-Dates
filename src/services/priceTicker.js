import { useEffect, useRef } from 'react';
import { TOKEN_CONFIG } from '../data/market';

/**
 * Calculates a profile's "fair value" based on their composite AI agent scores
 * Higher scores result in higher fair values
 * @param {Object} profile - The user profile object
 * @returns {number} The calculated fair value
 */
export function calculateFairValue(profile) {
  if (!profile || !profile.aiAgentScores) {
    return 100; // Default base value
  }

  const { aiAgentScores } = profile;

  // Extract agent scores
  const scores = {
    personability: aiAgentScores.personability || 0,
    authenticity: aiAgentScores.authenticity || 0,
    emotionalIntelligence: aiAgentScores.emotionalIntelligence || 0,
    humor: aiAgentScores.humor || 0,
    compatibility: aiAgentScores.compatibility || 0,
  };

  // Calculate composite score (weighted average, 0-100)
  const weights = {
    personability: 0.2,
    authenticity: 0.25,
    emotionalIntelligence: 0.25,
    humor: 0.15,
    compatibility: 0.15,
  };

  const compositeScore = Object.keys(scores).reduce((sum, key) => {
    return sum + (scores[key] * weights[key]);
  }, 0);

  // Map composite score (0-100) to fair value range (80-200)
  // Base is 100, can range from 80 to 200
  const fairValue = 100 + (compositeScore - 50) * 2;

  return Math.max(80, Math.min(200, fairValue));
}

/**
 * React hook for real-time price ticker with micro-fluctuations
 * Updates prices every 5 seconds based on AI scores, demand, and market dynamics
 * @param {Array} profiles - Array of profile objects with currentPrice, aiAgentScores, bankOfUsers
 * @param {Function} setProfiles - State setter for profiles
 */
export function usePriceTicker(profiles, setProfiles) {
  const intervalRef = useRef(null);
  const pulseStateRef = useRef({});

  useEffect(() => {
    if (!profiles || profiles.length === 0) {
      return;
    }

    // Initialize pulse state and price history on mount
    profiles.forEach((profile) => {
      if (!pulseStateRef.current[profile.id]) {
        pulseStateRef.current[profile.id] = false;
      }

      // Initialize price history if not present
      if (!profile.priceHistory) {
        profile.priceHistory = [profile.currentPrice || 100];
      }

      // Initialize price change percentage
      if (profile.priceChangePct === undefined) {
        profile.priceChangePct = 0;
      }
    });

    // Tick interval - update prices every 5 seconds
    intervalRef.current = setInterval(() => {
      setProfiles((prevProfiles) =>
        prevProfiles.map((profile) => {
          const currentPrice = profile.currentPrice || 100;
          const fairValue = calculateFairValue(profile);

          // Components of price movement:

          // 1. Mean reversion (pull toward fair value)
          const meanReversionStrength = 0.05; // 5% pull toward fair value per tick
          const meanReversionComponent = (fairValue - currentPrice) * meanReversionStrength;

          // 2. Random walk (white noise)
          const randomComponent = (Math.random() - 0.5) * 2; // Range: -1 to +1

          // 3. Score-based bias (higher scores = slight upward bias)
          const compositeScore = profile.aiAgentScores
            ? Object.keys(profile.aiAgentScores).reduce((sum, key) => {
                return sum + (profile.aiAgentScores[key] || 0);
              }, 0) / (Object.keys(profile.aiAgentScores).length || 1)
            : 50;
          const scoreBasedBias = (compositeScore - 50) * 0.01; // Map 0-100 to -0.5 to +0.5

          // 4. Demand/momentum component (more longs = slight upward trend)
          const totalLongs = profile.bankOfUsers?.totalLongs || 0;
          const demandBias = Math.min(totalLongs * 0.005, 0.5); // Cap at 0.5% per tick

          // Combine components (scaled to small percentage movements: 0.1-0.5%)
          const basePerturbation = meanReversionComponent * 0.3 + randomComponent * 0.15 + scoreBasedBias + demandBias * 0.2;

          // Scale to percentage (ensure small movements)
          const movementPercentage = Math.max(-0.5, Math.min(0.5, basePerturbation / 100));

          // Calculate new price
          const priceChange = currentPrice * movementPercentage;
          const newPrice = Math.max(50, currentPrice + priceChange); // Floor at $50

          // Update price history (keep last 30 prices)
          const updatedHistory = [...(profile.priceHistory || [currentPrice]), newPrice];
          if (updatedHistory.length > 30) {
            updatedHistory.shift();
          }

          // Calculate price change percentage relative to oldest price in history
          const oldestPrice = updatedHistory[0];
          const priceChangePct = oldestPrice > 0
            ? ((newPrice - oldestPrice) / oldestPrice) * 100
            : 0;

          // Set pulse flag for animation (toggle on each update)
          const pulseFlag = !pulseStateRef.current[profile.id];
          pulseStateRef.current[profile.id] = pulseFlag;

          return {
            ...profile,
            currentPrice: parseFloat(newPrice.toFixed(2)),
            priceHistory: updatedHistory,
            priceChangePct: parseFloat(priceChangePct.toFixed(2)),
            pulse: pulseFlag,
          };
        })
      );
    }, 5000); // Update every 5 seconds

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [profiles, setProfiles]);
}

/**
 * React hook for daily token reset
 * Checks if 24 hours have passed since last reset and refreshes tokens
 * @param {number} tokens - Current token balance
 * @param {Function} setTokens - State setter for tokens
 * @param {Function} showToast - Callback function to show toast notification
 */
export function useTokenReset(tokens, setTokens, showToast) {
  const minuteCheckRef = useRef(null);

  useEffect(() => {
    const RESET_KEY = 'lastTokenReset';
    const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

    /**
     * Check if token reset should occur
     */
    const checkAndResetTokens = () => {
      const lastResetTimestamp = localStorage.getItem(RESET_KEY);
      const now = Date.now();

      if (!lastResetTimestamp) {
        // First time - initialize reset timestamp
        localStorage.setItem(RESET_KEY, now.toString());
        return;
      }

      const lastReset = parseInt(lastResetTimestamp, 10);
      const timeSinceReset = now - lastReset;

      if (timeSinceReset >= MILLISECONDS_PER_DAY) {
        // More than 24 hours have passed - reset tokens
        const newTokenBalance = TOKEN_CONFIG.dailyAllocation || 500;
        setTokens(newTokenBalance);
        localStorage.setItem(RESET_KEY, now.toString());

        if (showToast && typeof showToast === 'function') {
          showToast('Daily tokens refreshed! +500 $EVO');
        }
      }
    };

    // Check immediately on mount
    checkAndResetTokens();

    // Set up recurring check every minute
    minuteCheckRef.current = setInterval(checkAndResetTokens, 60000);

    // Cleanup on unmount
    return () => {
      if (minuteCheckRef.current) {
        clearInterval(minuteCheckRef.current);
      }
    };
  }, [setTokens, showToast]);
}
