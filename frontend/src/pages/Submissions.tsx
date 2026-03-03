import React, { useState, useRef } from 'react';
import { Card, Button, Input } from '../components/ui';
import AdminLayout from '../layouts/AdminLayout';

interface Milestone {
    id: string;
    title: string;
    dueDate: string;
    description: string;
    status: 'Pending' | 'Submitted' | 'Overdue';
}



const Submissions: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [repoLink, setRepoLink] = useState('');
    const [urlError, setUrlError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeMilestone: Milestone = {
        id: 'final-submission',
        title: 'Final Submission',
        dueDate: '2026-05-19T23:59:59Z',
        description: 'Complete project code, documentation, and a short demonstration video link.',
        status: 'Pending'
    };


    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleRepoLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setRepoLink(value);
        if (value && !/^https?:\/\/.*/.test(value)) {
            setUrlError('Please enter a valid URL starting with http:// or https://');
        } else {
            setUrlError('');
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile && !repoLink) return;
        setIsSubmitting(true);
        // Simulate upload
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsSubmitting(false);
        setIsSubmittedSuccessfully(true);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <AdminLayout title="Project Submissions" breadcrumb={['Dashboard', 'Submissions']}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
                padding: '2rem 1rem',
                width: '100%'
            }}>
                <div style={{
                    maxWidth: '900px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2rem'
                }}>
                    {isSubmittedSuccessfully ? (
                        <Card style={{ textAlign: 'center', padding: '5rem 2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: '#10b98120',
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 2rem auto'
                            }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800 }}>Submission successful!</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
                                Your final project documentation and files have been securely uploaded. You can review your submission details below.
                            </p>
                            <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '20px', marginBottom: '3rem', display: 'inline-block', minWidth: '400px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.05em' }}>COMPENSATION TIMESTAMP</div>
                                <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-main)' }}>{new Date().toLocaleString()}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                                <Button variant="outline" onClick={() => {
                                    setIsSubmittedSuccessfully(false);
                                    setSelectedFile(null);
                                    setRepoLink('');
                                }} style={{ padding: '12px 30px' }}>Back to Portal</Button>
                                <Button style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '12px 30px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    Download Confirmation
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <>
                            <Card style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary-blue)' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem', textAlign: 'center' }}>
                                    <h2 style={{ fontSize: '2.5rem', margin: '0 0 1rem 0', fontWeight: 800, letterSpacing: '-0.025em' }}>{activeMilestone.title}</h2>
                                    <div style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '0.75rem 2rem',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)',
                                        display: 'flex',
                                        gap: '1rem',
                                        alignItems: 'baseline'
                                    }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>DEADLINE</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                            {new Date(activeMilestone.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(37, 99, 235, 0.05)', padding: '1.25rem 1.75rem', borderRadius: '16px', marginBottom: '3rem', display: 'flex', gap: '1rem', alignItems: 'center', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                        <strong style={{ color: 'var(--text-main)', fontWeight: 700 }}>Submission Rules:</strong> Only one member per team needs to submit. This will update the status for all members.
                                    </span>
                                </div>

                                <div style={{ marginBottom: '0' }}>
                                    <h4 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Upload Deliverables</h4>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                        accept=".pdf,.zip,.doc,.docx"
                                    />

                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => !selectedFile && fileInputRef.current?.click()}
                                        style={{
                                            border: `2px dashed ${dragActive ? 'var(--primary-blue)' : 'var(--border-color)'}`,
                                            borderRadius: '20px',
                                            padding: selectedFile ? '2.5rem' : '4rem 2rem',
                                            textAlign: 'center',
                                            background: dragActive ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                                            transition: 'all 0.3s cubic--bezier(0.4, 0, 0.2, 1)',
                                            marginBottom: '2rem',
                                            cursor: selectedFile ? 'default' : 'pointer',
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {selectedFile ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: '500px', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px' }}>
                                                <div style={{ width: '56px', height: '56px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                                        <polyline points="13 2 13 9 20 9"></polyline>
                                                    </svg>
                                                </div>
                                                <div style={{ textAlign: 'left', flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{formatFileSize(selectedFile.size)}</div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{
                                                    width: '64px',
                                                    height: '64px',
                                                    borderRadius: '16px',
                                                    background: 'rgba(37, 99, 235, 0.1)',
                                                    color: 'var(--primary-blue)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginBottom: '1.5rem'
                                                }}>
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                        <polyline points="17 8 12 3 7 8"></polyline>
                                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                                    </svg>
                                                </div>
                                                <p style={{ margin: '0 0 0.75rem 0', fontWeight: 700, fontSize: '1.25rem' }}>Drag and drop files here</p>
                                                <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>or <span style={{ color: 'var(--primary-blue)', textDecoration: 'underline' }}>browse your computer</span></p>
                                                <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Supported: PDF, ZIP, DOC (Max 50MB)</p>
                                            </>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '2.5rem' }}>
                                        <label style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Repository / Live Link (Optional)</label>
                                        <Input
                                            value={repoLink}
                                            onChange={handleRepoLinkChange}
                                            placeholder="https://github.com/..."
                                            style={{
                                                padding: '1rem',
                                                fontSize: '1rem',
                                                border: urlError ? '2px solid #ef4444' : '1px solid var(--border-color)',
                                                borderRadius: '12px'
                                            }}
                                        />
                                        {urlError && (
                                            <span style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 500 }}>{urlError}</span>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !!urlError || (!selectedFile && !repoLink)}
                                        style={{
                                            width: '100%',
                                            height: '56px',
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            display: 'flex',
                                            gap: '1rem',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg style={{ animation: 'spin 1s linear infinite' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="2" x2="12" y2="6"></line>
                                                    <line x1="12" y1="18" x2="12" y2="22"></line>
                                                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                                    <line x1="2" y1="12" x2="6" y2="12"></line>
                                                    <line x1="18" y1="12" x2="22" y2="12"></line>
                                                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                                                </svg>
                                                Processing Submission...
                                            </>
                                        ) : 'Submit'}
                                    </Button>

                                    <style>{`
                                        @keyframes spin {
                                            from { transform: rotate(0deg); }
                                            to { transform: rotate(360deg); }
                                        }
                                    `}</style>
                                </div>
                            </Card>

                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default Submissions;
