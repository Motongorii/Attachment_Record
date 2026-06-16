'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Save, User, Building, UserCheck, Calendar, BookOpen, Plus, Trash2, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<{index: number, results: any[]}[]>([]);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  
  // Password Reset State
  const [pwdEmail, setPwdEmail] = useState('');
  const [pwdCodeSent, setPwdCodeSent] = useState(false);
  const [pwdCode, setPwdCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ text: '', type: '' });
  
  const router = useRouter();

  const kenyaCounties = [
    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado",
    "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia",
    "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
    "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita Taveta", "Tana River",
    "Tharaka Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
  ];

  useEffect(() => {
    fetch('/api/student')
      .then(res => res.json())
      .then(json => {
        if (!json.firms || json.firms.length === 0) {
          json.firms = [{}];
        }
        setData(json);
        if (json.email) setPwdEmail(json.email); // Initialize pwdEmail with saved email
      });
  }, []);

  const handleChange = (field: string, value: string) => {
    setData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFirmChange = (index: number, field: string, value: string) => {
    const updatedFirms = [...(data.firms || [])];
    updatedFirms[index] = { ...updatedFirms[index], [field]: value };
    setData((prev: any) => ({ ...prev, firms: updatedFirms }));
  };

  const addFirm = () => {
    if (data.firms?.length < 3) {
      setData((prev: any) => ({ ...prev, firms: [...prev.firms, {}] }));
    }
  };

  const removeFirm = (index: number) => {
    if (data.firms?.length > 1) {
      const updatedFirms = data.firms.filter((_: any, i: number) => i !== index);
      setData((prev: any) => ({ ...prev, firms: updatedFirms }));
      setLocationSuggestions(prev => prev.filter(s => s.index !== index));
    }
  };

  let searchTimeout: NodeJS.Timeout;
  const fetchSuggestions = async (query: string, firmIndex: number) => {
    if (query.length < 3) {
      setLocationSuggestions(prev => prev.filter(s => s.index !== firmIndex));
      return;
    }
    setFetchingSuggestions(true);
    try {
      const county = data.firms[firmIndex]?.firmCounty || '';
      const searchQuery = county ? `${query}, ${county}` : query;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&countrycodes=ke&format=json&limit=5`);
      const results = await res.json();
      setLocationSuggestions(prev => {
        const filtered = prev.filter(s => s.index !== firmIndex);
        return [...filtered, { index: firmIndex, results }];
      });
    } catch(e) {
      console.error(e);
    }
    setFetchingSuggestions(false);
  };

  const handleExactLocationChange = (index: number, val: string) => {
    handleFirmChange(index, 'exactLocation', val);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => fetchSuggestions(val, index), 800);
  };

  const handleOffDaysChange = (day: string, checked: boolean) => {
    const currentOffDays = data.offDays ? JSON.parse(data.offDays) : {};
    currentOffDays[day] = checked;
    setData((prev: any) => ({ ...prev, offDays: JSON.stringify(currentOffDays) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/student', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/auth/request-code', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pwdEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setPwdCodeSent(true);
        setPwdMessage({ text: 'Verification code sent to your email.', type: 'success' });
      } else {
        setPwdMessage({ text: data.error || 'Failed to send code.', type: 'error' });
      }
    } catch (e) {
      setPwdMessage({ text: 'An error occurred.', type: 'error' });
    }
    setPwdLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pwdCode, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMessage({ text: 'Password changed successfully!', type: 'success' });
        setPwdCodeSent(false);
        setPwdCode('');
        setNewPassword('');
      } else {
        setPwdMessage({ text: data.error || 'Failed to change password.', type: 'error' });
      }
    } catch (e) {
      setPwdMessage({ text: 'An error occurred.', type: 'error' });
    }
    setPwdLoading(false);
  };

  if (!data) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="animate-fade-in" style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-purple)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const offDaysParsed = data.offDays ? JSON.parse(data.offDays) : {};
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const firms = data.firms || [{}];

  return (
    <>
      <div className="bg-shape-1"></div>
      <div className="bg-shape-2"></div>
      
      <div className="container animate-fade-in" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
        <header className="page-header stagger-1">
          <div>
            <h1 className="page-title">Student Dashboard</h1>
            <p className="page-subtitle">Manage your attachment records and details</p>
          </div>
          <button type="button" onClick={handleLogout} className="btn btn-secondary">
            <LogOut size={18} /> Logout
          </button>
        </header>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Read Only Details - Account Info */}
          <div className="glass-panel stagger-2">
            <h2 className="section-title" style={{ border: 'none', margin: '0 0 1.5rem', padding: 0 }}>
              <div className="icon-wrapper"><User size={20} /></div> Account Info
            </h2>
            <div className="grid-3">
              <div className="info-item">
                <span className="info-label">Admission Number</span>
                <span className="info-value">{data.admissionNumber}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Course</span>
                <span className="info-value">{data.course || 'Not specified'}</span>
              </div>
            </div>
          </div>

          <div className="glass-card stagger-3">
            <h3 className="section-title">
              <div className="icon-wrapper"><BookOpen size={20} /></div> Student Details
            </h3>
            <div className="grid-2">
              <div className="form-group">
                <label>Full Name</label>
                <input value={data.studentName || ''} onChange={e => handleChange('studentName', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={data.email || ''} onChange={e => handleChange('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" value={data.phone || ''} onChange={e => handleChange('phone', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Year of Study</label>
                <select value={data.yearOfStudy || ''} onChange={e => handleChange('yearOfStudy', e.target.value)} required>
                  <option value="">Select Year...</option>
                  <option value="Year 1">Year 1</option>
                  <option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option>
                  <option value="Year 4">Year 4</option>
                </select>
              </div>
            </div>
          </div>

          {firms.map((firm: any, index: number) => (
            <div key={index} className="glass-card stagger-4" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid rgba(90, 61, 122, 0.1)', paddingBottom: '0.75rem' }}>
                <h3 className="section-title" style={{ border: 'none', margin: 0, padding: 0 }}>
                  <div className="icon-wrapper"><Building size={20} /></div> Firm {index + 1} Details
                </h3>
                {firms.length > 1 && (
                  <button type="button" onClick={() => removeFirm(index)} className="btn" style={{ background: 'var(--error-color)', color: 'white', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    <Trash2 size={16} /> Remove
                  </button>
                )}
              </div>

              <div className="grid-2">
                <div>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Company Info</h4>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label>Firm Name</label>
                    <input value={firm.firmName || ''} onChange={e => handleFirmChange(index, 'firmName', e.target.value)} required />
                  </div>
                  <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
                    <div className="form-group">
                      <label>Firm Email</label>
                      <input type="email" value={firm.firmEmail || ''} onChange={e => handleFirmChange(index, 'firmEmail', e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>County</label>
                      <select value={firm.firmCounty || ''} onChange={e => handleFirmChange(index, 'firmCounty', e.target.value)} required>
                        <option value="">Select County...</option>
                        {kenyaCounties.map(county => (
                          <option key={county} value={county}>{county}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem', position: 'relative' }}>
                    <label>Exact Location (Start typing to search)</label>
                    <input 
                      value={firm.exactLocation || ''} 
                      onChange={e => handleExactLocationChange(index, e.target.value)} 
                      required 
                      placeholder="e.g. Westlands, Nairobi"
                    />
                    {fetchingSuggestions && <div style={{ position: 'absolute', right: '10px', top: '35px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Searching...</div>}
                    {locationSuggestions.find(s => s.index === index)?.results && locationSuggestions.find(s => s.index === index)!.results.length > 0 && (
                      <ul style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 10, listStyle: 'none',
                        padding: '0.5rem', margin: '0.25rem 0 0 0', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        {locationSuggestions.find(s => s.index === index)!.results.map((res: any, i: number) => (
                          <li 
                            key={i} 
                            style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: i !== locationSuggestions.find(s => s.index === index)!.results.length - 1 ? '1px solid var(--border-color)' : 'none', fontSize: '0.85rem' }}
                            onClick={() => {
                              handleFirmChange(index, 'exactLocation', res.display_name);
                              setLocationSuggestions(prev => prev.filter(s => s.index !== index));
                            }}
                          >
                            {res.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input type="date" value={firm.startDate ? firm.startDate.split('T')[0] : ''} onChange={e => handleFirmChange(index, 'startDate', e.target.value ? new Date(e.target.value).toISOString() : '')} required />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input type="date" value={firm.endDate ? firm.endDate.split('T')[0] : ''} onChange={e => handleFirmChange(index, 'endDate', e.target.value ? new Date(e.target.value).toISOString() : '')} required />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}><UserCheck size={16} style={{display:'inline', verticalAlign:'text-bottom'}} /> Supervisor</h4>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label>Supervisor's Name</label>
                    <input value={firm.supervisorName || ''} onChange={e => handleFirmChange(index, 'supervisorName', e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label>Phone Number</label>
                    <input type="tel" value={firm.supervisorPhone || ''} onChange={e => handleFirmChange(index, 'supervisorPhone', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={firm.supervisorEmail || ''} onChange={e => handleFirmChange(index, 'supervisorEmail', e.target.value)} required />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {firms.length < 3 && (
            <div className="stagger-4" style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="button" onClick={addFirm} className="btn btn-secondary" style={{ borderStyle: 'dashed', width: '100%', padding: '1rem', background: 'transparent' }}>
                <Plus size={20} /> Add Another Firm (Max 3)
              </button>
            </div>
          )}

          {/* Off Days */}
          <div className="glass-card stagger-5">
            <h3 className="section-title">
              <div className="icon-wrapper"><Calendar size={20} /></div> General Schedule Details
            </h3>
            <div>
              <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Off Days (Applicable to all)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {daysOfWeek.map(day => (
                  <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', transition: 'all 0.2s' }}>
                    <input 
                      type="checkbox" 
                      checked={offDaysParsed[day] || false}
                      onChange={(e) => handleOffDaysChange(day, e.target.checked)}
                    />
                    <span style={{ fontSize: '0.9rem' }}>{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="stagger-5" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingBottom: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save All Details'}
            </button>
          </div>
        </form>

        {/* Security / Password Change */}
        <div className="glass-card stagger-5" style={{ marginTop: '2rem', border: '1px solid var(--primary-purple-light)' }}>
          <h3 className="section-title" style={{ color: 'var(--primary-purple)' }}>
            <div className="icon-wrapper" style={{ background: 'var(--primary-purple)', color: 'white' }}>🛡️</div> Security Settings
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Change your account password securely. We will send a 4-digit verification code to the email address saved in your Personal Details.</p>
          
          {pwdMessage.text && (
            <div style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1rem', background: pwdMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: pwdMessage.type === 'success' ? 'var(--success-color)' : 'var(--error-color)', fontWeight: 500 }}>
              {pwdMessage.text}
            </div>
          )}

          {!pwdCodeSent ? (
            <form onSubmit={handleRequestCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
              <div className="form-group">
                <label>Email Address for Verification Code</label>
                <input 
                  type="email" 
                  value={pwdEmail}
                  onChange={e => setPwdEmail(e.target.value)}
                  placeholder="Enter your desired email address"
                  required 
                />
              </div>
              <button type="submit" disabled={pwdLoading || !pwdEmail} className="btn btn-primary" style={{ background: 'var(--primary-purple)' }}>
                {pwdLoading ? 'Sending...' : 'Send Verification Code via Email'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
              <div className="form-group">
                <label>4-Digit Verification Code</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={pwdCode}
                  onChange={e => setPwdCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1234"
                  required 
                  style={{ fontSize: '1.2rem', letterSpacing: '4px', textAlign: 'center' }}
                />
              </div>
              <div className="form-group">
                <label>New Password (min 6 chars)</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
              <button type="submit" disabled={pwdLoading || pwdCode.length < 4 || newPassword.length < 6} className="btn btn-primary">
                {pwdLoading ? 'Updating...' : 'Update Password'}
              </button>
              <button type="button" onClick={() => setPwdCodeSent(false)} className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Premium Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', background: 'var(--surface-color)',
          border: '1px solid var(--success-color)', borderLeft: '4px solid var(--success-color)',
          padding: '1rem 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000,
          animation: 'slideUp 0.3s ease forwards'
        }}>
          <CheckCircle size={20} color="var(--success-color)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-color)' }}>Success</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Details saved successfully!</span>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
