import React, { useContext } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { LogOut, Ticket } from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DistributeTickets from './components/DistributeTickets';
import SellerScanner from './components/SellerScanner';
import UserQR from './components/UserQR';

const PrivateRoute = ({ children }) => {
    const { authTokens } = useContext(AuthContext);
    return authTokens ? children : <Navigate to="/login" />;
};

const App = () => {
    const { userProfile, logoutUser, authTokens } = useContext(AuthContext);

    return (
        <div className="app-wrapper">
            {authTokens && (
                <nav className="nav-bar animate-fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary-dark)' }}>
                        <Ticket size={28} />
                        FMC Ticket App
                    </div>
                    {userProfile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600 }}>{userProfile.username}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Role: {userProfile.role}</div>
                            </div>
                            <button onClick={logoutUser} className="btn" style={{ background: 'transparent', color: 'var(--danger)', padding: '0.5rem', boxShadow: 'none' }}>
                                <LogOut size={24} />
                            </button>
                        </div>
                    )}
                </nav>
            )}

            <Routes>
                <Route path="/login" element={!authTokens ? <Login /> : <Navigate to="/" />} />
                <Route path="/" element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                } />
                <Route path="/distribute" element={
                    <PrivateRoute>
                        <DistributeTickets />
                    </PrivateRoute>
                } />
                <Route path="/scan" element={
                    <PrivateRoute>
                        <SellerScanner />
                    </PrivateRoute>
                } />
                <Route path="/my-qr" element={
                    <PrivateRoute>
                        <UserQR />
                    </PrivateRoute>
                } />
            </Routes>
        </div>
    );
};

export default App;
