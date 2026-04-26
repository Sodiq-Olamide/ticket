import React, { useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Reports = () => {
    const { userProfile } = useContext(AuthContext);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await axiosInstance.get('/api/reports/summary/');
                setReportData(res.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch reports');
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    if (!['SUPERADMIN', 'ADMIN'].includes(userProfile?.role)) {
        return <div style={{ textAlign: 'center', padding: '2rem' }}>Access Denied</div>;
    }

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Reports...</div>;

    return (
        <div className="glass-container animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>System Reports</h2>
                <Link to="/" className="btn btn-secondary">Back to Dashboard</Link>
            </div>

            {error && <div style={{ color: 'white', background: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

            {reportData && (
                <>
                    {/* Overview Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ background: '#e0f2fe', padding: '1.5rem', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                            <h3 style={{ margin: 0, color: '#0284c7', fontSize: '1rem' }}>Total Generated Tickets</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0369a1', marginTop: '0.5rem' }}>
                                {reportData.overview.total_generated}
                            </div>
                        </div>

                        <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '12px', border: '1px solid #fde68a' }}>
                            <h3 style={{ margin: 0, color: '#d97706', fontSize: '1rem' }}>Total Distributed</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#b45309', marginTop: '0.5rem' }}>
                                {reportData.overview.total_distributed}
                            </div>
                        </div>

                        <div style={{ background: '#d1fae5', padding: '1.5rem', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                            <h3 style={{ margin: 0, color: '#059669', fontSize: '1rem' }}>Total Purchased (Consumed)</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#047857', marginTop: '0.5rem' }}>
                                {reportData.overview.total_purchased}
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions Table */}
                    <h3 style={{ marginBottom: '1rem' }}>Recent Purchase Transactions</h3>
                    <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                    <th style={{ padding: '0.75rem' }}>Time</th>
                                    <th style={{ padding: '0.75rem' }}>Staff (Buyer)</th>
                                    <th style={{ padding: '0.75rem' }}>Seller</th>
                                    <th style={{ padding: '0.75rem' }}>Amount</th>
                                    <th style={{ padding: '0.75rem' }}>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.recent_purchases.map(rx => (
                                    <tr key={rx.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                        <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            {new Date(rx.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{rx.sender_name}</td>
                                        <td style={{ padding: '0.75rem' }}>{rx.receiver_name}</td>
                                        <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--danger)' }}>-{rx.amount}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{rx.description}</td>
                                    </tr>
                                ))}
                                {reportData.recent_purchases.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No consumptions yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;
