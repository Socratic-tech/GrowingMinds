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
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="max-w-xl bg-white border border-red-200 rounded-2xl shadow p-6">
            <h1 className="text-xl font-bold text-red-700 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-600">
              The app hit an unexpected error. Try refreshing the page.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
