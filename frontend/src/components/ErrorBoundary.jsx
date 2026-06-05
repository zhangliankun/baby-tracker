import { Component } from 'react';

/**
 * Error Boundary — 捕获子组件渲染错误，防止整个 SPA 白屏
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] 捕获到渲染错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-bg-page">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-brand-secondary-light flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">😵</span>
            </div>
            <h2 className="text-h2 text-text-primary mb-2">页面遇到了一点问题</h2>
            <p className="text-sm text-text-secondary mb-4">
              {this.props.fallbackMessage || '抱歉，发生了意外错误。请尝试刷新页面。'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn-primary px-8 py-2.5"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
