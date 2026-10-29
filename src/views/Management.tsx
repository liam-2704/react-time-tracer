import { useState } from 'react';
import type { Task, Tag } from '../App';

interface Props {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  tags: Tag[];
  onAddTag: (taskId: number, tagName: string) => void;
  onAddTask: (taskName: string) => void;
}

export default function Management({ tasks, onAddTag, onAddTask }: Props) {
  const [selectedTaskId, setSelectedTaskId] = useState<number | ''>('');
  const [tagInput, setTagInput] = useState('');
  const [newTaskName, setNewTaskName] = useState('');

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskName.trim()) {
      onAddTask(newTaskName);
      setNewTaskName(''); 
    }
  };

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTaskId !== '' && tagInput.trim()) {
      onAddTag(Number(selectedTaskId), tagInput);
      setTagInput(''); 
    }
  };

  return (
    <div className="main-content">
      <h2>Management Screen</h2>

      <div className = "manage-card">
        <h3>Create a New Task</h3>
        <form onSubmit={handleTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', marginTop: '1rem' }}>
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="Enter task name"
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />
          <button 
            type="submit" 
            style={{ padding: '0.5rem', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Create Task
          </button>
        </form>
      </div>

      <div className = "manage-card">
        <h3>Assign Tags to Tasks</h3>
        <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1rem' }}>
          Select a task below and type a new or existing tag to associate them.
        </p>

        <form onSubmit={handleTagSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(Number(e.target.value))}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          >
            <option value="" disabled>Select a task...</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Type tag name"
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />

          <button 
            type="submit" 
            style={{ padding: '0.5rem', cursor: 'pointer', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Add Tag to Task
          </button>
        </form>
      </div>

    </div>
  );
}