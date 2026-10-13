import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ReportErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Report component crashed:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="card p-6 border-red-200 bg-red-50/50 text-red-900 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <h4 className="font-semibold text-sm text-red-800">
              {this.props.fallbackTitle || 'Unable to render report section'}
            </h4>
          </div>
          <p className="text-xs text-red-700">
            {this.state.error?.message || 'An unexpected rendering error occurred in this analytics widget.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Widget</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
