'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Heart,
  TrendingUp,
  MapPin,
  GraduationCap,
  Briefcase,
  Building,
  Instagram,
  Linkedin,
  Activity,
  ArrowLeft,
  Check,
  Sparkles,
  Zap,
  ChevronRight,
  Shield,
  Lock,
  Mail,
  User,
  Calendar,
  Ruler,
  Eye,
  EyeOff,
  ArrowRight,
  Star,
  BarChart3,
  Crown,
  Flame
} from 'lucide-react'
import { CircularGauge } from '../../components/index.jsx'
import { useAnimatedValue } from '../../hooks/useAnimatedValue'
import { AGENTS } from '../../data/agents'
import { supabase, supabaseReady, ready } from '../../lib/supabase.js'

// ============================================================================
// Interest List
// ============================================================================
const INTERESTS_LIST = [
  { name: 'Travel', emoji: '✈️' },
  { name: 'Coffee', emoji: '☕' },
  { name: 'Fitness', emoji: '💪' },
  { name: 'Music', emoji: '🎵' },
  { name: 'Photography', emoji: '📸' },
  { name: 'Cooking', emoji: '👨‍🍳' },
  { name: 'Art', emoji: '🎨' },
  { name: 'Tech', emoji: '💻' },
  { name: 'Reading', emoji: '📚' },
  { name: 'Hiking', emoji: '🥾' },
  { name: 'Gaming', emoji: '🎮' },
  { name: 'Movies', emoji: '🎬' },
  { name: 'Fashion', emoji: '👗' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Yoga', emoji: '🧘' },
  { name: 'Dancing', emoji: '💃' },
  { name: 'Wine', emoji: '🍷' },
  { name: 'Startups', emoji: '🚀' },
  { name: 'Dogs', emoji: '🐕' },
  { name: 'Cats', emoji: '🐈' }
]

// ============================================================================
// Shared Styles
// ============================================================================
const STYLES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-12px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.92); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  @keyframes ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes confettiFall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .anim-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .anim-fade-in { animation: fadeIn 0.5s ease-out both; }
  .anim-scale-in { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.2s; }
  .delay-3 { animation-delay: 0.3s; }
  .delay-4 { animation-delay: 0.4s; }
  .delay-5 { animation-delay: 0.5s; }
  .delay-6 { animation-delay: 0.6s; }
  .delay-7 { animation-delay: 0.7s; }
`

// ============================================================================
// OnboardingFlow Component
// ============================================================================
export default function OnboardingFlow({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [showLogin, setShowLogin] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    location: '',
    height: '',
    education: '',
    job: '',
    company: '',
    interests: [],
    connectedApps: []
  })

  const [showPassword, setShowPassword] = useState(false)
  const [ipoPrice, setIpoPrice] = useState(null)
  const [aiScore, setAiScore] = useState(null)
  const [topPercentile, setTopPercentile] = useState(null)
  const [signupError, setSignupError] = useState(null)
  const [isSigningUp, setIsSigningUp] = useState(false)

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleConnectApp = (appName) => {
    setFormData(prev => ({
      ...prev,
      connectedApps: prev.connectedApps.includes(appName)
        ? prev.connectedApps.filter(a => a !== appName)
        : [...prev.connectedApps, appName]
    }))
  }

  const handleLogin = async () => {
    setLoginLoading(true)
    setLoginError(null)
    try {
      await ready
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword
        })
        if (error) throw error
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single()

        onComplete({
          name: profile?.name || data.user.user_metadata?.name || 'User',
          email: loginEmail,
          ipoPrice: profile?.current_price || 100,
          aiScore: 75,
          topPercentile: 80
        })
      } else {
        onComplete({
          name: 'Demo User',
          email: loginEmail,
          ipoPrice: 100,
          aiScore: 75,
          topPercentile: 80
        })
      }
    } catch (err) {
      setLoginError(err.message)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLaunchIPO = async () => {
    setIsSigningUp(true)
    setSignupError(null)

    try {
      await ready

      const price = Math.floor(Math.random() * 51) + 100
      const score = Math.floor(Math.random() * 26) + 60
      const percentile = Math.floor(Math.random() * 30) + 65

      if (supabase) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { name: formData.name } }
        })
        if (authError) throw authError

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              name: formData.name,
              age: parseInt(formData.age),
              location: formData.location,
              height: formData.height,
              education: formData.education,
              job: formData.job,
              company: formData.company,
              bio: '',
              interests: formData.interests,
              instagram: formData.connectedApps.includes('instagram'),
              linkedin: formData.connectedApps.includes('linkedin'),
              strava: formData.connectedApps.includes('strava'),
              ipo_price: price,
              current_price: price,
              previous_price: price,
              all_time_high: price,
              all_time_low: price,
            })
          if (profileError) console.warn('Profile creation error:', profileError.message)

          await supabase.from('token_ledger').insert({
            user_id: authData.user.id,
            amount: 500,
            reason: 'initial_allocation',
            balance: 500,
          })
        }
      }

      setIpoPrice(price)
      setAiScore(score)
      setTopPercentile(percentile)
      setCurrentStep(6)
    } catch (err) {
      console.error('Signup error:', err)
      setSignupError(err.message)
    } finally {
      setIsSigningUp(false)
    }
  }

  const handleComplete = () => {
    onComplete({
      ...formData,
      ipoPrice,
      aiScore,
      topPercentile
    })
  }

  const canProceedStep2 = formData.name && formData.age && formData.location &&
    (!supabaseReady || (formData.email && formData.password && formData.password.length >= 6))
  const canProceedStep3 = formData.height && formData.education && formData.job && formData.company
  const canProceedStep4 = formData.interests.length >= 3

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col" style={{ background: '#07070f' }}>
      <style>{STYLES}</style>

      {/* Progress Bar — Steps 2-5 */}
      {currentStep > 1 && currentStep < 6 && (
        <div className="relative z-10 w-full px-5 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/[0.06] transition-colors"
            >
              <ArrowLeft size={16} className="text-white/50" />
            </button>
            <div className="flex-1 flex gap-1">
              {[2, 3, 4, 5].map(step => (
                <div key={step} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: currentStep > step ? '100%' : currentStep === step ? '50%' : '0%',
                      background: 'linear-gradient(90deg, #e8475f, #c44dff)',
                    }}
                  />
                </div>
              ))}
            </div>
            <span className="text-[11px] text-white/25 font-mono w-6 text-right">{currentStep - 1}/4</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 flex flex-col items-center justify-start relative z-10">
        {currentStep === 1 && (
          <Step1Welcome
            onNext={handleNext}
            showLogin={showLogin}
            setShowLogin={setShowLogin}
            loginEmail={loginEmail}
            setLoginEmail={setLoginEmail}
            loginPassword={loginPassword}
            setLoginPassword={setLoginPassword}
            loginError={loginError}
            loginLoading={loginLoading}
            onLogin={handleLogin}
          />
        )}
        {currentStep === 2 && (
          <Step2BasicInfo
            formData={formData}
            onChange={handleInputChange}
            onNext={handleNext}
            canProceed={canProceedStep2}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        )}
        {currentStep === 3 && (
          <Step3Details
            formData={formData}
            onChange={handleInputChange}
            onNext={handleNext}
            canProceed={canProceedStep3}
          />
        )}
        {currentStep === 4 && (
          <Step4Interests
            formData={formData}
            onToggle={handleInterestToggle}
            onNext={handleNext}
            canProceed={canProceedStep4}
          />
        )}
        {currentStep === 5 && (
          <Step5Socials
            formData={formData}
            onConnect={handleConnectApp}
            onNext={handleLaunchIPO}
            isSigningUp={isSigningUp}
            signupError={signupError}
          />
        )}
        {currentStep === 6 && (
          <Step6IpoLaunch
            name={formData.name}
            price={ipoPrice}
            score={aiScore}
            percentile={topPercentile}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Reusable Input
// ============================================================================
function FormInput({ icon: Icon, label, type = 'text', placeholder, value, onChange, suffix, valid, className = '' }) {
  const filled = value && value.length > 0
  return (
    <div className={className}>
      {label && (
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/30 mb-2 uppercase tracking-[0.08em]">
          {label}
          {valid && <Check size={10} className="text-emerald-400" />}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
            style={{ color: filled ? 'rgba(232,71,95,0.7)' : 'rgba(255,255,255,0.15)' }}
          />
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full rounded-[14px] text-[14px] text-white placeholder-white/20 focus:outline-none transition-all duration-300"
          style={{
            padding: '14px 16px',
            paddingLeft: Icon ? '40px' : '16px',
            paddingRight: suffix ? '48px' : '16px',
            background: filled ? 'rgba(232,71,95,0.04)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${filled ? 'rgba(232,71,95,0.2)' : 'rgba(255,255,255,0.06)'}`,
          }}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// CTA Button
// ============================================================================
function CTAButton({ onClick, disabled, children, variant = 'primary', className = '' }) {
  const base = 'w-full py-[15px] rounded-[16px] font-semibold text-[15px] text-white transition-all duration-300 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5'

  const styles = {
    primary: {
      background: disabled
        ? 'rgba(232,71,95,0.15)'
        : 'linear-gradient(135deg, #e8475f 0%, #c43a50 100%)',
      boxShadow: disabled
        ? 'none'
        : '0 8px 32px rgba(232,71,95,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
    },
    success: {
      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      boxShadow: '0 8px 32px rgba(34,197,94,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
    },
    outline: {
      background: 'transparent',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: 'none',
    }
  }

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${className}`} style={styles[variant]}>
      {children}
    </button>
  )
}

// ============================================================================
// Section Header
// ============================================================================
function SectionHeader({ icon: Icon, label, color = '#e8475f' }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-[22px] h-[22px] rounded-md flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon size={11} style={{ color }} />
      </div>
      <span className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.1em]">{label}</span>
    </div>
  )
}

// ============================================================================
// STEP 1 — Welcome (Complete Redesign)
// ============================================================================
function Step1Welcome({ onNext, showLogin, setShowLogin, loginEmail, setLoginEmail, loginPassword, setLoginPassword, loginError, loginLoading, onLogin }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setReady(true))
  }, [])

  // Simulated live ticker data
  const tickerData = [
    { name: 'Sarah M.', price: 142, change: +4.2 },
    { name: 'Alex K.', price: 128, change: +2.8 },
    { name: 'Jordan T.', price: 156, change: -1.3 },
    { name: 'Riley P.', price: 119, change: +6.1 },
    { name: 'Morgan S.', price: 134, change: +3.5 },
    { name: 'Casey L.', price: 147, change: -0.8 },
  ]

  return (
    <div className="w-full max-w-[430px] flex flex-col min-h-[90vh] relative">
      {/* Ambient light — subtle, elegant */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[300px] h-[300px] rounded-full blur-[120px]"
          style={{ top: '-80px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(232,71,95,0.08)' }}
        />
        <div
          className="absolute w-[200px] h-[200px] rounded-full blur-[100px]"
          style={{ bottom: '20%', right: '-40px', background: 'rgba(139,92,246,0.06)' }}
        />
      </div>

      {/* Top section */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 pt-8 pb-6">
        {/* Logo mark */}
        <div
          className="mb-8 relative"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? 'scale(1)' : 'scale(0.8)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s'
          }}
        >
          <div className="relative">
            {/* Outer glow ring */}
            <div
              className="absolute inset-[-12px] rounded-[28px]"
              style={{
                background: 'linear-gradient(135deg, rgba(232,71,95,0.15), rgba(139,92,246,0.1))',
                filter: 'blur(16px)',
                animation: 'pulse-glow 3s ease-in-out infinite',
              }}
            />
            {/* Icon container */}
            <div
              className="relative w-[72px] h-[72px] rounded-[22px] flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, rgba(232,71,95,0.12), rgba(139,92,246,0.08))',
                border: '1px solid rgba(232,71,95,0.15)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="relative">
                <TrendingUp size={28} style={{ color: '#e8475f', filter: 'drop-shadow(0 0 12px rgba(232,71,95,0.4))' }} />
                <Heart
                  size={13}
                  fill="currentColor"
                  className="absolute -bottom-0.5 -right-1.5"
                  style={{ color: '#c44dff', filter: 'drop-shadow(0 0 6px rgba(196,77,255,0.5))' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Title + tagline */}
        <div
          className="text-center mb-8"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s'
          }}
        >
          <h1
            className="text-[42px] font-black tracking-[-0.02em] leading-none mb-3"
            style={{
              background: 'linear-gradient(135deg, #fff 20%, rgba(255,255,255,0.6) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Evolve
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Where your dating profile<br />
            becomes your portfolio
          </p>
        </div>

        {/* Live ticker strip — adds credibility + movement */}
        <div
          className="w-full overflow-hidden mb-8 relative"
          style={{
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.8s ease 0.45s',
            maskImage: 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)',
          }}
        >
          <div className="flex gap-4 whitespace-nowrap" style={{ animation: 'ticker 20s linear infinite' }}>
            {[...tickerData, ...tickerData].map((item, i) => (
              <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-[11px] font-medium text-white/30">{item.name}</span>
                <span className="text-[11px] font-bold text-white/50">${item.price}</span>
                <span className={`text-[10px] font-bold ${item.change > 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                  {item.change > 0 ? '+' : ''}{item.change}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Value props */}
        <div
          className="w-full space-y-2.5 mb-8"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.55s'
          }}
        >
          {[
            { icon: BarChart3, text: 'AI scores every profile across 9 dimensions', color: '#e8475f' },
            { icon: Flame, text: 'Trade on who you think is the best match', color: '#c44dff' },
            { icon: Crown, text: 'Top traders unlock exclusive connections', color: '#f0b429' },
          ].map(({ icon: Ic, text, color }, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-[14px]"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}10` }}>
                <Ic size={15} style={{ color, opacity: 0.8 }} />
              </div>
              <span className="text-[13px] text-white/45 leading-snug">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA section */}
      <div
        className="relative z-10 pb-10 space-y-3"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s'
        }}
      >
        {!showLogin ? (
          <>
            <CTAButton onClick={onNext}>
              Get Started
              <ArrowRight size={16} />
            </CTAButton>
            <button
              onClick={() => setShowLogin(true)}
              className="w-full py-3 text-[13px] transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Already have an account? <span style={{ color: '#e8475f' }}>Log in</span>
            </button>
          </>
        ) : (
          <div className="space-y-3 anim-fade-up">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">Welcome back</h3>
              <button onClick={() => setShowLogin(false)} className="text-[12px] text-white/30 hover:text-white/50 transition-colors">
                Sign up instead
              </button>
            </div>
            <FormInput
              icon={Mail}
              placeholder="Email address"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <FormInput
              icon={Lock}
              placeholder="Password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
            {loginError && (
              <p className="text-[12px] text-red-400/80 px-1">{loginError}</p>
            )}
            <CTAButton
              onClick={onLogin}
              disabled={loginLoading || !loginEmail || !loginPassword}
            >
              {loginLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Logging in...
                </div>
              ) : (
                <>Log In</>
              )}
            </CTAButton>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// STEP 2 — Basic Info
// ============================================================================
function Step2BasicInfo({ formData, onChange, onNext, canProceed, showPassword, setShowPassword }) {
  return (
    <div className="w-full max-w-[430px] py-6 space-y-6 anim-fade-up">
      <div>
        <h2 className="text-[24px] font-bold text-white tracking-[-0.01em] mb-1">Create your profile</h2>
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Our 9 AI agents will evaluate your market value
        </p>
      </div>

      {/* Account Section */}
      {supabaseReady && (
        <div className="space-y-2.5">
          <SectionHeader icon={Lock} label="Account" />
          <FormInput
            icon={Mail}
            placeholder="Email address"
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            valid={formData.email && formData.email.includes('@')}
          />
          <FormInput
            icon={Lock}
            placeholder="Password (min 6 characters)"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => onChange('password', e.target.value)}
            valid={formData.password && formData.password.length >= 6}
            suffix={
              <button onClick={() => setShowPassword(!showPassword)} className="text-white/20 hover:text-white/40 transition-colors">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
          {formData.password && formData.password.length > 0 && formData.password.length < 6 && (
            <p className="text-[11px] text-amber-400/60 px-1">Password must be at least 6 characters</p>
          )}
        </div>
      )}

      {!supabaseReady && (
        <div className="flex items-center gap-3 p-3 rounded-[14px]" style={{ background: 'rgba(62,207,207,0.04)', border: '1px solid rgba(62,207,207,0.08)' }}>
          <Zap size={14} style={{ color: 'rgba(62,207,207,0.6)' }} />
          <p className="text-[11px]" style={{ color: 'rgba(62,207,207,0.5)' }}>
            Demo mode — run <code className="font-mono bg-white/5 px-1 rounded text-[10px]">npm install</code> for real accounts
          </p>
        </div>
      )}

      {/* Personal Info */}
      <div className="space-y-2.5">
        <SectionHeader icon={User} label="Personal" color="#a855f7" />
        <FormInput
          icon={User}
          placeholder="First name"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          valid={!!formData.name}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <FormInput
            icon={Calendar}
            placeholder="Age"
            type="number"
            value={formData.age}
            onChange={(e) => onChange('age', e.target.value)}
            valid={formData.age >= 18}
          />
          <FormInput
            icon={MapPin}
            placeholder="City, State"
            value={formData.location}
            onChange={(e) => onChange('location', e.target.value)}
            valid={!!formData.location}
          />
        </div>
      </div>

      {/* Privacy note */}
      <div className="flex items-center gap-2 px-1">
        <Shield size={11} className="text-emerald-500/40" />
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Your data is encrypted and never shared without consent
        </p>
      </div>

      <CTAButton onClick={onNext} disabled={!canProceed}>
        Continue
        <ChevronRight size={15} />
      </CTAButton>
    </div>
  )
}

// ============================================================================
// STEP 3 — Details
// ============================================================================
function Step3Details({ formData, onChange, onNext, canProceed }) {
  const filledCount = [formData.height, formData.education, formData.job, formData.company].filter(Boolean).length

  return (
    <div className="w-full max-w-[430px] py-6 space-y-6 anim-fade-up">
      <div>
        <h2 className="text-[24px] font-bold text-white tracking-[-0.01em] mb-1">Your background</h2>
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          These details boost your market positioning
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <FormInput
            icon={Ruler}
            label="Height"
            placeholder={'5\'10"'}
            value={formData.height}
            onChange={(e) => onChange('height', e.target.value)}
            valid={!!formData.height}
          />
          <FormInput
            icon={GraduationCap}
            label="Education"
            placeholder="Stanford"
            value={formData.education}
            onChange={(e) => onChange('education', e.target.value)}
            valid={!!formData.education}
          />
        </div>
        <FormInput
          icon={Briefcase}
          label="Job Title"
          placeholder="Product Manager"
          value={formData.job}
          onChange={(e) => onChange('job', e.target.value)}
          valid={!!formData.job}
        />
        <FormInput
          icon={Building}
          label="Company"
          placeholder="Stripe"
          value={formData.company}
          onChange={(e) => onChange('company', e.target.value)}
          valid={!!formData.company}
        />
      </div>

      {/* Progress indicator */}
      <div className="p-4 rounded-[14px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Profile strength</span>
          <span className="text-[11px] font-bold" style={{ color: filledCount === 4 ? '#22c55e' : '#e8475f' }}>
            {filledCount}/4
          </span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: i < filledCount ? '100%' : '0%',
                  background: 'linear-gradient(90deg, #e8475f, #c44dff)',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <CTAButton onClick={onNext} disabled={!canProceed}>
        Continue
        <ChevronRight size={15} />
      </CTAButton>
    </div>
  )
}

// ============================================================================
// STEP 4 — Interests
// ============================================================================
function Step4Interests({ formData, onToggle, onNext, canProceed }) {
  const count = formData.interests.length

  return (
    <div className="w-full max-w-[430px] py-6 space-y-5 anim-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[24px] font-bold text-white tracking-[-0.01em] mb-1">Your interests</h2>
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Pick at least 3 to calibrate your market
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold transition-all duration-300"
          style={{
            background: count >= 3 ? 'rgba(232,71,95,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1.5px solid ${count >= 3 ? 'rgba(232,71,95,0.3)' : 'rgba(255,255,255,0.06)'}`,
            color: count >= 3 ? '#e8475f' : 'rgba(255,255,255,0.2)',
          }}
        >
          {count}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {INTERESTS_LIST.map(({ name, emoji }) => {
          const selected = formData.interests.includes(name)
          return (
            <button
              key={name}
              onClick={() => onToggle(name)}
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-[12px] text-left text-[13px] font-medium transition-all duration-200 active:scale-[0.97]"
              style={{
                background: selected ? 'rgba(232,71,95,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${selected ? 'rgba(232,71,95,0.25)' : 'rgba(255,255,255,0.04)'}`,
                color: selected ? 'rgba(232,71,95,0.85)' : 'rgba(255,255,255,0.35)',
              }}
            >
              <span className="text-base">{emoji}</span>
              <span className="flex-1">{name}</span>
              {selected && <Check size={13} style={{ color: '#e8475f' }} />}
            </button>
          )
        })}
      </div>

      <div className="pt-1">
        <CTAButton onClick={onNext} disabled={!canProceed}>
          Continue
          <ChevronRight size={15} />
        </CTAButton>
      </div>
    </div>
  )
}

// ============================================================================
// STEP 5 — Connect Socials
// ============================================================================
function Step5Socials({ formData, onConnect, onNext, isSigningUp, signupError }) {
  const socials = [
    {
      name: 'Instagram',
      appName: 'instagram',
      icon: Instagram,
      color: '#E1306C',
      description: 'Verify lifestyle & authenticity',
      boost: '+18%',
    },
    {
      name: 'LinkedIn',
      appName: 'linkedin',
      icon: Linkedin,
      color: '#0A66C2',
      description: 'Verify career & education',
      boost: '+22%',
    },
    {
      name: 'Strava',
      appName: 'strava',
      icon: Activity,
      color: '#FC4C02',
      description: 'Share fitness & health data',
      boost: '+12%',
    }
  ]

  const connectedCount = formData.connectedApps.length

  return (
    <div className="w-full max-w-[430px] py-6 space-y-6 anim-fade-up">
      <div>
        <h2 className="text-[24px] font-bold text-white tracking-[-0.01em] mb-1">Verify your identity</h2>
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Verified profiles get higher initial valuations
        </p>
      </div>

      {/* Trust Score */}
      <div className="p-4 rounded-[14px]" style={{ background: 'rgba(34,197,94,0.03)', border: '1px solid rgba(34,197,94,0.08)' }}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Shield size={13} style={{ color: 'rgba(34,197,94,0.6)' }} />
            <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Trust score boost</span>
          </div>
          <span className="text-[12px] font-bold" style={{ color: '#22c55e' }}>
            +{connectedCount === 0 ? '0' : connectedCount === 1 ? '18' : connectedCount === 2 ? '40' : '52'}%
          </span>
        </div>
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(connectedCount / 3) * 100}%`,
              background: 'linear-gradient(90deg, #22c55e, #16a34a)',
            }}
          />
        </div>
      </div>

      {/* Social cards */}
      <div className="space-y-2.5">
        {socials.map(({ name, appName, icon: Icon, color, description, boost }) => {
          const connected = formData.connectedApps.includes(appName)
          return (
            <button
              key={appName}
              onClick={() => onConnect(appName)}
              className="w-full p-4 rounded-[14px] transition-all duration-200 flex items-center gap-3.5 active:scale-[0.98]"
              style={{
                background: connected ? `${color}06` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${connected ? `${color}20` : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}15` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-white text-[13px]">{name}</h4>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.08)', color: 'rgba(34,197,94,0.7)', border: '1px solid rgba(34,197,94,0.1)' }}
                  >
                    {boost}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{description}</p>
              </div>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: connected ? `${color}12` : 'rgba(255,255,255,0.03)',
                }}
              >
                {connected ? (
                  <Check size={14} style={{ color }} />
                ) : (
                  <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.15)' }} />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {signupError && (
        <div className="p-3 rounded-[14px]" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
          <p className="text-[12px] text-red-400/80">{signupError}</p>
        </div>
      )}

      <CTAButton onClick={onNext} disabled={isSigningUp}>
        {isSigningUp ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Preparing your IPO...
          </div>
        ) : (
          <>
            <Zap size={15} />
            Launch My IPO
          </>
        )}
      </CTAButton>

      <button
        onClick={onNext}
        disabled={isSigningUp}
        className="w-full py-2 text-[12px] transition-colors disabled:opacity-40"
        style={{ color: 'rgba(255,255,255,0.2)' }}
      >
        Skip for now
      </button>
    </div>
  )
}

// ============================================================================
// STEP 6 — IPO Launch
// ============================================================================
function Step6IpoLaunch({ name, price, score, percentile, onComplete }) {
  const [phase, setPhase] = useState(0)
  const animatedPrice = useAnimatedValue(price || 0, 2000, 800)
  const animatedScore = useAnimatedValue(score || 0, 2000, 1200)
  const [agentProgress, setAgentProgress] = useState({})

  useEffect(() => {
    setTimeout(() => setPhase(1), 300)
    setTimeout(() => setPhase(2), 800)
    setTimeout(() => setPhase(3), 1500)
    setTimeout(() => setPhase(4), 2200)

    AGENTS.forEach((agent, idx) => {
      setTimeout(() => {
        setAgentProgress(prev => ({ ...prev, [agent.id]: Math.floor(Math.random() * 30) + 65 }))
      }, 1800 + idx * 150)
    })
  }, [])

  const confettiColors = ['#e8475f', '#c44dff', '#22c55e', '#f0b429', '#3ecfcf']

  return (
    <div className="w-full max-w-[430px] text-center py-8 relative">
      {/* Confetti */}
      {phase >= 1 && (
        <>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="fixed pointer-events-none"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-8px',
                animation: `confettiFall ${2.5 + Math.random()}s ease-in forwards`,
                animationDelay: `${Math.random() * 0.6}s`,
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: `${3 + Math.random() * 3}px`,
                  height: `${3 + Math.random() * 3}px`,
                  background: confettiColors[Math.floor(Math.random() * confettiColors.length)],
                  opacity: 0.5,
                }}
              />
            </div>
          ))}
        </>
      )}

      {/* Header */}
      <div className="mb-8" style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(24px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div
          className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.15)' }}
        >
          <Check size={24} style={{ color: '#22c55e' }} />
        </div>
        <h1 className="text-[28px] font-bold text-white tracking-[-0.01em] mb-1">You're live</h1>
        <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Welcome to the market, <span style={{ color: '#e8475f', fontWeight: 600 }}>{name}</span>
        </p>
      </div>

      {/* Price Card */}
      <div
        className="p-6 rounded-[18px] mb-6"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <p className="text-[10px] uppercase font-mono tracking-[0.15em] mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Initial Market Price
        </p>
        <div
          className="text-[48px] font-black leading-none tracking-[-0.02em]"
          style={{
            background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.7))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ${Math.round(animatedPrice)}
        </div>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.08)' }}>
            <TrendingUp size={11} style={{ color: '#22c55e' }} />
            <span className="text-[11px] font-semibold" style={{ color: '#22c55e' }}>New Listing</span>
          </div>
          <div className="px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>500 $EVO</span>
          </div>
        </div>
      </div>

      {/* AI Score */}
      <div style={{
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div className="flex justify-center mb-5">
          <CircularGauge
            score={animatedScore}
            size={120}
            color="#e8475f"
            label="AI Score"
            delay={1200}
          />
        </div>

        {/* Agent grid */}
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {AGENTS.length} AI Agents Analyzing
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {AGENTS.map((agent) => (
              <div
                key={agent.id}
                className="p-2 rounded-[10px]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: agent.color }} />
                  <span className="text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>{agent.shortName}</span>
                </div>
                <div className="h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${agentProgress[agent.id] || 0}%`,
                      backgroundColor: agent.color,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Position */}
      <div
        className="p-4 rounded-[14px] mb-6"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.04)',
          opacity: phase >= 4 ? 1 : 0,
          transform: phase >= 4 ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <p className="text-[10px] uppercase tracking-[0.1em] mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Your Market Position</p>
        <p
          className="text-[24px] font-bold"
          style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Top {percentile}%
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.15)' }}>Of all new listings this month</p>
      </div>

      {/* CTA */}
      <div
        className="space-y-3"
        style={{
          opacity: phase >= 4 ? 1 : 0,
          transition: 'opacity 0.6s ease 0.2s'
        }}
      >
        <CTAButton onClick={onComplete} variant="success">
          <TrendingUp size={16} />
          Start Trading
        </CTAButton>
      </div>
    </div>
  )
}
