import { useState, useEffect } from 'react';
import type { Task, Tag } from '../App';

interface TaskItemProps {
  task: Task;
  tags: Tag[];
  onDelete: (id: number) => void;
  onAddTag: (taskId: number, tagName: string) => void;
  onRemoveTag: (taskId: number, tagId: number) => void;
  onUpdateName: (taskId: number, newName: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  onToggleTimer: (task: Task) => void; 
}

function TaskItem({ task, tags, onDelete, onAddTag, onRemoveTag, onUpdateName, onMoveUp, onMoveDown, isFirst, isLast, onToggleTimer }: TaskItemProps) {
  const [tagInput, setTagInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  const sessions = task.sessions || []; 
  const isActive = sessions.length > 0 && sessions[sessions.length - 1].end === null;

  const taskTags = (task.tags || []).map(tagId => tags.find(t => t.id === tagId)).filter((t): t is Tag => t !== undefined);

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
    if (isActive) interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [sessions, isActive]);

  return (
    <div className="task-card" style={{ borderColor: isActive ? 'var(--success-color)' : 'var(--border-color)', backgroundColor: isActive ? 'rgba(46, 125, 50, 0.1)' : 'var(--card-bg)' }}>
      <div style={{ flexGrow: 1 }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
          {isEditing ? (
             <>
               <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
               <button onClick={() => { onUpdateName(task.id, editName); setIsEditing(false); }}>Save</button>
             </>
          ) : (
             <>
               <strong>{task.name || 'Unnamed Task'}</strong>
               <button onClick={() => setIsEditing(true)} style={{ fontSize: '0.75rem', background: 'transparent', color: 'var(--primary-btn)', border: '1px solid var(--primary-btn)' }}>Edit</button>
             </>
          )}
        </div>

        <div style={{ fontSize: '0.9rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
          {taskTags.map(tag => (
            <span key={tag.id} style={{ backgroundColor: 'var(--nav-bg)', padding: '0.2rem 0.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              {tag.name} <button onClick={() => onRemoveTag(task.id, tag.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-btn)', padding: 0, marginLeft: '4px' }}>&times;</button>
            </span>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if(tagInput) { onAddTag(task.id, tagInput); setTagInput(''); } }} className="flex-row" style={{ display: 'flex', gap: '0.5rem' }}>
          <input list={`tag-suggestions-${task.id}`} value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag..." />
          <datalist id={`tag-suggestions-${task.id}`}>
            {tags.map((tag) => <option key={tag.id} value={tag.name} />)}
          </datalist>
          <button type="submit">+ Add</button>
        </form>
      </div>
      
      <div className="actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.2rem' }}>
          <button onClick={onMoveUp} disabled={isFirst} aria-label="Move Up">↑</button>
          <button onClick={onMoveDown} disabled={isLast} aria-label="Move Down">↓</button>
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{displaySeconds}s</div>
        <button onClick={() => onToggleTimer(task)} style={{ backgroundColor: isActive ? 'var(--danger-btn)' : 'var(--success-color)' }}>
          {isActive ? 'Stop' : 'Start'}
        </button>
        <button className="danger" onClick={() => onDelete(task.id)} style={{ fontSize: '0.8rem', background: 'transparent', color: 'var(--danger-btn)', textDecoration: 'underline' }}>Delete</button>
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
  singleTaskMode: boolean; 
}

export default function TaskDashboard({ tasks, tags, setTasks, onDeleteTask, onAddTag, onRemoveTag, onUpdateName, onReorder, singleTaskMode }: Props) {
  const [filterTagId, setFilterTagId] = useState<number | ''>('');
  const filteredTasks = filterTagId === '' ? tasks : tasks.filter(task => (task.tags || []).includes(Number(filterTagId)));

  const handleToggleTimer = async (targetTask: Task) => {
    const targetSessions = targetTask.sessions || [];
    const isActive = targetSessions.length > 0 && targetSessions[targetSessions.length - 1].end === null;

    let updates = []; 

    if (isActive) {
    
      const newSessions = [...targetSessions];
      newSessions[newSessions.length - 1].end = Date.now();
      updates.push({ id: targetTask.id, sessions: newSessions, order: targetTask.order });
    } else {
  
      const newSessions = [...targetSessions, { start: Date.now(), end: null }];
      updates.push({ id: targetTask.id, sessions: newSessions, order: targetTask.order });

  
      if (singleTaskMode) {
        tasks.forEach(t => {
          if (t.id !== targetTask.id) {
            const s = t.sessions || [];
            if (s.length > 0 && s[s.length - 1].end === null) {
              const closedSessions = [...s];
              closedSessions[closedSessions.length - 1].end = Date.now();
              updates.push({ id: t.id, sessions: closedSessions, order: t.order });
            }
          }
        });
      }
    }

    try {
      await Promise.all(updates.map(update => 
        fetch(`http://localhost:3010/tasks/${update.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ additional_data: JSON.stringify({ order: update.order, sessions: update.sessions }) })
        })
      ));

      setTasks(prevTasks => prevTasks.map(t => {
        const matchingUpdate = updates.find(u => u.id === t.id);
        return matchingUpdate ? { ...t, sessions: matchingUpdate.sessions } : t;
      }));
    } catch (e) { console.error("Error toggling timers", e); }
  };

  return (
    <div className="main-content">
      <h2>Task Dashboard</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="dashboard-filter" style={{ fontWeight: 'bold' }}>Filter by Tag: </label>
        <select id="dashboard-filter" value={filterTagId} onChange={(e) => setFilterTagId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">All Tags</option>
          {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
        </select>
      </div>

      <div>
        {filteredTasks.length === 0 ? <p>No tasks found.</p> : filteredTasks.map((task, index) => (
          <TaskItem 
            key={task.id} task={task} tags={tags} 
            onDelete={onDeleteTask} onAddTag={onAddTag} onRemoveTag={onRemoveTag} onUpdateName={onUpdateName}
            onMoveUp={() => onReorder(task, filteredTasks[index - 1])}
            onMoveDown={() => onReorder(task, filteredTasks[index + 1])}
            isFirst={index === 0} isLast={index === filteredTasks.length - 1}
            onToggleTimer={handleToggleTimer} 
          />
        ))}
      </div>
    </div>
  );
}