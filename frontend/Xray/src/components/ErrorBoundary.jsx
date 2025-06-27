import React, { Component } from 'react';

class ErrorBoundary extends Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h2>Đã xảy ra lỗi</h2>
                    <p>{this.state.error?.message || 'Vui lòng thử lại sau.'}</p>
                    <button onClick={() => window.location.reload()}>Tải lại trang</button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;