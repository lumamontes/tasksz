/**
 * ErrorBoundary Component
 * Class-based boundary so a render error in one task panel never silently
 * blanks the whole app. Falls back to a graceful, recoverable message.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, _info: ErrorInfo) {
    console.error('UI render error caught by ErrorBoundary:', error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center bg-theme-panel">
          <p className="text-theme-text font-medium">
            Algo deu errado nesta parte da tela.
          </p>
          <p className="text-sm text-theme-muted max-w-sm">
            Recarregue a página para tentar de novo. Seus dados estão seguros no
            dispositivo.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-theme-accent text-white rounded-lg text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-theme-accent"
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}