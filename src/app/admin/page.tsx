'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Printer, Download, Search, CheckCircle2, ChevronDown, ChevronUp, Mail, Phone, MapPin, Building, UserCheck, Calendar, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const kenyaCounties = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado",
  "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia",
  "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
  "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita Taveta", "Tana River",
  "Tharaka Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
];

export default function AdminDashboard() {
  const getCourseDisplay = (student: any) => {
    if (student.course && student.course !== 'Unknown Course') return student.course;
    const prefix = student.admissionNumber?.substring(0, 3).toUpperCase();
    if (prefix === 'J17') return 'Computer Science';
    if (prefix === 'J18') return 'Cloud Computing';
    if (prefix === 'J77') return 'Information Technology';
    return 'Unknown Course';
  };

  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [countyFilter, setCountyFilter] = useState('');
  const [assessmentFilter, setAssessmentFilter] = useState('ALL');
  const [sortMode, setSortMode] = useState('ADM');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin')
      .then(res => res.json())
      .then(data => setStudents(data));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Attempt to load the logo
    let logoBase64 = '';
    try {
      const response = await fetch('/logo.png');
      const blob = await response.blob();
      const reader = new FileReader();
      logoBase64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Could not load logo for PDF", err);
    }

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 14, 10, 18, 18);
      doc.setFontSize(16);
      doc.setTextColor(90, 61, 122);
      doc.text('Machakos University - Comprehensive Attachment Records', 36, 18);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 36, 24);
    } else {
      doc.setFontSize(16);
      doc.setTextColor(90, 61, 122);
      doc.text('Machakos University - Comprehensive Attachment Records', 14, 15);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    }

    const tableColumn = [
      "No.", 
      "Admission", 
      "Student Details", 
      "Course", 
      "Firm Details (Name, Contact & Location)", 
      "Attachment Period",
      "Assessment"
    ];
    
    const tableRows: any[] = [];

    // Filtered students are already calculated in the render, but we need them here
    const currentFilteredStudents = students.filter(s => {
      const hasValidName = s.studentName && s.studentName.trim().length > 0 && s.studentName !== 'Unnamed Student';
      const validFirms = s.firms ? s.firms.filter((f: any) => f.firmName && f.firmName.trim().length > 0) : [];
      const isComplete = hasValidName && validFirms.length > 0;
      if (!isComplete) return false;

      const matchesSearch = 
        s.admissionNumber?.toLowerCase().includes(search.toLowerCase()) ||
        s.studentName?.toLowerCase().includes(search.toLowerCase()) ||
        (s.firms && s.firms.some((f: any) => f.firmName?.toLowerCase().includes(search.toLowerCase())));
        
      const matchesCourse = courseFilter === '' || s.course === courseFilter;
      const matchesCounty = countyFilter === '' || (s.firms && s.firms.some((f: any) => f.firmCounty === countyFilter));
      
      const matchesAssessment = 
        assessmentFilter === 'ALL' ||
        (assessmentFilter === 'ASSESSED' && s.firms && s.firms.length > 0 && s.firms.every((f: any) => f.assessmentDone)) ||
        (assessmentFilter === 'NOT_ASSESSED' && s.firms && s.firms.some((f: any) => !f.assessmentDone));
      
      return matchesSearch && matchesCourse && matchesCounty && matchesAssessment;
    }).sort((a, b) => {
      if (sortMode === 'GEO') {
        const countyA = (a.firms && a.firms.length > 0 && a.firms[0].firmCounty) || 'ZZZ';
        const countyB = (b.firms && b.firms.length > 0 && b.firms[0].firmCounty) || 'ZZZ';
        const cmpCounty = countyA.localeCompare(countyB);
        if (cmpCounty !== 0) return cmpCounty;
        
        const locA = (a.firms && a.firms.length > 0 && a.firms[0].exactLocation) || 'ZZZ';
        const locB = (b.firms && b.firms.length > 0 && b.firms[0].exactLocation) || 'ZZZ';
        const cmpLoc = locA.localeCompare(locB);
        if (cmpLoc !== 0) return cmpLoc;
      }

      const numA = a.admissionNumber || '';
      const numB = b.admissionNumber || '';
      return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
    });

    currentFilteredStudents.forEach((student, index) => {
      const studentDetails = `${student.studentName || 'Not Provided'}\nPhone: ${student.phone || 'N/A'}\nEmail: ${student.email || 'N/A'}`;

      const firmsSummary = student.firms && student.firms.length > 0 
        ? student.firms.map((f: any) => `${f.firmName || 'Unnamed'} - ${f.firmCounty || 'No County'}\nLocation: ${f.exactLocation || 'N/A'}\nFirm Email: ${f.firmEmail || 'N/A'}\nSup. Phone: ${f.supervisorPhone || 'N/A'}`).join('\n\n')
        : 'No Firm Attached';

      const datesSummary = student.firms && student.firms.length > 0 
        ? student.firms.map((f: any) => {
            const start = f.startDate ? new Date(f.startDate).toLocaleDateString() : 'N/A';
            const end = f.endDate ? new Date(f.endDate).toLocaleDateString() : 'N/A';
            return `${start} to ${end}\n\n`; // Matches 3 lines height of firmsSummary
          }).join('\n\n').trim()
        : 'N/A';

      const statusSummary = student.firms && student.firms.length > 0 
        ? student.firms.map((f: any) => `${f.assessmentDone ? 'COMPLETED' : 'PENDING'}\n\n`).join('\n\n').trim()
        : 'N/A';

      tableRows.push([
        index + 1,
        student.admissionNumber || 'N/A',
        studentDetails,
        getCourseDisplay(student),
        firmsSummary,
        datesSummary,
        statusSummary
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 32,
      theme: 'grid',
      styles: { 
        fontSize: 7.5,
        cellPadding: 1.5,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        textColor: [40, 40, 40]
      },
      headStyles: {
        fillColor: [90, 61, 122],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 50 },
        3: { cellWidth: 35 },
        4: { cellWidth: 75 },
        5: { cellWidth: 45 },
        6: { cellWidth: 25, halign: 'center' }
      },
      didDrawPage: (data) => {
        const str = `Page ${data.pageNumber}`;
        doc.setFontSize(8);
        doc.setTextColor(150);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 8);
      }
    });

    doc.save('MKSU_Attachment_Records.pdf');
  };

  const handleAssessmentToggle = async (firmId: string, currentStatus: boolean) => {
    setStudents(prev => prev.map(student => ({
      ...student,
      firms: student.firms?.map((firm: any) => 
        firm.id === firmId ? { ...firm, assessmentDone: !currentStatus } : firm
      )
    })));

    try {
      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmId, assessmentDone: !currentStatus })
      });
    } catch (err) {
      console.error('Failed to update assessment');
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  const getCompletionScore = (s: any) => {
    let score = 0;
    if (s.studentName) score++;
    if (s.email) score++;
    if (s.phone) score++;
    if (s.yearOfStudy) score++;
    
    if (s.firms && s.firms.length > 0) {
      score += 2;
      s.firms.forEach((f: any) => {
        if (f.firmName) score++;
        if (f.firmCounty) score++;
        if (f.exactLocation) score++;
        if (f.supervisorName) score++;
        if (f.startDate) score++;
      });
    }
    return score;
  };

  const filteredStudents = students.filter(s => {
    const hasValidName = s.studentName && s.studentName.trim().length > 0 && s.studentName !== 'Unnamed Student';
    const validFirms = s.firms ? s.firms.filter((f: any) => f.firmName && f.firmName.trim().length > 0) : [];
    const isComplete = hasValidName && validFirms.length > 0;
    if (!isComplete) return false;

    const matchesSearch = 
      s.admissionNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      (s.firms && s.firms.some((f: any) => f.firmName?.toLowerCase().includes(search.toLowerCase())));
      
    const matchesCourse = courseFilter === '' || s.course === courseFilter;
    const matchesCounty = countyFilter === '' || (s.firms && s.firms.some((f: any) => f.firmCounty === countyFilter));
    
    const matchesAssessment = 
      assessmentFilter === 'ALL' ||
      (assessmentFilter === 'ASSESSED' && s.firms && s.firms.length > 0 && s.firms.every((f: any) => f.assessmentDone)) ||
      (assessmentFilter === 'NOT_ASSESSED' && s.firms && s.firms.some((f: any) => !f.assessmentDone));
    
    return matchesSearch && matchesCourse && matchesCounty && matchesAssessment;
  }).sort((a, b) => {
    if (sortMode === 'GEO') {
      const countyA = (a.firms && a.firms.length > 0 && a.firms[0].firmCounty) || 'ZZZ';
      const countyB = (b.firms && b.firms.length > 0 && b.firms[0].firmCounty) || 'ZZZ';
      const cmpCounty = countyA.localeCompare(countyB);
      if (cmpCounty !== 0) return cmpCounty;
      
      const locA = (a.firms && a.firms.length > 0 && a.firms[0].exactLocation) || 'ZZZ';
      const locB = (b.firms && b.firms.length > 0 && b.firms[0].exactLocation) || 'ZZZ';
      const cmpLoc = locA.localeCompare(locB);
      if (cmpLoc !== 0) return cmpLoc;
    }

    const numA = a.admissionNumber || '';
    const numB = b.admissionNumber || '';
    return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header className="hide-on-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle" style={{ marginBottom: '0.75rem' }}>View and manage comprehensive student attachment records</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(90, 61, 122, 0.1)', color: 'var(--primary-purple)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>
            <Users size={16} /> {filteredStudents.length} Student{filteredStudents.length !== 1 && 's'} Found
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary">
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div className="card hide-on-print" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: 'none', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, background: 'var(--bg-color)', padding: '0.5rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', transition: 'all 0.3s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <Search color="var(--primary-purple)" size={20} />
              <input 
                type="text" 
                placeholder="Search by name, admission, or firm..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.5rem 0', outline: 'none', fontSize: '1rem' }}
              />
            </div>

            <select 
              value={courseFilter} 
              onChange={e => setCourseFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '180px', cursor: 'pointer', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', fontWeight: 500 }}
            >
              <option value="">All Courses</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Cloud Computing">Cloud Computing</option>
              <option value="Information Technology">Information Technology</option>
            </select>

            <select 
              value={countyFilter} 
              onChange={e => setCountyFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '160px', cursor: 'pointer', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', fontWeight: 500 }}
            >
              <option value="">All Locations</option>
              {Array.from(new Set(
                students
                  .filter(s => s.studentName && s.studentName !== 'Unnamed Student')
                  .flatMap(s => s.firms ? s.firms.map((f: any) => f.firmCounty).filter(Boolean) : [])
              )).sort((a: any, b: any) => a.localeCompare(b)).map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
            </select>

            <select 
              value={assessmentFilter} 
              onChange={e => setAssessmentFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '160px', cursor: 'pointer', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', fontWeight: 500 }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ASSESSED">Fully Assessed</option>
              <option value="NOT_ASSESSED">Pending Assessment</option>
            </select>

            <select 
              value={sortMode} 
              onChange={e => setSortMode(e.target.value)}
              style={{ width: 'auto', minWidth: '180px', cursor: 'pointer', padding: '1rem', borderRadius: '12px', border: '1px solid var(--primary-purple)', background: 'rgba(90, 61, 122, 0.05)', color: 'var(--primary-purple)', fontWeight: 600 }}
            >
              <option value="ADM">Sort by Admission</option>
              <option value="GEO">Group Geographically</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handlePrint} className="btn btn-secondary" style={{ borderRadius: '12px' }}>
              <Printer size={18} /> Print Report
            </button>
            <button onClick={handleDownloadPDF} className="btn btn-primary" style={{ borderRadius: '12px' }}>
              <Download size={18} /> Download PDF
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginRight: '0.5rem' }}>Quick Filters:</span>
          {['', 'Computer Science', 'Cloud Computing', 'Information Technology'].map(course => (
            <button
              key={course}
              onClick={() => setCourseFilter(course)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: courseFilter === course ? 'var(--primary-purple)' : 'var(--border-color)',
                backgroundColor: courseFilter === course ? 'var(--primary-purple)' : 'var(--bg-color)',
                color: courseFilter === course ? 'white' : 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                boxShadow: courseFilter === course ? '0 4px 10px rgba(46, 26, 71, 0.2)' : 'none'
              }}
            >
              {course === '' ? 'All Courses' : course}
            </button>
          ))}
        </div>
      </div>

      <div className="hide-on-print">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredStudents.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Search size={48} color="var(--border-color)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: 'var(--text-secondary)' }}>No records found matching your filters.</h3>
            </div>
          ) : (
            filteredStudents.map((student, i) => {
              const isExpanded = expandedRowId === student.id;
              const offDaysParsed = student.offDays ? JSON.parse(student.offDays) : {};
              const offDaysList = Object.entries(offDaysParsed).filter(([_, isOff]) => isOff).map(([day]) => day).join(', ');

              return (
                <div key={student.id} className="glass-card animate-fade-in" style={{ padding: '0', overflow: 'hidden', animationDelay: (i * 0.05) + 's' }}>
                  <div 
                    onClick={() => toggleRow(student.id)}
                    className="hide-on-print"
                    style={{ 
                      padding: '1.5rem 2rem', 
                      display: 'grid', 
                      gridTemplateColumns: '1.5fr 2fr 1fr auto', 
                      gap: '1rem', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      background: isExpanded ? 'rgba(90, 61, 122, 0.03)' : 'transparent',
                      transition: 'background 0.3s ease'
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>{student.admissionNumber}</p>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{student.studentName || 'Unnamed Student'}</h3>
                    </div>
                    <div>
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '0.4rem 0.8rem', 
                        background: 'rgba(42, 96, 200, 0.1)', 
                        color: 'var(--primary-blue)', 
                        borderRadius: '6px', 
                        fontSize: '0.85rem',
                        fontWeight: 600 
                      }}>
                        {getCourseDisplay(student)}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Firms Attended</p>
                      <p style={{ fontWeight: 600 }}>{student.firms?.length || 0} Firm(s)</p>
                    </div>
                    <div style={{ color: 'var(--primary-purple)' }}>
                      {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </div>

                  {(isExpanded) && (
                    <div className="expanded-content" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
                      <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-purple)', fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>
                            <UserCheck size={18} /> Personal Details
                          </h4>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to reset this student's password back to their Admission Number?")) {
                                try {
                                  const res = await fetch('/api/admin', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'resetPassword', studentId: student.id })
                                  });
                                  if (res.ok) alert('Password reset successfully!');
                                  else alert('Failed to reset password.');
                                } catch (err) {
                                  alert('Error resetting password.');
                                }
                              }
                            }}
                            className="btn btn-secondary hide-on-print" 
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', color: 'var(--error-color)', borderColor: 'var(--error-color)', background: 'transparent' }}
                          >
                            Reset Password
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'var(--surface-color)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                          <div className="info-item">
                            <span className="info-label"><Mail size={14} style={{display:'inline', marginRight:'4px'}} /> Email</span>
                            <span className="info-value" style={{ fontSize: '0.95rem' }}>{student.email || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label"><Phone size={14} style={{display:'inline', marginRight:'4px'}} /> Phone</span>
                            <span className="info-value" style={{ fontSize: '0.95rem' }}>{student.phone || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Year of Study</span>
                            <span className="info-value" style={{ fontSize: '0.95rem' }}>{student.yearOfStudy || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label"><Calendar size={14} style={{display:'inline', marginRight:'4px'}} /> Off Days</span>
                            <span className="info-value" style={{ fontSize: '0.95rem', color: offDaysList ? 'inherit' : 'var(--text-secondary)' }}>{offDaysList || 'None'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-purple)', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>
                          <Building size={18} /> Attachment Placements
                        </h4>
                        {!student.firms || student.firms.length === 0 ? (
                          <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                            <p style={{ color: 'var(--text-secondary)' }}>No attachment firms recorded.</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {student.firms.map((firm: any, fIndex: number) => (
                              <div key={firm.id} style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', background: 'linear-gradient(to right, rgba(90, 61, 122, 0.02), transparent)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-purple)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                      {fIndex + 1}
                                    </div>
                                    <h5 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{firm.firmName || 'Unnamed Firm'}</h5>
                                  </div>
                                  <label className="hide-on-print" style={{ 
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', 
                                    padding: '0.5rem 1rem', borderRadius: '30px', 
                                    background: firm.assessmentDone ? 'var(--success-color)' : 'var(--primary-blue)',
                                    color: 'white',
                                    fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                                    boxShadow: firm.assessmentDone ? '0 4px 10px rgba(16, 185, 129, 0.3)' : '0 4px 10px rgba(42, 96, 200, 0.3)'
                                  }}>
                                    <input 
                                      type="checkbox" 
                                      checked={firm.assessmentDone || false}
                                      onChange={() => handleAssessmentToggle(firm.id, firm.assessmentDone)}
                                      style={{ display: 'none' }}
                                    />
                                    {firm.assessmentDone ? <CheckCircle2 size={18} color="white" /> : <div style={{ width: '16px', height: '16px', border: '2px solid white', borderRadius: '50%' }}></div>}
                                    {firm.assessmentDone ? 'Assessed' : 'Mark Assessed'}
                                  </label>
                                </div>
                                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                                  <div style={{ flex: '1 1 250px' }}>
                                    <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>Company Info</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Mail size={14} color="var(--text-secondary)" /> <span style={{ fontSize: '0.9rem' }}>{firm.firmEmail || 'N/A'}</span></div>
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}><MapPin size={14} color="var(--text-secondary)" style={{ marginTop: '2px' }} /> <span style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{firm.firmCounty || 'N/A'} {firm.exactLocation ? '— ' + firm.exactLocation : ''}</span></div>
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Calendar size={14} color="var(--text-secondary)" /> <span style={{ fontSize: '0.9rem' }}>{firm.startDate ? new Date(firm.startDate).toLocaleDateString() : 'N/A'} — {firm.endDate ? new Date(firm.endDate).toLocaleDateString() : 'N/A'}</span></div>
                                    </div>
                                  </div>
                                  <div style={{ flex: '1 1 250px' }}>
                                    <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>Supervisor Info</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><UserCheck size={14} color="var(--text-secondary)" /> <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{firm.supervisorName || 'N/A'}</span></div>
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Phone size={14} color="var(--text-secondary)" /> <span style={{ fontSize: '0.9rem' }}>{firm.supervisorPhone || 'N/A'}</span></div>
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Mail size={14} color="var(--text-secondary)" /> <span style={{ fontSize: '0.9rem' }}>{firm.supervisorEmail || 'N/A'}</span></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="print-only-table-wrapper" style={{ display: 'none' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#000' }}>Machakos University - Comprehensive Attachment Records</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#000', fontSize: '12px' }}>Generated on: {new Date().toLocaleString()}</p>
        <table className="print-only-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>No.</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Admission</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Student Details</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Course</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Firm Details</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Attachment Period</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Assessment</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, i) => (
              <tr key={student.id}>
                <td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>{i + 1}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>{student.admissionNumber}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>
                  <strong>{student.studentName || 'Not Provided'}</strong><br/>
                  Phone: {student.phone || 'N/A'}<br/>
                  Email: {student.email || 'N/A'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>{getCourseDisplay(student)}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>
                  {student.firms?.map((f: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      <strong>{f.firmName}</strong> - {f.firmCounty}<br/>
                      Loc: {f.exactLocation}<br/>
                      Sup. Phone: {f.supervisorPhone}
                    </div>
                  ))}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>
                  {student.firms?.map((f: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      {f.startDate ? new Date(f.startDate).toLocaleDateString() : 'N/A'} to {f.endDate ? new Date(f.endDate).toLocaleDateString() : 'N/A'}
                    </div>
                  ))}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>
                  {student.firms?.map((f: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      {f.assessmentDone ? 'COMPLETED' : 'PENDING'}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        .print-only { display: none; }
        @media print {
          .hide-on-print { display: none !important; }
          .print-only { display: block; }
          .print-only-table-wrapper { display: block !important; }
          body { background: white; color: black; }
          .container { padding: 0; max-width: none; }
          .expanded-content { display: block !important; border: 1px solid #ccc; margin-bottom: 2rem; padding: 1rem !important; }
          .glass-card { box-shadow: none !important; border: none !important; padding: 0 !important; margin-bottom: 30px; }
          .grid-4, .grid-2 { display: block; }
          .grid-4 > div, .grid-2 > div { margin-bottom: 10px; }
        }
      `}</style>
    </div>
  );
}
