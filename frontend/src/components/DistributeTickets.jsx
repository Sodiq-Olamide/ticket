import React, { useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const DistributeTickets = () => {
    const { userProfile, refreshUserData } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [amount, setAmount] = useState('');
    const [statusData, setStatusData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch users to distribute to
        const fetchUsers = async () => {
            try {
                const res = await axiosInstance.get('/api/users/');
                // Filter out self
                const others = res.data.filter(u => u.id !== userProfile.id);
                // Also could filter by department here depending on role rules
                setUsers(others);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUsers();
    }, [userProfile]);

    const handleCheckbox = (id) => {
        setSelectedUsers(prev => 
            prev.includes(id) ? prev.filter(uId => uId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(u => u.id));
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusData(null);
        if (selectedUsers.length === 0 || !amount) {
            setStatusData({ error: 'Please select users and input an amount.' });
            return;
        }
        
        try {
            await axiosInstance.post('/api/distribute/', {
                receiver_ids: selectedUsers,
                amount: parseInt(amount)
            });
            setStatusData({ success: `Successfully distributed ${amount} tickets to ${selectedUsers.length} users.` });
            setSelectedUsers([]);
            setAmount('');
            refreshUserData();
        } catch (err) {
            setStatusData({ error: err.response?.data?.error || 'Failed to distribute tickets.' });
        }
    };

    return (
        <div className="glass-container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Distribute Tickets</h2>
                <Link to="/" className="btn btn-secondary">Back</Link>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <strong>Your Balance: </strong> 
                <span style={{ fontSize: '1.25rem', color: 'var(--primary-dark)', marginLeft: '0.5rem' }}>
                    {userProfile.ticket_balance}
                </span>
            </div>

            {statusData?.error && <div style={{ color: 'white', background: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{statusData.error}</div>}
            {statusData?.success && <div style={{ color: 'white', background: 'var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{statusData.success}</div>}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Amount PER User</label>
                    <input 
                        type="number" 
                        min="1" 
                        className="input-field" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)}
                        placeholder="e.g. 5"
                    />
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ fontWeight: 600 }}>Select Receivers</label>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }} onClick={handleSelectAll}>
                            {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', background: 'white' }}>
                        {users.map(user => (
                            <label key={user.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedUsers.includes(user.id)} 
                                    onChange={() => handleCheckbox(user.id)}
                                    style={{ marginRight: '1rem', transform: 'scale(1.2)' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 600 }}>{user.username}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Role: {user.role}</div>
                                </div>
                            </label>
                        ))}
                        {users.length === 0 && <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No standard users found.</div>}
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Confirm Distribution
                </button>
            </form>
        </div>
    );
};

export default DistributeTickets;
