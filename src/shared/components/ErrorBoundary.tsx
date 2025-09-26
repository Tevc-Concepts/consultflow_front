'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
    private retryTimeoutId: NodeJS.Timeout | null = null;

    constructor(props: Props) {
        super(props);
        this.state = { 
            hasError: false, 
            errorId: '' 
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        // Report error to monitoring service
        this.reportError(error, errorInfo);
        
        // Call optional error handler
        this.props.onError?.(error, errorInfo);
    }

    componentWillUnmount() {
        if (this.retryTimeoutId) {
            clearTimeout(this.retryTimeoutId);
        }
    }

    private reportError = (error: Error, errorInfo: ErrorInfo) => {
        // In production, send to error tracking service (Sentry, LogRocket, etc.)
        const errorReport = {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            errorId: this.state.errorId,
            timestamp: new Date().toISOString(),
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
            url: typeof window !== 'undefined' ? window.location.href : ''
        };

        // Mock error reporting - replace with actual service
        if (process.env.NODE_ENV === 'development') {
            console.log('Error Report:', errorReport);
        }
    };

    private handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    private handleRetryWithDelay = () => {
        this.retryTimeoutId = setTimeout(() => {
            this.handleRetry();
        }, 1000);
    };

    private handleReload = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-light">
                    <Card className="max-w-lg w-full text-center">
                        <div className="mb-6">
                            <div className="text-4xl mb-4">⚠️</div>
                            <h2 className="text-xl font-semibold text-deep-navy mb-2">
                                Something went wrong
                            </h2>
                            <p className="text-deep-navy/70 mb-4">
                                We encountered an unexpected error. Our team has been notified.
                            </p>
                            
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="text-left bg-coral/10 border border-coral/20 rounded p-3 mb-4">
                                    <summary className="cursor-pointer text-sm font-medium text-coral mb-2">
                                        Error Details
                                    </summary>
                                    <pre className="text-xs text-coral/80 overflow-auto">
                                        {this.state.error.message}
                                        {'\n\n'}
                                        {this.state.error.stack}
                                    </pre>
                                </details>
                            )}
                            
                            <div className="text-xs text-deep-navy/50 mb-4">
                                Error ID: {this.state.errorId}
                            </div>
                        </div>
                        
                        <div className="flex gap-3 justify-center">
                            <Button 
                                onClick={this.handleRetry}
                                variant="primary"
                            >
                                Try Again
                            </Button>
                            <Button 
                                onClick={this.handleReload}
                                variant="ghost"
                            >
                                Reload Page
                            </Button>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;