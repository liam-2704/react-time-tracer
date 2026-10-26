import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react'; 
import TaskDashboard from './views/TaskDashboard';
import TimeReport from './views/TimeReport';
import Management from './views/Management';
import './App.css';

export interface Tag {
  id: number;
  name: string;
}

// NEW: Represents a single active period for a task
export interface TimeSession {
  start: number;
  end: number | null; 
}

export interface Task {
  id: number;
  name: string;
  tags: number[]; 
  order: number; // For manual UI rearranging
  sessions: TimeSession[]; // Replaces elapsedSeconds/isRunning to support multiple simultaneous tasks & history
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const loadData = async () => {
    try {
      const tasksResponse = await fetch('http://localhost:3010/tasks');
      const tagsResponse = await fetch('http://localhost:3010/tags');
      
      const rawTasks = await tasksResponse.json();
      const tagsData = await tagsResponse.json();

      const formattedTasks: Task[] = rawTasks.map((t: any) => {
        let extra = { order: Date.now(), sessions: [] as TimeSession[] };
        if (t.additional_data) {
          try { 
            const parsed = JSON.parse(t.additional_data); 
            if (parsed.order !== undefined) extra.order = parsed.order;
            if (parsed.sessions) extra.sessions = parsed.sessions;
          } catch (e) {}
        }
        const tagsArray = t.tags ? t.tags.split(',').map(Number) : [];

        return {
          id: t.id,
          name: t.name,
          tags: tagsArray,
          order: extra.order,
          sessions: extra.sessions,
        };
      });

      // Sort by the custom order property before saving to state
      formattedTasks.sort((a, b) => a.order - b.order);

      setTasks(formattedTasks);
      setTags(tagsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteTask = async (taskId: number) => {
    try {
      await fetch(`http://localhost:3010/tasks/${taskId}`, { method: 'DELETE' });
      await loadData();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddTask = async (taskName: string) => {
    if (!taskName.trim()) return;
    try {
      await fetch('http://localhost:3010/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName.trim(),
          tags: "", 
          additional_data: JSON.stringify({ order: Date.now(), sessions: [] })
        }),
      });
      await loadData(); 
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTaskName = async (taskId: number, newName: string) => {
    if (!newName.trim()) return;
    try {
      await fetch(`http://localhost:3010/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      await loadData();
    } catch (error) {
      console.error('Error updating task name:', error);
    }
  };

  const handleAddTagToTask = async (taskId: number, tagName: string) => {
    if (!tagName.trim()) return;
    const normalizedName = tagName.trim();
    try {
      let tagIdToAdd: number;
      const existingTag = tags.find((t) => t.name.toLowerCase() === normalizedName.toLowerCase());

      if (existingTag) {
        tagIdToAdd = existingTag.id;
      } else {
        const tagRes = await fetch('http://localhost:3010/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: normalizedName }),
        });
        const newTag = await tagRes.json();
        tagIdToAdd = newTag.id;
      }

      const taskToUpdate = tasks.find((t) => t.id === taskId);
      if (!taskToUpdate) return;
      if (taskToUpdate.tags.includes(tagIdToAdd)) return;

      const updatedTagsArray = [...taskToUpdate.tags, tagIdToAdd];
      await fetch(`http://localhost:3010/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTagsArray.join(',') }),
      });
      await loadData(); 
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleRemoveTagFromTask = async (taskId: number, tagIdToRemove: number) => {
    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate) return;
    const updatedTagsArray = taskToUpdate.tags.filter(id => id !== tagIdToRemove);
    try {
      await fetch(`http://localhost:3010/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTagsArray.join(',') }),
      });
      await loadData(); 
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  // NEW: Swaps the visual order of two tasks in the database
  const handleReorderTasks = async (task1: Task, task2: Task) => {
    try {
      // Ensure distinct order values even if they were identical
      const order1 = task1.order === task2.order ? Date.now() : task1.order;
      const order2 = task1.order === task2.order ? Date.now() + 1 : task2.order;

      await fetch(`http://localhost:3010/tasks/${task1.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additional_data: JSON.stringify({ order: order2, sessions: task1.sessions }) })
      });
      await fetch(`http://localhost:3010/tasks/${task2.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additional_data: JSON.stringify({ order: order1, sessions: task2.sessions }) })
      });
      await loadData();
    } catch (error) {
      console.error("Error reordering tasks", error);
    }
  };

  return (
    <BrowserRouter>
      <nav className="nav-menu">
        <Link to="/" className="nav-link">Task Dashboard</Link>
        <Link to="/TimeReport" className="nav-link">Time Report</Link>
        <Link to="/Management" className="nav-link">Management Screen</Link>
      </nav>
      <main className="main-content">
        <Routes>
          <Route 
            path="/" 
            element={
              <TaskDashboard 
                tasks={tasks} 
                tags={tags} 
                setTasks={setTasks} 
                onDeleteTask={handleDeleteTask} 
                onAddTag={handleAddTagToTask}
                onRemoveTag={handleRemoveTagFromTask}
                onUpdateName={handleUpdateTaskName}
                onReorder={handleReorderTasks}
              />
            } 
          />
          <Route path="/TimeReport" element={<TimeReport tasks={tasks} tags={tags} />} />
          <Route 
            path="/Management" 
            element={
              <Management 
                tasks={tasks} 
                setTasks={setTasks} 
                tags={tags} 
                onAddTag={handleAddTagToTask}
                onAddTask={handleAddTask}
              />
            } 
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}