import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center p-4 text-center">
                    <div className="bg-surface-dark border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl">
                        <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-red-500 text-4xl">error_outline</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
                        <p className="text-slate-400 mb-6">The application encountered an unexpected error.</p>

                        <div className="bg-black/30 p-4 rounded-lg text-left overflow-auto max-h-48 mb-6 border border-white/5">
                            <code className="text-xs text-red-400 font-mono break-all block">
                                {this.state.error?.message}
                            </code>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
