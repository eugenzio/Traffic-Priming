import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });

    // Log error to console for debugging
    console.group('🚨 Application Error');
    console.error('Error:', error.message);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  handleReset = () => {
    // Clear error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Reload the page to restart
    window.location.reload();
  };

  handleClearData = () => {
    // Clear all localStorage data
    if (window.confirm('This will clear all experiment data and restart. Continue?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg, #ffffff)',
            color: 'var(--fg, #111827)',
            padding: 'var(--space-4, 16px)'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '600px',
              width: '100%',
              padding: 'var(--space-6, 24px)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--danger-bg, #fee)',
                color: 'var(--danger-fg, #b42318)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-4, 16px)',
                fontSize: '32px'
              }}
            >
              ⚠️
            </div>

            <h2 style={{ margin: '0 0 var(--space-3, 12px) 0' }}>
              Something went wrong
            </h2>

            <p style={{ color: 'var(--fg-muted, #667085)', marginBottom: 'var(--space-4, 16px)' }}>
              The application encountered an unexpected error. You can try reloading the page or clearing
              your data to restart.
            </p>

            {this.state.error && (
              <details
                style={{
                  marginBottom: 'var(--space-4, 16px)',
                  padding: 'var(--space-3, 12px)',
                  background: 'var(--panel, #fafafa)',
                  borderRadius: 'var(--radius-md, 10px)',
                  textAlign: 'left',
                  fontSize: 'var(--fs-sm, 14px)',
                  fontFamily: 'monospace'
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 'var(--space-2, 8px)' }}>
                  Error details (for debugging)
                </summary>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '12px',
                    color: 'var(--danger-fg, #b42318)'
                  }}
                >
                  {this.state.error.message}
                </pre>
                {this.state.errorInfo && (
                  <pre
                    style={{
                      margin: 'var(--space-2, 8px) 0 0 0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: '11px',
                      opacity: 0.7
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3, 12px)', justifyContent: 'center' }}>
              <button onClick={this.handleReset} className="btn btn-primary">
                Reload page
              </button>
              <button onClick={this.handleClearData} className="btn">
                Clear data & restart
              </button>
            </div>

            <p className="help" style={{ marginTop: 'var(--space-4, 16px)', fontSize: 'var(--fs-sm, 14px)' }}>
              If this error persists, please contact the study administrator
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
