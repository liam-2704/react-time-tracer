import { useState } from 'react';
import type { Task, Tag } from '../App';

interface Props {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  tags: Tag[];
  onAddTag: (taskId: number, tagName: string) => void;
  onAddTask: (taskName: string) => void;
  onDeleteTag: (tagId: number) => Promise<void>;
}

export default function Management({ tasks, setTasks, tags, onAddTag, onAddTask, onDeleteTag }: Props) {
  const [newTaskName, setNewTaskName] = useState('');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskName.trim()) {
      onAddTask(newTaskName);
      setNewTaskName('');
    }
  };

  return (
    <div className="main-content">
      <h2>Management</h2>
      
      <div className="task-card management-card management-create-section">
        <h3>Create New Task</h3>
        <form onSubmit={handleCreateTask} className="management-form">
          <input 
            type="text" 
            value={newTaskName} 
            onChange={(e) => setNewTaskName(e.target.value)} 
            placeholder="Enter task name..."
            className="management-input"
          />
          <button type="submit">+ Create Task</button>
        </form>
      </div>

      <div className="task-card management-card management-tags-section">
        <h3>Manage Global Tags</h3>
        <p className="management-warning-text">
          Deleting a tag here will permanently remove it from all tasks.
        </p>

        {tags.length === 0 ? (
          <p>No tags exist yet.</p>
        ) : (
          <ul className="management-tag-list">
            {tags.map(tag => (
              <li key={tag.id} className="management-tag-item">
                <span className="management-tag-name">{tag.name}</span>
                <button 
                  className="danger management-delete-btn" 
                  onClick={() => onDeleteTag(tag.id)}
                >
                  Delete Tag
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}