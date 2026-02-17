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
      <div className="w-10 h-10 rounded-full bg-white/[0.05] animate-pulse" />
    )
  }

  if (!user || !profile) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-70"
        style={{
          background: '#5865F2',
          boxShadow: '0 4px 15px rgba(88, 101, 242, 0.3)',
        }}
      >
        <FaDiscord className="w-5 h-5" />
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
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl glass glass-hover transition-all"
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.discord_username}
            className="w-8 h-8 rounded-full ring-2 ring-purple-500/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
            {profile.discord_username[0].toUpperCase()}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-white/80 max-w-[120px] truncate">
          {profile.discord_username}
        </span>
        <HiChevronDown className={`w-4 h-4 text-white/50 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 rounded-xl glass-strong overflow-hidden shadow-xl z-50"
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.discord_username}
                    className="w-10 h-10 rounded-full ring-2 ring-purple-500/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                    {profile.discord_username[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {profile.discord_username}
                  </p>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <FaDiscord className="w-3 h-3" />
                    Connected
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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
