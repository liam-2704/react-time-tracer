import type { AppSettings } from '../App';

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export default function SettingsView({ settings, onSave }: Props) {
  return (
    <div>
      <h2>Application Settings</h2>
      
      <div className="task-card flex-row">
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="theme-select" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Theme</label>
          <select 
            id="theme-select"
            value={settings.theme} 
            onChange={(e) => onSave({ ...settings, theme: e.target.value as 'light' | 'dark' })}
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Timer Mode</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              className = "checkBox"
              type="checkbox" 
              checked={settings.singleTaskMode}
              onChange={(e) => onSave({ ...settings, singleTaskMode: e.target.checked })}
              style={{ width: '20px', height: '20px' }}
            />
            Single Mode (Only one task active at a time)
          </label>
        </div>
      </div>
    </div>
  );
}