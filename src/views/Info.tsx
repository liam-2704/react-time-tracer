
export default function InfoView() {
    return (
        <div className="main-content">
            <h2>Application Information & Help</h2>
            
            <div className="task-card info-card">
                <div>
                    <h3>1. Author</h3>
                    <p>Developed by <strong>Hoang Lam Duong</strong></p>
                </div>

                <div>
                    <h3>2. Instructions for users</h3>
                    <p>Using the application should be intuitive and straightforward.</p>
                    <ul className="info-list">
                        <li><strong>Task Dashboard:</strong> View your task list, start and stop independent timers, add/remove tags with auto-complete suggestions, edit task names, and manually reorder tasks using the up/down arrows.</li>
                        <br />
                        <li><strong>Time Report:</strong> Specify custom date and time intervals to view aggregated summaries by task and tag, inspect chronological activity intervals with visual overlap warnings, and view daily active time bar charts.</li>
                        <br />
                        <li><strong>Management Screen:</strong> Quickly create new tasks and manage global application tags.</li>
                        <br />
                        <li><strong>Settings:</strong> Switch between Light and Dark themes or enable Alternative Mode (where only one task can be active at a time). All settings persist automatically via the API.</li>
                    </ul>
                </div>

                <div>
                    <h3>3. Content & Assets</h3>
                    <p>All application code, interface design, icons, and layout components used in this application are originally created and written by the author. No external media assets or copyrighted external libraries (outside of standard open-source packages like React and Vite) were used.</p>
                </div>
            </div>
        </div>
    );
}