import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Always log to the console (even in production) so anyone who does
    // check devtools, or a future error-reporting integration, can see it.
    console.error("ErrorBoundary caught an error:", error, info);
  }

  handleRetry = () => {
    // Most render errors are transient (a bad response, a stale route).
    // Clearing the error lets the tree re-render without losing the tab -
    // if it fails again immediately, the user still has "Reload page" below.
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="max-w-xl w-full bg-white border border-red-200 rounded-2xl shadow p-6 space-y-4">
            <div>
              <h1 className="text-xl font-bold text-red-700 mb-2">
                Something went wrong
              </h1>
              <p className="text-sm text-gray-600">
                The app hit an unexpected error. You can try again, or reload
                the page if that doesn't fix it. Your data in Supabase is
                unaffected — this only broke the display.
              </p>
            </div>

            {isDev && this.state.error && (
              <pre className="text-xs bg-red-50 border border-red-100 rounded-lg p-3 overflow-auto max-h-48 text-red-800">
                {String(this.state.error?.message || this.state.error)}
              </pre>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-teal-700 hover:bg-teal-800 text-white
                           py-3 rounded-xl shadow-md text-sm font-bold uppercase"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700
                           py-3 rounded-xl shadow-md text-sm font-bold uppercase"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
