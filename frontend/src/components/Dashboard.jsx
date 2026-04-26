import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

const Dashboard = () => {
    const { userProfile, logout } = useContext(AuthContext);
    const [newPassword, setNewPassword] = useState('');
    const [passwordStatus, setPasswordStatus] = useState(null);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordStatus(null);
        try {
            await axiosInstance.post('/api/users/change_password/', { new_password: newPassword });
            setPasswordStatus({ success: "Updated!" });
            setNewPassword('');
            setTimeout(() => setPasswordStatus(null), 3000);
        } catch (err) {
            setPasswordStatus({ error: err.response?.data?.error || 'Failed' });
        }
    };

    if (!userProfile) return <div>Loading...</div>;

    const nameStr = (userProfile.first_name || userProfile.last_name) ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : userProfile.username;

    return (
        <div style={{ padding: '0 1rem', paddingBottom: '3rem' }}>
            {/* Nav Bar */}
            <nav style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: 'rgba(255,255,255,0.85)', 
                backdropFilter: 'blur(10px)',
                padding: '1rem 2rem', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                margin: '1rem auto',
                maxWidth: '1200px',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <h2 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '1.25rem' }}>FMC Tickets</h2>
                
                {/* Nav actions aligned right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    
                    {/* Inline Password Reset */}
                    <form onSubmit={handleChangePassword} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                            type="password" 
                            placeholder="Change Password" 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            className="input-field" 
                            required 
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', minWidth: '150px', background: '#f8fafc' }} 
                        />
                        <button type="submit" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>Update</button>
                        {passwordStatus?.error && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{passwordStatus.error}</span>}
                        {passwordStatus?.success && <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>{passwordStatus.success}</span>}
                    </form>

                    <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }}></div>
                    <button className="btn btn-secondary" onClick={logout} style={{ padding: '0.4rem 1.5rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Logout</button>
                </div>
            </nav>

            <div className="glass-container animate-fade-in" style={{ maxWidth: '800px', margin: '2rem auto' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Welcome, {nameStr}</h2>
                
                <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--primary-dark)' }}>Your Balance: <span style={{ fontSize: '2.5rem' }}>{userProfile.ticket_balance}</span> tickets</h3>
                            <p style={{ margin: '1rem 0 0.5rem', color: 'var(--text-muted)' }}>Role: <strong>{userProfile.role}</strong></p>
                            
                            {userProfile.role === 'SELLER' ? (
                                <p style={{ margin: '0' }}>Organization: <strong>{userProfile.seller_org_name || 'N/A'}</strong></p>
                            ) : (
                                <>
                                    {userProfile.department_name && <p style={{ margin: '0 0 0.5rem' }}>Department: <strong>{userProfile.department_name}</strong></p>}
                                    {userProfile.unit_name && <p style={{ margin: '0' }}>Unit: <strong>{userProfile.unit_name}</strong></p>}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Primary Actions */}
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {(userProfile.role === 'STAFF' || userProfile.role === 'HOU' || userProfile.role === 'HOD') && (
                        <Link to="/my-qr" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>Generate QR Code</Link>
                    )}
                    {userProfile.role === 'SELLER' && (
                        <Link to="/scan" className="btn btn-secondary" style={{ padding: '1rem 2rem' }}>Open Scanner</Link>
                    )}
                    {['SUPERADMIN', 'HCS', 'HOD', 'HOU'].includes(userProfile.role) && (
                        <Link to="/distribute" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>Distribute Tickets</Link>
                    )}
                </div>

                {/* Admin Portals */}
                {['SUPERADMIN', 'ADMIN'].includes(userProfile.role) && (
                    <div style={{ marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <Link to="/manage-users" className="btn btn-secondary" style={{ border: '2px solid #3b82f6', color: '#3b82f6', padding: '1rem 2rem' }}>Manage Users & System</Link>
                        <Link to="/reports" className="btn btn-secondary" style={{ border: '2px solid #8b5cf6', color: '#8b5cf6', padding: '1rem 2rem' }}>View Reports</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
