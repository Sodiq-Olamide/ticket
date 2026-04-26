import React, { useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ManageUsers = () => {
    const { userProfile, refreshUserData } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [units, setUnits] = useState([]);
    const [statusData, setStatusData] = useState(null);

    // Common fields
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [sex, setSex] = useState('Male');

    // Create Staff Form states
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('STAFF');
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [staffId, setStaffId] = useState('');

    // Seller fields
    const [sellerUsername, setSellerUsername] = useState('');
    const [sellerId, setSellerId] = useState('');
    const [sellerOrgName, setSellerOrgName] = useState('');
    const [sellerLocation, setSellerLocation] = useState('');
    const [sellerAlias, setSellerAlias] = useState('');
    const [sellerContactInfo, setSellerContactInfo] = useState('');

    // Generate Tickets state
    const [tcAmount, setTcAmount] = useState('');

    // Create Dept & Unit states
    const [deptName, setDeptName] = useState('');
    const [unitName, setUnitName] = useState('');
    const [unitDeptId, setUnitDeptId] = useState('');

    // Reset Password states
    const [resetUserId, setResetUserId] = useState('');
    const [resetNewPassword, setResetNewPassword] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchDepartmentsAndUnits();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axiosInstance.get('/api/users/');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDepartmentsAndUnits = async () => {
        try {
            const [deptRes, unitRes] = await Promise.all([
                axiosInstance.get('/api/departments/'),
                axiosInstance.get('/api/units/')
            ]);
            setDepartments(deptRes.data);
            setUnits(unitRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setStatusData(null);
        try {
            const payload = { 
                username, password, role, 
                first_name: firstName, 
                last_name: lastName, 
                sex,
                staff_id: staffId
            };
            if (selectedDept) payload.department = selectedDept;
            if (selectedUnit) payload.unit = selectedUnit;

            await axiosInstance.post('/api/users/', payload);
            setStatusData({ success: `Staff ${username} created successfully!` });
            
            setUsername(''); setPassword(''); setFirstName(''); setLastName(''); setSex('Male'); setRole('STAFF'); 
            setSelectedDept(''); setSelectedUnit(''); setStaffId('');
            fetchUsers();
        } catch (err) {
            setStatusData({ error: err.response?.data?.error || 'Failed to create staff.' });
        }
    };

    const handleCreateSeller = async (e) => {
        e.preventDefault();
        setStatusData(null);
        try {
            const payload = { 
                username: sellerUsername, 
                password, 
                role: 'SELLER', 
                first_name: firstName, 
                last_name: lastName, 
                sex,
                seller_id: sellerId,
                seller_org_name: sellerOrgName,
                seller_location: sellerLocation,
                seller_alias: sellerAlias,
                seller_contact_info: sellerContactInfo
            };

            await axiosInstance.post('/api/users/', payload);
            setStatusData({ success: `Seller ${sellerUsername} created successfully!` });
            
            setSellerUsername(''); setPassword(''); setFirstName(''); setLastName(''); setSex('Male');
            setSellerOrgName(''); setSellerLocation(''); setSellerAlias(''); setSellerContactInfo(''); setSellerId('');
            fetchUsers();
        } catch (err) {
            setStatusData({ error: err.response?.data?.error || 'Failed to create seller.' });
        }
    };

    const handleGenerateTickets = async (e) => {
        e.preventDefault();
        if (!tcAmount || parseInt(tcAmount) <= 0) return;
        setStatusData(null);
        try {
            const res = await axiosInstance.post('/api/generate/', { amount: parseInt(tcAmount) });
            setStatusData({ success: res.data.message });
            setTcAmount('');
            refreshUserData();
        } catch (err) {
            setStatusData({ error: err.response?.data?.error || 'Failed to generate tickets.' });
        }
    };

    const handleCreateDept = async (e) => {
        e.preventDefault();
        setStatusData(null);
        try {
            await axiosInstance.post('/api/departments/', { name: deptName });
            setStatusData({ success: `Department ${deptName} created!` });
            setDeptName('');
            fetchDepartmentsAndUnits();
        } catch (err) {
            setStatusData({ error: 'Failed to create department. Name may exist.' });
        }
    };

    const handleCreateUnit = async (e) => {
        e.preventDefault();
        setStatusData(null);
        try {
            await axiosInstance.post('/api/units/', { name: unitName, department: unitDeptId });
            setStatusData({ success: `Unit ${unitName} created!` });
            setUnitName(''); setUnitDeptId('');
            fetchDepartmentsAndUnits();
        } catch (err) {
            setStatusData({ error: 'Failed to create unit.' });
        }
    };

    const handleAdminResetPassword = async (e) => {
        e.preventDefault();
        if (!resetUserId || !resetNewPassword) return;
        setStatusData(null);
        try {
            const res = await axiosInstance.post(`/api/users/${resetUserId}/admin_reset_password/`, { new_password: resetNewPassword });
            setStatusData({ success: res.data.message });
            setResetUserId('');
            setResetNewPassword('');
        } catch (err) {
            setStatusData({ error: err.response?.data?.error || 'Failed to reset password.' });
        }
    };

    if (!['SUPERADMIN', 'ADMIN'].includes(userProfile?.role)) {
        return <div style={{ textAlign: 'center', padding: '2rem' }}>Access Denied</div>;
    }

    return (
        <div className="glass-container animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Manage Users & Organization</h2>
                <Link to="/" className="btn btn-secondary">Back</Link>
            </div>

            {statusData?.error && <div style={{ color: 'white', background: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{statusData.error}</div>}
            {statusData?.success && <div style={{ color: 'white', background: 'var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{statusData.success}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                
                {/* Create Department */}
                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Create Department</h3>
                    <form onSubmit={handleCreateDept}>
                        <input className="input-field" style={{ marginBottom: '1rem' }} placeholder="Department Name" value={deptName} onChange={e => setDeptName(e.target.value)} required />
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Department</button>
                    </form>
                </div>

                {/* Create Unit */}
                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Create Unit</h3>
                    <form onSubmit={handleCreateUnit}>
                        <input className="input-field" style={{ marginBottom: '1rem' }} placeholder="Unit Name" value={unitName} onChange={e => setUnitName(e.target.value)} required />
                        <select className="input-field" style={{ marginBottom: '1rem' }} value={unitDeptId} onChange={e => setUnitDeptId(e.target.value)} required>
                            <option value="" disabled>Select Parent Department</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Unit</button>
                    </form>
                </div>

                {/* Generate Tickets Form for SuperAdmin Only */}
                {userProfile.role === 'SUPERADMIN' && (
                    <div style={{ background: 'var(--bg-gradient-start)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #99f6e4' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--primary-dark)' }}>Mint Ticket Pool</h3>
                        <form onSubmit={handleGenerateTickets}>
                            <input type="number" min="1" className="input-field" style={{ marginBottom: '1rem' }} placeholder="Amount" value={tcAmount} onChange={e => setTcAmount(e.target.value)} required />
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', background: 'var(--primary-dark)' }}>Generate Tickets</button>
                        </form>
                    </div>
                )}

                {/* Force Reset Password */}
                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Force Reset Password</h3>
                    <form onSubmit={handleAdminResetPassword}>
                        <select className="input-field" style={{ marginBottom: '1rem' }} value={resetUserId} onChange={e => setResetUserId(e.target.value)} required>
                            <option value="" disabled>Select User</option>
                            {users.map(u => {
                                const idStr = u.role === 'SELLER' ? u.seller_id : u.staff_id;
                                const nameStr = (u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.username;
                                return (
                                    <option key={u.id} value={u.id}>
                                        {nameStr} {idStr ? `- ${idStr}` : ''} ({u.role})
                                    </option>
                                );
                            })}
                        </select>
                        <input type="password" placeholder="New Password" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} className="input-field" style={{ marginBottom: '1rem' }} required />
                        <button type="submit" className="btn btn-secondary" style={{ width: '100%', borderColor: 'var(--danger)', color: 'var(--danger)' }}>Force Reset</button>
                    </form>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                {/* Create Staff Form */}
                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Register New Staff</h3>
                    <form onSubmit={handleCreateStaff} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Username</label>
                            <input className="input-field" value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Password</label>
                            <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>First Name</label>
                            <input className="input-field" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Last Name</label>
                            <input className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Sex</label>
                            <select className="input-field" value={sex} onChange={e => setSex(e.target.value)}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Role</label>
                            <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
                                {userProfile.role === 'SUPERADMIN' && <option value="ADMIN">Admin</option>}
                                <option value="HCS">HCS</option>
                                <option value="HOD">HOD</option>
                                <option value="HOU">HOU</option>
                                <option value="STAFF">Staff</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Staff ID</label>
                            <input className="input-field" value={staffId} onChange={e => setStaffId(e.target.value)} required />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Department</label>
                                <select className="input-field" value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setSelectedUnit(''); }}>
                                    <option value="">-- None --</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Unit</label>
                                <select className="input-field" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} disabled={!selectedDept}>
                                    <option value="">-- None --</option>
                                    {units.filter(u => u.department === parseInt(selectedDept)).map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register Staff</button>
                        </div>
                    </form>
                </div>

                {/* Create Seller Form */}
                <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#1d4ed8' }}>Register New Seller</h3>
                    <form onSubmit={handleCreateSeller} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>System Username</label>
                            <input className="input-field" value={sellerUsername} onChange={e => setSellerUsername(e.target.value)} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Password</label>
                            <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Rep First Name</label>
                            <input className="input-field" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Rep Last Name</label>
                            <input className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Sex</label>
                            <select className="input-field" value={sex} onChange={e => setSex(e.target.value)}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Seller ID</label>
                            <input className="input-field" value={sellerId} onChange={e => setSellerId(e.target.value)} required />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Organization Name</label>
                            <input className="input-field" value={sellerOrgName} onChange={e => setSellerOrgName(e.target.value)} required />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Business Location</label>
                                <input className="input-field" value={sellerLocation} onChange={e => setSellerLocation(e.target.value)} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Contact Info</label>
                                <input className="input-field" value={sellerContactInfo} onChange={e => setSellerContactInfo(e.target.value)} required />
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#2563eb' }}>Register Seller</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* List existing users */}
            <h3 style={{ marginBottom: '1rem' }}>Registered Users & Sellers</h3>
            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                            <th style={{ padding: '0.75rem' }}>Username / Entity</th>
                            <th style={{ padding: '0.75rem' }}>Role</th>
                            <th style={{ padding: '0.75rem' }}>Info (Dept / Seller Info)</th>
                            <th style={{ padding: '0.75rem' }}>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => {
                            const deptName = departments.find(d => d.id === u.department)?.name || '-';
                            const unitName = units.find(unit => unit.id === u.unit)?.name || '-';
                            return (
                                <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                                        {u.username} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({u.role === 'SELLER' ? u.seller_id : u.staff_id})</span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{u.role}</span>
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                        {u.role === 'SELLER' ? (
                                            <span style={{ color: 'var(--secondary-color)' }}>
                                                {u.seller_org_name} ({u.seller_location})
                                            </span>
                                        ) : (
                                            <span>{deptName} / {unitName}</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{u.ticket_balance}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageUsers;
