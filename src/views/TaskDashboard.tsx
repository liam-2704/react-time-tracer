import { useState, useEffect } from 'react';
import type { Task, Tag, TimeSession } from '../App';

interface TaskItemProps {
  task: Task;
  tags: Tag[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>; 
  onDelete: (id: number) => void;
  onAddTag: (taskId: number, tagName: string) => void;
  onRemoveTag: (taskId: number, tagId: number) => void;
  onUpdateName: (taskId: number, newName: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function TaskItem({ task, tags, setTasks, onDelete, onAddTag, onRemoveTag, onUpdateName, onMoveUp, onMoveDown, isFirst, isLast }: TaskItemProps) {
  const [tagInput, setTagInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  const sessions = task.sessions || []; 
  const isActive = sessions.length > 0 && sessions[sessions.length - 1].end === null;

  const taskTags = (task.tags || [])
    .map(tagId => tags.find(t => t.id === tagId))
    .filter((t): t is Tag => t !== undefined);

useEffect(() => {
    const updateTime = () => {
      let total = 0;
      sessions.forEach(session => {
        const start = session.start;
        const end = session.end || Date.now();
        total += Math.floor((end - start) / 1000);
      });
      setDisplaySeconds(total);
    };

    updateTime();
    let interval: ReturnType<typeof setInterval>;
    if (isActive) {
      interval = setInterval(updateTime, 1000);
    }
    return () => clearInterval(interval);
  }, [sessions, isActive]);

  const handleToggleTimer = async () => {
    const newSessions = sessions.map(s => ({ ...s }));
    
    if (isActive) {
      newSessions[newSessions.length - 1].end = Date.now(); 
    } else {
      newSessions.push({ start: Date.now(), end: null }); 
    }

    try {
      await fetch(`http://localhost:3010/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additional_data: JSON.stringify({ order: task.order, sessions: newSessions }) })
      });
      
      setTasks((prevTasks: Task[]) =>
        prevTasks.map((t) =>
          t.id === task.id ? { ...t, sessions: newSessions } : t
        )
      );
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{
      border: `2px solid ${isActive ? '#28a745' : '#444'}`, 
      padding: '1rem',
      marginBottom: '0.50rem',
      borderRadius: '4px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      backgroundColor: isActive ? '#e8f8ec' : 'transparent',
    }}>
      <div style={{ flexGrow: 1 }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {isEditing ? (
             <>
               <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
               <button onClick={() => { onUpdateName(task.id, editName); setIsEditing(false); }}>Save</button>
             </>
          ) : (
             <>
               <strong>{task.name || 'Unnamed Task'} {isActive && '(Active)'}</strong>
               <button onClick={() => setIsEditing(true)} style={{ fontSize: '0.75rem', cursor: 'pointer' }}>Edit Name</button>
             </>
          )}
        </div>

        <div style={{ fontSize: '0.9rem', color: '#aaa', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span>Tags:</span>
          {taskTags.map(tag => (
            <span key={tag.id} style={{ backgroundColor: '#eee', color: '#333', padding: '0.1rem 0.4rem', borderRadius: '12px', fontSize: '0.8rem' }}>
              {tag.name} <button onClick={() => onRemoveTag(task.id, tag.id)} style={{ border: 'none', color: 'red', cursor: 'pointer' }}>&times;</button>
            </span>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if(tagInput) { onAddTag(task.id, tagInput); setTagInput(''); } }} style={{ marginTop: '0.5rem' }}>
          <input list={`tag-suggestions-${task.id}`} value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag..." style={{ fontSize: '0.85rem' }}/>
          <datalist id={`tag-suggestions-${task.id}`}>
            {tags.map((tag) => <option key={tag.id} value={tag.name} />)}
          </datalist>
          <button type="submit" style={{ fontSize: '0.85rem', marginLeft: '0.5rem' }}>+ Add Tag</button>
        </form>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.2rem' }}>
          <button onClick={onMoveUp} disabled={isFirst} title="Move Up">↑</button>
          <button onClick={onMoveDown} disabled={isLast} title="Move Down">↓</button>
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{displaySeconds}s</div>
        <button onClick={handleToggleTimer} style={{ backgroundColor: isActive ? '#dc3545' : '#28a745', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>
          {isActive ? 'Stop Timer' : 'Start Timer'}
        </button>
        <button onClick={() => onDelete(task.id)} style={{ border: 'none', backgroundColor: 'transparent', textDecoration: 'underline', color: '#dc3545', cursor: 'pointer', fontSize: '0.8rem' }}>Delete Task</button>
      </div>
    </div>
  );
}

interface Props {
  tasks: Task[];
  tags: Tag[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onDeleteTask: (id: number) => void;
  onAddTag: (taskId: number, tagName: string) => void;
  onRemoveTag: (taskId: number, tagId: number) => void;
  onUpdateName: (taskId: number, newName: string) => void;
  onReorder: (t1: Task, t2: Task) => void;
}

export default function TaskDashboard({ tasks, tags, setTasks, onDeleteTask, onAddTag, onRemoveTag, onUpdateName, onReorder }: Props) {
  const [filterTagId, setFilterTagId] = useState<number | ''>('');
  
  const filteredTasks = filterTagId === '' ? tasks : tasks.filter(task => (task.tags || []).includes(Number(filterTagId)));

  return (
    <div className="main-content">
      <h2>Task Dashboard</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <label>Filter by Tag: </label>
        <select value={filterTagId} onChange={(e) => setFilterTagId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">All Tags</option>
          {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
        </select>
      </div>

      <div className="task-cards-container">
        {filteredTasks.length === 0 ? <p>No tasks found.</p> : filteredTasks.map((task, index) => (
          <TaskItem 
            key={task.id} 
            task={task} 
            tags={tags} 
            setTasks={setTasks} // ADD THIS LINE
            onDelete={onDeleteTask} 
            onAddTag={onAddTag} 
            onRemoveTag={onRemoveTag} 
            onUpdateName={onUpdateName}
            onMoveUp={() => onReorder(task, filteredTasks[index - 1])}
            onMoveDown={() => onReorder(task, filteredTasks[index + 1])}
            isFirst={index === 0}
            isLast={index === filteredTasks.length - 1}
          />
        ))}
      </div>
    </div>
    
  );
}