import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in UI Component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-gray-900 border border-yellow-500/30 p-8 rounded-sm shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/40 rounded-full flex items-center justify-center mx-auto text-yellow-400 font-bold text-2xl">
              !
            </div>
            
            <div>
              <h1 className="font-display text-2xl font-bold tracking-wider text-white mb-2">
                J&J VINTAGE COLLECTION
              </h1>
              <p className="text-yellow-400 font-mono text-xs uppercase tracking-widest">
                System Refresh Required
              </p>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed">
              We encountered a minor display update. Click below to refresh your session.
            </p>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-sm transition-colors shadow-lg"
              >
                Refresh Page
              </button>
              
              <a
                href="/"
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-sm transition-colors border border-gray-700"
              >
                Back Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
