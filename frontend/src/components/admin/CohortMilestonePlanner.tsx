import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { Card } from '../ui';

interface Milestone {
  id: number;
  cohort: number;
  title: string;
  due_date: string;
  order_index: number;
  is_final_submission: boolean;
}

interface Props {
  cohortId: number;
  style?: React.CSSProperties;
}

const CohortMilestonePlanner: React.FC<Props> = ({ cohortId, style }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isFinal, setIsFinal] = useState(false);

  const fetchMilestones = async () => {
    try {
      const res = await axiosInstance.get(`/cohort-milestones/?cohort=${cohortId}`);
      // Ensure sorted by order_index locally as fallback
      const sorted = res.data.sort((a: Milestone, b: Milestone) => a.order_index - b.order_index);
      setMilestones(sorted);
    } catch (err) {
      console.error('Failed to fetch milestones', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [cohortId]);

  const resetForm = () => {
    setTitle('');
    setDueDate('');
    setIsFinal(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    try {
      const payload = {
        cohort: cohortId,
        title,
        due_date: dueDate,
        is_final_submission: isFinal,
        order_index: editingId 
            ? milestones.find(m => m.id === editingId)?.order_index || 0
            : milestones.length
      };

      if (editingId) {
        await axiosInstance.put(`/cohort-milestones/${editingId}/`, payload);
      } else {
        await axiosInstance.post(`/cohort-milestones/`, payload);
      }
      resetForm();
      fetchMilestones();
    } catch (err) {
      console.error('Failed to save milestone', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;
    try {
      await axiosInstance.delete(`/cohort-milestones/${id}/`);
      fetchMilestones();
    } catch (err) {
      console.error('Failed to delete milestone', err);
    }
  };

  const handleEdit = (m: Milestone) => {
    setEditingId(m.id);
    setTitle(m.title);
    setDueDate(m.due_date);
    setIsFinal(m.is_final_submission);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === milestones.length - 1) return;

    const newMilestones = [...milestones];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap order_index
    const tempOpts = newMilestones[index].order_index;
    newMilestones[index].order_index = newMilestones[swapIndex].order_index;
    newMilestones[swapIndex].order_index = tempOpts;

    // Fast local update
    const sorted = [...newMilestones].sort((a, b) => a.order_index - b.order_index);
    setMilestones(sorted);

    // Persist
    try {
      await Promise.all([
        axiosInstance.patch(`/cohort-milestones/${sorted[index].id}/`, { order_index: sorted[index].order_index }),
        axiosInstance.patch(`/cohort-milestones/${sorted[swapIndex].id}/`, { order_index: sorted[swapIndex].order_index })
      ]);
    } catch (err) {
      console.error('Failed to update order', err);
      fetchMilestones(); // Revert on fail
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading milestones...</div>;

  return (
    <Card style={{ padding: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Cohort Milestone Planner</h2>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Define the timeline sequence for this cohort. A milestone marked as "Final Submission" will represent the end of the project. Time-based intermediate phases will automatically be marked completed when their due date passes.
      </p>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {milestones.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No milestones configured yet.
          </div>
        ) : (
          milestones.map((m, idx) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: m.is_final_submission ? 'rgba(37,99,235,0.03)' : 'var(--bg-main)', border: m.is_final_submission ? '1px solid rgba(37,99,235,0.2)' : '1px solid var(--border-color)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: idx === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', padding: '2px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                  </button>
                  <button onClick={() => handleMove(idx, 'down')} disabled={idx === milestones.length - 1} style={{ border: 'none', background: 'transparent', cursor: idx === milestones.length - 1 ? 'not-allowed' : 'pointer', color: idx === milestones.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)', padding: '2px' }}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{m.title}</h4>
                    {m.is_final_submission && <span style={{ fontSize: '0.7rem', background: '#2563eb', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Final</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Due: {m.due_date}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={() => handleEdit(m)} style={{ padding: '6px 10px', fontSize: '0.8rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-main)' }}>Edit</button>
                <button onClick={() => handleDelete(m.id)} style={{ padding: '6px 10px', fontSize: '0.8rem', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form */}
      <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {editingId ? 'Edit Milestone' : 'Add Milestone'}
        </h3>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }} placeholder="e.g., Project Proposal" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="is_final" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} />
            <label htmlFor="is_final" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>Mark as Final Submission</label>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={!title || !dueDate} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 600, cursor: (!title || !dueDate) ? 'not-allowed' : 'pointer', opacity: (!title || !dueDate) ? 0.7 : 1 }}>
              {editingId ? 'Update Milestone' : 'Add Milestone'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

    </Card>
  );
};

export default CohortMilestonePlanner;
