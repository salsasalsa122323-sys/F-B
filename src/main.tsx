import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by RootErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-lg font-black text-white">
              አፕሊኬሽኑን ዳግም ማስጀመር ይፈልጋሉ?
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              ሲስተሙ ዳታዎን ሳይነካ በደህንነት ዝግጁ ሆኗል። ከታች ያለውን አዝራር በመጫን ገጹን ያድሱት።
            </p>
            {this.state.error && (
              <div className="text-[11px] font-mono text-rose-300/80 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-left overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-yellow-400 transition-all"
            >
              🔄 አፑን እንደገና ጫን (Reload App)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
