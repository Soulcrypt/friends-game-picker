'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiX, HiUpload, HiDocument } from 'react-icons/hi'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { importGames } from '@/lib/votes'
import { fetchSteamCoverByTitle } from '@/lib/steam'
import type { Game } from '@/lib/types'
import toast from 'react-hot-toast'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImported: () => void
}

interface PreviewGame {
  title: string
  tags?: string[]
  price?: string
  cover?: string
}

export default function ImportModal({ isOpen, onClose, onImported }: ImportModalProps) {
  const focusTrapRef = useFocusTrap(isOpen)
  const [preview, setPreview] = useState<PreviewGame[]>([])
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        if (!Array.isArray(data)) {
          toast.error('JSON must be an array of games')
          return
        }

        const games = data.filter((g: any) => g.title && typeof g.title === 'string')
        if (games.length === 0) {
          toast.error('No valid games found (each needs a "title" field)')
          return
        }

        setPreview(games)
      } catch {
        toast.error('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.json')) {
      handleFile(file)
    } else {
      toast.error('Please drop a .json file')
    }
  }, [handleFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleImport = useCallback(async () => {
    setImporting(true)

    // Enrich games with Steam covers
    const enriched: Partial<Game>[] = await Promise.all(
      preview.map(async (game) => {
        if (game.cover) {
          return game as Partial<Game>
        }

        const steamData = await fetchSteamCoverByTitle(game.title)
        return {
          title: game.title,
          tags: game.tags || steamData?.genres || [],
          price: game.price || steamData?.price || 'TBD',
          cover: steamData?.cover || '',
          rawg_id: steamData?.steam_appid,
          metacritic: steamData?.metacritic ?? undefined,
          trailer_url: steamData?.trailer_url,
        }
      })
    )

    const count = await importGames(enriched)
    setImporting(false)

    if (count > 0) {
      toast.success(`Imported ${count} game${count > 1 ? 's' : ''}`)
      onImported()
      onClose()
      setPreview([])
    } else {
      toast.error('No new games imported (may already exist)')
    }
  }, [preview, onImported, onClose])

  const handleClose = useCallback(() => {
    onClose()
    setPreview([])
    setDragOver(false)
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            ref={focusTrapRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Import Games"
            className="relative glass-strong rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Import Games</h2>
              <button
                onClick={handleClose}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <HiX className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {preview.length === 0 ? (
                <>
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      dragOver
                        ? 'border-purple-500/50 bg-purple-500/[0.05]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <HiUpload className="w-8 h-8 text-white/20 mx-auto mb-3" />
                    <p className="text-sm text-white/50 mb-1">
                      Drop a .json file here or click to browse
                    </p>
                    <p className="text-xs text-white/25">
                      Covers will be auto-fetched from Steam
                    </p>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Format example */}
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs text-white/40 mb-2 font-medium">Expected format:</p>
                    <pre className="text-[11px] text-white/30 font-mono leading-relaxed">
{`[
  {
    "title": "Game Name",
    "tags": ["Co-op", "RPG"],
    "price": "$20"
  }
]`}
                    </pre>
                  </div>
                </>
              ) : (
                <>
                  {/* Preview */}
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <HiDocument className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-white/70">
                        {preview.length} game{preview.length > 1 ? 's' : ''} ready to import
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {preview.map((game, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-white/50 text-xs w-5">{i + 1}.</span>
                          <span className="text-white/70 truncate">{game.title}</span>
                          {game.tags && game.tags.length > 0 && (
                            <span className="text-[10px] text-white/30 flex-shrink-0">
                              {game.tags.slice(0, 2).join(', ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setPreview([])}
                      className="flex-1 glass glass-hover rounded-xl py-2.5 text-sm font-medium text-white/60 transition-all"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleImport}
                      disabled={importing}
                      className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-all disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                      }}
                    >
                      {importing ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Importing...
                        </span>
                      ) : (
                        `Import ${preview.length} Game${preview.length > 1 ? 's' : ''}`
                      )}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
