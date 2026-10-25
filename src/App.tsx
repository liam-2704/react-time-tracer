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

export interface Task {
  id: number;
  name: string;
  tags: number[]; // We will keep it as an array in React for easy mapping
  elapsedSeconds?: number;
  isRunning?: boolean;
  startTime?: number | null;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // 1. REUSABLE FETCH: Unpacks the stringified data from the backend
  const loadData = async () => {
    try {
      const tasksResponse = await fetch('http://localhost:3010/tasks');
      const tagsResponse = await fetch('http://localhost:3010/tags');
      
      const rawTasks = await tasksResponse.json();
      const tagsData = await tagsResponse.json();

      // Format the raw backend data into our React Task structure
      const formattedTasks: Task[] = rawTasks.map((t: any) => {
        // Parse the timer data hidden inside additional_data
        let extra = { elapsedSeconds: 0, isRunning: false, startTime: null };
        if (t.additional_data) {
          try { extra = JSON.parse(t.additional_data); } catch (e) {}
        }

        // Convert the comma-separated string "1,2" back into an array [1, 2]
        const tagsArray = t.tags ? t.tags.split(',').map(Number) : [];

        return {
          id: t.id,
          name: t.name,
          tags: tagsArray,
          elapsedSeconds: extra.elapsedSeconds,
          isRunning: extra.isRunning,
          startTime: extra.startTime,
        };
      });

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
      // 2. CREATE TASK: Send tags as a string, pack timer data into additional_data
      await fetch('http://localhost:3010/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName.trim(),
          tags: "", 
          additional_data: JSON.stringify({ elapsedSeconds: 0, isRunning: false, startTime: null })
        }),
      });
      await loadData(); 
    } catch (error) {
      console.error('Error creating task:', error);
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

      // 3. UPDATE TAGS: Convert the array back to a string "1,2" for the database
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
              />
            } 
          />
          <Route path="/TimeReport" element={<TimeReport tasks={tasks} />} />
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