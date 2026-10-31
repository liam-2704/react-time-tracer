import { useState } from 'react';
import type { Task, Tag, TimeSession } from '../App';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
    if (isNaN(filterStart) || isNaN(filterEnd)) return { days: [] };

    let current = new Date(filterStart);
    current.setHours(0,0,0,0);
    const end = new Date(filterEnd);

    while(current.getTime() <= end.getTime()) {
      const dayStart = current.getTime();
      const dayEnd = dayStart + 86399999;
      const secs = calculateTotalSeconds(task.sessions, dayStart, dayEnd);
      days.push({ label: current.toLocaleDateString(), seconds: secs });
      current.setDate(current.getDate() + 1);
    }
    return { days };
  };

  const selectedTask = tasks.find(t => t.id === selectedDetailTaskId);
  const rawChartData = selectedTask ? generateChartData(selectedTask) : null;

  const chartJsData = {
    labels: rawChartData?.days.map(d => d.label) || [],
    datasets: [
      {
        label: 'Time Tracked',
        data: rawChartData?.days.map(d => d.seconds) || [],
        backgroundColor: '#42a5f5',
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return ` ${formatTime(context.raw as number)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatTime(value);
          }
        }
      }
    }
  };

  const taskSummaries = tasks.map(task => ({
    ...task,
    intervalSeconds: calculateTotalSeconds(task.sessions, filterStart, filterEnd)
  })).filter(t => t.intervalSeconds > 0);

  const tagSummaries = tags.map(tag => {
    const associatedTasks = tasks.filter(t => t.tags.includes(tag.id));
    const totalTagSeconds = associatedTasks.reduce((sum, task) => sum + calculateTotalSeconds(task.sessions, filterStart, filterEnd), 0);
    return { name: tag.name, seconds: totalTagSeconds };
  }).filter(t => t.seconds > 0);

  return (
    <div className="main-content">
      <h2>Activity Reports & Editing</h2>
      
      <div className="task-card flex-row filter-card">
        <div>
          <label className="filter-label">From:</label>
          <input type="datetime-local" value={filterStartStr} onChange={(e) => setFilterStartStr(e.target.value)} />
        </div>
        <div>
          <label className="filter-label">To:</label>
          <input type="datetime-local" value={filterEndStr} onChange={(e) => setFilterEndStr(e.target.value)} />
        </div>
      </div>

      <div className="summaries-container">
        <div className="summary-box">
          <h3>Tasks Active in Period</h3>
          {taskSummaries.length === 0 ? <p>No tasks active during this time.</p> : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th className="text-right">Time Spent</th>
                </tr>
              </thead>
              <tbody>
                {taskSummaries.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td className="text-right font-mono">{formatTime(t.intervalSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="summary-box">
          <h3>Tags Active in Period</h3>
          {tagSummaries.length === 0 ? <p>No tags active during this time.</p> : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th className="text-right">Cumulative Time</th>
                </tr>
              </thead>
              <tbody>
                {tagSummaries.map((t, idx) => (
                  <tr key={idx}>
                    <td>{t.name}</td>
                    <td className="text-right font-mono">{formatTime(t.seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="detailed-task-section">
        <h3>Detailed Task View (Intervals & Chart)</h3>
        <select 
          className="task-select"
          value={selectedDetailTaskId} 
          onChange={(e) => setSelectedDetailTaskId(Number(e.target.value))}
        >
          <option value="" disabled>Select a task to view intervals and chart</option>
          {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        {selectedTask && (
          <div className="task-card task-card-column">
            
            <h4>Daily Active Time</h4>
            <div className="chart-wrapper">
              <Bar data={chartJsData} options={chartOptions} />
            </div>

            <div className="intervals-header">
              <h4>Activity Intervals</h4>
              <button onClick={() => addManualSession(selectedTask.id)}>+ Add Interval</button>
            </div>
            
            {selectedTask.sessions.sort((a,b) => a.start - b.start).map((session, idx) => {
              if (session.start > filterEnd || (session.end && session.end < filterStart)) return null;
              
              const overlapping = hasOverlap(idx, selectedTask.sessions);
              
              return (
                <div key={idx} className={`session-row ${overlapping ? 'session-overlap' : 'session-normal'}`}>
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
                  <button className="danger session-remove-btn" onClick={() => deleteSession(selectedTask.id, idx)}>Remove</button>
                  {overlapping && <span className="overlap-text">Overlap Detected!</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}