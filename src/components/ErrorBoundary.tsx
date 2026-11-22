import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Unexpected error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-[#F6F7F5] p-6">
          <div className="w-full max-w-md rounded-2xl border border-[#E5E7E4] bg-white p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#B91C1C]">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="font-display mt-4 text-lg font-bold text-[#141A15]">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-[#566058]">
              Please reload the page to reconnect to Bazar Fresh.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#15663C] px-6 text-sm font-semibold text-white hover:bg-[#105230]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Reload</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
