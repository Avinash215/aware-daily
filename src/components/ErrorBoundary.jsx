import { Component } from 'react'

/**
 * Catches render-time errors from anything below it so one malformed story
 * can never take down the whole briefing.
 *
 * Props:
 *  - `fallback`: node, or (error, reset) => node
 *  - `label`: short name of the region being guarded, used in the default UI
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
    this.reset = this.reset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[aware-daily] render error', error, info)
  }

  reset() {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    const { children, fallback, label } = this.props

    if (!error) return children

    if (typeof fallback === 'function') return fallback(error, this.reset)
    if (fallback !== undefined) return fallback

    return (
      <div
        role="alert"
        className="rounded-lg border border-border bg-surface-sunken px-4 py-3 text-meta text-text-secondary"
      >
        <p className="m-0 font-medium text-text-primary">
          {label ? `${label} could not be displayed.` : 'Something could not be displayed.'}
        </p>
        <p className="mt-1 mb-0">The rest of the briefing is unaffected.</p>
        <button
          type="button"
          onClick={this.reset}
          className="mt-3 cursor-pointer rounded-md border border-border bg-surface-raised px-3 py-1.5 text-meta font-medium text-text-primary"
        >
          Try again
        </button>
      </div>
    )
  }
}
