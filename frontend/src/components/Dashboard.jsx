import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { userProfile } = useContext(AuthContext);

    if (!userProfile) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Dashboard...</div>;

    return (
        <div className="glass-container animate-fade-in">
            <h2>Welcome, {userProfile.username}</h2>
            
            <div style={{ 
                padding: '1.5rem', 
                background: 'rgba(255,255,255,0.5)', 
                border: '1px solid var(--glass-border)',
                borderRadius: '12px', 
                marginTop: '1.5rem' 
            }}>
                <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Available Ticket Balance</h3>
                <div style={{ fontSize: '3.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: '0.5rem 0' }}>
                    {userProfile.ticket_balance}
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {(userProfile.role === 'STAFF' || userProfile.role === 'HOU' || userProfile.role === 'HOD') && (
                    <Link to="/my-qr" className="btn btn-primary">Generate QR Code</Link>
                )}
                {userProfile.role === 'SELLER' && (
                    <Link to="/scan" className="btn btn-secondary">Open Scanner</Link>
                )}
                {['SUPERADMIN', 'HCS', 'HOD', 'HOU'].includes(userProfile.role) && (
                    <Link to="/distribute" className="btn btn-primary">Distribute Tickets</Link>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
