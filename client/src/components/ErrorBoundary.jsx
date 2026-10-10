import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SEG ErrorBoundary Caught]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060a12] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-900 border border-red-500/70 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h2 className="text-lg font-bold">SEG Application Runtime Alert</h2>
            </div>
            
            <p className="text-xs text-slate-300">
              A UI rendering error occurred. The system trapped the exception to prevent application crash:
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-red-300 max-h-40 overflow-y-auto break-all">
              {this.state.error?.toString()}
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Reload & Recover Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
