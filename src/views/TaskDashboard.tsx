import { useState, useEffect } from 'react';
import type { Task, Tag } from '../App';

interface TaskItemProps {
  task: Task;
  tags: Tag[];
  onDelete: (id: number) => void;
}

function TaskItem({ task, tags, onDelete }: TaskItemProps) {
  // Since we parsed the string to an array of numbers in App.tsx, we can safely map it
  const displayTags = task.tags && task.tags.length > 0
    ? task.tags
        .map((tagId) => {
          const foundTag = tags.find((t) => t.id === tagId);
          return foundTag ? foundTag.name : null;
        })
        .filter(Boolean)
        .join(', ')
    : 'None';

  return (
    <div
      style={{
        border: '1px solid #444',
        padding: '1rem',
        marginBottom: '0.50rem',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: task.isRunning ? '#e8f4f8' : 'transparent',
      }}
    >
      <div style={{ flexGrow: 1 }}>
        <strong>Task: {task.name || 'Unnamed Task'} {task.isRunning && '(Running...)'}</strong>
        <div style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '0.25rem' }}>
          Tags: {displayTags}
        </div>
      </div>
      
      <button
        onClick={() => onDelete(task.id)}
        style={{
          backgroundColor: '#dc3545',
          color: '#fff',
          border: 'none',
          padding: '0.4rem 0.8rem',
          borderRadius: '4px',
          cursor: 'pointer',
          marginLeft: '1rem'
        }}
      >
        Delete
      </button>
    </div>
  );
}

interface Props {
  tasks: Task[];
  tags: Tag[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onDeleteTask: (id: number) => void;
  onAddTag: (taskId: number, tagName: string) => void; // Keep prop signature to avoid errors
}

export default function TaskDashboard({ tasks, tags, setTasks, onDeleteTask }: Props) {
  const [selectedTaskId, setSelectedTaskId] = useState<number | ''>('');
  const [displaySeconds, setDisplaySeconds] = useState(0);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (selectedTask) {
      if (selectedTask.isRunning && selectedTask.startTime) {
        const updateTimer = () => {
          const sessionSeconds = Math.floor((Date.now() - selectedTask.startTime!) / 1000);
          setDisplaySeconds((selectedTask.elapsedSeconds || 0) + sessionSeconds);
        };
        
        updateTimer();
        interval = setInterval(updateTimer, 1000);
      } else {
        setDisplaySeconds(selectedTask.elapsedSeconds || 0);
      }
    } else {
      setDisplaySeconds(0);
    }

    return () => clearInterval(interval);
  }, [selectedTask]);

  const handleDelete = (taskId: number) => {
    onDeleteTask(taskId);
    if (selectedTaskId === taskId) setSelectedTaskId('');
  };

  const handleStart = async () => {
    if (!selectedTask) return;
    const startTime = Date.now();

    // Pack the timer logic into additional_data for the SQLite backend
    const extraData = JSON.stringify({
      elapsedSeconds: selectedTask.elapsedSeconds || 0,
      isRunning: true,
      startTime
    });

    try {
      const response = await fetch(`http://localhost:3010/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additional_data: extraData })
      });

      if (!response.ok) throw new Error('Failed to start timer');

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === selectedTask.id ? { ...task, isRunning: true, startTime } : task
        )
      );
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };

  const handleStopAndSave = async () => {
    if (!selectedTask || !selectedTask.startTime) return;

    const sessionSeconds = Math.floor((Date.now() - selectedTask.startTime) / 1000);
    const newTotalSeconds = (selectedTask.elapsedSeconds || 0) + sessionSeconds;

    // Pack the final times into additional_data
    const extraData = JSON.stringify({
      elapsedSeconds: newTotalSeconds,
      isRunning: false,
      startTime: null
    });

    try {
      const response = await fetch(`http://localhost:3010/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additional_data: extraData })
      });

      if (!response.ok) throw new Error('Failed to stop timer');

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === selectedTask.id
            ? { ...task, isRunning: false, startTime: null, elapsedSeconds: newTotalSeconds }
            : task
        )
      );
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };

  return (
    <div className="main-content">
      <h2>Task Dashboard</h2>

      <div className="task-cards-container" style={{ marginBottom: '2rem' }}>
        <h3>All Tasks & Tags</h3>
        {tasks.length === 0 ? (
          <p>No tasks found. Go to Management to create one!</p>
        ) : (
          tasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              tags={tags} 
              onDelete={handleDelete} 
            />
          ))
        )}
      </div>

      <select
        value={selectedTaskId}
        onChange={(e) => setSelectedTaskId(Number(e.target.value))}
        className="task-input"
        style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem' }}
      >
        <option value="" disabled>Select a task to time</option>
        {tasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.name || 'Unnamed Task'}
          </option>
        ))}
      </select>

      <p>Elapsed Time: {displaySeconds} seconds</p>

      <button
        onClick={handleStart}
        className="add-button"
        style={{ marginRight: '1rem' }}
        disabled={selectedTaskId === '' || selectedTask?.isRunning}
      >
        Start
      </button>

      <button
        onClick={handleStopAndSave}
        className="add-button"
        style={{ backgroundColor: '#dc3545' }}
        disabled={selectedTaskId === '' || !selectedTask?.isRunning}
      >
        Stop & Save
      </button>
    </div>
  );
}