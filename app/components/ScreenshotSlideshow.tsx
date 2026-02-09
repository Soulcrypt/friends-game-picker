'use client'

import { useState, useEffect, useRef } from 'react'

interface ScreenshotSlideshowProps {
  screenshots: string[]
  isActive: boolean
}

export default function ScreenshotSlideshow({ screenshots, isActive }: ScreenshotSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isActive || screenshots.length <= 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % screenshots.length)
    }, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, screenshots.length])

  // Preload next image
  useEffect(() => {
    if (!isActive || screenshots.length <= 1) return

    const nextIndex = (currentIndex + 1) % screenshots.length
    if (!loadedImages.has(nextIndex)) {
      const img = new Image()
      img.src = screenshots[nextIndex]
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(nextIndex))
      }
    }
  }, [currentIndex, isActive, screenshots, loadedImages])

  // Reset when deactivated
  useEffect(() => {
    if (!isActive) {
      setCurrentIndex(0)
    }
  }, [isActive])

  if (!screenshots.length) return null

  return (
    <div className="absolute inset-0">
      {screenshots.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: index === currentIndex ? 1 : 0 }}
          onLoad={() => {
            setLoadedImages(prev => new Set(prev).add(index))
          }}
        />
      ))}
    </div>
  )
}
