'use client'

import { Component, ReactNode } from 'react'
import { HiExclamationCircle, HiRefresh } from 'react-icons/hi'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-6">
            <HiExclamationCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-white/80 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-white/50 mb-6 max-w-sm">
            An unexpected error occurred. Try refreshing the page or click retry below.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="text-xs text-red-400/70 bg-red-500/10 rounded-lg p-4 mb-6 max-w-lg overflow-auto text-left">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            className="btn-secondary rounded-xl px-6 py-3 text-sm font-medium flex items-center gap-2"
          >
            <HiRefresh className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Game-specific error fallback component
 */
export function GameLoadError() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-6">
        <HiExclamationCircle className="w-8 h-8 text-amber-400" />
      </div>
      <h2 className="text-lg font-semibold text-white/80 mb-2">
        Failed to load games
      </h2>
      <p className="text-sm text-white/50 mb-6 max-w-sm">
        We couldn't load your game collection. Please check your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn-primary rounded-xl px-6 py-3 text-sm font-medium flex items-center gap-2"
      >
        <HiRefresh className="w-4 h-4" />
        Refresh Page
      </button>
    </div>
  )
}
