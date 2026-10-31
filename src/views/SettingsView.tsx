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
        <div className="settings-section">
          <label htmlFor="theme-select" className="settings-label">Theme</label>
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
          <label className="settings-label">Timer Mode</label>
          <label className="settings-checkbox-label">
            <input 
              className="checkBox settings-checkbox-input"
              type="checkbox" 
              checked={settings.singleTaskMode}
              onChange={(e) => onSave({ ...settings, singleTaskMode: e.target.checked })}
            />
            Single Mode (Only one task active at a time)
          </label>
        </div>
      </div>
    </div>
  );
}