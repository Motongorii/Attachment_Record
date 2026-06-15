'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Save, User, Building, UserCheck, Calendar, BookOpen, Plus, Trash2 } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/student')
      .then(res => res.json())
      .then(json => {
        if (!json.firms || json.firms.length === 0) {
          json.firms = [{}];
        }
        setData(json);
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
    }
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
    alert('Details saved successfully!');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
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
                <input value={data.studentName || ''} onChange={e => handleChange('studentName', e.target.value)} required placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={data.email || ''} onChange={e => handleChange('email', e.target.value)} required placeholder="student@example.com" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" value={data.phone || ''} onChange={e => handleChange('phone', e.target.value)} required placeholder="0712345678" />
              </div>
              <div className="form-group">
                <label>Year of Study</label>
                <select value={data.yearOfStudy || ''} onChange={e => handleChange('yearOfStudy', e.target.value)} required>
                  <option value="">Select Year...</option>
                  <option value="Year 1">Year 1</option>
                  <option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option>
                  <option value="Year 4">Year 4</option>
                  <option value="Option 1 (Other)">Option 1 (Other)</option>
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
                    <input value={firm.firmName || ''} onChange={e => handleFirmChange(index, 'firmName', e.target.value)} required placeholder="Company Ltd" />
                  </div>
                  <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
                    <div className="form-group">
                      <label>Firm Email</label>
                      <input type="email" value={firm.firmEmail || ''} onChange={e => handleFirmChange(index, 'firmEmail', e.target.value)} required placeholder="info@company.com" />
                    </div>
                    <div className="form-group">
                      <label>Town/City</label>
                      <input value={firm.firmCity || ''} onChange={e => handleFirmChange(index, 'firmCity', e.target.value)} required placeholder="Nairobi" />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label>Major Land Mark</label>
                    <input value={firm.firmLandmark || ''} onChange={e => handleFirmChange(index, 'firmLandmark', e.target.value)} required placeholder="Near KICC" />
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
                    <input value={firm.supervisorName || ''} onChange={e => handleFirmChange(index, 'supervisorName', e.target.value)} required placeholder="Jane Doe" />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label>Phone Number</label>
                    <input type="tel" value={firm.supervisorPhone || ''} onChange={e => handleFirmChange(index, 'supervisorPhone', e.target.value)} required placeholder="0712345678" />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={firm.supervisorEmail || ''} onChange={e => handleFirmChange(index, 'supervisorEmail', e.target.value)} required placeholder="jane@company.com" />
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
      </div>
    </>
  );
}
