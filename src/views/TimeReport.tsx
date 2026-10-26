import { useState } from 'react';
import type { Task, Tag, TimeSession } from '../App';

interface Props {
  tasks: Task[];
  tags: Tag[];
}

export default function TimeReport({ tasks, tags }: Props) {
  // Setup default time interval (Today)
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const [filterStartStr, setFilterStartStr] = useState(new Date(startOfDay).toISOString().slice(0, 16));
  const [filterEndStr, setFilterEndStr] = useState(new Date(now.getTime()).toISOString().slice(0, 16));

  const filterStart = new Date(filterStartStr).getTime();
  const filterEnd = new Date(filterEndStr).getTime();

  // Mathematical overlapping helper for strict time boundaries
  const calculateOverlapSeconds = (sessions: TimeSession[]) => {
    let total = 0;
    sessions.forEach(s => {
      const sStart = s.start;
      const sEnd = s.end || Date.now();
      
      const actualStart = Math.max(sStart, filterStart);
      const actualEnd = Math.min(sEnd, filterEnd);
      
      if (actualEnd > actualStart) {
        total += (actualEnd - actualStart) / 1000;
      }
    });
    return Math.floor(total);
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // 1. Calculate Activity per Task
  const taskSummaries = tasks.map(task => ({
    ...task,
    intervalSeconds: calculateOverlapSeconds(task.sessions)
  })).filter(t => t.intervalSeconds > 0);

  // 2. Calculate Activity per Tag
  const tagSummaries = tags.map(tag => {
    const associatedTasks = tasks.filter(t => t.tags.includes(tag.id));
    const totalTagSeconds = associatedTasks.reduce((sum, task) => sum + calculateOverlapSeconds(task.sessions), 0);
    return { name: tag.name, seconds: totalTagSeconds };
  }).filter(t => t.seconds > 0);

  return (
    <div className="main-content">
      <h2>Activity Summary</h2>
      
      <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3>Select Time Interval</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label>From: <input type="datetime-local" value={filterStartStr} onChange={(e) => setFilterStartStr(e.target.value)} /></label>
          <label>To: <input type="datetime-local" value={filterEndStr} onChange={(e) => setFilterEndStr(e.target.value)} /></label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* TASK SUMMARY */}
        <div style={{ flex: 1 }}>
          <h3>Tasks Active in Period</h3>
          {taskSummaries.length === 0 ? <p>No tasks active during this time.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ backgroundColor: '#333', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Task</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Time Spent</th>
              </tr></thead>
              <tbody>
                {taskSummaries.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '0.5rem' }}>{t.name}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatTime(t.intervalSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* TAG SUMMARY */}
        <div style={{ flex: 1 }}>
          <h3>Tags Active in Period</h3>
          {tagSummaries.length === 0 ? <p>No tags active during this time.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ backgroundColor: '#333', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Tag</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Cumulative Time</th>
              </tr></thead>
              <tbody>
                {tagSummaries.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '0.5rem' }}>{t.name}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatTime(t.seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}