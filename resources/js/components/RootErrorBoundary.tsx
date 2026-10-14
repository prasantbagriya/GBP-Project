import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Building2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary] Caught uncaught application error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCacheAndReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch (e) {
      console.warn('Cache clear error:', e);
    }
    window.location.href = window.location.pathname + '?nocache=' + Date.now();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 select-none font-sans">
          <div className="max-w-lg w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6 text-center">
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>GBP Live Sync Recovery</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Application Interruption Recovered
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                A browser session or module caching glitch occurred. Click reload below to immediately resume normal operation.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3.5 bg-slate-950/80 border border-rose-500/30 rounded-xl text-left overflow-x-auto text-xs font-mono text-rose-300">
                <span className="text-rose-400 font-bold block mb-1">Error Diagnostic:</span>
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-blue-500/20 whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Dashboard</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCacheAndReload}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 cursor-pointer border border-slate-600 whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4 text-slate-400" />
                <span>Purge Cache & Reload</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
