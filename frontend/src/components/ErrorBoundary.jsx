import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MASTITIS AI UI ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white rounded-2xl shadow-xl border border-rose-200 p-8 max-w-lg w-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Application Display Notice
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              The application encountered an unexpected render condition. You can reload the
              workspace or reset saved cache.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 text-left font-mono text-[11px] text-rose-700 border border-slate-200 mb-5 overflow-x-auto max-h-40">
              {this.state.error?.toString()}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Reset Saved State
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
