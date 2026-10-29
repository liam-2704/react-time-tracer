export default function InfoView() {
    return (
        <div className = "main-content">
            <h2>Application Information & Help</h2>
            <div className = "task-card" style = {{flexDirection: 'column', gap: '1.5rem', padding: '1.5rem'}}>
                <div>
                    <h3>1. Author</h3>
                    <p>Developed by <strong>Hoang Lam Duong</strong></p>
                </div>

                <div>
                    <h3>2. Instructions for users</h3>
                    <p>Using the application should be intuitive and straightforward. </p>
                    <ul style = {{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                        <li><strong>Task Dashboard</strong>View your task list, start and stop independent timers, add/remove arbitrary tags with autocomplete suggestions, edit task names inline, and manually reorder tasks using the up/down arrows.</li>
                        <br></br>
                        <li><strong>Time Report:</strong> Specify custom date and time intervals to view aggregated summaries by task and tag, inspect chronological activity intervals with visual overlap warnings, and view daily active time bar charts.</li>
                        <br></br>
                        <li><strong>Management Screen:</strong> Quickly create new tasks and manage global application tags.</li>
                        <br></br>
                        <li><strong>Settings:</strong> Switch between Light and Dark themes or enable Alternative Mode (where only one task can be active at a time). All settings persist automatically via the API.</li>
                    </ul>
                </div>
            </div>

            <div>
                <h3>3. Content & Assets</h3>
                <p>All application code, interface design, icons, and layout components used in this application are originally created and written by the author. No external media assets or copyrighted external libraries (outside of standard open-source packages like React and Vite) were used.</p>
            </div>
        </div>
    );
}