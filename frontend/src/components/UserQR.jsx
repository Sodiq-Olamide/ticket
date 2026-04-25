import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axiosInstance from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const UserQR = () => {
    const { refreshUserData } = useContext(AuthContext);
    const [intent, setIntent] = useState(null);
    const [status, setStatus] = useState('generating'); // generating, active, requested, confirmed, expired
    const [error, setError] = useState(null);

    const generateIntent = async () => {
        try {
            setStatus('generating');
            const res = await axiosInstance.post('/api/intents/create_intent/');
            setIntent(res.data.intent_id);
            setStatus('active');
        } catch (err) {
            setError('Failed to generate secure QR.');
            setStatus('error');
        }
    };

    useEffect(() => {
        generateIntent();
    }, []);

    useEffect(() => {
        let interval;
        if (status === 'active' || status === 'requested') {
            interval = setInterval(async () => {
                try {
                    const res = await axiosInstance.get('/api/intents/my_intent/');
                    const currentIntent = res.data.intent;
                    if (!currentIntent) {
                        setStatus('expired');
                        clearInterval(interval);
                        return;
                    }
                    if (currentIntent.status === 'REQUESTED' && status !== 'requested') {
                        setIntent(currentIntent);
                        setStatus('requested');
                    } else if (currentIntent.status === 'CONFIRMED') {
                        setStatus('confirmed');
                        refreshUserData();
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error("Polling error", err);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const handleConfirm = async () => {
        try {
            await axiosInstance.post(`/api/intents/${intent.id}/confirm/`);
            setStatus('confirmed');
            refreshUserData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to confirm payment.');
        }
    };

    return (
        <div className="glass-container animate-fade-in" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <h2>My Ticket QR</h2>

            {error && <div style={{ color: 'white', background: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

            {status === 'generating' && <p>Generating secure intent...</p>}
            
            {status === 'active' && typeof intent === 'string' && (
                <>
                    <div style={{ padding: '2rem', background: 'white', borderRadius: '16px', display: 'inline-block', margin: '2rem 0' }}>
                        <QRCodeSVG value={intent} size={200} />
                    </div>
                    <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>Show this QR code to the seller. Valid for 10 minutes.</p>
                </>
            )}

            {status === 'requested' && intent?.amount_requested && (
                <div style={{ padding: '2rem', background: 'rgba(255, 152, 0, 0.1)', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--secondary-color)' }}>
                    <h3 style={{ color: 'var(--secondary-color)' }}>Payment Request</h3>
                    <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>Seller is requesting <strong>{intent.amount_requested} tickets</strong>.</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={handleConfirm}>Confirm</button>
                        <button className="btn btn-secondary" onClick={() => setStatus('expired')}>Reject</button>
                    </div>
                </div>
            )}

            {status === 'confirmed' && (
                <div style={{ padding: '2rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', marginBottom: '2rem', color: 'var(--success)' }}>
                    <h3 style={{ margin: 0 }}>Payment Successful!</h3>
                </div>
            )}

            {status === 'expired' && (
                <div style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--danger)' }}>Session expired or rejected.</p>
                    <button className="btn btn-secondary" onClick={generateIntent} style={{ marginTop: '1rem' }}>Generate New QR</button>
                </div>
            )}

            <div style={{ marginTop: '1.5rem' }}>
                <Link to="/" className="btn btn-secondary">Back to Dashboard</Link>
            </div>
        </div>
    );
};

export default UserQR;
