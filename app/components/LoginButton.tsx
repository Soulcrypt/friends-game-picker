'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { HiLogout, HiChevronDown } from 'react-icons/hi'
import { FaDiscord } from 'react-icons/fa'

export default function LoginButton() {
  const { user, profile, loading, signInWithDiscord, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true)
      await signInWithDiscord()
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setShowDropdown(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="w-32 h-10 rounded-xl animate-shimmer" style={{ background: 'rgba(255,255,255,0.05)' }} />
    )
  }

  if (!user || !profile) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 disabled:opacity-70"
        style={{
          background: 'rgba(88, 101, 242, 0.9)',
          boxShadow: '0 4px 18px rgba(88, 101, 242, 0.35)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <FaDiscord className="w-4 h-4" />
        <span className="hidden sm:inline">
          {isSigningIn ? 'Connecting...' : 'Login with Discord'}
        </span>
        <span className="sm:hidden">
          {isSigningIn ? '...' : 'Login'}
        </span>
      </motion.button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.discord_username}
            className="w-8 h-8 rounded-lg ring-2 ring-primary/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            {profile.discord_username[0].toUpperCase()}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-text-secondary max-w-[120px] truncate">
          {profile.discord_username}
        </span>
        <HiChevronDown className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-60 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'rgba(22, 26, 35, 0.95)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 20px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.25)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* User info header */}
            <div className="px-4 py-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.discord_username}
                    className="w-11 h-11 rounded-xl ring-2 ring-primary/30"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold">
                    {profile.discord_username[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {profile.discord_username}
                  </p>
                  <p className="text-xs text-text-tertiary flex items-center gap-1.5 mt-0.5">
                    <FaDiscord className="w-3.5 h-3.5 text-[#5865F2]" />
                    Connected
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-150"
              >
                <HiLogout className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
