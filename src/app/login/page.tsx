'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admissionNumber, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      if (data.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card animate-fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        
        <h1 style={{ marginBottom: '1rem', fontSize: 'clamp(1.5rem, 4vw, 1.8rem)', fontWeight: 800, color: 'var(--text-color)', lineHeight: 1.2 }}>
          Machakos University <br/><span style={{ fontSize: '0.85em', color: 'var(--primary-purple)' }}>Attachment Record</span>
        </h1>
        
        <div style={{ display: 'flex', justifyContent: 'center', margin: '1.25rem 0' }}>
          <img 
            src="/logo.png" 
            alt="Machakos University Logo" 
            style={{ width: '100px', height: '100px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} 
          />
        </div>

        <p style={{ color: '#e53935', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontStyle: 'italic', fontWeight: 600, marginBottom: '2rem', letterSpacing: '0.03em', lineHeight: 1.4 }}>
          "Excellence in Transformative Scholarship And Community Service"
        </p>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
          Enter your Admission Number to continue.
        </p>

        {error && (
          <div style={{ backgroundColor: 'var(--error-color)', color: 'white', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Admission Number</label>
            <input 
              type="text" 
              placeholder="e.g. J17-0000-0000" 
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value)}
              required 
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Lowercase admission number" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                style={{ width: '100%', paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Your password is your admission number in lowercase.
            </p>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
