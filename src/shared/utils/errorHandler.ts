type ErrorLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AppError extends Error {
    level: ErrorLevel;
    code?: string;
    context?: Record<string, any>;
    userMessage?: string;
    retryable?: boolean;
}

export class ConsultflowError extends Error implements AppError {
    public level: ErrorLevel;
    public code?: string;
    public context?: Record<string, any>;
    public userMessage?: string;
    public retryable?: boolean;

    constructor(
        message: string,
        options: {
            level?: ErrorLevel;
            code?: string;
            context?: Record<string, any>;
            userMessage?: string;
            retryable?: boolean;
            cause?: Error;
        } = {}
    ) {
        super(message);
        this.name = 'ConsultflowError';
        this.level = options.level || 'medium';
        this.code = options.code;
        this.context = options.context;
        this.userMessage = options.userMessage || message;
        this.retryable = options.retryable ?? false;

        if (options.cause && Error.captureStackTrace) {
            Error.captureStackTrace(this, ConsultflowError);
        }
    }
}

// Specific error types
export class NetworkError extends ConsultflowError {
    constructor(message: string, context?: Record<string, any>) {
        super(message, {
            level: 'high',
            code: 'NETWORK_ERROR',
            context,
            userMessage: 'Connection issue. Please check your internet connection.',
            retryable: true
        });
        this.name = 'NetworkError';
    }
}

export class AuthenticationError extends ConsultflowError {
    constructor(message: string, context?: Record<string, any>) {
        super(message, {
            level: 'high',
            code: 'AUTH_ERROR',
            context,
            userMessage: 'Authentication failed. Please sign in again.',
            retryable: false
        });
        this.name = 'AuthenticationError';
    }
}

export class ValidationError extends ConsultflowError {
    constructor(message: string, context?: Record<string, any>) {
        super(message, {
            level: 'medium',
            code: 'VALIDATION_ERROR',
            context,
            userMessage: 'Please check your input and try again.',
            retryable: false
        });
        this.name = 'ValidationError';
    }
}

export class BusinessLogicError extends ConsultflowError {
    constructor(message: string, context?: Record<string, any>) {
        super(message, {
            level: 'medium',
            code: 'BUSINESS_ERROR',
            context,
            retryable: false
        });
        this.name = 'BusinessLogicError';
    }
}

export class DataError extends ConsultflowError {
    constructor(message: string, context?: Record<string, any>) {
        super(message, {
            level: 'high',
            code: 'DATA_ERROR',
            context,
            userMessage: 'Data processing error. Please try again or contact support.',
            retryable: true
        });
        this.name = 'DataError';
    }
}

// Error handling utilities
export class ErrorHandler {
    private static instance: ErrorHandler;
    private errorQueue: AppError[] = [];
    private maxQueueSize = 50;

    static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    handle(error: Error | AppError, context?: Record<string, any>): AppError {
        const appError = this.normalizeError(error, context);
        this.logError(appError);
        this.queueError(appError);
        
        // Report to external services in production
        if (process.env.NODE_ENV === 'production') {
            this.reportError(appError);
        }

        return appError;
    }

    async handleAsync<T>(
        operation: () => Promise<T>,
        options: {
            retries?: number;
            retryDelay?: number;
            fallback?: () => Promise<T>;
            context?: Record<string, any>;
        } = {}
    ): Promise<T> {
        const { retries = 0, retryDelay = 1000, fallback, context } = options;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                const appError = this.handle(error as Error, {
                    ...context,
                    attempt: attempt + 1,
                    maxRetries: retries
                });

                // If this is the last attempt or error is not retryable
                if (attempt === retries || !appError.retryable) {
                    if (fallback) {
                        try {
                            return await fallback();
                        } catch (fallbackError) {
                            this.handle(fallbackError as Error, { 
                                ...context, 
                                fallbackFailed: true 
                            });
                            throw appError;
                        }
                    }
                    throw appError;
                }

                // Wait before retry
                if (retryDelay > 0) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

        throw new Error('Unexpected end of retry loop');
    }

    getRecentErrors(count = 10): AppError[] {
        return this.errorQueue.slice(-count);
    }

    clearErrors(): void {
        this.errorQueue = [];
    }

    private normalizeError(error: Error | AppError, context?: Record<string, any>): AppError {
        if (error instanceof ConsultflowError) {
            return {
                ...error,
                context: { ...error.context, ...context }
            };
        }

        // Convert common error types
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return new NetworkError(error.message, context);
        }

        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            return new AuthenticationError(error.message, context);
        }

        if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
            return new ValidationError(error.message, context);
        }

        // Generic error
        return new ConsultflowError(error.message, {
            level: 'medium',
            context: { ...context, originalName: error.name }
        });
    }

    private logError(error: AppError): void {
        const logLevel = this.getLogLevel(error.level);
        const logData = {
            message: error.message,
            level: error.level,
            code: error.code,
            context: error.context,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };

        console[logLevel]('ConsultflowError:', logData);
    }

    private queueError(error: AppError): void {
        this.errorQueue.push(error);
        
        // Maintain queue size
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift();
        }
    }

    private async reportError(error: AppError): Promise<void> {
        try {
            // In production, send to error reporting service
            // await this.sendToErrorService(error);
        } catch (reportError) {
            console.error('Failed to report error:', reportError);
        }
    }

    private getLogLevel(errorLevel: ErrorLevel): 'log' | 'warn' | 'error' {
        switch (errorLevel) {
            case 'low':
                return 'log';
            case 'medium':
                return 'warn';
            case 'high':
            case 'critical':
                return 'error';
            default:
                return 'error';
        }
    }
}

// Convenience function for global error handling
export const handleError = (error: Error, context?: Record<string, any>) => {
    return ErrorHandler.getInstance().handle(error, context);
};

export const handleAsyncError = <T>(
    operation: () => Promise<T>,
    options?: Parameters<ErrorHandler['handleAsync']>[1]
) => {
    return ErrorHandler.getInstance().handleAsync(operation, options);
};

// React hook for error handling
export const useErrorHandler = () => {
    const errorHandler = ErrorHandler.getInstance();

    return {
        handleError: errorHandler.handle.bind(errorHandler),
        handleAsync: errorHandler.handleAsync.bind(errorHandler),
        getRecentErrors: errorHandler.getRecentErrors.bind(errorHandler),
        clearErrors: errorHandler.clearErrors.bind(errorHandler)
    };
};