import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('STRIKR render error', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-6 text-center">
          <span className="font-display text-5xl font-semibold uppercase tracking-[0.04em] text-accent">
            Reset.
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold uppercase text-paper">
            Something went off script.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-mist">
            The app hit an unexpected error. Your saved sessions and settings are still on this
            device.
          </p>
          <Button className="mt-6" onClick={() => window.location.assign('/')}>
            Back to the room
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
