import type { Task } from '../App';

interface Props {
  tasks: Task[];
}

export default function TimeReport({ tasks }: Props) {
  // Helper function to format raw seconds into H:M:S
  const formatTime = (totalSeconds: number = 0) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Pads single digits with a leading zero (e.g., 9 becomes 09)
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');

    return `${h}:${m}:${s}`;
  };

  // Calculate the grand total of all tracked time
  const totalTrackedSeconds = tasks.reduce((sum, task) => {
    return sum + (task.elapsedSeconds || 0);
  }, 0);

  // Filter out tasks that haven't been tracked yet to keep the report clean
  const trackedTasks = tasks.filter(task => (task.elapsedSeconds || 0) > 0);

  return (
    <div className="main-content">
      <h2>Time Report</h2>
      
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #ddd',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Total Time Tracked</h3>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0056b3' }}>
          {formatTime(totalTrackedSeconds)}
        </div>
      </div>

      {trackedTasks.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>
          No time has been tracked yet. Head over to the Dashboard to start a timer!
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#333', color: '#fff', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem', border: '1px solid #555' }}>Task Name</th>
              <th style={{ padding: '0.75rem', border: '1px solid #555', textAlign: 'right' }}>Time Spent (HH:MM:SS)</th>
            </tr>
          </thead>
          <tbody>
            {trackedTasks.map((task) => (
              <tr key={task.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                  <strong>{task.name}</strong>
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                  {formatTime(task.elapsedSeconds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}