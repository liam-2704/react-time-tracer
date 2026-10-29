import { useState } from 'react';
import type { Task, Tag, TimeSession } from '../App';

interface Props {
  tasks: Task[];
  tags: Tag[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function TimeReport({ tasks, tags, setTasks }: Props) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const [filterStartStr, setFilterStartStr] = useState(new Date(startOfDay - 86400000 * 6).toISOString().slice(0, 16)); 
  const [filterEndStr, setFilterEndStr] = useState(new Date(now.getTime()).toISOString().slice(0, 16));
  const [selectedDetailTaskId, setSelectedDetailTaskId] = useState<number | ''>(''); 

  const filterStart = new Date(filterStartStr).getTime();
  const filterEnd = new Date(filterEndStr).getTime();

  const safeISOString = (timestamp: number | null) => {
    if (!timestamp || isNaN(timestamp)) return '';
    try {
      return new Date(timestamp - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch (e) {
      return '';
    }
  };

  const hasOverlap = (index: number, sessions: TimeSession[]) => {
    const current = sessions[index];
    const currentEnd = current.end; 
    if (currentEnd === null) return false; 

    return sessions.some((other, i) => {
      const otherEnd = other.end;
      if (i === index || otherEnd === null) return false; 
      return current.start < otherEnd && currentEnd > other.start;
    });
  };

  const calculateTotalSeconds = (sessions: TimeSession[], startBoundary: number, endBoundary: number) => {
    return sessions.reduce((total, s) => {
      const sEnd = s.end || Date.now();
      const actualStart = Math.max(s.start, startBoundary);
      const actualEnd = Math.min(sEnd, endBoundary);
      return actualEnd > actualStart ? total + Math.floor((actualEnd - actualStart) / 1000) : total;
    }, 0);
  };

  const formatTime = (secs: number) => `${Math.floor(secs/3600).toString().padStart(2,'0')}:${Math.floor((secs%3600)/60).toString().padStart(2,'0')}:${(secs%60).toString().padStart(2,'0')}`;

  const handleUpdateSessions = async (taskId: number, newSessions: TimeSession[]) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    try {
      await fetch(`http://localhost:3010/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additional_data: JSON.stringify({ order: task.order, sessions: newSessions }) })
      });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, sessions: newSessions } : t));
    } catch (e) { console.error(e); }
  };

  const addManualSession = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) handleUpdateSessions(taskId, [...task.sessions, { start: Date.now() - 3600000, end: Date.now() }]);
  };

  const updateSessionTime = (taskId: number, sessionIndex: number, field: 'start'|'end', isoString: string) => {
    if (!isoString) return; 
    const newTime = new Date(isoString).getTime();
    if (isNaN(newTime)) return; 

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newSessions = [...task.sessions];
    newSessions[sessionIndex] = { ...newSessions[sessionIndex], [field]: newTime };
    handleUpdateSessions(taskId, newSessions);
  };

  const deleteSession = (taskId: number, sessionIndex: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) handleUpdateSessions(taskId, task.sessions.filter((_, i) => i !== sessionIndex));
  };

  const generateChartData = (task: Task) => {
    const days = [];
    if (isNaN(filterStart) || isNaN(filterEnd)) return { days: [], maxSeconds: 1 };

    let current = new Date(filterStart);
    current.setHours(0,0,0,0);
    const end = new Date(filterEnd);
    let maxSeconds = 1; 

    while(current.getTime() <= end.getTime()) {
      const dayStart = current.getTime();
      const dayEnd = dayStart + 86399999;
      const secs = calculateTotalSeconds(task.sessions, dayStart, dayEnd);
      if (secs > maxSeconds) maxSeconds = secs;
      days.push({ label: current.toLocaleDateString(), seconds: secs });
      current.setDate(current.getDate() + 1);
    }
    return { days, maxSeconds };
  };

  const selectedTask = tasks.find(t => t.id === selectedDetailTaskId);
  const chartData = selectedTask ? generateChartData(selectedTask) : null;

  // RESTORED: Calculate Activity per Task
  const taskSummaries = tasks.map(task => ({
    ...task,
    intervalSeconds: calculateTotalSeconds(task.sessions, filterStart, filterEnd)
  })).filter(t => t.intervalSeconds > 0);

  // RESTORED: Calculate Activity per Tag
  const tagSummaries = tags.map(tag => {
    const associatedTasks = tasks.filter(t => t.tags.includes(tag.id));
    const totalTagSeconds = associatedTasks.reduce((sum, task) => sum + calculateTotalSeconds(task.sessions, filterStart, filterEnd), 0);
    return { name: tag.name, seconds: totalTagSeconds };
  }).filter(t => t.seconds > 0);


  return (
    <div className="main-content">
      <h2>Activity Reports & Editing</h2>
      
      <div className="task-card flex-row" style={{ marginBottom: '2rem' }}>
        <div>
          <label style={{display:'block'}}>From:</label>
          <input type="datetime-local" value={filterStartStr} onChange={(e) => setFilterStartStr(e.target.value)} />
        </div>
        <div>
          <label style={{display:'block'}}>To:</label>
          <input type="datetime-local" value={filterEndStr} onChange={(e) => setFilterEndStr(e.target.value)} />
        </div>
      </div>

      {/* RESTORED SUMMARY TABLES */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h3>Tasks Active in Period</h3>
          {taskSummaries.length === 0 ? <p>No tasks active during this time.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--card-bg)' }}>
              <thead><tr style={{ backgroundColor: 'var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', border: '1px solid var(--border-color)' }}>Task</th>
                <th style={{ padding: '0.75rem', border: '1px solid var(--border-color)', textAlign: 'right' }}>Time Spent</th>
              </tr></thead>
              <tbody>
                {taskSummaries.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', border: '1px solid var(--border-color)' }}>{t.name}</td>
                    <td style={{ padding: '0.75rem', border: '1px solid var(--border-color)', textAlign: 'right', fontFamily: 'monospace' }}>{formatTime(t.intervalSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ flex: '1 1 300px' }}>
          <h3>Tags Active in Period</h3>
          {tagSummaries.length === 0 ? <p>No tags active during this time.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--card-bg)' }}>
              <thead><tr style={{ backgroundColor: 'var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', border: '1px solid var(--border-color)' }}>Tag</th>
                <th style={{ padding: '0.75rem', border: '1px solid var(--border-color)', textAlign: 'right' }}>Cumulative Time</th>
              </tr></thead>
              <tbody>
                {tagSummaries.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', border: '1px solid var(--border-color)' }}>{t.name}</td>
                    <td style={{ padding: '0.75rem', border: '1px solid var(--border-color)', textAlign: 'right', fontFamily: 'monospace' }}>{formatTime(t.seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DETAILED TASK VIEW */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Detailed Task View (Intervals & Chart)</h3>
        <select 
          value={selectedDetailTaskId} 
          onChange={(e) => setSelectedDetailTaskId(Number(e.target.value))}
          style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem' }}
        >
          <option value="" disabled>Select a task to view intervals and chart</option>
          {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        {selectedTask && (
          <div className="task-card" style={{ flexDirection: 'column' }}>
            
            <h4>Daily Active Time (Bar Chart)</h4>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', overflowX: 'auto' }}>
              {chartData?.days.map((day, i) => (
                <div key={i} style={{ flex: 1, minWidth: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }} title={`${day.label}: ${formatTime(day.seconds)}`}>
    
                  <div style={{ width: '80%', height: `${(day.seconds / chartData.maxSeconds) * 100}%`, minHeight: day.seconds > 0 ? '4px' : '0', backgroundColor: 'var(--primary-btn)', transition: 'height 0.3s' }}></div>
                  <span style={{ fontSize: '0.6rem', marginTop: '4px', writingMode: 'vertical-rl' }}>{day.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4>Activity Intervals (Chronological)</h4>
              <button onClick={() => addManualSession(selectedTask.id)}>+ Add Interval</button>
            </div>
            
            {selectedTask.sessions.sort((a,b) => a.start - b.start).map((session, idx) => {
              if (session.start > filterEnd || (session.end && session.end < filterStart)) return null;
              
              const overlapping = hasOverlap(idx, selectedTask.sessions);
              
              return (
                <div key={idx} style={{ 
                  display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', 
                  padding: '0.5rem', marginTop: '0.5rem', 
                  backgroundColor: overlapping ? 'var(--error-bg)' : 'var(--nav-bg)', 
                  border: overlapping ? '2px solid var(--danger-btn)' : '1px solid var(--border-color)' 
                }}>
                  <input 
                    type="datetime-local" 
                    value={safeISOString(session.start)} 
                    onChange={(e) => updateSessionTime(selectedTask.id, idx, 'start', e.target.value)}
                  />
                  <span>to</span>
                  {session.end ? (
                    <input 
                      type="datetime-local" 
                      value={safeISOString(session.end)} 
                      onChange={(e) => updateSessionTime(selectedTask.id, idx, 'end', e.target.value)}
                    />
                  ) : (
                    <span>(Ongoing)</span>
                  )}
                  <button className="danger" onClick={() => deleteSession(selectedTask.id, idx)} style={{ marginLeft: 'auto' }}>Remove</button>
                  {overlapping && <span style={{ color: 'var(--danger-btn)', fontWeight: 'bold', width: '100%' }}>Overlap Detected!</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}