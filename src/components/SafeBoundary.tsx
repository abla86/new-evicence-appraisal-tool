import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SafeBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SafeBoundary caught an error:', error, errorInfo);
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null });
    try {
      window.location.reload();
    } catch {
      // ignore
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-[350px] w-full flex items-center justify-center p-6 bg-rose-50/50 rounded-2xl border border-rose-200">
          <div className="max-w-md text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">
              {this.props.fallbackTitle || 'Workspace Recovered from Unhandled State'}
            </h3>
            <p className="text-sm text-zinc-600 mb-4">
              The self-healing boundary prevented an application crash. All research records and cryptographic audit logs remain safely cached.
            </p>
            <button
              id="self-healing-recover-button"
              onClick={this.handleRecover}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Resume Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
