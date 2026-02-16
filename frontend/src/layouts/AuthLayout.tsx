import React from 'react';
import './Layouts.css';

interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    return (
        <div className="auth-layout">
            <header className="auth-header">
                <div className="logo-container">
                    <div className="logo-icon">🎓</div>
                    <span className="logo-text">Capstone Portal</span>
                </div>
                <div className="header-links">
                    <span>Need help?</span>
                    <a href="#">Documentation</a>
                </div>
            </header>

            <main className="auth-main">
                {children}
            </main>

            <footer className="auth-footer">
                <p>© 2026 Accredian. All rights reserved.</p>
                <div className="footer-links">
                    <a href="#">Privacy Policy</a>
                    <span>•</span>
                    <a href="#">Terms of Service</a>
                </div>
            </footer>
        </div>
    );
};

export default AuthLayout;
