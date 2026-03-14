'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const orbs = [
  { size: 700, x: '10%', y: '20%', color: 'cyan', delay: 0 },
  { size: 600, x: '80%', y: '60%', color: 'purple', delay: 2 },
  { size: 500, x: '60%', y: '10%', color: 'cyan', delay: 4 },
  { size: 550, x: '20%', y: '70%', color: 'purple', delay: 1 },
  { size: 400, x: '50%', y: '50%', color: 'cyan', delay: 3 },
]

export default function FloatingOrbs() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: orb.color === 'cyan'
              ? 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(139, 92, 246, 0.10) 0%, transparent 70%)',
            filter: 'blur(80px)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={prefersReducedMotion ? {} : {
            x: [0, 40, -30, 20, 0],
            y: [0, -30, 40, -20, 0],
            scale: [1, 1.15, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 25 + index * 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  )
}
