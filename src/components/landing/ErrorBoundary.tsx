import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    fetch('/api/report-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)] text-[var(--text-main)]">
          <div className="text-center px-8">
            <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
            <p className="text-[var(--text-muted)] font-mono text-sm mb-6">
              Ha ocurrido un error inesperado. Por favor, recargue la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 text-[11px] font-bold tracking-widest uppercase rounded-full bg-[var(--btn-bg)] text-[var(--btn-text)] hover:bg-[var(--btn-hover)] transition-colors"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
