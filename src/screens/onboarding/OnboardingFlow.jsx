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
  Star
} from 'lucide-react'
import { CircularGauge } from '../../components/index.jsx'
import { useAnimatedValue } from '../../hooks/useAnimatedValue'
import { AGENTS } from '../../data/agents'
import { supabase, supabaseReady, ready } from '../../lib/supabase.js'

// ============================================================================
// Interest List with emojis
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
    <div className="w-full h-screen bg-[#06060b] overflow-hidden flex flex-col">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl" />
      </div>

      {/* Progress Bar */}
      {currentStep > 1 && currentStep < 6 && (
        <div className="relative z-10 w-full px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <button onClick={handleBack} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
              <ArrowLeft size={18} className="text-gray-400 hover:text-white" />
            </button>
            <div className="flex gap-1.5">
              {[2, 3, 4, 5].map(step => (
                <div
                  key={step}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: currentStep === step ? '32px' : '8px',
                    background: currentStep >= step
                      ? 'linear-gradient(90deg, #ff2d78, #a855f7)'
                      : 'rgba(255,255,255,0.1)'
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 font-mono">{currentStep - 1}/4</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col items-center justify-start relative z-10">
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
// Reusable Input Component
// ============================================================================
function FormInput({ icon: Icon, label, type = 'text', placeholder, value, onChange, suffix, valid, className = '' }) {
  const filled = value && value.length > 0
  return (
    <div className={className}>
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
          {label}
          {valid && <Check size={12} className="text-emerald-400" />}
        </label>
      )}
      <div className="relative group">
        {Icon && <Icon size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${filled ? 'text-pink-400' : 'text-gray-600'}`} />}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-12' : 'pr-4'} py-3.5 rounded-xl bg-white/[0.04] border text-white placeholder-gray-600 focus:outline-none transition-all duration-300 text-sm ${filled ? 'border-pink-500/40 bg-pink-500/[0.03]' : 'border-white/[0.08] group-hover:border-white/20'} focus:border-pink-500/60 focus:bg-pink-500/[0.05]`}
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
  const styles = {
    primary: {
      background: disabled ? 'rgba(255, 45, 120, 0.2)' : 'linear-gradient(135deg, #ff2d78 0%, #e91e63 50%, #ff2d78 100%)',
      boxShadow: disabled ? 'none' : '0 4px 20px rgba(255, 45, 120, 0.4), 0 0 40px rgba(255, 45, 120, 0.1)',
    },
    success: {
      background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
      boxShadow: '0 4px 20px rgba(0, 255, 136, 0.4), 0 0 40px rgba(0, 212, 255, 0.1)',
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
      style={styles[variant]}
    >
      {children}
    </button>
  )
}

// ============================================================================
// STEP 1: Welcome
// ============================================================================
function Step1Welcome({ onNext, showLogin, setShowLogin, loginEmail, setLoginEmail, loginPassword, setLoginPassword, loginError, loginLoading, onLogin }) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    setTimeout(() => setShowContent(true), 100)
  }, [])

  return (
    <div className="w-full max-w-[430px] text-center py-8 flex flex-col items-center justify-center min-h-[80vh]">
      {/* Logo */}
      <div
        className="mb-10 relative"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl border border-pink-500/30 flex items-center justify-center backdrop-blur-sm">
            <Heart size={32} className="text-pink-400" fill="currentColor" style={{ filter: 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.6))' }} />
            <TrendingUp size={24} className="text-cyan-400 absolute -top-1 -right-1" style={{ filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.6))' }} />
          </div>
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s'
        }}
      >
        <h1
          className="text-5xl font-black tracking-tight mb-3"
          style={{
            background: 'linear-gradient(135deg, #ff2d78 0%, #a855f7 40%, #00d4ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          LoveMarket
        </h1>
        <p className="text-gray-400 text-base">Where every person is a stock</p>
      </div>

      {/* Stats Pills */}
      <div
        className="flex gap-3 mt-8 mb-10"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s'
        }}
      >
        <div className="px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20">
          <span className="text-pink-400 text-sm font-semibold">12K+ Traders</span>
        </div>
        <div className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <span className="text-cyan-400 text-sm font-semibold">94% Accuracy</span>
        </div>
      </div>

      {/* Login / Signup Toggle */}
      <div
        className="w-full space-y-4"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.45s'
        }}
      >
        {!showLogin ? (
          <>
            <CTAButton onClick={onNext}>
              <Sparkles size={18} />
              Launch Your IPO
            </CTAButton>
            <button
              onClick={() => setShowLogin(true)}
              className="w-full py-3 text-sm text-gray-400 hover:text-white transition-colors font-medium"
            >
              Already have an account? <span className="text-pink-400">Log in</span>
            </button>
          </>
        ) : (
          <div className="space-y-3 animate-fadeIn">
            <h3 className="text-lg font-bold text-white mb-4">Welcome back</h3>
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
              <p className="text-xs text-red-400 text-left px-1">{loginError}</p>
            )}
            <CTAButton
              onClick={onLogin}
              disabled={loginLoading || !loginEmail || !loginPassword}
            >
              {loginLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </div>
              ) : (
                <>
                  <ArrowRight size={18} />
                  Log In
                </>
              )}
            </CTAButton>
            <button
              onClick={() => setShowLogin(false)}
              className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Don't have an account? <span className="text-pink-400">Sign up</span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  )
}

// ============================================================================
// STEP 2: Basic Info (Account + Personal)
// ============================================================================
function Step2BasicInfo({ formData, onChange, onNext, canProceed, showPassword, setShowPassword }) {
  return (
    <div className="w-full max-w-[430px] space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Create your profile</h2>
        <p className="text-sm text-gray-400">Our AI agents will use this to evaluate your market value</p>
      </div>

      {/* Account Section */}
      {supabaseReady && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded bg-pink-500/20 flex items-center justify-center">
              <Lock size={11} className="text-pink-400" />
            </div>
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Account</span>
          </div>
          <FormInput
            icon={Mail}
            placeholder="alex@email.com"
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            valid={formData.email && formData.email.includes('@')}
          />
          <FormInput
            icon={Lock}
            placeholder="Min 6 characters"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => onChange('password', e.target.value)}
            valid={formData.password && formData.password.length >= 6}
            suffix={
              <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-gray-300 transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          {formData.password && formData.password.length > 0 && formData.password.length < 6 && (
            <p className="text-xs text-amber-400 px-1">Password must be at least 6 characters</p>
          )}
        </div>
      )}

      {!supabaseReady && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/15">
          <Zap size={16} className="text-cyan-400 flex-shrink-0" />
          <p className="text-xs text-cyan-300/80">Demo mode active. Run <code className="font-mono bg-white/10 px-1 py-0.5 rounded text-cyan-400">npm install</code> for real accounts.</p>
        </div>
      )}

      {/* Personal Info Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
            <User size={11} className="text-purple-400" />
          </div>
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Personal</span>
        </div>

        <FormInput
          icon={User}
          placeholder="First name"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          valid={!!formData.name}
        />

        <div className="grid grid-cols-2 gap-3">
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

      {/* Security Note */}
      <div className="flex items-center gap-2 px-1">
        <Shield size={12} className="text-emerald-500/60" />
        <p className="text-[10px] text-gray-500">Your data is encrypted and never shared without consent</p>
      </div>

      <CTAButton onClick={onNext} disabled={!canProceed}>
        Continue
        <ChevronRight size={18} />
      </CTAButton>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  )
}

// ============================================================================
// STEP 3: Details
// ============================================================================
function Step3Details({ formData, onChange, onNext, canProceed }) {
  return (
    <div className="w-full max-w-[430px] space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Tell us more</h2>
        <p className="text-sm text-gray-400">These details boost your market positioning</p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
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

      {/* Score Preview */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/[0.06] to-pink-500/[0.06] border border-purple-500/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-purple-400" />
            <span className="text-xs text-gray-300 font-medium">Profile Completeness</span>
          </div>
          <span className="text-xs font-bold text-purple-400">
            {[formData.height, formData.education, formData.job, formData.company].filter(Boolean).length}/4
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-pink-500"
            style={{ width: `${[formData.height, formData.education, formData.job, formData.company].filter(Boolean).length * 25}%` }}
          />
        </div>
      </div>

      <CTAButton onClick={onNext} disabled={!canProceed}>
        Continue
        <ChevronRight size={18} />
      </CTAButton>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  )
}

// ============================================================================
// STEP 4: Interests
// ============================================================================
function Step4Interests({ formData, onToggle, onNext, canProceed }) {
  const count = formData.interests.length

  return (
    <div className="w-full max-w-[430px] space-y-6 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Your interests</h2>
          <p className="text-sm text-gray-400">Pick at least 3 to calibrate your market</p>
        </div>
        {/* Counter */}
        <div className="relative flex-shrink-0">
          <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <circle
              cx="24" cy="24" r="20" fill="none"
              stroke={count >= 3 ? '#ff2d78' : '#666'}
              strokeWidth="3"
              strokeDasharray={`${(count / Math.max(count, 3)) * 125.6} 125.6`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${count >= 3 ? 'text-pink-400' : 'text-gray-500'}`}>
            {count}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {INTERESTS_LIST.map(({ name, emoji }) => {
          const selected = formData.interests.includes(name)
          return (
            <button
              key={name}
              onClick={() => onToggle(name)}
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200 active:scale-[0.97]"
              style={{
                background: selected ? 'rgba(255, 45, 120, 0.1)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${selected ? 'rgba(255, 45, 120, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                color: selected ? '#ff7eb3' : '#888',
                boxShadow: selected ? '0 0 20px rgba(255, 45, 120, 0.15)' : 'none',
              }}
            >
              <span className="text-lg">{emoji}</span>
              <span>{name}</span>
              {selected && <Check size={14} className="text-pink-400 ml-auto" />}
            </button>
          )
        })}
      </div>

      <CTAButton onClick={onNext} disabled={!canProceed}>
        Continue
        <ChevronRight size={18} />
      </CTAButton>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  )
}

// ============================================================================
// STEP 5: Connect Socials
// ============================================================================
function Step5Socials({ formData, onConnect, onNext, isSigningUp, signupError }) {
  const socials = [
    {
      name: 'Instagram',
      appName: 'instagram',
      icon: Instagram,
      color: '#E1306C',
      gradient: 'from-pink-500 to-purple-600',
      description: 'Verify lifestyle & authenticity',
      boost: '+18%',
    },
    {
      name: 'LinkedIn',
      appName: 'linkedin',
      icon: Linkedin,
      color: '#0A66C2',
      gradient: 'from-blue-500 to-blue-700',
      description: 'Verify career & education',
      boost: '+22%',
    },
    {
      name: 'Strava',
      appName: 'strava',
      icon: Activity,
      color: '#FC4C02',
      gradient: 'from-orange-500 to-red-600',
      description: 'Share fitness & health data',
      boost: '+12%',
    }
  ]

  const connectedCount = formData.connectedApps.length

  return (
    <div className="w-full max-w-[430px] space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Verify your identity</h2>
        <p className="text-sm text-gray-400">Verified profiles get more interest</p>
      </div>

      {/* Trust Score Preview */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/[0.06] to-cyan-500/[0.06] border border-emerald-500/15">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-400" />
            <span className="text-xs text-gray-300 font-medium">Trust Score Boost</span>
          </div>
          <span className="text-xs font-bold text-emerald-400">
            +{connectedCount === 0 ? '0' : connectedCount === 1 ? '18' : connectedCount === 2 ? '40' : '52'}%
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-cyan-500"
            style={{ width: `${(connectedCount / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {socials.map(({ name, appName, icon: Icon, color, gradient, description, boost }) => {
          const connected = formData.connectedApps.includes(appName)
          return (
            <button
              key={appName}
              onClick={() => onConnect(appName)}
              className="w-full p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 active:scale-[0.98]"
              style={{
                background: connected ? `${color}08` : 'rgba(255,255,255,0.02)',
                borderColor: connected ? `${color}40` : 'rgba(255,255,255,0.06)',
              }}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className="text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-white text-sm">{name}</h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    {boost}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: connected ? `${color}20` : 'rgba(255,255,255,0.05)',
                  borderColor: connected ? `${color}50` : 'transparent',
                }}
              >
                {connected ? (
                  <Check size={16} style={{ color }} />
                ) : (
                  <ChevronRight size={16} className="text-gray-600" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {signupError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{signupError}</p>
        </div>
      )}

      <CTAButton onClick={onNext} disabled={isSigningUp}>
        {isSigningUp ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Preparing your IPO...
          </div>
        ) : (
          <>
            <Zap size={18} />
            Launch My IPO
          </>
        )}
      </CTAButton>

      <button
        onClick={onNext}
        disabled={isSigningUp}
        className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
      >
        Skip for now
      </button>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  )
}

// ============================================================================
// STEP 6: IPO Launch!
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

  return (
    <div className="w-full max-w-[430px] text-center space-y-6 py-6 relative">
      {/* Confetti */}
      {phase >= 1 && (
        <>
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="fixed pointer-events-none"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-5px',
                animation: `confettiFall ${2 + Math.random()}s ease-in forwards`,
                animationDelay: `${Math.random() * 0.8}s`,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: ['#ff2d78', '#00d4ff', '#a855f7', '#00ff88', '#fbbf24'][Math.floor(Math.random() * 5)],
                  opacity: 0.7,
                }}
              />
            </div>
          ))}
        </>
      )}

      {/* Header */}
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div className="text-4xl mb-3">🎉</div>
        <h1 className="text-3xl font-black text-white">Your IPO is Live!</h1>
        <p className="text-gray-400 mt-2">
          Welcome to the market, <span className="text-pink-400 font-bold">{name}</span>
        </p>
      </div>

      {/* Price Card */}
      <div
        className="p-6 rounded-2xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.06) 0%, rgba(168, 85, 247, 0.06) 100%)',
          borderColor: 'rgba(0, 212, 255, 0.2)',
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <p className="text-[10px] uppercase text-gray-500 font-mono tracking-[0.2em] mb-2">
          Initial Market Price
        </p>
        <div
          className="text-5xl font-black"
          style={{
            background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ${Math.round(animatedPrice)}
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10">
            <TrendingUp size={12} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">New Listing</span>
          </div>
          <div className="px-2 py-1 rounded-full bg-white/5">
            <span className="text-xs text-gray-400">500 $LOVE</span>
          </div>
        </div>
      </div>

      {/* AI Score */}
      <div style={{
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div className="flex justify-center mb-4">
          <CircularGauge
            score={animatedScore}
            size={120}
            color="#ff2d78"
            label="AI Score"
            delay={1200}
          />
        </div>

        {/* Agent Analysis */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
            {AGENTS.length} AI Agents Analyzing
          </p>
          <div className="grid grid-cols-3 gap-2">
            {AGENTS.map((agent) => (
              <div
                key={agent.id}
                className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
                  <span className="text-[10px] text-gray-400 truncate">{agent.shortName}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${agentProgress[agent.id] || 0}%`,
                      backgroundColor: agent.color,
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
        className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
        style={{
          opacity: phase >= 4 ? 1 : 0,
          transform: phase >= 4 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Your Market Position</p>
        <p
          className="text-2xl font-black"
          style={{
            background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Top {percentile}%
        </p>
        <p className="text-[10px] text-gray-500 mt-1">Of all new listings this month</p>
      </div>

      {/* CTA */}
      <div
        className="space-y-3 pt-4"
        style={{
          opacity: phase >= 4 ? 1 : 0,
          transform: phase >= 4 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
        }}
      >
        <CTAButton onClick={onComplete} variant="success">
          <TrendingUp size={18} />
          Start Trading
        </CTAButton>
      </div>

      <style>{`
        @keyframes confettiFall {
          to { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
