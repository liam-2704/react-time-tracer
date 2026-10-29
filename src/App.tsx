import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react'; 
import TaskDashboard from './views/TaskDashboard';
import TimeReport from './views/TimeReport';
import Management from './views/Management';
import SettingsView from './views/SettingsView';
import './App.css';
import InfoView from './views/Info';

export interface Tag { id: number; name: string; }
export interface TimeSession { start: number; end: number | null; }
export interface Task { id: number; name: string; tags: number[]; order: number; sessions: TimeSession[]; }

export interface AppSettings {
  theme: 'light' | 'dark';
  singleTaskMode: boolean;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ theme: 'light', singleTaskMode: false });

  const loadData = async () => {
    try {
      
      const [tasksRes, tagsRes] = await Promise.all([
        fetch('http://localhost:3010/tasks'),
        fetch('http://localhost:3010/tags')
      ]);
      
      const rawTasks = await tasksRes.json();
      const tagsData = await tagsRes.json();
      
      // 2. Extract settings from our hidden settings task
      const settingsTask = rawTasks.find((t: any) => t.name === '__APP_SETTINGS__');
      if (settingsTask && settingsTask.additional_data) {
        try { setSettings(JSON.parse(settingsTask.additional_data)); } catch(e) {}
      }

      // 3. Filter out the hidden settings task so it doesn't show in your UI
      const formattedTasks: Task[] = rawTasks
        .filter((t: any) => t.name !== '__APP_SETTINGS__')
        .map((t: any) => {
          let extra = { order: Date.now(), sessions: [] as TimeSession[] };
          if (t.additional_data) {
            try { 
              const parsed = JSON.parse(t.additional_data); 
              if (parsed.order !== undefined) extra.order = parsed.order;
              if (parsed.sessions) extra.sessions = parsed.sessions;
            } catch (e) {}
          }
          return {
            id: t.id,
            name: t.name,
            tags: t.tags ? t.tags.split(',').map(Number) : [],
            order: extra.order,
            sessions: extra.sessions,
          };
        });

      formattedTasks.sort((a, b) => a.order - b.order);
      setTasks(formattedTasks);
      setTags(tagsData);
    } catch (error) { console.error('Error fetching data:', error); }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // 4. Save settings using the stable /tasks endpoint
  const saveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      const tasksRes = await fetch('http://localhost:3010/tasks');
      const allTasks = await tasksRes.json();
      const settingsTask = allTasks.find((t: any) => t.name === '__APP_SETTINGS__');
      
      if (settingsTask) {
        await fetch(`http://localhost:3010/tasks/${settingsTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ additional_data: JSON.stringify(newSettings) })
        });
      } else {
        await fetch('http://localhost:3010/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '__APP_SETTINGS__', tags: "", additional_data: JSON.stringify(newSettings) })
        });
      }
    } catch (error) { console.error("Failed to save settings", error); }
  };

  const handleDeleteTask = async (taskId: number) => { 
    try { await fetch(`http://localhost:3010/tasks/${taskId}`, { method: 'DELETE' }); 
    await loadData(); 
  } catch (error) { console.error(error); 
  } };
  const handleAddTask = async (taskName: string) => 
    { if (!taskName.trim()) return; 
      try { await fetch('http://localhost:3010/tasks', 
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ name: taskName.trim(), tags: "", 
        additional_data: JSON.stringify({ order: Date.now(), sessions: [] }) }), }); 
        await loadData(); 
      } catch (error) { console.error(error); 
      } };
  const handleUpdateTaskName = async (taskId: number, newName: string) => 
    { if (!newName.trim()) return; 
      try { await fetch(`http://localhost:3010/tasks/${taskId}`, 
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ name: newName.trim() }), }); 
        await loadData(); 
      } catch (error) { console.error(error); 
      } };
  const handleAddTagToTask = async (taskId: number, tagName: string) => 
    { if (!tagName.trim()) return; 
      const normalizedName = tagName.trim(); 
      try { let tagIdToAdd: number; 
        const existingTag = tags.find((t) => t.name.toLowerCase() === normalizedName.toLowerCase()); 
        if (existingTag) { tagIdToAdd = existingTag.id;
         } else {
           const tagRes = await fetch('http://localhost:3010/tags',
             { method: 'POST', headers: { 'Content-Type': 'application/json' }, 
             body: JSON.stringify({ name: normalizedName }), 
            }); 
            const newTag = await tagRes.json(); 
            tagIdToAdd = newTag.id; }
            const taskToUpdate = tasks.find((t) => t.id === taskId); 
            if (!taskToUpdate) return; 
            if (taskToUpdate.tags.includes(tagIdToAdd)) return; 
            const updatedTagsArray = [...taskToUpdate.tags, tagIdToAdd]; 
            await fetch(`http://localhost:3010/tasks/${taskId}`, 
              { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ tags: updatedTagsArray.join(',') }), }); 
              await loadData(); } catch (error) { console.error(error); } };
  const handleRemoveTagFromTask = async (taskId: number, tagIdToRemove: number) => { 
    const taskToUpdate = tasks.find((t) => t.id === taskId); 
    if (!taskToUpdate) return; const updatedTagsArray = taskToUpdate.tags.filter(id => id !== tagIdToRemove); 
    try { await fetch(`http://localhost:3010/tasks/${taskId}`,
       { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ tags: updatedTagsArray.join(',') }), 
    }); 
      await loadData(); } catch (error) { console.error(error); } };
  const handleReorderTasks = async (task1: Task, task2: Task) => { 
    try { const order1 = task1.order === task2.order ? Date.now() : task1.order; 
      const order2 = task1.order === task2.order ? Date.now() + 1 : task2.order; await fetch(`http://localhost:3010/tasks/${task1.id}`,
         { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             additional_data: JSON.stringify({ order: order2, sessions: task1.sessions }) })
             });
              await fetch(`http://localhost:3010/tasks/${task2.id}`,
                 { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, 
                 body: JSON.stringify({
                   additional_data: JSON.stringify({ order: order1, sessions: task2.sessions }) }) 
                  });
                  await loadData(); } catch (error) { console.error(error); } };

  return (
    <BrowserRouter>
      <nav className="nav-menu">
        <Link to="/" className="nav-link">Task Dashboard</Link>
        <Link to="/TimeReport" className="nav-link">Time Report</Link>
        <Link to="/Management" className="nav-link">Management Screen</Link>
        <Link to="/Settings" className="nav-link">Settings</Link>
        <Link to = "/Info" className = "nav-link">Info</Link>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<TaskDashboard tasks={tasks} tags={tags} setTasks={setTasks} onDeleteTask={handleDeleteTask} onAddTag={handleAddTagToTask} onRemoveTag={handleRemoveTagFromTask} onUpdateName={handleUpdateTaskName} onReorder={handleReorderTasks} singleTaskMode={settings.singleTaskMode} />} />
          <Route path="/TimeReport" element={<TimeReport tasks={tasks} tags={tags} setTasks={setTasks} />} />
          <Route path="/Management" element={<Management tasks={tasks} setTasks={setTasks} tags={tags} onAddTag={handleAddTagToTask} onAddTask={handleAddTask} />} />
          <Route path="/Settings" element={<SettingsView settings={settings} onSave={saveSettings} />} />
          <Route path = "/Info" element = {<InfoView/>}></Route>
        </Routes>
      </main>
    </BrowserRouter>
  );
}