/*
 *************************************************************************          SSA MAINTENANCE PROEJCTS - MODULARITY NOTES      *************************************************************************
 * 
 * This script is organized into 23 logical blocks for modularity and maintainability.
 * Each block is numbered and encapsulated in a generic function to facilitate updates.
 * Below is a summary of each block:
 *
 * 1. Initialize Application: Sets up event listeners and initial rendering on DOM load.
 * 2. Manage Data Storage: Loads and saves project/PIC data to localStorage.
 * 3. Parse and Serialize CSV Data: Handles CSV import/export functionality.
 * 4. Calculate Project Metrics: Computes deadlines, completion percentages, and overdue status.
 * 5. Filter and Render Projects: Filters and renders projects/tasks in the dashboard.
 * 6. Manage Project and Task Updates: Updates properties like PIC and completion.
 * 7. Manage Tabs and Navigation: Controls tab switching and navigation logic.
 * 8. Add and Delete Projects/Tasks: Functions for creating/removing projects and tasks.
 * 9. Edit Tasks: Edits task names and due dates with validation.
 * 10. Handle Context Menu: Manages right-click context menu interactions.
 * 11. Render Calendar: Displays calendar in full or list view with navigation.
 * 12. Render Gantt Chart: Renders Gantt chart for selected project with timeline.
 * 13. Handle Gantt Chart Interactions: Manages resizing/dragging of Gantt task bars.
 * 14. Handle Drag and Drop: Implements drag-and-drop for task reordering/nesting.
 * 15. Manage Notes Popup: Opens and saves notes for tasks in Gantt view.
 * 16. Manage PIC List: Adds, deletes, and renders the list of Persons-in-Charge.
 * 17. Import and Export Data: Facilitates CSV data import/export.
 * 18. Manage Task List Popup: Toggles and renders the task list popup.
 * 19. Manage Modals and Undo: Shows modals and handles undo functionality.
 * 20. Manage Notifications: Requests permission and sends task notifications.
 * 21. Print Gantt Schedule: Generates a printable project schedule.
 * 22. Manage Calendar Popup: Toggles and renders a draggable calendar popup.
 * 23. Miscellaneous Utilities: Includes task toggling and overlap checking utilities.
 *
 * Usage: Functions are globally accessible and called as needed. Start with initializeApp().
 *
 *
 ********************************************************************************                 END                 ******************************************************************************
 */

/*
 *****************************************************************************              GUIDE TO OBJECTS IN SCRIPT.JS               ************************************************************************
 *
 *
 * This section describes the key objects used throughout the script, including global variables,
 * data structures, and DOM elements. Use this guide to reference them when modifying or extending the code.
 *
 * 1. Global State Variables
 *    - projects (Array): Array of project objects. Each project has:
 *        - id (String): Unique identifier (e.g., "1").
 *        - name (String): Project name (e.g., "Overhaul 2025").
 *        - tasks (Array): Array of task objects with properties:
 *            - name (String): Task name.
 *            - due (String): Due date in YYYY-MM-DD format.
 *            - startDate (String): Start date in YYYY-MM-DD format.
 *            - subTasks (Array): Nested tasks with similar properties.
 *            - notes (String): Optional notes.
 *            - expanded (Boolean): Toggle state for UI.
 *            - pic (String): Person-in-Charge name.
 *            - completion (Number): Completion percentage (0-100).
 *            - dependencies (Array): Task dependencies (e.g., ["parent"]).
 *        - pic (String): Project-level PIC.
 *        - completion (Number): Aggregated completion percentage.
 *        - expanded (Boolean): Project expansion state in dashboard.
 *        - calendarExpanded (Boolean): Expansion state in calendar (unused in current version).
 *      Reference: `projects[0].tasks[0].name` for first project's first task name.
 *    - currentMonth (Date): Current month displayed in calendar (e.g., `new Date()`).
 *    - openTabs (Array): Active tab IDs (e.g., ["dashboard"]).
 *    - calendarView (String): Calendar display mode ("full" or "list").
 *    - picList (Array): List of PIC names (e.g., ["Alice", "Bob"]).
 *    - contextTarget (Object): Current context menu target with { type, projectId, taskIdx, subIdx }.
 *    - undoStack (Array): Stack of undoable actions (e.g., [{ action: "deleteProject", data: {...} }]).
 *    - isTaskListVisible (Boolean): Task list popup visibility state.
 *    - draggedItem (HTMLElement|null): Currently dragged table row element.
 *    - calendarPopupVisible (Boolean): Calendar popup visibility state.
 *    - popupMonth (Date): Month displayed in calendar popup.
 *    - selectedProjectId (String|null): ID of project shown in Gantt chart.
 *
 * 2. DOM Elements (Referenced by ID)
 *    - "project-list" (tbody): Table body for dashboard project/task list.
 *    - "filter-pic" (select): Dropdown for filtering by PIC.
 *    - "filter-overdue" (select): Dropdown for filtering by overdue status.
 *    - "filter-completion" (select): Dropdown for filtering by completion status.
 *    - "month-year" (span): Displays current month/year in calendar.
 *    - "calendar-full" (div): Container for full calendar view.
 *    - "calendar-list" (div): Container for list calendar view.
 *    - "calendar-body" (tbody): Table body for full calendar grid.
 *    - "toggle-view-btn" (button): Toggles calendar view mode.
 *    - "toggle-task-list" (button): Toggles task list popup.
 *    - "pic-list" (tbody): Table body for PIC list in settings.
 *    - "gantt-body" (tbody): Table body for Gantt chart tasks.
 *    - "gantt-timeline" (div): Gantt chart timeline header.
 *    - "context-menu" (div): Context menu container.
 *    - "task-list-popup" (div): Task list popup container.
 *    - "task-list-content" (div): Content area for task list popup.
 *    - "calendar-popup" (div): Calendar popup container.
 *    - "undo-button" (button): Undo action button.
 *    - "notification-permission" (button): Notification permission request button.
 *    - "import-file" (input): Hidden file input for CSV import.
 *      Reference: `document.getElementById("project-list")` to access.
 *
 * 3. Dynamic DOM Elements (Created Programmatically)
 *    - Task Bars (div.task-bar): Gantt chart bars with dataset attributes:
 *        - data-project-id (String): Project ID.
 *        - data-task-idx (Number): Task index.
 *        - data-sub-idx (String|null): Sub-task index or "null".
 *        - data-total-days (Number): Total days in Gantt timeline.
 *        - data-min-date (String): Minimum date in YYYY-MM-DD format.
 *      Reference: `document.querySelectorAll(".task-bar")`.
 *    - Modals (div.modal): Temporary modal dialogs for task dates/notes.
 *    - Notes Popup (div.notes-popup): Popup for editing task notes.
 *      Reference: Created and removed dynamically; access via event handlers.
 *
 * Usage Tips:
 * - Access global variables directly (e.g., `projects.push({...})`).
 * - Use DOM methods for elements (e.g., `document.getElementById("gantt-body").innerHTML`).
 * - Check for null/undefined when accessing dynamic elements.
 *
 *********************************************************************************                 END                 ******************************************************************************
 */






//**************************************************************************
//            DOM ID CONSTANTS SETUP
//**************************************************************************
const DOM_IDS = {
    PROJECT_LIST: "project-list",
    FILTER_PIC: "filter-pic",
    FILTER_OVERDUE: "filter-overdue",
    FILTER_COMPLETION: "filter-completion",
    MONTH_YEAR: "month-year",
    CALENDAR_FULL: "calendar-full",
    CALENDAR_LIST: "calendar-list",
    CALENDAR_BODY: "calendar-body",
    TOGGLE_VIEW_BTN: "toggle-view-btn",
    TOGGLE_TASK_LIST: "toggle-task-list",
    PIC_LIST: "pic-list",
    GANTT_BODY: "gantt-body",
    GANTT_TIMELINE: "gantt-timeline",
    CONTEXT_MENU: "context-menu",
    TASK_LIST_POPUP: "task-list-popup",
    TASK_LIST_CONTENT: "task-list-content",
    CALENDAR_POPUP: "calendar-popup",
    UNDO_BUTTON: "undo-button",
    NOTIFICATION_PERMISSION: "notification-permission",
    IMPORT_FILE: "import-file",
    POPUP_MONTH_YEAR: "popup-month-year",
    // New entries from index.html updates
    HEADER: "header",
    MAIN_CONTAINER: "main-container",
    TABS: "tabs",
    PROJECT_TABS: "project-tabs",
    DASHBOARD: "dashboard",
    CALENDAR: "calendar",
    SETTINGS: "settings",
    GANTT: "gantt",
    FOOTER: "footer"
};
//**************************************************************************
//            END OF DOM ID CONSTANTS SETUP
//**************************************************************************


//**************************************************************************
//            CONFIGURATION SETTINGS SETUP
//**************************************************************************
const CONFIG = {
    // Colors
    OVERDUE_COLOR: '#ff0000',          // Red for overdue tasks
    ON_TRACK_COLOR: '#004EA1',         // Blue for on-track tasks in Gantt
    TODAY_COLOR: 'rgba(0, 204, 0, 0.3)', // Green highlight for today in calendar
    OVERDUE_ROW_OPACITY: '0.5',        // Opacity for overdue row background
    TASK_BAR_OPACITY: '0.7',           // Default opacity for Gantt task bars
    TASK_BAR_HOVER_OPACITY: '0.9',     // Hover opacity for Gantt task bars

    // Timeouts
    UNDO_BUTTON_TIMEOUT: 5000,         // Duration (ms) undo button is visible

    // Table Column Widths (Dashboard)
    PROJECT_WIDTH: '25%',              // Project/Task column
    START_DATE_WIDTH: '15%',           // Start Date column
    DEADLINE_WIDTH: '15%',             // Deadline column
    COMPLETION_WIDTH: '10%',           // Completion column
    PIC_WIDTH: '15%',                  // Person-in-Charge column
    NOTES_WIDTH: '20%',                // Notes column

    // Gantt Table Column Widths
    GANTT_TASK_WIDTH: '30%',           // Task column in Gantt chart
    GANTT_TIMELINE_WIDTH: '70%'        // Timeline column in Gantt chart
};
//**************************************************************************
//            END OF CONFIGURATION SETTINGS SETUP
//**************************************************************************


//**************************************************************************
//            TAB CONFIGURATION SETUP
//**************************************************************************
const TABS_CONFIG = [
    { id: DOM_IDS.DASHBOARD, label: "Dashboard", controls: DOM_IDS.DASHBOARD },
    { id: DOM_IDS.CALENDAR, label: "Calendar", controls: DOM_IDS.CALENDAR },
    { id: DOM_IDS.SETTINGS, label: "Settings", controls: DOM_IDS.SETTINGS }
];
//**************************************************************************
//            END OF TAB CONFIGURATION SETUP
//**************************************************************************



// Global State Variables
let projects = [];
let currentMonth = new Date();
let openTabs = ['dashboard'];
let calendarView = 'full';
let picList = [];
let contextTarget = null;
let undoStack = [];
let isTaskListVisible = false;
let draggedItem = null;
let calendarPopupVisible = false;
let popupMonth = new Date();
let selectedProjectId = null;





/*
 **************************************************************************
 *            BLOCK 1. Initialize Application
 **************************************************************************
 */
function initializeApp() {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            console.log('Initializing application...');
            loadData();
            console.log('Data loaded:', projects.length, 'projects');
            updateTabs();
            console.log('Tabs updated');
            renderProjects();
            console.log('Projects rendered');
            renderCalendar();
            console.log('Calendar rendered');
            // Check if renderPICList exists before calling it
            if (typeof renderPICList === 'function') {
                renderPICList();
                console.log('PIC list rendered');
            } else {
                console.warn('renderPICList function is not defined; skipping PIC list rendering');
            }
            setupContextMenu();
            console.log('Context menu set up');
            populateFilterOptions();
            console.log('Filter options populated');
            showTab(DOM_IDS.DASHBOARD);
            console.log('Dashboard shown');

            const notificationButton = document.querySelector(`[data-id="${DOM_IDS.NOTIFICATION_PERMISSION}"]`);
            if (!notificationButton) {
                console.error('Notification button not found');
            } else {
                if (window.location.protocol === 'file:') {
                    notificationButton.classList.add('hidden');
                    console.log('Notification button hidden (file protocol)');
                } else if (Notification.permission === "granted") {
                    notificationButton.classList.add('hidden');
                    checkNotifications();
                    console.log('Notifications checked');
                } else if (Notification.permission === "default") {
                    notificationButton.classList.remove('hidden');
                    console.log('Notification permission pending; button visible');
                }
            }

            const taskListPopup = document.querySelector(`[data-id="${DOM_IDS.TASK_LIST_POPUP}"]`);
            if (!taskListPopup) {
                console.error('Task list popup not found');
            } else {
                taskListPopup.classList.add('hidden');
                isTaskListVisible = false;
                console.log('Task List initialized as hidden');
            }

            // Add toggleSubmenu function globally for Settings menu
            window.toggleSubmenu = function(id) {
                const submenu = document.getElementById(id);
                if (submenu) {
                    submenu.classList.toggle('hidden');
                }
            };
        } catch (error) {
            console.error('Initialization error:', error);
        }
    });
    window.addEventListener('dataUpdated', () => {
        console.log('Data updated event triggered');
        updateUI();
        checkNotifications();
        showTab(openTabs[0]);
    });
    console.log('Data updated event listener added');
}
/*
 **************************************************************************
 *            END OF BLOCK 1. Initialize Application
 *            Block 1 - Initialize Application - script.js
 **************************************************************************
 */




/*
 **************************************************************************
 *            BLOCK 2. Manage Data Storage
 **************************************************************************
 */
function loadData() {
    const storedProjects = localStorage.getItem('projects');
    projects = storedProjects ? JSON.parse(storedProjects) : [];
    
    projects.forEach(project => {
        project.id = project.id || (projects.length + 1).toString();
        project.pic = project.pic || '';
        project.completion = project.completion || 0;
        project.expanded = project.expanded || false;
        project.calendarExpanded = project.calendarExpanded || false;
        project.isArchived = project.isArchived || false;
        project.tasks = project.tasks || [];
        project.tasks.forEach(task => {
            task.subTasks = task.subTasks || [];
            task.notes = task.notes || '';
            task.expanded = task.expanded || false;
            task.pic = task.pic || '';
            task.completion = task.completion || 0;
            task.startDate = task.startDate || task.due;
            task.dependencies = task.dependencies || [];
            delete task.status;
            task.subTasks.forEach(subTask => {
                subTask.subTasks = subTask.subTasks || [];
                subTask.notes = subTask.notes || '';
                subTask.expanded = subTask.expanded || false;
                subTask.pic = subTask.pic || '';
                subTask.completion = subTask.completion || 0;
                subTask.startDate = subTask.startDate || subTask.due;
                subTask.dependencies = subTask.dependencies || ['parent'];
                delete subTask.status;
            });
        });
    });
    
    const storedPICs = localStorage.getItem('picList');
    picList = storedPICs ? JSON.parse(storedPICs) : ['Alice', 'Bob', 'Charlie'];

    // Load style settings
    const storedStyles = localStorage.getItem('styleSettings');
    if (storedStyles) {
        const styles = JSON.parse(storedStyles);
        Object.entries(styles).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
    } else {
        // Apply default styles if none stored
        const defaultStyles = {
            '--background-color': '#000000',
            '--background-color-rgb': '0, 0, 0',
            '--button-color': '#004EA1',
            '--button-color-rgb': '0, 78, 161',
            '--task-bar-color': '#004EA1',
            '--task-bar-color-rgb': '0, 78, 161',
            '--text-color': '#f0f0f0',
            '--transparency': '0.7',
            '--sidebar-bg-color': '#000000',
            '--sidebar-bg-color-rgb': '0, 0, 0',
            '--sidebar-transparency': '0.9',
            '--tab-button-bg': '#2e3b3b',
            '--tab-button-bg-rgb': '46, 59, 59',
            '--tab-button-transparency': '0.9',
            '--tab-button-active-bg': '#004EA1',
            '--tab-button-active-bg-rgb': '0, 78, 161',
            '--tab-button-active-transparency': '1.0',
            '--tab-button-hover-bg': '#003c7a',
            '--tab-button-hover-bg-rgb': '0, 60, 122',
            '--tab-button-hover-transparency': '0.9',
            '--table-header-bg': '#004EA1',
            '--table-header-bg-rgb': '0, 78, 161',
            '--table-header-transparency': '0.5',
            '--tooltip-bg': '#000000',
            '--tooltip-bg-rgb': '0, 0, 0',
            '--tooltip-transparency': '0.8',
            '--tooltip-text-color': '#f0f0f0',
            '--modal-header-bg': '#004EA1',
            '--modal-header-bg-rgb': '0, 78, 161',
            '--modal-header-transparency': '1.0',
            '--overdue-highlight': '#ff0000',
            '--overdue-highlight-rgb': '255, 0, 0',
            '--overdue-transparency': '0.3',
            '--calendar-today-bg': '#00cc00',
            '--calendar-today-bg-rgb': '0, 204, 0',
            '--calendar-today-transparency': '0.3',
            '--today-line-color': '#ff0000',
            '--today-line-color-rgb': '255, 0, 0',
            '--today-line-transparency': '1.0',
            '--calendar-task-popup-bg': '#000000',
            '--calendar-task-popup-bg-rgb': '0, 0, 0',
            '--calendar-task-popup-transparency': '0.9'
        };
        Object.entries(defaultStyles).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
    }

    // Load custom themes
    const storedCustomThemes = localStorage.getItem('customThemes');
    customThemes = storedCustomThemes ? JSON.parse(storedCustomThemes) : {};
}

function saveData() {
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('picList', JSON.stringify(picList));
    
    // Save all style settings
    const styleSettings = {
        '--background-color': getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim(),
        '--background-color-rgb': getComputedStyle(document.documentElement).getPropertyValue('--background-color-rgb').trim(),
        '--button-color': getComputedStyle(document.documentElement).getPropertyValue('--button-color').trim(),
        '--button-color-rgb': getComputedStyle(document.documentElement).getPropertyValue('--button-color-rgb').trim(),
        '--task-bar-color': getComputedStyle(document.documentElement).getPropertyValue('--task-bar-color').trim(),
        '--task-bar-color-rgb': getComputedStyle(document.documentElement).getPropertyValue('--task-bar-color-rgb').trim(),
        '--text-color': getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim(),
        '--transparency': getComputedStyle(document.documentElement).getPropertyValue('--transparency').trim(),
        '--sidebar-bg-color': getComputedStyle(document.documentElement).getPropertyValue('--sidebar-bg-color').trim(),
        '--sidebar-bg-color-rgb': getComputedStyle(document.documentElement).getPropertyValue('--sidebar-bg-color-rgb').trim(),
        '--sidebar-transparency': getComputedStyle(document.documentElement).getPropertyValue('--sidebar-transparency').trim(),
        '--tab-button-bg': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-bg').trim(),
        '--tab-button-bg-rgb': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-bg-rgb').trim(),
        '--tab-button-transparency': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-transparency').trim(),
        '--tab-button-active-bg': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-active-bg').trim(),
        '--tab-button-active-bg-rgb': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-active-bg-rgb').trim(),
        '--tab-button-active-transparency': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-active-transparency').trim(),
        '--tab-button-hover-bg': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-hover-bg').trim(),
        '--tab-button-hover-bg-rgb': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-hover-bg-rgb').trim(),
        '--tab-button-hover-transparency': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-hover-transparency').trim(),
        '--table-header-bg': getComputedStyle(document.documentElement).getPropertyValue('--table-header-bg').trim(),
        '--table-header-bg-rgb': getComputedStyle(document.documentElement).getPropertyValue('--table-header-bg-rgb').trim(),
        '--table-header-transparency': getComputedStyle(document.documentElement).getPropertyValue('--table-header-transparency').trim(),
        '--tooltip-bg': getComputedStyle(document.documentElement).getPropertyValue('--tooltip-bg').trim(),
        '--tooltip-bg-rgb': getComputedStyle(document.documentElement).getPropertyValue('--tooltip-bg-rgb').trim(),
        '--tooltip-transparency': getComputedStyle(document.documentElement).getPropertyValue('--tooltip-transparency').trim(),
        '--tooltip-text-color': getComputedStyle(document.documentElement).getPropertyValue('--tooltip-text-color').trim(),
        '--modal-header-bg': getComputedStyle(document.documentElement).getPropertyValue('--modal-header-bg').trim(),
        '--modal-header-bg-rgb': getComputedStyle(document.documentElement).getPropertyValue('--modal-header-bg-rgb').trim(),
        '--modal-header-transparency': getComputedStyle(document.documentElement).getPropertyValue('--modal-header-transparency').trim(),
        '--overdue-highlight': getComputedStyle(document.documentElement).getPropertyValue('--overdue-highlight').trim(),
        '--overdue-highlight-rgb': getComputedStyle(document.documentElement).getPropertyValue('--overdue-highlight-rgb').trim(),
        '--overdue-transparency': getComputedStyle(document.documentElement).getPropertyValue('--overdue-transparency').trim(),
        '--calendar-today-bg': getComputedStyle(document.documentElement).getPropertyValue('--calendar-today-bg').trim(),
        '--calendar-today-bg-rgb': getComputedStyle(document.documentElement).getPropertyValue('--calendar-today-bg-rgb').trim(),
        '--calendar-today-transparency': getComputedStyle(document.documentElement).getPropertyValue('--calendar-today-transparency').trim(),
        '--today-line-color': getComputedStyle(document.documentElement).getPropertyValue('--today-line-color').trim(),
        '--today-line-color-rgb': getComputedStyle(document.documentElement).getPropertyValue('--today-line-color-rgb').trim(),
        '--today-line-transparency': getComputedStyle(document.documentElement).getPropertyValue('--today-line-transparency').trim(),
        '--calendar-task-popup-bg': getComputedStyle(document.documentElement).getPropertyValue('--calendar-task-popup-bg').trim(),
        '--calendar-task-popup-bg-rgb': getComputedStyle(document.documentElement).getPropertyValue('--calendar-task-popup-bg-rgb').trim(),
        '--calendar-task-popup-transparency': getComputedStyle(document.documentElement).getPropertyValue('--calendar-task-popup-transparency').trim()
    };
    localStorage.setItem('styleSettings', JSON.stringify(styleSettings));
    
    // Save custom themes
    localStorage.setItem('customThemes', JSON.stringify(customThemes));
    
    window.dispatchEvent(new CustomEvent('dataUpdated'));
}
/*
 **************************************************************************
 *            END OF BLOCK 2. Manage Data Storage
 *            Block 2 - Manage Data Storage - script.js
 **************************************************************************
 */




//**************************************************************************
//            BLOCK 3. Parse and Serialize CSV Data
//**************************************************************************

function parseCsv(text, overviewOnly = false) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    let result = [];
    let currentProject = null;
    let currentTask = null;
    let parsingPICList = false;

    const colMap = {};
    headers.forEach((header, idx) => colMap[header] = idx);

    lines.forEach((line, index) => {
        if (line.startsWith('PICList')) {
            parsingPICList = true;
            picList = line.split(',').slice(1).filter(name => name.trim());
            return;
        }
        if (parsingPICList || index === 0) return;

        const fields = line.split(',');
        const projectId = fields[colMap['ProjectID']] || '';
        const projectName = fields[colMap['ProjectName']] || '';
        const taskName = fields[colMap['TaskName']] || '';
        const due = fields[colMap['DueDate']] || '';
        const subTaskLevel = fields[colMap['SubTaskLevel']] || '0';
        const parentTaskId = fields[colMap['ParentTaskID']] || '';
        const pic = fields[colMap['PIC']] || '';
        const completion = fields[colMap['Completion']] || '0';
        const notes = fields[colMap['Notes']] || '';
        const startDate = fields[colMap['StartDate']] || due;
        const isArchived = fields[colMap['isArchived']] === 'true'; // Parse isArchived field

        if (!currentProject || currentProject.id !== projectId) {
            if (currentProject && overviewOnly && currentProject.taskCompletions) {
                const total = currentProject.taskCompletions.reduce((sum, comp) => sum + comp, 0);
                currentProject.completion = currentProject.taskCompletions.length > 0 
                    ? Math.round(total / currentProject.taskCompletions.length) 
                    : 0;
                delete currentProject.taskCompletions;
            }
            currentProject = { 
                id: projectId, 
                name: projectName, 
                tasks: [], 
                pic: pic || '', 
                completion: 0,
                expanded: false, 
                calendarExpanded: false,
                isArchived: isArchived // Set isArchived from CSV
            };
            if (overviewOnly) {
                currentProject.taskCompletions = [];
            }
            result.push(currentProject);
            currentTask = null;
        }
        
        if (overviewOnly) {
            currentProject.pic = pic || currentProject.pic;
            if (taskName) {
                currentProject.taskCompletions.push(parseInt(completion) || 0);
            }
        } else if (taskName) {
            const dueDateObj = new Date(due);
            const startDateObj = new Date(startDate);
            if (isNaN(dueDateObj.getTime())) throw new Error(`Invalid due date in CSV: ${due}`);
            if (startDate && isNaN(startDateObj.getTime())) throw new Error(`Invalid start date in CSV: ${startDate}`);
            let adjustedStartDate = startDate || due;
            if (startDate && startDateObj > dueDateObj) {
                console.warn(`Start date ${startDate} after due date ${due} for task ${taskName}; using due date as start.`);
                adjustedStartDate = due;
            }

            const task = {
                name: taskName,
                due: due,
                startDate: adjustedStartDate,
                subTasks: [],
                notes: notes || '',
                expanded: false,
                pic: pic || '',
                completion: parseInt(completion) || 0,
                dependencies: fields[colMap['Dependencies']] ? fields[colMap['Dependencies']].split('|') : []
            };
            if (subTaskLevel === '0' || !subTaskLevel) {
                currentProject.tasks.push(task);
                currentTask = task;
            } else if (subTaskLevel === '1' && currentTask) {
                task.startDate = adjustedStartDate;
                task.dependencies = task.dependencies.length ? task.dependencies : ['parent'];
                currentTask.subTasks.push(task);
            }
        }
    });

    if (overviewOnly && currentProject && currentProject.taskCompletions) {
        const total = currentProject.taskCompletions.reduce((sum, comp) => sum + comp, 0);
        currentProject.completion = currentProject.taskCompletions.length > 0 
            ? Math.round(total / currentProject.taskCompletions.length) 
            : 0;
        delete currentProject.taskCompletions;
    }

    return result;
}

function serializeCsv(data) {
    let csv = 'ProjectID,ProjectName,TaskName,DueDate,,SubTaskLevel,ParentTaskID,PIC,Completion,Notes,StartDate,Dependencies,isArchived\n';
    data.forEach(project => {
        project.tasks.forEach((task, taskIdx) => {
            csv += `${project.id},${project.name},${task.name},${task.due},,0,,${task.pic},${task.completion},${task.notes || ''},${task.startDate},${task.dependencies.join('|')},${project.isArchived}\n`;
            task.subTasks.forEach((subTask) => {
                csv += `${project.id},${project.name},${subTask.name},${subTask.due},,1,${taskIdx},${subTask.pic},${subTask.completion},${subTask.notes || ''},${subTask.startDate},${subTask.dependencies.join('|')},${project.isArchived}\n`;
            });
        });
        if (project.tasks.length === 0) {
            csv += `${project.id},${project.name},,,,0,,${project.pic},${project.completion},,,${project.isArchived}\n`;
        }
    });
    csv += `PICList,${picList.join(',')}\n`;
    return csv;
}

//**************************************************************************
//            END OF BLOCK 3. Parse and Serialize CSV Data
//            Block 3 - Parse and Serialize CSV Data - script.js
//**************************************************************************




//**************************************************************************
//            BLOCK 4. Calculate Project Metrics
//**************************************************************************

function getProjectDeadline(project) {
    if (project.tasks.length === 0) return 'N/A';
    const latestDueDate = project.tasks.reduce((latest, task) => {
        const taskDate = new Date(task.due);
        const subTaskLatest = task.subTasks.reduce((subLatest, subTask) => {
            const subTaskDate = new Date(subTask.due);
            return subTaskDate > new Date(subLatest) ? subTask.due : subLatest;
        }, task.due);
        return new Date(subTaskLatest) > new Date(latest) ? subTaskLatest : latest;
    }, project.tasks[0].due);
    return latestDueDate;
}

function getProjectCompletion(project) {
    if (project.tasks.length === 0) return 0;

    function calculateTaskCompletion(task) {
        if (task.subTasks && task.subTasks.length > 0) {
            let totalSubCompletion = 0;
            let subTaskCount = 0;
            task.subTasks.forEach(subTask => {
                totalSubCompletion += calculateTaskCompletion(subTask);
                subTaskCount++;
            });
            task.completion = subTaskCount > 0 ? Math.round(totalSubCompletion / subTaskCount) : 0;
        }
        return task.completion;
    }

    let totalCompletion = 0;
    let taskCount = 0;
    project.tasks.forEach(task => {
        totalCompletion += calculateTaskCompletion(task);
        taskCount++;
    });
    project.completion = taskCount > 0 ? Math.round(totalCompletion / taskCount) : 0;

    // Removed automatic archiving logic; archiving is now manual

    return project.completion;
}

function isProjectOverdue(project) {
    return project.tasks.some(task => isTaskOverdue(task));
}

//**************************************************************************
//            END OF BLOCK 4. Calculate Project Metrics
//            Block 4 - Calculate Project Metrics - script.js
//**************************************************************************




/*
 *************************************************************************
 *            BLOCK 5. Filter and Render Projects
 *************************************************************************
 */
function populateFilterOptions() {
    const filterPic = document.querySelector(`[data-id="${DOM_IDS.FILTER_PIC}"]`);
    if (filterPic) {
        filterPic.innerHTML = '<option value="">All</option>';
        picList.forEach(pic => {
            filterPic.innerHTML += `<option value="${pic}">${pic}</option>`;
        });
    }
    const filterCompletion = document.querySelector(`[data-id="${DOM_IDS.FILTER_COMPLETION}"]`);
    if (filterCompletion) {
        filterCompletion.innerHTML = `
            <option value="">All</option>
            <option value="completed">Completed</option>
            <option value="incomplete">Incomplete</option>
        `;
    }
}

function filterProjects() {
    const filterPic = document.querySelector(`[data-id="${DOM_IDS.FILTER_PIC}"]`).value;
    const filterOverdue = document.querySelector(`[data-id="${DOM_IDS.FILTER_OVERDUE}"]`).value;
    const filterCompletion = document.querySelector(`[data-id="${DOM_IDS.FILTER_COMPLETION}"]`).value;
    const showArchived = document.querySelector(`[data-id="filter-archived"]`)?.checked || false;

    let filteredProjects = [...projects];

    if (filterPic) {
        filteredProjects = filteredProjects.filter(project => {
            return project.pic === filterPic || 
                   project.tasks.some(task => task.pic === filterPic || 
                   task.subTasks.some(subTask => subTask.pic === filterPic));
        });
    }

    if (filterOverdue) {
        filteredProjects = filteredProjects.filter(project => {
            const overdue = isProjectOverdue(project);
            return filterOverdue === 'overdue' ? overdue : !overdue;
        });
    }

    if (filterCompletion) {
        filteredProjects = filteredProjects.filter(project => {
            const completion = getProjectCompletion(project);
            if (filterCompletion === 'completed') return completion === 100 && !project.isArchived;
            if (filterCompletion === 'incomplete') return completion < 100 && !project.isArchived;
            return true;
        });
    }

    if (!showArchived) {
        filteredProjects = filteredProjects.filter(project => !project.isArchived);
    }

    renderFilteredProjects(filteredProjects);
}

function renderFilteredProjects(filteredProjects) {
    const tbody = document.querySelector(`[data-id="${DOM_IDS.PROJECT_LIST}"]`);
    if (!tbody) return;
    tbody.innerHTML = '';
    filteredProjects.forEach(project => {
        const tr = document.createElement('tr');
        const hasTasks = project.tasks.length > 0;
        const expanded = project.expanded || false;
        const isOverdue = project.tasks.some(task => isTaskOverdue(task));
        tr.className = isOverdue ? 'overdue-row' : (project.isArchived ? 'archived-row' : '');
        tr.dataset.projectId = project.id;
        tr.dataset.isProject = "true";
        tr.draggable = true;
        tr.addEventListener('dragstart', handleDragStart);
        tr.addEventListener('dragover', handleDragOver);
        tr.addEventListener('dragenter', handleDragEnter);
        tr.addEventListener('dragleave', handleDragLeave);
        tr.addEventListener('drop', handleDrop);
        tr.addEventListener('dragend', handleDragEnd);
        tr.innerHTML = `
            <td style="width: ${CONFIG.PROJECT_WIDTH}" oncontextmenu="showContextMenu(event, 'project', '${project.id}')">
                <span class="project-toggle" onclick="toggleProject('${project.id}', this)">
                    ${hasTasks ? (expanded ? '–' : '+') : ''} 
                </span>
                <span class="project-name">
                    <a href="javascript:void(0)" onclick="openProjectTab('${project.id}'); return false;">${project.name}${project.isArchived ? ' (Archived)' : ''}</a>
                </span>
            </td>
            <td style="width: ${CONFIG.START_DATE_WIDTH}"></td>
            <td style="width: ${CONFIG.DEADLINE_WIDTH}">${getProjectDeadline(project)}</td>
            <td style="width: ${CONFIG.COMPLETION_WIDTH}">${getProjectCompletion(project)}%</td>
            <td style="width: ${CONFIG.PIC_WIDTH}">
                <select onchange="assignProjectPIC('${project.id}', this.value)">
                    <option value="">None</option>
                    ${picList.map(pic => `<option value="${pic}" ${project.pic === pic ? 'selected' : ''}>${pic}</option>`).join('')}
                </select>
            </td>
            <td style="width: ${CONFIG.NOTES_WIDTH}"></td>
        `;
        project.expanded = expanded;
        tbody.appendChild(tr);

        if (hasTasks && expanded) {
            renderTasks(project, tbody, 1);
        }
    });
}

function renderProjects() {
    filterProjects();
}

function renderTasks(project, tbody, level, parentIdx = null) {
    project.tasks.forEach((task, idx) => {
        const hasSubTasks = task.subTasks && task.subTasks.length > 0;
        const expanded = task.expanded || false;
        const isOverdue = isTaskOverdue(task);
        const hasNotes = task.notes && task.notes.trim().length > 0;
        const tr = document.createElement('tr');
        tr.className = isOverdue ? 'overdue-row' : '';
        tr.draggable = true;
        tr.dataset.projectId = project.id;
        tr.dataset.taskIdx = idx;
        tr.dataset.isSubtask = "false";
        tr.dataset.dropZone = "task";
        tr.addEventListener('dragstart', handleDragStart);
        tr.addEventListener('dragover', handleDragOver);
        tr.addEventListener('dragenter', handleDragEnter);
        tr.addEventListener('dragleave', handleDragLeave);
        tr.addEventListener('drop', handleDrop);
        tr.addEventListener('dragend', handleDragEnd);
        const dueDate = new Date(task.due);
        tr.innerHTML = `
            <td style="width: ${CONFIG.PROJECT_WIDTH}; padding-left: ${level * 30}px" oncontextmenu="showContextMenu(event, 'task', '${project.id}', ${idx}, ${parentIdx})">
                <span class="task-toggle" onclick="toggleTask('${project.id}', ${idx}, ${parentIdx}, this)">
                    ${hasSubTasks ? (expanded ? '–' : '+') : ''} 
                </span>
                <span class="task-name"><a href="javascript:void(0)" onclick="openProjectTab('${project.id}'); return false;">${task.name}</a></span>
                <span class="notes-icon ${hasNotes ? 'has-notes' : ''}" onclick="openNotesPopup('${project.id}', ${idx}, ${parentIdx}, event)">📝</span>
            </td>
            <td style="width: ${CONFIG.START_DATE_WIDTH}; cursor: pointer;" onclick="console.log('Start Date clicked for task ${task.name}'); showDatePickerPopup(event, '${project.id}', ${idx}, ${parentIdx}, 'startDate') || alert('Date picker failed to open')">${task.startDate}</td>
            <td style="width: ${CONFIG.DEADLINE_WIDTH}; cursor: pointer;" onclick="console.log('Deadline clicked for task ${task.name}'); showDatePickerPopup(event, '${project.id}', ${idx}, ${parentIdx}, 'due') || alert('Date picker failed to open')">${dueDate.toISOString().split('T')[0]}</td>
            <td style="width: ${CONFIG.COMPLETION_WIDTH}">${hasSubTasks ? `${task.completion}%` : `<input type="number" min="0" max="100" value="${task.completion}" onchange="updateTaskCompletion('${project.id}', ${idx}, ${parentIdx}, this.value)" style="width: 50px;">`}</td>
            <td style="width: ${CONFIG.PIC_WIDTH}">
                <select onchange="assignTaskPIC('${project.id}', ${idx}, ${parentIdx}, this.value)">
                    <option value="">None</option>
                    ${picList.map(pic => `<option value="${pic}" ${task.pic === pic ? 'selected' : ''}>${pic}</option>`).join('')}
                </select>
            </td>
            <td style="width: ${CONFIG.NOTES_WIDTH}">${task.notes || ''}</td>
        `;
        task.expanded = expanded;
        tbody.appendChild(tr);

        if (hasSubTasks && expanded) {
            renderSubTasks(project, tbody, task.subTasks, idx, level + 1);
        }
    });
}

function renderSubTasks(project, tbody, subTasks, parentIdx, level) {
    subTasks.forEach((subTask, idx) => {
        const isOverdue = isTaskOverdue(subTask);
        const hasNotes = subTask.notes && subTask.notes.trim().length > 0;
        const tr = document.createElement('tr');
        tr.className = isOverdue ? 'overdue-row' : '';
        tr.draggable = true;
        tr.dataset.projectId = project.id;
        tr.dataset.taskIdx = parentIdx;
        tr.dataset.subtaskIdx = idx;
        tr.dataset.isSubtask = "true";
        tr.dataset.dropZone = "subtask";
        tr.addEventListener('dragstart', handleDragStart);
        tr.addEventListener('dragover', handleDragOver);
        tr.addEventListener('dragenter', handleDragEnter);
        tr.addEventListener('dragleave', handleDragLeave);
        tr.addEventListener('drop', handleDrop);
        tr.addEventListener('dragend', handleDragEnd);
        const dueDate = new Date(subTask.due);
        tr.innerHTML = `
            <td style="width: ${CONFIG.PROJECT_WIDTH}; padding-left: ${level * 30}px" oncontextmenu="showContextMenu(event, 'subTask', '${project.id}', ${parentIdx}, ${idx})">
                <span class="sub-task">
                    <a href="javascript:void(0)" onclick="openProjectTab('${project.id}'); return false;">${subTask.name}</a>
                </span>
                <span class="notes-icon ${hasNotes ? 'has-notes' : ''}" onclick="openNotesPopup('${project.id}', ${parentIdx}, ${idx}, event)">📝</span>
            </td>
            <td style="width: ${CONFIG.START_DATE_WIDTH}; cursor: pointer;" onclick="console.log('Start Date clicked for subtask ${subTask.name}'); showDatePickerPopup(event, '${project.id}', ${parentIdx}, ${idx}, 'startDate') || alert('Date picker failed to open')">${subTask.startDate}</td>
            <td style="width: ${CONFIG.DEADLINE_WIDTH}; cursor: pointer;" onclick="console.log('Deadline clicked for subtask ${subTask.name}'); showDatePickerPopup(event, '${project.id}', ${parentIdx}, ${idx}, 'due') || alert('Date picker failed to open')">${dueDate.toISOString().split('T')[0]}</td>
            <td style="width: ${CONFIG.COMPLETION_WIDTH}"><input type="number" min="0" max="100" value="${subTask.completion}" onchange="updateSubTaskCompletion('${project.id}', ${parentIdx}, ${idx}, this.value)" style="width: 50px;"></td>
            <td style="width: ${CONFIG.PIC_WIDTH}">
                <select onchange="assignTaskPIC('${project.id}', ${parentIdx}, ${idx}, this.value)">
                    <option value="">None</option>
                    ${picList.map(pic => `<option value="${pic}" ${subTask.pic === pic ? 'selected' : ''}>${pic}</option>`).join('')}
                </select>
            </td>
            <td style="width: ${CONFIG.NOTES_WIDTH}">${subTask.notes || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}
/*
 *************************************************************************
 *            END OF BLOCK 5. Filter and Render Projects
 *            Block 5 - Filter and Render Projects - script.js
 *************************************************************************
 */




//**************************************************************************
//            BLOCK 6. Manage Project and Task Updates
//**************************************************************************
function toggleProject(projectId, toggleElement) {
    const project = projects.find(p => p.id === projectId);
    project.expanded = !project.expanded;
    toggleElement.textContent = project.expanded ? '–' : '+';
    updateUI(); // Kept here as it’s a UI-only change, not a data change
}

function toggleTask(projectId, taskIdx, parentIdx, toggleElement) {
    const project = projects.find(p => p.id === projectId);
    const task = parentIdx === null ? project.tasks[taskIdx] : project.tasks[parentIdx].subTasks[taskIdx];
    task.expanded = !task.expanded;
    toggleElement.textContent = task.expanded ? '–' : '+';
    updateUI(); // Kept here as it’s a UI-only change, not a data change
}

function assignProjectPIC(projectId, pic) {
    const project = projects.find(p => p.id === projectId);
    project.pic = pic;
    saveData(); // Dispatches 'dataUpdated' event
}

function assignTaskPIC(projectId, taskIdx, parentIdx, pic) {
    const project = projects.find(p => p.id === projectId);
    const task = parentIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[parentIdx];
    task.pic = pic;
    saveData(); // Dispatches 'dataUpdated' event
}

function updateTaskCompletion(projectId, taskIdx, parentIdx, value) {
    const project = projects.find(p => p.id === projectId);
    const task = parentIdx === null ? project.tasks[taskIdx] : project.tasks[parentIdx].subTasks[taskIdx];
    task.completion = Math.max(0, Math.min(100, parseInt(value) || 0));
    
    if (task.subTasks && task.subTasks.length > 0) {
        let totalSubCompletion = 0;
        let subTaskCount = 0;
        task.subTasks.forEach(subTask => {
            totalSubCompletion += subTask.completion;
            subTaskCount++;
        });
        task.completion = subTaskCount > 0 ? Math.round(totalSubCompletion / subTaskCount) : 0;
    }

    getProjectCompletion(project);
    saveData(); // Dispatches 'dataUpdated' event
}

function updateSubTaskCompletion(projectId, parentIdx, subIdx, value) {
    const project = projects.find(p => p.id === projectId);
    const subTask = project.tasks[parentIdx].subTasks[subIdx];
    subTask.completion = Math.max(0, Math.min(100, parseInt(value) || 0));

    const task = project.tasks[parentIdx];
    let totalSubCompletion = 0;
    let subTaskCount = 0;
    task.subTasks.forEach(st => {
        totalSubCompletion += st.completion;
        subTaskCount++;
    });
    task.completion = subTaskCount > 0 ? Math.round(totalSubCompletion / subTaskCount) : 0;

    getProjectCompletion(project);
    saveData(); // Dispatches 'dataUpdated' event
}

//**************************************************************************
//            END OF BLOCK 6. Manage Project and Task Updates
//**************************************************************************




/*
 *************************************************************************
//            BLOCK 7. Manage Tabs and Navigation
 *************************************************************************
*/
function updateTabs() {
    const tabsDiv = document.querySelector(`[data-id="${DOM_IDS.TABS}"]`);
    if (!tabsDiv) return;

    tabsDiv.innerHTML = TABS_CONFIG.map(tab => `
        <button class="tab-button ${openTabs[0] === tab.id ? 'active' : ''}" 
                onclick="showTab('${tab.id}')" 
                role="tab" 
                aria-selected="${openTabs[0] === tab.id}" 
                aria-controls="${tab.controls}">
            ${tab.label}
        </button>
    `).join('');
}

function showTab(tabId) {
    openTabs = [tabId];

    // Reload style settings to ensure current values are applied
    loadStyleSettings();
    console.log('Style settings reloaded for tab:', tabId);

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.action-bar').forEach(bar => {
        bar.classList.add('hidden');
    });

    const activeTab = document.querySelector(`[data-id="${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        const actionBar = activeTab.querySelector('.action-bar');
        if (actionBar) {
            actionBar.classList.remove('hidden');
        }
    }

    updateTabs();

    if (tabId === DOM_IDS.GANTT && selectedProjectId) {
        renderGanttChart(selectedProjectId);
    } else if (tabId === DOM_IDS.CALENDAR) {
        renderCalendar();
    } else if (tabId === DOM_IDS.SETTINGS) {
        renderSettings(); // Ensure settings reflect current styles
    } else if (tabId === 'import') {
        // Do not clear importedProjects here; let importData handle the flow
        renderImportPage();
    } else {
        renderProjects();
    }
}

function openProjectTab(projectId) {
    selectedProjectId = projectId;
    showTab(DOM_IDS.GANTT);
    if (selectedProjectId) {
        renderGanttChart(selectedProjectId);
    }
}
/*
 *************************************************************************
 *         END OF BLOCK 7. Manage Tabs and Navigation
 *         Block 7 - Manage Tabs and Navigation - script.js
 *************************************************************************
*/





/*
 **************************************************************************
 *            BLOCK 8. Add and Delete Projects/Tasks
 **************************************************************************
 */
function addProject() {
    const projectName = prompt('Enter project name:');
    if (projectName) {
        const newId = (projects.length + 1).toString();
        projects.push({
            id: newId,
            name: projectName,
            tasks: [],
            pic: '',
            completion: 0,
            expanded: false,
            calendarExpanded: false,
            isArchived: false
        });
        saveData();
    }
}

function deleteProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (project && confirm(`Are you sure you want to delete the project "${project.name}"?`)) {
        undoStack.push({ action: 'deleteProject', data: { project: { ...project }, index: projects.findIndex(p => p.id === projectId) } });
        projects = projects.filter(p => p.id !== projectId);
        saveData();
        showUndoButton();
    }
}

function archiveProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (project && confirm(`Are you sure you want to archive the project "${project.name}"?`)) {
        undoStack.push({ action: 'archiveProject', data: { projectId, wasArchived: project.isArchived } });
        project.isArchived = true;
        saveData();
        showUndoButton();
    }
}

function restoreProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (project && confirm(`Are you sure you want to restore the project "${project.name}" to active status?`)) {
        undoStack.push({ action: 'restoreProject', data: { projectId, wasArchived: project.isArchived } });
        project.isArchived = false;
        saveData();
        showUndoButton();
    }
}

function editProjectName(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const newName = prompt('Enter new project name:', project.name);
    if (newName && newName.trim() && newName !== project.name) {
        undoStack.push({ action: 'editProjectName', data: { projectId, oldName: project.name } });
        project.name = newName.trim();
        saveData();
        showUndoButton();
    }
}

function addTask(projectId, parentIdx = null) {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        console.error(`Project with ID ${projectId} not found`);
        return;
    }
    const taskName = prompt('Enter task name:');
    if (taskName) {
        showModal('Add Task Dates', `
            <label>Start Date: <input type="date" id="modal-start-date" value="${new Date().toISOString().split('T')[0]}"></label><br>
            <label>Due Date: <input type="date" id="modal-due-date" value="${new Date().toISOString().split('T')[0]}"></label><br>
            <label>Notes: <textarea id="modal-notes" rows="3" placeholder="Optional notes"></textarea></label>
        `, function() {
            const startDate = document.getElementById('modal-start-date')?.value;
            const dueDate = document.getElementById('modal-due-date')?.value;
            const notes = document.getElementById('modal-notes')?.value;

            if (!startDate || !dueDate) {
                console.error('Start date or due date missing');
                return;
            }

            const validation = validateTaskDates(startDate, dueDate);
            if (!validation.valid) {
                alert(validation.message);
                return;
            }

            const newTask = {
                name: taskName,
                due: dueDate,
                startDate: startDate,
                subTasks: [],
                notes: notes || '',
                expanded: false,
                pic: project.pic || '',
                completion: 0,
                dependencies: parentIdx !== null ? ['parent'] : []
            };

            try {
                if (parentIdx === null) {
                    project.tasks.push(newTask);
                } else {
                    if (!project.tasks[parentIdx]) {
                        console.error(`Parent task at index ${parentIdx} not found`);
                        return;
                    }
                    project.tasks[parentIdx].subTasks.push(newTask);
                    const parentTask = project.tasks[parentIdx];
                    const newTaskDue = new Date(newTask.due);
                    const parentDue = new Date(parentTask.due);
                    if (newTaskDue > parentDue) {
                        parentTask.due = newTask.due;
                        updateTaskDueDateWithSubTasks(parentTask, parentTask.due, parentTask.startDate);
                    }
                }
                saveData();
            } catch (error) {
                console.error('Error adding task:', error);
            }
        });
    }
}

function deleteTask(projectId, taskIdx, parentIdx = null) {
    const project = projects.find(p => p.id === projectId);
    let task;
    if (parentIdx === null) {
        task = project.tasks[taskIdx];
        if (confirm(`Are you sure you want to delete the task "${task.name}"?`)) {
            undoStack.push({ action: 'deleteTask', data: { projectId, task: { ...task }, taskIdx, parentIdx } });
            project.tasks.splice(taskIdx, 1);
        }
    } else {
        task = project.tasks[parentIdx].subTasks[taskIdx];
        if (confirm(`Are you sure you want to delete the sub-task "${task.name}"?`)) {
            undoStack.push({ action: 'deleteTask', data: { projectId, task: { ...task }, taskIdx, parentIdx } });
            project.tasks[parentIdx].subTasks.splice(taskIdx, 1);
            const parentTask = project.tasks[parentIdx];
            if (parentTask.subTasks.length > 0) {
                const latestSubTaskDue = parentTask.subTasks.reduce((latest, subTask) => {
                    const subDue = new Date(subTask.due);
                    return subDue > latest ? subDue : latest;
                }, new Date(parentTask.subTasks[0].due));
                if (latestSubTaskDue > new Date(parentTask.due)) {
                    parentTask.due = latestSubTaskDue.toISOString().split('T')[0];
                    updateTaskDueDateWithSubTasks(parentTask, parentTask.due, parentTask.startDate);
                }
            }
        }
    }
    getProjectCompletion(project);
    saveData();
    showUndoButton();
}
/*
 **************************************************************************
 *            END OF BLOCK 8. Add and Delete Projects/Tasks
 *            Block 8 - Add and Delete Projects/Tasks - script.js
 **************************************************************************
 */




//**************************************************************************
//            BLOCK 9. Edit Tasks
//**************************************************************************
function editTask(projectId, taskIdx, parentIdx = null) {
    const project = projects.find(p => p.id === projectId);
    const task = parentIdx === null ? project.tasks[taskIdx] : project.tasks[parentIdx].subTasks[taskIdx];
    const newName = prompt('Enter new task name:', task.name);
    if (newName) {
        task.name = newName;
        saveData();
    }
}

function editTaskDueDate(projectId, taskIdx, parentIdx = null) {
    const project = projects.find(p => p.id === projectId);
    const task = parentIdx === null ? project.tasks[taskIdx] : project.tasks[parentIdx].subTasks[taskIdx];

    showModal('Edit Dates', `
        <label>Start Date: <input type="date" id="modal-start-date" value="${task.startDate}"></label><br>
        <label>Due Date: <input type="date" id="modal-due-date" value="${task.due}"></label>
    `, function() {
        const startDateInput = document.getElementById('modal-start-date').value;
        const dueDateInput = document.getElementById('modal-due-date').value;
        if (startDateInput && dueDateInput) {
            const validation = validateTaskDates(startDateInput, dueDateInput);
            if (!validation.valid) {
                alert(validation.message);
                return;
            }

            if (task.subTasks.length > 0) {
                const latestSubTaskDue = task.subTasks.reduce((latest, subTask) => {
                    const subDue = new Date(subTask.due);
                    return subDue > latest ? subDue : latest;
                }, new Date(task.subTasks[0].due));
                if (new Date(dueDateInput) < latestSubTaskDue) {
                    alert('Parent task due date cannot be earlier than its sub-tasks.');
                    return;
                }
            }
            task.startDate = startDateInput;
            task.due = dueDateInput;
            updateTaskDueDateWithSubTasks(task, dueDateInput, startDateInput);

            if (parentIdx !== null) {
                const parentTask = project.tasks[parentIdx];
                const parentDueDate = new Date(parentTask.due);
                const subDueDate = new Date(dueDateInput);
                if (subDueDate > parentDueDate) {
                    parentTask.due = dueDateInput;
                    updateTaskDueDateWithSubTasks(parentTask, dueDateInput, parentTask.startDate);
                }
            }
            saveData();
        }
    });

    // Make the modal draggable
    const modal = document.querySelector('.modal');
    const modalContent = modal.querySelector('.modal-content'); // Drag by the content area
    const modalHeader = modal.querySelector('.modal-content h3');
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX;
    let initialY;

    // Center the modal initially
    modal.style.display = 'block'; // Ensure it's visible for positioning
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    const modalRect = modalContent.getBoundingClientRect();
    currentX = (window.innerWidth - modalRect.width) / 2;
    currentY = (window.innerHeight - modalRect.height) / 2;
    modalContent.style.position = 'absolute';
    modalContent.style.left = `${currentX}px`;
    modalContent.style.top = `${currentY}px`;
    modal.style.justifyContent = 'unset'; // Disable flex centering during drag
    modal.style.alignItems = 'unset';

    modalHeader.style.cursor = 'move'; // Indicate draggability
    modalHeader.addEventListener('mousedown', startDragging);

    function startDragging(e) {
        e.preventDefault();
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        isDragging = true;

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDragging);
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            const modalRect = modalContent.getBoundingClientRect();
            const maxX = window.innerWidth - modalRect.width;
            const maxY = window.innerHeight - modalRect.height;

            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));

            modalContent.style.left = `${currentX}px`;
            modalContent.style.top = `${currentY}px`;
        }
    }

    function stopDragging() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDragging);
    }
}

function updateTaskDueDateWithSubTasks(task, dueDate, startDate) {
    task.startDate = startDate;
    task.due = dueDate;

    if (task.subTasks && task.subTasks.length > 0) {
        task.subTasks.forEach(subTask => {
            if (subTask.dependencies.includes('parent')) {
                // Calculate original duration of sub-task
                const originalSubStart = new Date(subTask.startDate);
                const originalSubDue = new Date(subTask.due);
                const subTaskDuration = (originalSubDue - originalSubStart) / (1000 * 60 * 60 * 24);

                // Set new sub-task dates relative to parent's new start date
                const newParentStart = new Date(startDate);
                subTask.startDate = newParentStart.toISOString().split('T')[0];
                const newSubDue = new Date(newParentStart);
                newSubDue.setDate(newParentStart.getDate() + subTaskDuration);
                subTask.due = newSubDue.toISOString().split('T')[0];
            }
            // Recursively update any nested sub-tasks
            updateTaskDueDateWithSubTasks(subTask, subTask.due, subTask.startDate);
        });
    }
}
//**************************************************************************
//            END OF BLOCK 9. Edit Tasks
//**************************************************************************




/*
 **************************************************************************
 *            BLOCK 10. Handle Context Menu
 **************************************************************************
 */
function setupContextMenu() {
    console.log('Setting up context menu listener');
    const contextMenu = document.querySelector(`[data-id="${DOM_IDS.CONTEXT_MENU}"]`);
    if (!contextMenu) return;

    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const target = e.target.closest('td');
        if (!target) return;

        const projectId = target.closest('tr')?.dataset.projectId;
        const taskIdx = target.closest('tr')?.dataset.taskIdx;
        const subIdx = target.closest('tr')?.dataset.subtaskIdx;

        if (projectId) {
            let menuItems = [];
            if (!taskIdx && !subIdx) {
                contextTarget = { type: 'project', projectId };
                menuItems = [
                    { label: 'Add Task', action: `addTask('${projectId}')` },
                    { label: 'Delete Project', action: `deleteProject('${projectId}')` },
                    { label: 'Edit Project Name', action: `editProjectName('${projectId}')` },
                    { label: projectId && projects.find(p => p.id === projectId)?.isArchived ? 'Restore Project' : 'Archive Project', 
                      action: projectId && projects.find(p => p.id === projectId)?.isArchived ? `restoreProject('${projectId}')` : `archiveProject('${projectId}')` }
                ];
            } else if (taskIdx && subIdx === undefined) {
                contextTarget = { type: 'task', projectId, taskIdx: parseInt(taskIdx), subIdx: null };
                menuItems = [
                    { label: 'Add Sub-Task', action: `addTask('${projectId}', ${taskIdx})` },
                    { label: 'Delete Task', action: `deleteTask('${projectId}', ${taskIdx}, null)` },
                    { label: 'Edit Task Name', action: `editTaskName('${projectId}', ${taskIdx}, null)` }
                ];
            } else if (taskIdx && subIdx !== undefined) {
                contextTarget = { type: 'subTask', projectId, taskIdx: parseInt(taskIdx), subIdx: parseInt(subIdx) };
                menuItems = [
                    { label: 'Delete Sub-Task', action: `deleteTask('${projectId}', ${taskIdx}, ${subIdx})` },
                    { label: 'Edit Sub-Task Name', action: `editTaskName('${projectId}', ${taskIdx}, ${subIdx})` }
                ];
            }

            contextMenu.innerHTML = menuItems.map(item => `<div class="menu-item" onclick="${item.action}">${item.label}</div>`).join('');
            // Use clientX and clientY directly for exact cursor position
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.style.top = `${e.clientY}px`;
            contextMenu.classList.remove('hidden');

            // Adjust position to prevent overflow
            const menuRect = contextMenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (menuRect.right > viewportWidth) {
                contextMenu.style.left = `${e.clientX - menuRect.width}px`;
            }
            if (menuRect.bottom > viewportHeight) {
                contextMenu.style.top = `${e.clientY - menuRect.height}px`;
            }
        }
    });

    // Close context menu on click outside
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            console.log('Outside click detected, hiding context menu');
            contextMenu.classList.add('hidden');
            contextTarget = null;
        }
    });
}

function showContextMenu(event, type, projectId, taskIdx = null, subIdx = null) {
    event.preventDefault();
    const contextMenu = document.querySelector(`[data-id="${DOM_IDS.CONTEXT_MENU}"]`);
    if (!contextMenu) return;

    contextTarget = { type, projectId, taskIdx, subIdx };
    let menuItems = [];

    if (type === 'project') {
        menuItems = [
            { label: 'Add Task', action: `addTask('${projectId}')` },
            { label: 'Delete Project', action: `deleteProject('${projectId}')` },
            { label: 'Edit Project Name', action: `editProjectName('${projectId}')` },
            { label: projectId && projects.find(p => p.id === projectId)?.isArchived ? 'Restore Project' : 'Archive Project', 
              action: projectId && projects.find(p => p.id === projectId)?.isArchived ? `restoreProject('${projectId}')` : `archiveProject('${projectId}')` }
        ];
    } else if (type === 'task') {
        menuItems = [
            { label: 'Add Sub-Task', action: `addTask('${projectId}', ${taskIdx})` },
            { label: 'Delete Task', action: `deleteTask('${projectId}', ${taskIdx}, null)` },
            { label: 'Edit Task Name', action: `editTaskName('${projectId}', ${taskIdx}, null)` }
        ];
    } else if (type === 'subTask') {
        menuItems = [
            { label: 'Delete Sub-Task', action: `deleteTask('${projectId}', ${taskIdx}, ${subIdx})` },
            { label: 'Edit Sub-Task Name', action: `editTaskName('${projectId}', ${taskIdx}, ${subIdx})` }
        ];
    } else if (type === 'addTask') {
        menuItems = [
            { label: 'Add Task', action: `addTask('${projectId}')` }
        ];
    }

    contextMenu.innerHTML = menuItems.map(item => `<div class="menu-item" onclick="${item.action}">${item.label}</div>`).join('');
    // Use clientX and clientY directly for exact cursor position
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.classList.remove('hidden');

    // Adjust position to prevent overflow
    const menuRect = contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (menuRect.right > viewportWidth) {
        contextMenu.style.left = `${event.clientX - menuRect.width}px`;
    }
    if (menuRect.bottom > viewportHeight) {
        contextMenu.style.top = `${event.clientY - menuRect.height}px`;
    }
}
/*
 **************************************************************************
 *            END OF BLOCK 10. Handle Context Menu
 *            Block 10 - Handle Context Menu - script.js
 **************************************************************************
 */




/*
 **************************************************************************
 *            BLOCK 11. Render Calendar
 **************************************************************************
 */
function renderCalendar() {
    const calendarFull = document.querySelector(`[data-id="${DOM_IDS.CALENDAR_FULL}"]`);
    const calendarList = document.querySelector(`[data-id="${DOM_IDS.CALENDAR_LIST}"]`);
    const calendarBody = document.querySelector(`[data-id="${DOM_IDS.CALENDAR_BODY}"]`);
    const monthYear = document.querySelector(`[data-id="${DOM_IDS.MONTH_YEAR}"]`);
    const toggleViewBtn = document.querySelector(`[data-id="${DOM_IDS.TOGGLE_VIEW_BTN}"]`);

    if (!calendarFull || !calendarList || !calendarBody || !monthYear || !toggleViewBtn) {
        console.error('Calendar elements not found');
        return;
    }

    monthYear.textContent = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    calendarFull.classList.toggle('hidden', calendarView !== 'full');
    calendarList.classList.toggle('hidden', calendarView === 'full');
    toggleViewBtn.textContent = calendarView === 'full' ? 'Full View' : 'List View';

    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const firstDay = monthStart.getDay();
    const daysInMonth = monthEnd.getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (calendarView === 'full') {
        calendarBody.innerHTML = '';
        let currentDay = 1;
        for (let i = 0; i < 6; i++) {
            const tr = document.createElement('tr');
            for (let j = 0; j < 7; j++) {
                const td = document.createElement('td');
                const dayIndex = i * 7 + j;
                if (dayIndex < firstDay || currentDay > daysInMonth) {
                    tr.appendChild(td);
                    continue;
                }

                const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentDay);
                td.innerHTML = `<span class="day-number">${currentDay}</span>`;
                if (currentDate.getTime() === today.getTime()) {
                    td.style.backgroundColor = 'rgba(var(--calendar-today-bg-rgb), var(--calendar-today-transparency))';
                }

                const tasksOnDay = [];
                projects.forEach(project => {
                    project.tasks.forEach(task => {
                        const dueDate = new Date(task.due);
                        if (dueDate.getFullYear() === currentDate.getFullYear() &&
                            dueDate.getMonth() === currentDate.getMonth() &&
                            dueDate.getDate() === currentDate.getDate()) {
                            const truncatedTask = `${project.name}: ${task.name}`;
                            tasksOnDay.push({ projectId: project.id, name: truncatedTask });
                            td.innerHTML += `
                                <div class="task-container">
                                    <span class="calendar-task" onclick="openProjectTab('${project.id}')">${truncatedTask}</span>
                                </div>`;
                        }
                        task.subTasks.forEach(subTask => {
                            const subDueDate = new Date(subTask.due);
                            if (subDueDate.getFullYear() === currentDate.getFullYear() &&
                                subDueDate.getMonth() === currentDate.getMonth() &&
                                subDueDate.getDate() === currentDate.getDate()) {
                                const truncatedSubTask = `${project.name}: ${subTask.name}`;
                                tasksOnDay.push({ projectId: project.id, name: truncatedSubTask });
                                td.innerHTML += `
                                    <div class="task-container">
                                        <span class="calendar-task" onclick="openProjectTab('${project.id}')">${truncatedSubTask}</span>
                                    </div>`;
                            }
                        });
                    });
                });

                if (tasksOnDay.length > 0) {
                    const popup = document.createElement('div');
                    popup.className = 'calendar-task-popup';
                    popup.innerHTML = '<ul>' + tasksOnDay.map(task => `
                        <li><a href="#" onclick="openProjectTab('${task.projectId}'); return false;">${task.name}</a></li>
                    `).join('') + '</ul>';
                    td.appendChild(popup);
                }

                tr.appendChild(td);
                currentDay++;
            }
            calendarBody.appendChild(tr);
            if (currentDay > daysInMonth) break;
        }
    } else {
        calendarList.innerHTML = '';
        const tasksByDate = {};
        projects.forEach(project => {
            project.tasks.forEach(task => {
                const dueDate = new Date(task.due);
                const dateKey = dueDate.toISOString().split('T')[0];
                if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
                tasksByDate[dateKey].push({ project: project.name, task: task.name, projectId: project.id });
                task.subTasks.forEach(subTask => {
                    const subDueDate = new Date(subTask.due);
                    const subDateKey = subDueDate.toISOString().split('T')[0];
                    if (!tasksByDate[subDateKey]) tasksByDate[subDateKey] = [];
                    tasksByDate[subDateKey].push({ project: project.name, task: subTask.name, projectId: project.id });
                });
            });
        });

        const sortedDates = Object.keys(tasksByDate).sort();
        sortedDates.forEach(date => {
            const tasks = tasksByDate[date];
            const div = document.createElement('div');
            div.className = 'calendar-list-date';
            div.innerHTML = `
                <strong>${new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                <ul>${tasks.map(t => `<li><a href="#" onclick="openProjectTab('${t.projectId}'); return false;">${t.project}: ${t.task}</a></li>`).join('')}</ul>
            `;
            calendarList.appendChild(div);
        });
    }
}

function prevMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
}

function toggleCalendarView() {
    calendarView = calendarView === 'full' ? 'list' : 'full';
    renderCalendar();
}
/*
 **************************************************************************
 *            END OF BLOCK 11. Render Calendar
 *            Block 11 - Render Calendar - script.js
 **************************************************************************
 */





//**************************************************************************
//            BLOCK 12. Render Gantt Chart
//**************************************************************************
function renderGanttChart(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const tbody = document.querySelector(`[data-id="${DOM_IDS.GANTT_BODY}"]`);
    const timelineHeader = document.querySelector(`[data-id="${DOM_IDS.GANTT_TIMELINE}"]`);
    if (!tbody || !timelineHeader) return;

    tbody.innerHTML = '';
    timelineHeader.innerHTML = '';

    let minDate = new Date();
    let maxDate = new Date();
    project.tasks.forEach(task => {
        const taskStart = parseLocalDate(task.startDate);
        const taskDue = parseLocalDate(task.due);
        minDate = taskStart < minDate ? taskStart : minDate;
        maxDate = taskDue > maxDate ? taskDue : maxDate;
        task.subTasks.forEach(subTask => {
            const subStart = parseLocalDate(subTask.startDate);
            const subDue = parseLocalDate(subTask.due);
            minDate = subStart < minDate ? subStart : minDate;
            maxDate = subDue > maxDate ? subDue : maxDate;
        });
    });

    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) || 1;

    project.tasks.forEach((task, taskIdx) => {
        const tr = document.createElement('tr');
        const hasNotes = task.notes && task.notes.trim().length > 0;
        tr.innerHTML = `
            <td oncontextmenu="showContextMenu(event, 'ganttTask', '${projectId}', ${taskIdx}, null)">
                ${task.name} 
                <span class="notes-icon ${hasNotes ? 'has-notes' : ''}" onclick="openNotesPopup('${projectId}', ${taskIdx}, null, event)">📝</span>
            </td>
            <td><div class="gantt-container"></div></td>
        `;
        tbody.appendChild(tr);
        const container = tr.querySelector('.gantt-container');
        renderTaskBar(container, task, minDate, totalDays, projectId, taskIdx, null);

        task.subTasks.forEach((subTask, subIdx) => {
            const subTr = document.createElement('tr');
            const subHasNotes = subTask.notes && subTask.notes.trim().length > 0;
            subTr.innerHTML = `
                <td style="padding-left: 20px;" oncontextmenu="showContextMenu(event, 'ganttSubTask', '${projectId}', ${taskIdx}, ${subIdx})">
                    ${subTask.name}
                    <span class="notes-icon ${subHasNotes ? 'has-notes' : ''}" onclick="openNotesPopup('${projectId}', ${taskIdx}, ${subIdx}, event)">📝</span>
                </td>
                <td><div class="gantt-container"></div></td>
            `;
            tbody.appendChild(subTr);
            const subContainer = subTr.querySelector('.gantt-container');
            renderTaskBar(subContainer, subTask, minDate, totalDays, projectId, taskIdx, subIdx);
        });
    });

    const today = new Date();
    const todayDaysFromMin = (today - minDate) / (1000 * 60 * 60 * 24);
    if (todayDaysFromMin >= 0 && todayDaysFromMin <= totalDays) {
        const todayLine = document.createElement('div');
        todayLine.className = 'today-line';
        todayLine.style.left = `${(todayDaysFromMin / totalDays) * 100}%`;
        const firstContainer = tbody.querySelector('.gantt-container');
        if (firstContainer) firstContainer.appendChild(todayLine);
    }

    const timelineDiv = document.createElement('div');
    timelineDiv.className = 'gantt-timeline';
    const labelCount = Math.min(totalDays, 10);
    const daysPerLabel = totalDays / labelCount;

    let currentDate = new Date(minDate);
    for (let i = 0; i <= labelCount; i++) {
        const label = document.createElement('div');
        label.className = 'timeline-label';
        label.style.left = `${(i / labelCount) * 100}%`;
        label.textContent = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        currentDate.setDate(currentDate.getDate() + Math.round(daysPerLabel));
        timelineDiv.appendChild(label);
    }

    while (currentDate < maxDate) {
        const label = document.createElement('div');
        label.className = 'timeline-label';
        label.style.left = `${((currentDate - minDate) / (1000 * 60 * 60 * 24) / totalDays) * 100}%`;
        label.textContent = currentDate.toLocaleDateString('en-US', { month: 'short' });
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    timelineHeader.appendChild(timelineDiv);
}

function renderTaskBar(container, task, minDate, totalDays, projectId, taskIdx, subIdx) {
    const startDate = parseLocalDate(task.startDate);
    const dueDate = parseLocalDate(task.due);
    const daysFromMinStart = (startDate - minDate) / (1000 * 60 * 60 * 24);
    const durationDays = (dueDate - startDate) / (1000 * 60 * 60 * 24) + 1;
    const leftPercent = (daysFromMinStart / totalDays) * 100;
    const widthPercent = (durationDays / totalDays) * 100;

    const taskBar = document.createElement('div');
    taskBar.className = `task-bar ${task.completion === 100 ? 'completed' : ''}`; // Add 'completed' class if 100%
    taskBar.style.left = `${leftPercent}%`;
    taskBar.style.width = `${widthPercent}%`;
    taskBar.dataset.projectId = projectId;
    taskBar.dataset.taskIdx = taskIdx;
    taskBar.dataset.subIdx = subIdx === null ? 'null' : subIdx;
    taskBar.dataset.totalDays = totalDays;
    taskBar.dataset.minDate = minDate.toISOString().split('T')[0];

    const resizeStart = document.createElement('div');
    resizeStart.className = 'resize-start';
    resizeStart.addEventListener('mousedown', startResizeStart);

    const resizeEnd = document.createElement('div');
    resizeEnd.className = 'resize-end';
    resizeEnd.addEventListener('mousedown', startResizeEnd);

    const tooltip = document.createElement('div');
    tooltip.className = 'task-tooltip';
    const displayDueDate = new Date(dueDate);
    displayDueDate.setDate(displayDueDate.getDate() + 1); // Add 1 day for display
    tooltip.innerHTML = `Start: ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<br>End: ${displayDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    taskBar.appendChild(resizeStart);
    taskBar.appendChild(tooltip);
    taskBar.appendChild(resizeEnd);

    taskBar.addEventListener('mousedown', startDragTaskBar);
    taskBar.addEventListener('contextmenu', (e) => {
        const type = subIdx === null ? 'ganttTask' : 'ganttSubTask';
        showContextMenu(e, type, projectId, taskIdx, subIdx);
    });

    container.appendChild(taskBar);
}
//**************************************************************************
//            END OF BLOCK 12. Render Gantt Chart
//**************************************************************************





//**************************************************************************
//            BLOCK 13. Handle Gantt Chart Interactions
//**************************************************************************

// Helper function to parse dates as local time
function parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // Midnight local time
}

function startResizeStart(event) {
    event.preventDefault();
    const taskBar = event.target.closest('.task-bar');
    if (!taskBar) return;

    const projectId = taskBar.dataset.projectId;
    const taskIdx = parseInt(taskBar.dataset.taskIdx);
    const subIdx = taskBar.dataset.subIdx === 'null' ? null : parseInt(taskBar.dataset.subIdx);
    let totalDays = parseFloat(taskBar.dataset.totalDays);
    const originalTotalDays = totalDays; // Store original totalDays for comparison
    let minDate = parseLocalDate(taskBar.dataset.minDate);

    const parentDiv = taskBar.parentElement;
    const parentRect = parentDiv.getBoundingClientRect();
    const startX = event.clientX;
    let initialLeft = parseFloat(taskBar.style.left) || 0;

    const project = projects.find(p => p.id === projectId);
    const task = subIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[subIdx];
    const tooltip = taskBar.querySelector('.task-tooltip');
    const originalEndDate = new Date(task.due);
    const endDaysFromMin = (originalEndDate - minDate) / (1000 * 60 * 60 * 24);
    let offsetDays = 0;

    function onMouseMove(e) {
        const deltaX = e.clientX - startX;
        const deltaPercent = (deltaX / parentRect.width) * 100;
        let newLeft = initialLeft + deltaPercent;

        if (newLeft < 0) {
            offsetDays = -Math.ceil(Math.abs(newLeft) * totalDays / 100);
            newLeft = 0;
        } else {
            offsetDays = 0;
        }

        const daysFromMinStart = (newLeft / 100) * totalDays + offsetDays;
        const snappedDaysStart = Math.round(daysFromMinStart);
        const newStartDate = new Date(minDate);
        newStartDate.setDate(newStartDate.getDate() + snappedDaysStart);

        const newWidthPercent = ((endDaysFromMin - snappedDaysStart) / totalDays) * 100;
        const minWidthPercent = (1 / totalDays) * 100;
        if (newWidthPercent < minWidthPercent) {
            newLeft = ((endDaysFromMin - 1) / totalDays) * 100;
            taskBar.style.left = `${newLeft}%`;
            taskBar.style.width = `${minWidthPercent}%`;
        } else {
            taskBar.style.left = `${(snappedDaysStart / totalDays) * 100}%`;
            taskBar.style.width = `${newWidthPercent}%`;
        }

        if (tooltip) {
            const startDateStr = newStartDate instanceof Date && !isNaN(newStartDate) 
                ? newStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                : task.startDate || 'Invalid Start Date';
            const displayEndDate = new Date(originalEndDate);
            displayEndDate.setDate(displayEndDate.getDate() + 1); // Add 1 day for display
            const endDateStr = displayEndDate instanceof Date && !isNaN(displayEndDate) 
                ? displayEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                : task.due || 'Invalid End Date';
            tooltip.innerHTML = `Start: ${startDateStr}<br>End: ${endDateStr}`;
        }
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const project = projects.find(p => p.id === projectId);
        const task = subIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[subIdx];
        const daysFromMinStart = (parseFloat(taskBar.style.left) / 100) * totalDays + offsetDays;
        const snappedDaysStart = Math.round(daysFromMinStart);
        const newStartDate = new Date(minDate);
        newStartDate.setDate(newStartDate.getDate() + snappedDaysStart);
        const originalStartDate = task.startDate;

        const startYear = newStartDate.getFullYear();
        const startMonth = String(newStartDate.getMonth() + 1).padStart(2, '0');
        const startDay = String(newStartDate.getDate()).padStart(2, '0');
        task.startDate = `${startYear}-${startMonth}-${startDay}`;

        if (checkForOverlaps(projectId)) {
            task.startDate = originalStartDate;
            alert('This change would cause a scheduling conflict. Reverting.');
        } else {
            if (subIdx !== null) {
                const parentTask = project.tasks[taskIdx];
                const parentDue = parseLocalDate(parentTask.due);
                const taskDue = parseLocalDate(task.due);
                if (taskDue > parentDue) {
                    parentTask.due = task.due;
                    updateTaskDueDateWithSubTasks(parentTask, parentTask.due, parentTask.startDate);
                }
            }
        }

        // Check if totalDays changed (rescaling occurred)
        if (totalDays !== originalTotalDays) {
            showNotificationPopup(
                'Gantt Chart Rescaled',
                `The timeline has been expanded to ${totalDays} days to accommodate the new start date of ${task.name}.`
            );
        }

        saveData();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function startResizeEnd(event) {
    event.preventDefault();
    const taskBar = event.target.closest('.task-bar');
    if (!taskBar) return;

    const projectId = taskBar.dataset.projectId;
    const taskIdx = parseInt(taskBar.dataset.taskIdx);
    const subIdx = taskBar.dataset.subIdx === 'null' ? null : parseInt(taskBar.dataset.subIdx);
    let totalDays = parseFloat(taskBar.dataset.totalDays);
    const originalTotalDays = totalDays; // Store original totalDays for comparison
    let minDate = parseLocalDate(taskBar.dataset.minDate);

    const parentDiv = taskBar.parentElement;
    const parentRect = parentDiv.getBoundingClientRect();
    const startX = event.clientX;
    let initialWidth = parseFloat(taskBar.style.width) || 0;
    let initialLeft = parseFloat(taskBar.style.left) || 0;

    const project = projects.find(p => p.id === projectId);
    const task = subIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[subIdx];
    const latestSubTaskDue = task.subTasks.length > 0 ? task.subTasks.reduce((latest, subTask) => {
        const subDue = parseLocalDate(subTask.due);
        return subDue > latest ? subDue : latest;
    }, parseLocalDate(task.subTasks[0].due)) : null;

    const tooltip = taskBar.querySelector('.task-tooltip');
    const startDate = new Date(task.startDate);

    function onMouseMove(e) {
        const deltaX = e.clientX - startX;
        const deltaPercent = (deltaX / parentRect.width) * 100;
        let newWidth = initialWidth + deltaPercent;

        const minWidthPercent = (1 / totalDays) * 100;
        newWidth = Math.max(minWidthPercent, newWidth);

        if (newWidth + initialLeft > 100) {
            const excessDays = ((newWidth + initialLeft - 100) / 100) * totalDays;
            const newMaxDate = new Date(minDate);
            newMaxDate.setDate(newMaxDate.getDate() + totalDays + Math.ceil(excessDays));
            totalDays = (newMaxDate - minDate) / (1000 * 60 * 60 * 24);
            taskBar.dataset.totalDays = totalDays;
            updateUI();
            return;
        }

        const daysFromMinStart = (initialLeft / 100) * totalDays;
        const durationDays = (newWidth / 100) * totalDays;
        const snappedDurationDays = Math.round(durationDays);
        const newEndDate = new Date(minDate);
        newEndDate.setDate(newEndDate.getDate() + daysFromMinStart + snappedDurationDays);

        if (latestSubTaskDue && newEndDate < latestSubTaskDue) {
            newEndDate.setTime(latestSubTaskDue.getTime());
            const newDurationDays = Math.ceil((newEndDate - new Date(minDate).setDate(minDate.getDate() + daysFromMinStart)) / (1000 * 60 * 60 * 24));
            newWidth = (newDurationDays / totalDays) * 100;
        }

        taskBar.style.width = `${newWidth}%`;

        if (tooltip) {
            const startDateStr = startDate instanceof Date && !isNaN(startDate) 
                ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                : task.startDate || 'Invalid Start Date';
            const displayEndDate = new Date(newEndDate);
            displayEndDate.setDate(displayEndDate.getDate() + 1); // Add 1 day for display
            const endDateStr = displayEndDate instanceof Date && !isNaN(displayEndDate) 
                ? displayEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                : task.due || 'Invalid End Date';
            tooltip.innerHTML = `Start: ${startDateStr}<br>End: ${endDateStr}`;
        }
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const project = projects.find(p => p.id === projectId);
        const task = subIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[subIdx];
        const daysFromMinStart = (initialLeft / 100) * totalDays;
        const durationDays = (parseFloat(taskBar.style.width) / 100) * totalDays;
        const newEndDate = new Date(minDate);
        newEndDate.setDate(newEndDate.getDate() + Math.round(daysFromMinStart + durationDays));
        const originalDue = task.due;

        const year = newEndDate.getFullYear();
        const month = String(newEndDate.getMonth() + 1).padStart(2, '0');
        const day = String(newEndDate.getDate()).padStart(2, '0');
        task.due = `${year}-${month}-${day}`;

        if (checkForOverlaps(projectId)) {
            task.due = originalDue;
            alert('This change would cause a scheduling conflict. Reverting.');
        } else {
            updateTaskDueDateWithSubTasks(task, task.due, task.startDate);
            if (subIdx !== null) {
                const parentTask = project.tasks[taskIdx];
                const parentDue = parseLocalDate(parentTask.due);
                const taskDue = parseLocalDate(task.due);
                if (taskDue > parentDue) {
                    parentTask.due = task.due;
                    updateTaskDueDateWithSubTasks(parentTask, parentTask.due, parentTask.startDate);
                }
            }
        }

        // Check if totalDays changed (rescaling occurred)
        if (totalDays !== originalTotalDays) {
            showNotificationPopup(
                'Gantt Chart Rescaled',
                `The timeline has been expanded to ${totalDays} days to accommodate the new end date of ${task.name}.`
            );
        }

        saveData();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function startDragTaskBar(event) {
    if (event.target.classList.contains('resize-start') || event.target.classList.contains('resize-end')) return;

    event.preventDefault();
    const taskBar = event.target.closest('.task-bar');
    if (!taskBar) return;

    const projectId = taskBar.dataset.projectId;
    const taskIdx = parseInt(taskBar.dataset.taskIdx);
    const subIdx = taskBar.dataset.subIdx === 'null' ? null : parseInt(taskBar.dataset.subIdx);
    let totalDays = parseFloat(taskBar.dataset.totalDays);
    const originalTotalDays = totalDays; // Store original totalDays for comparison
    let minDate = parseLocalDate(taskBar.dataset.minDate);

    const parentDiv = taskBar.parentElement;
    const parentRect = parentDiv.getBoundingClientRect();
    const startX = event.clientX;
    let initialLeft = parseFloat(taskBar.style.left) || 0;
    let initialWidth = parseFloat(taskBar.style.width) || 0;

    const project = projects.find(p => p.id === projectId);
    const task = subIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[subIdx];
    const latestSubTaskDue = task.subTasks.length > 0 ? task.subTasks.reduce((latest, subTask) => {
        const subDue = parseLocalDate(subTask.due);
        return subDue > latest ? subDue : latest;
    }, parseLocalDate(task.subTasks[0].due)) : null;

    const tooltip = taskBar.querySelector('.task-tooltip');

    function onMouseMove(e) {
        const deltaX = e.clientX - startX;
        const deltaPercent = (deltaX / parentRect.width) * 100;
        let newLeft = initialLeft + deltaPercent;

        if (newLeft < 0) {
            const daysToExtend = Math.abs(newLeft) * totalDays / 100;
            minDate.setDate(minDate.getDate() - Math.ceil(daysToExtend));
            totalDays = Math.ceil((new Date(task.due) - minDate) / (1000 * 60 * 60 * 24)) || totalDays + Math.ceil(daysToExtend);
            newLeft = 0;
            initialLeft = 0;
            taskBar.dataset.totalDays = totalDays;
            taskBar.dataset.minDate = minDate.toISOString().split('T')[0];
            renderGanttChart(projectId);
            return;
        }

        if (newLeft + initialWidth > 100) {
            const excessDays = ((newLeft + initialWidth - 100) / 100) * totalDays;
            const newMaxDate = new Date(minDate);
            newMaxDate.setDate(newMaxDate.getDate() + totalDays + Math.ceil(excessDays));
            totalDays = Math.ceil((newMaxDate - minDate) / (1000 * 60 * 60 * 24));
            taskBar.dataset.totalDays = totalDays;
            renderGanttChart(projectId);
            return;
        }

        const daysFromMinStart = (newLeft / 100) * totalDays;
        const snappedDaysStart = Math.round(daysFromMinStart);
        const newStartDate = new Date(minDate);
        newStartDate.setDate(newStartDate.getDate() + snappedDaysStart);
        const durationDays = (initialWidth / 100) * totalDays;
        const snappedDurationDays = Math.round(durationDays);
        const newEndDate = new Date(minDate);
        newEndDate.setDate(newEndDate.getDate() + snappedDaysStart + snappedDurationDays);

        if (latestSubTaskDue && newEndDate < latestSubTaskDue) {
            newEndDate.setTime(latestSubTaskDue.getTime());
            const newDurationDays = Math.ceil((newEndDate - newStartDate) / (1000 * 60 * 60 * 24));
            taskBar.style.left = `${((newStartDate - minDate) / (1000 * 60 * 60 * 24)) / totalDays * 100}%`;
            taskBar.style.width = `${(newDurationDays / totalDays) * 100}%`;
        } else {
            taskBar.style.left = `${(snappedDaysStart / totalDays) * 100}%`;
        }

        if (tooltip) {
            const startDateStr = newStartDate instanceof Date && !isNaN(newStartDate) 
                ? newStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                : task.startDate || 'Invalid Start Date';
            const displayEndDate = new Date(newEndDate);
            displayEndDate.setDate(displayEndDate.getDate() + 1); // Add 1 day for display
            const endDateStr = displayEndDate instanceof Date && !isNaN(displayEndDate) 
                ? displayEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                : task.due || 'Invalid End Date';
            tooltip.innerHTML = `Start: ${startDateStr}<br>End: ${endDateStr}`;
        }
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const project = projects.find(p => p.id === projectId);
        const task = subIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[subIdx];
        const originalStartDate = task.startDate;
        const originalDue = task.due;
        const originalDuration = Math.round((parseLocalDate(originalDue) - parseLocalDate(originalStartDate)) / (1000 * 60 * 60 * 24));

        let newLeft = parseFloat(taskBar.style.left) || 0;
        const daysFromMinStart = (newLeft / 100) * totalDays;
        const snappedDaysStart = Math.round(daysFromMinStart);
        const newStartDate = new Date(minDate);
        newStartDate.setDate(newStartDate.getDate() + snappedDaysStart);
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newStartDate.getDate() + originalDuration);

        const snappedLeftPercent = (snappedDaysStart / totalDays) * 100;
        taskBar.style.left = `${snappedLeftPercent}%`;

        const startYear = newStartDate.getFullYear();
        const startMonth = String(newStartDate.getMonth() + 1).padStart(2, '0');
        const startDay = String(newStartDate.getDate()).padStart(2, '0');
        task.startDate = `${startYear}-${startMonth}-${startDay}`;

        const endYear = newEndDate.getFullYear();
        const endMonth = String(newEndDate.getMonth() + 1).padStart(2, '0');
        const endDay = String(newEndDate.getDate()).padStart(2, '0');
        task.due = `${endYear}-${endMonth}-${endDay}`;

        if (checkForOverlaps(projectId)) {
            task.startDate = originalStartDate;
            task.due = originalDue;
            alert('This change would cause a scheduling conflict. Reverting.');
        } else {
            if (subIdx !== null) {
                const parentTask = project.tasks[taskIdx];
                const parentDue = parseLocalDate(parentTask.due);
                const taskDue = parseLocalDate(task.due);
                if (taskDue > parentDue) {
                    parentTask.due = task.due;
                    updateTaskDueDateWithSubTasks(parentTask, parentTask.due, parentTask.startDate);
                }
            } else {
                updateTaskDueDateWithSubTasks(task, task.due, task.startDate);
            }
        }

        // Check if totalDays changed (rescaling occurred)
        if (totalDays !== originalTotalDays) {
            showNotificationPopup(
                'Gantt Chart Rescaled',
                `The timeline has been expanded to ${totalDays} days to accommodate the new position of ${task.name}.`
            );
        }

        saveData();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}
//**************************************************************************
//            END OF BLOCK 13. Handle Gantt Chart Interactions
//**************************************************************************




//**************************************************************************
//            BLOCK 14. Handle Drag and Drop
//**************************************************************************
function handleDragStart(event) {
    draggedItem = event.target.closest('tr');
    if (draggedItem) {
        console.log('drag start on:', draggedItem.dataset);
        event.dataTransfer.setData('text/plain', '');
        draggedItem.style.opacity = '0.5';
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(event) {
    event.preventDefault();
    const target = event.target.closest('tr');
    if (!target || target === draggedItem) return;

    if (target.dataset.isProject === "true") {
        const rect = target.getBoundingClientRect();
        const y = event.clientY - rect.top;
        const height = rect.height;
        if (y < height / 2) {
            target.classList.add('drop-above');
            target.classList.remove('drop-below');
        } else {
            target.classList.add('drop-below');
            target.classList.remove('drop-above');
        }
        target.classList.remove('drop-onto');
    } else {
        const rect = target.getBoundingClientRect();
        const y = event.clientY - rect.top;
        const height = rect.height;
        if (y < height / 3) {
            target.classList.add('drop-above');
            target.classList.remove('drop-onto', 'drop-below');
        } else if (y > height * 2 / 3) {
            target.classList.add('drop-below');
            target.classList.remove('drop-onto', 'drop-above');
        } else {
            target.classList.add('drop-onto');
            target.classList.remove('drop-above', 'drop-below');
        }
    }
}

function handleDragLeave(event) {
    const target = event.target.closest('tr');
    if (target) {
        target.classList.remove('drop-above', 'drop-onto', 'drop-below');
    }
}

function handleDrop(event) {
    event.preventDefault();
    const target = event.target.closest('tr');
    if (!draggedItem || !target || draggedItem === target) return;

    console.log('draggedItem:', draggedItem.dataset);
    console.log('target:', target.dataset);
    console.log('target classes:', target.classList);

    if (draggedItem.dataset.isProject === "true" && target.dataset.isProject === "true") {
        const sourceIndex = projects.findIndex(p => p.id === draggedItem.dataset.projectId);
        const targetIndex = projects.findIndex(p => p.id === target.dataset.projectId);
        console.log('sourceIndex:', sourceIndex, 'targetIndex:', targetIndex);
        if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
            const [movedProject] = projects.splice(sourceIndex, 1);
            let insertIndex = targetIndex;
            if (target.classList.contains('drop-below')) {
                insertIndex = targetIndex + 1;
            }
            if (sourceIndex < insertIndex) {
                insertIndex--;
            }
            console.log('insertIndex:', insertIndex);
            projects.splice(insertIndex, 0, movedProject);
            saveData(); // Dispatches 'dataUpdated' event
        }
        return;
    }

    const sourceProjectId = draggedItem.dataset.projectId;
    const targetProjectId = target.dataset.projectId;
    if (sourceProjectId !== targetProjectId) return;

    const project = projects.find(p => p.id === sourceProjectId);
    const sourceIsSubtask = draggedItem.dataset.isSubtask === 'true';
    const targetIsSubtask = target.dataset.isSubtask === 'true';
    const sourceTaskIdx = parseInt(draggedItem.dataset.taskIdx);
    const sourceSubtaskIdx = draggedItem.dataset.subtaskIdx ? parseInt(draggedItem.dataset.subtaskIdx) : null;
    const targetTaskIdx = parseInt(target.dataset.taskIdx);
    const targetSubtaskIdx = target.dataset.subtaskIdx ? parseInt(target.dataset.subtaskIdx) : null;
    const isProjectDrop = target.dataset.isProject === 'true';

    let sourceTask, sourceArray, sourceIndex;
    if (sourceIsSubtask) {
        sourceArray = project.tasks[sourceTaskIdx].subTasks;
        sourceIndex = sourceSubtaskIdx;
        sourceTask = sourceArray[sourceIndex];
    } else {
        sourceArray = project.tasks;
        sourceIndex = sourceTaskIdx;
        sourceTask = sourceArray[sourceIndex];
    }

    sourceArray.splice(sourceIndex, 1);

    try {
        if (target.classList.contains('drop-onto') && !isProjectDrop) {
            let parentTask;
            if (targetIsSubtask) {
                parentTask = project.tasks[targetTaskIdx];
            } else {
                parentTask = project.tasks[targetTaskIdx];
            }
            parentTask.subTasks.push(sourceTask);
            sourceTask.dependencies = ['parent'];
            const latestSubTaskDue = parentTask.subTasks.reduce((latest, subTask) => {
                const subDue = new Date(subTask.due);
                return subDue > latest ? subDue : latest;
            }, new Date(parentTask.due));
            if (latestSubTaskDue > new Date(parentTask.due)) {
                parentTask.due = latestSubTaskDue.toISOString().split('T')[0];
                updateTaskDueDateWithSubTasks(parentTask, parentTask.due, parentTask.startDate);
            }
        } else {
            let targetArray, insertIdx;
            if (isProjectDrop) {
                targetArray = project.tasks;
                insertIdx = 0;
            } else if (targetIsSubtask) {
                targetArray = project.tasks[targetTaskIdx].subTasks;
                insertIdx = targetSubtaskIdx + (target.classList.contains('drop-below') ? 1 : 0);
                sourceTask.dependencies = ['parent'];
            } else {
                targetArray = project.tasks;
                insertIdx = targetTaskIdx + (target.classList.contains('drop-below') ? 1 : 0);
                sourceTask.dependencies = sourceTask.dependencies.filter(dep => dep !== 'parent');
            }

            if (targetArray === sourceArray && sourceIndex < insertIdx) {
                insertIdx--;
            }
            targetArray.splice(insertIdx, 0, sourceTask);
        }

        getProjectCompletion(project);
        saveData(); // Dispatches 'dataUpdated' event
    } catch (error) {
        console.error('Error during drop:', error);
        sourceArray.splice(sourceIndex, 0, sourceTask);
        saveData(); // Dispatches 'dataUpdated' event
    }
}

function handleDragEnd(event) {
    event.target.style.opacity = '1';
    document.querySelectorAll('tr').forEach(row => {
        row.classList.remove('drop-above', 'drop-onto', 'drop-below');
    });
    draggedItem = null;
}

//**************************************************************************
//            END OF BLOCK 14. Handle Drag and Drop
//**************************************************************************






//**************************************************************************
//            BLOCK 15. Manage Notes Popup
//**************************************************************************
function openNotesPopup(projectId, taskIdx, subIdx, event) {
    event.stopPropagation();
    const project = projects.find(p => p.id === projectId);
    const task = subIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[subIdx];
    const notesPopup = document.createElement('div');
    notesPopup.className = 'notes-popup';
    notesPopup.innerHTML = `
        <h4>Notes for ${task.name}</h4>
        <textarea rows="5">${task.notes || ''}</textarea>
        <button onclick="saveNotes('${projectId}', ${taskIdx}, ${subIdx}, this)">Save</button>
        <button onclick="this.parentElement.remove()">Close</button>
    `;
    document.body.appendChild(notesPopup);

    // Position the popup with a precise 2px Y offset below the cursor
    const adjustedLeft = event.clientX + window.scrollX; // Use clientX for cursor position, adjusted for horizontal scroll
    const adjustedTop = event.clientY + window.scrollY + 2; // Use clientY + 2px offset, adjusted for vertical scroll

    notesPopup.style.left = `${adjustedLeft}px`;
    notesPopup.style.top = `${adjustedTop}px`;

    // Adjust if popup would overflow the viewport
    const popupRect = notesPopup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (popupRect.right > viewportWidth) {
        notesPopup.style.left = `${viewportWidth - popupRect.width}px`;
    }
    if (popupRect.bottom > viewportHeight) {
        notesPopup.style.top = `${event.clientY + window.scrollY - popupRect.height - 2}px`; // Move above cursor with 2px offset
    }
}

function saveNotes(projectId, taskIdx, subIdx, button) {
    const project = projects.find(p => p.id === projectId);
    const task = subIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[subIdx];
    const textarea = button.parentElement.querySelector('textarea');
    task.notes = textarea.value;
    saveData();
    button.parentElement.remove();
}
//**************************************************************************
//            END OF BLOCK 15. Manage Notes Popup
//**************************************************************************





/*
 **************************************************************************
 *            BLOCK 16. Manage PIC List
 **************************************************************************
 */
function renderPICList() {
    const tbody = document.querySelector(`[data-id="${DOM_IDS.PIC_LIST}"]`);
    if (!tbody) {
        console.error('PIC list tbody not found');
        return;
    }
    tbody.innerHTML = '';
    picList.forEach((pic, index) => {
        const tr = document.createElement('tr');
        tr.className = 'pic-row';
        tr.innerHTML = `
            <td>${pic}</td>
            <td><button onclick="deletePIC(${index})">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function addPIC() {
    const picName = prompt('Enter Person-in-Charge name:');
    if (picName && picName.trim() && !picList.includes(picName.trim())) {
        picList.push(picName.trim());
        saveData();
        renderPICList();
        populateFilterOptions(); // Update filter dropdown with new PIC
    } else if (picName && picList.includes(picName.trim())) {
        alert('This Person-in-Charge already exists.');
    }
}

function deletePIC(index) {
    const picToDelete = picList[index];
    if (confirm(`Are you sure you want to delete "${picToDelete}" from the PIC list?`)) {
        // Check if PIC is assigned to any projects or tasks
        const isAssigned = projects.some(project => 
            project.pic === picToDelete || 
            project.tasks.some(task => 
                task.pic === picToDelete || 
                task.subTasks.some(subTask => subTask.pic === picToDelete)
            )
        );
        if (isAssigned) {
            alert(`Cannot delete "${picToDelete}" because it is assigned to one or more projects or tasks.`);
            return;
        }
        picList.splice(index, 1);
        saveData();
        renderPICList();
        populateFilterOptions(); // Update filter dropdown after deletion
    }
}
/*
 **************************************************************************
 *            END OF BLOCK 16. Manage PIC List
 *            Block 16 - Manage PIC List - script.js
 **************************************************************************
 */





//**************************************************************************
//            BLOCK 17. Import and Export Data
//**************************************************************************
let importedProjects = []; // Temporary storage for CSV projects during import selection

function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                console.log('CSV Text:', text);
                importedProjects = parseCsv(text, true); // Load overview only
                console.log('Imported Projects:', importedProjects);
                showTab('import');
                renderImportPage();
            } catch (error) {
                console.error('Error parsing CSV:', error);
                alert('Failed to parse CSV. Check console for details.');
            }
        };
        reader.readAsText(file);
    } else {
        console.log('No file selected');
    }
}

function importSelectedProjects() {
    const tbody = document.querySelector(`[data-id="import-project-list"]`);
    const checkboxes = tbody.querySelectorAll('input[type="checkbox"]');
    const selectedIds = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.dataset.projectId);

    const fileInput = document.querySelector(`[data-id="${DOM_IDS.IMPORT_FILE}"]`);
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const allProjects = parseCsv(text, false); // Full parse
                const selectedProjects = allProjects.filter(p => selectedIds.includes(p.id));
                
                // Merge selected projects with existing projects
                selectedProjects.forEach(newProject => {
                    const existingIndex = projects.findIndex(p => p.id === newProject.id);
                    if (existingIndex !== -1) {
                        // Update existing project if it exists
                        projects[existingIndex] = { ...projects[existingIndex], ...newProject };
                    } else {
                        // Add new project if it doesn’t exist
                        projects.push(newProject);
                    }
                });
                
                importedProjects = [];
                saveData();
                showTab(DOM_IDS.DASHBOARD);
                populateFilterOptions();
            } catch (error) {
                console.error('Error importing selected projects:', error);
                alert('Failed to import selected projects. Check console for details.');
            }
        };
        reader.readAsText(file);
    }
}

function importAllProjects() {
    const fileInput = document.querySelector(`[data-id="${DOM_IDS.IMPORT_FILE}"]`);
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const allProjects = parseCsv(text, false); // Full parse of all projects
                
                // Merge all projects with existing projects
                allProjects.forEach(newProject => {
                    const existingIndex = projects.findIndex(p => p.id === newProject.id);
                    if (existingIndex !== -1) {
                        // Update existing project if it exists
                        projects[existingIndex] = { ...projects[existingIndex], ...newProject };
                    } else {
                        // Add new project if it doesn’t exist
                        projects.push(newProject);
                    }
                });
                
                importedProjects = [];
                saveData();
                showTab(DOM_IDS.DASHBOARD);
                populateFilterOptions();
            } catch (error) {
                console.error('Error importing all projects:', error);
                alert('Failed to import all projects. Check console for details.');
            }
        };
        reader.readAsText(file);
    }
}

function exportData() {
    const csv = serializeCsv(projects); // Export all projects, including archived
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

//**************************************************************************
//            END OF BLOCK 17. Import and Export Data
//            Block 17 - Import and Export Data - script.js
//**************************************************************************





/*
 **************************************************************************
 *            BLOCK 18. Manage Task List Popup
 **************************************************************************
 */
function toggleTaskList() {
    const taskListPopup = document.querySelector(`[data-id="${DOM_IDS.TASK_LIST_POPUP}"]`);
    if (!taskListPopup) {
        console.error('Task list popup not found');
        return;
    }

    isTaskListVisible = !isTaskListVisible;
    taskListPopup.classList.toggle('hidden', !isTaskListVisible);
    if (isTaskListVisible) {
        renderTaskList();
        makeTaskListDraggable();
        const closeBtn = taskListPopup.querySelector('.close-task-list');
        if (closeBtn) {
            closeBtn.onclick = () => closeTaskList();
        } else {
            console.error('Close button not found in task list popup');
        }
    }

    const toggleBtn = document.querySelector(`[data-id="${DOM_IDS.TOGGLE_TASK_LIST}"]`);
    if (toggleBtn) {
        toggleBtn.classList.toggle('active', isTaskListVisible);
    } else {
        console.error('Toggle task list button not found');
    }
}

function closeTaskList() {
    const taskListPopup = document.querySelector(`[data-id="${DOM_IDS.TASK_LIST_POPUP}"]`);
    if (!taskListPopup) {
        console.error('Task list popup not found');
        return;
    }

    isTaskListVisible = false;
    taskListPopup.classList.add('hidden');

    const toggleBtn = document.querySelector(`[data-id="${DOM_IDS.TOGGLE_TASK_LIST}"]`);
    if (toggleBtn) {
        toggleBtn.classList.remove('active');
    } else {
        console.error('Toggle task list button not found');
    }
}

function renderTaskList() {
    const taskListPopup = document.querySelector(`[data-id="${DOM_IDS.TASK_LIST_POPUP}"]`);
    const taskListContent = document.querySelector(`[data-id="${DOM_IDS.TASK_LIST_CONTENT}"]`);
    if (!taskListPopup || !taskListContent) {
        console.error('Task list popup or content not found');
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasksByDate = {};
    projects.forEach(project => {
        project.tasks.forEach((task, taskIdx) => {
            const dueDate = new Date(task.due);
            const dateKey = dueDate.toISOString().split('T')[0];
            if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
            tasksByDate[dateKey].push({ project: project.name, task: task.name, due: task.due, overdue: isTaskOverdue(task), projectId: project.id, taskIdx });
            task.subTasks.forEach((subTask, subIdx) => {
                const subDueDate = new Date(subTask.due);
                const subDateKey = subDueDate.toISOString().split('T')[0];
                if (!tasksByDate[subDateKey]) tasksByDate[subDateKey] = [];
                tasksByDate[subDateKey].push({ project: project.name, task: subTask.name, due: subTask.due, overdue: isTaskOverdue(subTask), projectId: project.id, taskIdx: subIdx });
            });
        });
    });

    const sortedDates = Object.keys(tasksByDate).sort();
    let html = '<ul>';
    if (sortedDates.length === 0) {
        html += '<li>No tasks scheduled.</li>';
    } else {
        sortedDates.forEach(date => {
            const tasks = tasksByDate[date];
            html += `<li><strong>${new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong><ul>`;
            tasks.forEach(task => {
                html += `<li class="${task.overdue ? 'overdue' : ''}"><a href="#" onclick="openProjectTab('${task.projectId}'); return false;">${task.project}: ${task.task}</a></li>`;
            });
            html += '</ul></li>';
        });
    }
    html += '</ul>';
    taskListContent.innerHTML = html;

    // Ensure header remains visible by setting popup structure
    taskListPopup.innerHTML = `
        <div class="task-list-header">
            <h3>Task List</h3>
            <span class="close-task-list">×</span>
        </div>
        <div data-id="${DOM_IDS.TASK_LIST_CONTENT}">${html}</div>
    `;
    taskListPopup.querySelector('.close-task-list').onclick = () => closeTaskList();
}

function makeTaskListDraggable() {
    const taskListPopup = document.querySelector(`[data-id="${DOM_IDS.TASK_LIST_POPUP}"]`);
    const taskListHeader = taskListPopup.querySelector('.task-list-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    taskListHeader.addEventListener('mousedown', startDragging);

    function startDragging(e) {
        if (e.target.classList.contains('close-task-list')) return;

        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        isDragging = true;

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDragging);
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            const popupRect = taskListPopup.getBoundingClientRect();
            const maxX = window.innerWidth - popupRect.width;
            const maxY = window.innerHeight - popupRect.height;

            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));

            taskListPopup.style.left = `${currentX}px`;
            taskListPopup.style.top = `${currentY}px`;
            taskListPopup.style.right = 'auto';
        }
    }

    function stopDragging() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDragging);
    }

    const rect = taskListPopup.getBoundingClientRect();
    currentX = rect.left;
    currentY = rect.top;
}
/*
 **************************************************************************
 *            END OF BLOCK 18. Manage Task List Popup
 *            Block 18 - Manage Task List Popup - script.js
 **************************************************************************
 */





/*
 **************************************************************************
 *            BLOCK 19. Manage Modals and Undo
 **************************************************************************
 */
function showModal(title, content, onSave) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${title}</h3>
            <div class="modal-body">${content}</div>
            <div class="modal-buttons">
                <button class="cancel-btn">Cancel</button>
                <button class="save-btn">Save</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.save-btn').addEventListener('click', () => {
        onSave();
        modal.remove();
    });
}

function showUndoButton() {
    const undoButton = document.querySelector(`[data-id="${DOM_IDS.UNDO_BUTTON}"]`);
    if (undoButton) {
        undoButton.classList.remove('hidden');
        setTimeout(() => {
            undoButton.classList.add('hidden');
        }, CONFIG.UNDO_BUTTON_TIMEOUT);
    }
}

function undoLastAction() {
    const lastAction = undoStack.pop();
    if (!lastAction) return;

    if (lastAction.action === 'deleteProject') {
        projects.splice(lastAction.data.index, 0, lastAction.data.project);
    } else if (lastAction.action === 'deleteTask') {
        const project = projects.find(p => p.id === lastAction.data.projectId);
        if (lastAction.data.parentIdx === null) {
            project.tasks.splice(lastAction.data.taskIdx, 0, lastAction.data.task);
        } else {
            project.tasks[lastAction.data.parentIdx].subTasks.splice(lastAction.data.taskIdx, 0, lastAction.data.task);
            const parentTask = project.tasks[lastAction.data.parentIdx];
            const latestSubTaskDue = parentTask.subTasks.reduce((latest, subTask) => {
                const subDue = new Date(subTask.due);
                return subDue > latest ? subDue : latest;
            }, new Date(parentTask.subTasks[0].due));
            if (latestSubTaskDue > new Date(parentTask.due)) {
                parentTask.due = latestSubTaskDue.toISOString().split('T')[0];
                updateTaskDueDateWithSubTasks(parentTask, parentTask.due, parentTask.startDate);
            }
        }
        getProjectCompletion(project);
    } else if (lastAction.action === 'archiveProject') {
        const project = projects.find(p => p.id === lastAction.data.projectId);
        if (project) {
            project.isArchived = lastAction.data.wasArchived;
        }
    } else if (lastAction.action === 'restoreProject') {
        const project = projects.find(p => p.id === lastAction.data.projectId);
        if (project) {
            project.isArchived = lastAction.data.wasArchived;
        }
    }

    saveData();
    const undoButton = document.querySelector(`[data-id="${DOM_IDS.UNDO_BUTTON}"]`);
    if (undoButton && undoStack.length === 0) {
        undoButton.classList.add('hidden');
    }
}

function showDatePickerPopup(event, projectId, taskIdx, subIdx, field) {
    console.log(`showDatePickerPopup called with projectId: ${projectId}, taskIdx: ${taskIdx}, subIdx: ${subIdx}, field: ${field}`);
    event.stopPropagation(); // Prevent the click from immediately triggering outside-click listeners
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        console.error(`Project with ID ${projectId} not found`);
        return false;
    }
    const task = subIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[subIdx];
    if (!task) {
        console.error(`Task not found at taskIdx: ${taskIdx}, subIdx: ${subIdx}`);
        return false;
    }
    const currentDate = field === 'startDate' ? task.startDate : task.due;
    const popup = document.createElement('div');
    popup.className = 'date-picker-popup';
    // Use clientX/clientY with scroll offset for accurate positioning
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    popup.style.left = `${event.clientX + scrollX}px`;
    popup.style.top = `${event.clientY + scrollY}px`;
    popup.style.display = 'block'; // Ensure visibility
    popup.style.zIndex = '1000'; // Ensure it appears above other elements
    console.log(`Popup positioned at left: ${popup.style.left}, top: ${popup.style.top}`);

    let pickerMonth = new Date(currentDate);
    if (isNaN(pickerMonth.getTime())) {
        console.warn(`Invalid currentDate: ${currentDate}, defaulting to today`);
        pickerMonth = new Date();
    }

    function renderPicker() {
        console.log('Rendering date picker popup');
        try {
            const monthStart = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1);
            const monthEnd = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 0);
            const firstDay = monthStart.getDay();
            const daysInMonth = monthEnd.getDate();
            console.log(`Month: ${pickerMonth.toLocaleDateString()}, firstDay: ${firstDay}, daysInMonth: ${daysInMonth}`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            popup.innerHTML = `
                <div class="calendar-nav">
                    <button class="prev-month">Previous</button>
                    <div class="month-year-wrapper">
                        <span id="date-picker-month-year">${pickerMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <button class="next-month">Next</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
                        </tr>
                    </thead>
                    <tbody id="date-picker-body"></tbody>
                </table>
            `;
            console.log('Popup HTML set');

            const tbody = popup.querySelector('#date-picker-body');
            if (!tbody) {
                console.error('Failed to find #date-picker-body in popup');
                throw new Error('Date picker body not found');
            }

            let currentDay = 1;
            for (let i = 0; i < 6; i++) {
                const tr = document.createElement('tr');
                for (let j = 0; j < 7; j++) {
                    const td = document.createElement('td');
                    const dayIndex = i * 7 + j;
                    if (dayIndex < firstDay || currentDay > daysInMonth) {
                        tr.appendChild(td);
                        continue;
                    }
                    const date = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), currentDay);
                    td.textContent = currentDay;
                    if (date.getTime() === today.getTime()) {
                        td.style.backgroundColor = 'rgba(0, 204, 0, 0.3)';
                    }
                    td.onclick = (e) => {
                        e.stopPropagation(); // Prevent date selection from closing the popup
                        console.log(`Date selected: ${date.toISOString().split('T')[0]}`);
                        const newDate = date.toISOString().split('T')[0];
                        if (field === 'startDate') {
                            task.startDate = newDate;
                            if (new Date(newDate) > new Date(task.due)) {
                                task.due = newDate;
                            }
                        } else {
                            task.due = newDate;
                            if (new Date(newDate) < new Date(task.startDate)) {
                                task.startDate = newDate;
                            }
                        }
                        if (subIdx !== null) {
                            const parentTask = project.tasks[taskIdx];
                            const latestSubDue = parentTask.subTasks.reduce((max, st) => {
                                const d = new Date(st.due);
                                return d > max ? d : max;
                            }, new Date(parentTask.due));
                            if (latestSubDue > new Date(parentTask.due)) {
                                parentTask.due = latestSubDue.toISOString().split('T')[0];
                            }
                        }
                        saveData();
                        popup.remove();
                    };
                    tr.appendChild(td);
                    currentDay++;
                }
                tbody.appendChild(tr);
                if (currentDay > daysInMonth) break;
            }
            console.log('Date picker table rendered');

            // Add event listeners within scope
            const prevButton = popup.querySelector('.prev-month');
            const nextButton = popup.querySelector('.next-month');
            if (!prevButton || !nextButton) {
                console.error('Navigation buttons not found in date picker popup');
                throw new Error('Navigation buttons missing');
            }
            prevButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent navigation clicks from closing the popup
                pickerMonth.setMonth(pickerMonth.getMonth() - 1);
                renderPicker();
            });
            nextButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent navigation clicks from closing the popup
                pickerMonth.setMonth(pickerMonth.getMonth() + 1);
                renderPicker();
            });
            console.log('Navigation event listeners added');
        } catch (error) {
            console.error('Error rendering date picker:', error);
            throw error; // Re-throw to trigger the alert in Block 5
        }
    }

    try {
        document.body.appendChild(popup);
        console.log('Popup appended to document body');
        renderPicker();

        // Delay the outside-click listener to avoid immediate closure
        setTimeout(() => {
            document.addEventListener('click', function closePopup(e) {
                if (!popup.contains(e.target)) {
                    console.log('Click outside detected, closing popup');
                    popup.remove();
                    document.removeEventListener('click', closePopup);
                }
            }, { once: true });
        }, 0);

        return true; // Indicate success
    } catch (error) {
        console.error('Error in showDatePickerPopup:', error);
        return false; // Trigger the alert in Block 5
    }
}
/*
 **************************************************************************
 *            END OF BLOCK 19. Manage Modals and Undo
 *            Block 19 - Manage Modals and Undo - script.js
 **************************************************************************
 */



/*
 **************************************************************************
 *            BLOCK 20. Manage Notifications
 **************************************************************************
 */
function requestNotificationPermission() {
    if (window.location.protocol === 'file:') {
        console.log('Notifications not supported in file protocol');
        return;
    }
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                const notificationButton = document.querySelector(`[data-id="${DOM_IDS.NOTIFICATION_PERMISSION}"]`);
                if (notificationButton) {
                    notificationButton.classList.add('hidden');
                }
                checkNotifications();
                console.log('Notification permission granted');
            } else {
                console.log('Notification permission denied');
            }
        }).catch(error => {
            console.error('Error requesting notification permission:', error);
        });
    }
}

function checkNotifications() {
    if (Notification.permission !== "granted" || window.location.protocol === 'file:') {
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    projects.forEach(project => {
        project.tasks.forEach(task => {
            const dueDate = new Date(task.due);
            dueDate.setHours(0, 0, 0, 0);
            if (task.completion < 100 && (dueDate.getTime() === today.getTime() || dueDate.getTime() === tomorrow.getTime())) {
                new Notification(`Task Due: ${task.name}`, {
                    body: `Project: ${project.name}\nDue: ${task.due}`,
                    icon: 'https://via.placeholder.com/16' // Optional: Replace with a real icon URL if available
                });
            }
            task.subTasks.forEach(subTask => {
                const subDueDate = new Date(subTask.due);
                subDueDate.setHours(0, 0, 0, 0);
                if (subTask.completion < 100 && (subDueDate.getTime() === today.getTime() || subDueDate.getTime() === tomorrow.getTime())) {
                    new Notification(`Sub-Task Due: ${subTask.name}`, {
                        body: `Project: ${project.name}\nParent Task: ${task.name}\nDue: ${subTask.due}`,
                        icon: 'https://via.placeholder.com/16' // Optional: Replace with a real icon URL if available
                    });
                }
            });
        });
    });
}
/*
 **************************************************************************
 *            END OF BLOCK 20. Manage Notifications
 *            Block 20 - Manage Notifications - script.js
 **************************************************************************
 */



//**************************************************************************
//            BLOCK 21. Print Gantt Schedule
//**************************************************************************
function printGanttSchedule(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const printContainer = document.createElement('div');
    printContainer.className = 'print-schedule';
    printContainer.style.display = 'none';

    printContainer.innerHTML = `<h1>Project Schedule: ${project.name}</h1>`;

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Task</th>
                <th>Start Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Completion</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');
    const currentDate = new Date();

    project.tasks.forEach(task => {
        const isOverdue = isTaskOverdue(task); // Updated to use isTaskOverdue
        const status = isOverdue ? 'Past Due' : 'On Track'; // Simplified using isTaskOverdue
        const statusClass = isOverdue ? 'status-past-due' : 'status-on-track';

        const taskRow = document.createElement('tr');
        taskRow.innerHTML = `
            <td>${task.name}</td>
            <td>${task.startDate}</td>
            <td>${task.due}</td>
            <td class="${statusClass}">${status}</td>
            <td>${task.completion}%</td>
        `;
        tbody.appendChild(taskRow);

        if (task.notes) {
            const notesRow = document.createElement('tr');
            notesRow.innerHTML = `
                <td colspan="5" class="notes">Notes: ${task.notes}</td>
            `;
            tbody.appendChild(notesRow);
        }

        task.subTasks.forEach(subTask => {
            const subIsOverdue = isTaskOverdue(subTask); // Updated to use isTaskOverdue
            const subStatus = subIsOverdue ? 'Past Due' : 'On Track'; // Simplified using isTaskOverdue
            const subStatusClass = subIsOverdue ? 'status-past-due' : 'status-on-track';

            const subTaskRow = document.createElement('tr');
            subTaskRow.innerHTML = `
                <td class="sub-task">${subTask.name}</td>
                <td>${subTask.startDate}</td>
                <td>${subTask.due}</td>
                <td class="${subStatusClass}">${subStatus}</td>
                <td>${subTask.completion}%</td>
            `;
            tbody.appendChild(subTaskRow);

            if (subTask.notes) {
                const subNotesRow = document.createElement('tr');
                subNotesRow.innerHTML = `
                    <td colspan="5" class="notes">Notes: ${subTask.notes}</td>
                `;
                tbody.appendChild(subNotesRow);
            }
        });
    });

    printContainer.appendChild(table);
    document.body.appendChild(printContainer);

    window.print();

    printContainer.remove();
}
//**************************************************************************
//            END OF BLOCK 21. Print Gantt Schedule
//**************************************************************************





/*
 **************************************************************************
 *            BLOCK 22. Manage Calendar Popup
 **************************************************************************
 */
function toggleCalendarPopup() {
    const calendarPopup = document.querySelector(`[data-id="${DOM_IDS.CALENDAR_POPUP}"]`);
    if (!calendarPopup) {
        console.error('Calendar popup element not found');
        return;
    }
    calendarPopupVisible = !calendarPopupVisible;
    calendarPopup.classList.toggle('hidden', !calendarPopupVisible);
    if (calendarPopupVisible) {
        renderPopupCalendar();
    }
}

function renderPopupCalendar() {
    const calendarPopup = document.querySelector(`[data-id="${DOM_IDS.CALENDAR_POPUP}"]`);
    if (!calendarPopup) {
        console.error('Calendar popup element not found');
        return;
    }

    const monthStart = new Date(popupMonth.getFullYear(), popupMonth.getMonth(), 1);
    const monthEnd = new Date(popupMonth.getFullYear(), popupMonth.getMonth() + 1, 0);

    calendarPopup.innerHTML = `
        <div class="calendar-nav">
            <button class="button" onclick="prevPopupMonth()">Previous</button>
            <div class="month-year-wrapper">
                <span data-id="${DOM_IDS.POPUP_MONTH_YEAR}">${popupMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
            <button class="button" onclick="nextPopupMonth()">Next</button>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
                </tr>
            </thead>
            <tbody id="popup-calendar-body"></tbody>
        </table>
    `;

    const tbody = calendarPopup.querySelector('#popup-calendar-body');
    if (!tbody) {
        console.error('Popup calendar body not found');
        return;
    }
    const firstDay = monthStart.getDay();
    const daysInMonth = monthEnd.getDate();
    let currentDay = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 6; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < 7; j++) {
            const td = document.createElement('td');
            const dayIndex = i * 7 + j;
            if (dayIndex < firstDay || currentDay > daysInMonth) {
                tr.appendChild(td);
                continue;
            }

            const currentDate = new Date(popupMonth.getFullYear(), popupMonth.getMonth(), currentDay);
            td.textContent = currentDay;
            if (currentDate.getTime() === today.getTime()) {
                td.style.backgroundColor = 'rgba(0, 204, 0, 0.3)';
            }

            const tasksOnDay = [];
            projects.forEach(project => {
                project.tasks.forEach(task => {
                    const dueDate = new Date(task.due);
                    if (dueDate.getFullYear() === currentDate.getFullYear() &&
                        dueDate.getMonth() === currentDate.getMonth() &&
                        dueDate.getDate() === currentDate.getDate()) {
                        tasksOnDay.push(`${project.name}: ${task.name}`);
                    }
                    task.subTasks.forEach(subTask => {
                        const subDueDate = new Date(subTask.due);
                        if (subDueDate.getFullYear() === currentDate.getFullYear() &&
                            subDueDate.getMonth() === currentDate.getMonth() &&
                            subDueDate.getDate() === currentDate.getDate()) {
                            tasksOnDay.push(`${project.name}: ${subTask.name}`);
                        }
                    });
                });
            });

            if (tasksOnDay.length > 0) {
                const tooltip = document.createElement('div');
                tooltip.className = 'task-tooltip';
                tooltip.innerHTML = tasksOnDay.join('<br>');
                td.appendChild(tooltip);
            }

            tr.appendChild(td);
            currentDay++;
        }
        tbody.appendChild(tr);
        if (currentDay > daysInMonth) break;
    }

    makePopupDraggable();
}

function prevPopupMonth() {
    popupMonth.setMonth(popupMonth.getMonth() - 1);
    renderPopupCalendar();
}

function nextPopupMonth() {
    popupMonth.setMonth(popupMonth.getMonth() + 1);
    renderPopupCalendar();
}

function makePopupDraggable() {
    const calendarPopup = document.querySelector(`[data-id="${DOM_IDS.CALENDAR_POPUP}"]`);
    const calendarNav = calendarPopup.querySelector('.calendar-nav');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    calendarNav.addEventListener('mousedown', startDragging);

    function startDragging(e) {
        if (e.target.tagName === 'BUTTON') return;

        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        isDragging = true;

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDragging);
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            const popupRect = calendarPopup.getBoundingClientRect();
            const maxX = window.innerWidth - popupRect.width;
            const maxY = window.innerHeight - popupRect.height;

            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));

            calendarPopup.style.left = `${currentX}px`;
            calendarPopup.style.top = `${currentY}px`;
            calendarPopup.style.right = 'auto';
        }
    }

    function stopDragging() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDragging);
    }

    const rect = calendarPopup.getBoundingClientRect();
    currentX = rect.left;
    currentY = rect.top;
}
/*
 **************************************************************************
 *            END OF BLOCK 22. Manage Calendar Popup
 *            Block 22 - Manage Calendar Popup - script.js
 **************************************************************************
 */




//**************************************************************************
//            BLOCK 23. Miscellaneous Utilities
//**************************************************************************
function toggleAllTasks(projectId) {
    const project = projects.find(p => p.id === projectId);
    const allExpanded = project.tasks.every(task => task.expanded);
    project.expanded = !allExpanded;
    project.tasks.forEach(task => {
        task.expanded = !allExpanded;
    });
    updateUI();
}

function checkForOverlaps(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return false;

    const tasksByPIC = {};

    function addTaskToPIC(task, parentTask = null) {
        if (task.pic) {
            if (!tasksByPIC[task.pic]) tasksByPIC[task.pic] = [];
            tasksByPIC[task.pic].push({ start: new Date(task.startDate), end: new Date(task.due), task });
        }
        task.subTasks.forEach(subTask => addTaskToPIC(subTask, task));
    }

    project.tasks.forEach(task => addTaskToPIC(task));

    for (const pic in tasksByPIC) {
        const tasks = tasksByPIC[pic];
        for (let i = 0; i < tasks.length - 1; i++) {
            for (let j = i + 1; j < tasks.length; j++) {
                if (doTasksOverlap(tasks[i], tasks[j])) {
                    return true;
                }
            }
        }
    }
    return false;
}

function doTasksOverlap(taskA, taskB) {
    const startA = taskA.start;
    const endA = taskA.end;
    const startB = taskB.start;
    const endB = taskB.end;
    return startA < endB && startB < endA;
}

function validateTaskDates(startDate, dueDate) {
    const startDateObj = new Date(startDate);
    const dueDateObj = new Date(dueDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(dueDateObj.getTime())) {
        return { valid: false, message: 'Invalid date format. Please use YYYY-MM-DD.' };
    }
    
    if (startDateObj > dueDateObj) {
        return { valid: false, message: 'Start date must be before or equal to due date.' };
    }
    
    return { valid: true };
}

function isTaskOverdue(task, currentDate = new Date()) {
    const dueDate = new Date(task.due);
    const isTaskPastDue = task.completion < 100 && dueDate < currentDate;
    const hasOverdueSubTask = task.subTasks.some(subTask => isTaskOverdue(subTask, currentDate));
    return isTaskPastDue || hasOverdueSubTask;
}
//**************************************************************************
//            END OF BLOCK 23. Miscellaneous Utilities
//**************************************************************************



//**************************************************************************
//            BLOCK 24. Render Import Page
//**************************************************************************
function renderImportPage() {
    const tbody = document.querySelector(`[data-id="import-project-list"]`);
    if (!tbody) {
        console.error('Import project list tbody not found');
        return;
    }
    console.log('Rendering import page with projects:', importedProjects); // Debug: Confirm data

    tbody.innerHTML = '';

    // Sort projects: incomplete first, completed at bottom
    const incompleteProjects = importedProjects.filter(p => p.completion < 100);
    const completedProjects = importedProjects.filter(p => p.completion === 100);
    const sortedProjects = [...incompleteProjects, ...completedProjects];

    sortedProjects.forEach(project => {
        const tr = document.createElement('tr');
        const isCompleted = project.completion === 100;
        tr.innerHTML = `
            <td>
                <input type="checkbox" data-project-id="${project.id}" ${isCompleted ? '' : 'checked'}>
            </td>
            <td>${project.name}</td>
            <td>${project.completion}%</td>
            <td>${project.pic || 'None'}</td>
        `;
        tbody.appendChild(tr);
    });
}
//**************************************************************************
//            END OF BLOCK 24. Render Import Page
//**************************************************************************



//**************************************************************************
//            BLOCK 25. UI Utilities
//**************************************************************************
function updateUI() {
    renderProjects();
    renderCalendar();
    if (selectedProjectId) {
        renderGanttChart(selectedProjectId);
    }
    checkNotifications();
    updateTabs();
}
//**************************************************************************
//            END OF BLOCK 25. UI Utilities
//**************************************************************************



/*
 **************************************************************************
 *            BLOCK 26. Manage Style Settings
 **************************************************************************
 */
function updateStyle(property, value) {
    document.documentElement.style.setProperty(property, value);
    // Update RGB equivalents for properties that need them
    const rgbMap = {
        '--background-color': '--background-color-rgb',
        '--button-color': '--button-color-rgb',
        '--task-bar-color': '--task-bar-color-rgb',
        '--sidebar-bg-color': '--sidebar-bg-color-rgb',
        '--tab-button-bg': '--tab-button-bg-rgb',
        '--tab-button-active-bg': '--tab-button-active-bg-rgb',
        '--tab-button-hover-bg': '--tab-button-hover-bg-rgb',
        '--table-header-bg': '--table-header-bg-rgb',
        '--tooltip-bg': '--tooltip-bg-rgb',
        '--modal-header-bg': '--modal-header-bg-rgb',
        '--overdue-highlight': '--overdue-highlight-rgb',
        '--calendar-today-bg': '--calendar-today-bg-rgb',
        '--today-line-color': '--today-line-color-rgb',
        '--calendar-task-popup-bg': '--calendar-task-popup-bg-rgb',
        '--notes-bg': '--notes-bg-rgb',
        '--date-picker-bg': '--date-picker-bg-rgb'
    };
    if (rgbMap[property]) {
        document.documentElement.style.setProperty(rgbMap[property], hexToRgb(value));
    }
    saveData(); // Save the updated style settings to localStorage
    updateUI(); // Force full UI refresh after every style change
}

function resetStyles() {
    const defaultStyles = {
        '--background-color': '#000000',
        '--button-color': '#004EA1',
        '--task-bar-color': '#004EA1',
        '--text-color': '#f0f0f0',
        '--transparency': '0.7',
        '--background-color-rgb': '0, 0, 0',
        '--button-color-rgb': '0, 78, 161',
        '--task-bar-color-rgb': '0, 78, 161',
        '--sidebar-bg-color': '#000000',
        '--sidebar-bg-color-rgb': '0, 0, 0',
        '--sidebar-transparency': '0.9',
        '--tab-button-bg': '#2e3b3b',
        '--tab-button-bg-rgb': '46, 59, 59',
        '--tab-button-transparency': '0.9',
        '--tab-button-active-bg': '#004EA1',
        '--tab-button-active-bg-rgb': '0, 78, 161',
        '--tab-button-active-transparency': '1.0',
        '--tab-button-hover-bg': '#003c7a',
        '--tab-button-hover-bg-rgb': '0, 60, 122',
        '--tab-button-hover-transparency': '0.9',
        '--table-header-bg': '#004EA1',
        '--table-header-bg-rgb': '0, 78, 161',
        '--table-header-transparency': '0.5',
        '--tooltip-bg': '#000000',
        '--tooltip-bg-rgb': '0, 0, 0',
        '--tooltip-transparency': '0.8',
        '--tooltip-text-color': '#f0f0f0',
        '--modal-header-bg': '#004EA1',
        '--modal-header-bg-rgb': '0, 78, 161',
        '--modal-header-transparency': '1.0',
        '--overdue-highlight': '#ff0000',
        '--overdue-highlight-rgb': '255, 0, 0',
        '--overdue-transparency': '0.3',
        '--calendar-today-bg': '#00cc00',
        '--calendar-today-bg-rgb': '0, 204, 0',
        '--calendar-today-transparency': '0.3',
        '--today-line-color': '#ff0000',
        '--today-line-color-rgb': '255, 0, 0',
        '--today-line-transparency': '1.0',
        '--calendar-task-popup-bg': '#000000',
        '--calendar-task-popup-bg-rgb': '0, 0, 0',
        '--calendar-task-popup-transparency': '0.9',
        '--notes-bg': '#000000',
        '--notes-bg-rgb': '0, 0, 0',
        '--notes-transparency': '0.8',
        '--date-picker-bg': '#000000',
        '--date-picker-bg-rgb': '0, 0, 0',
        '--date-picker-transparency': '0.8'
    };
    Object.entries(defaultStyles).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
    });
    saveData(); // Save the reset styles to localStorage
    updateUI(); // Force full UI refresh after reset
}

function loadStyleSettings() {
    const storedStyles = localStorage.getItem('styleSettings');
    if (storedStyles) {
        const styles = JSON.parse(storedStyles);
        Object.entries(styles).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
    } else {
        resetStyles(); // Apply default "Dark" theme styles if none are stored
    }
}

function switchTheme(themeName) {
    const themes = {
        'Dark': {
            '--background-color': '#000000',
            '--button-color': '#004EA1',
            '--task-bar-color': '#004EA1',
            '--text-color': '#f0f0f0',
            '--transparency': '0.7',
            '--background-color-rgb': '0, 0, 0',
            '--button-color-rgb': '0, 78, 161',
            '--task-bar-color-rgb': '0, 78, 161',
            '--sidebar-bg-color': '#000000',
            '--sidebar-bg-color-rgb': '0, 0, 0',
            '--sidebar-transparency': '0.9',
            '--tab-button-bg': '#2e3b3b',
            '--tab-button-bg-rgb': '46, 59, 59',
            '--tab-button-transparency': '0.9',
            '--tab-button-active-bg': '#004EA1',
            '--tab-button-active-bg-rgb': '0, 78, 161',
            '--tab-button-active-transparency': '1.0',
            '--tab-button-hover-bg': '#003c7a',
            '--tab-button-hover-bg-rgb': '0, 60, 122',
            '--tab-button-hover-transparency': '0.9',
            '--table-header-bg': '#004EA1',
            '--table-header-bg-rgb': '0, 78, 161',
            '--table-header-transparency': '0.5',
            '--tooltip-bg': '#000000',
            '--tooltip-bg-rgb': '0, 0, 0',
            '--tooltip-transparency': '0.8',
            '--tooltip-text-color': '#f0f0f0',
            '--modal-header-bg': '#004EA1',
            '--modal-header-bg-rgb': '0, 78, 161',
            '--modal-header-transparency': '1.0',
            '--overdue-highlight': '#ff0000',
            '--overdue-highlight-rgb': '255, 0, 0',
            '--overdue-transparency': '0.3',
            '--calendar-today-bg': '#00cc00',
            '--calendar-today-bg-rgb': '0, 204, 0',
            '--calendar-today-transparency': '0.3',
            '--today-line-color': '#ff0000',
            '--today-line-color-rgb': '255, 0, 0',
            '--today-line-transparency': '1.0',
            '--calendar-task-popup-bg': '#000000',
            '--calendar-task-popup-bg-rgb': '0, 0, 0',
            '--calendar-task-popup-transparency': '0.9',
            '--notes-bg': '#000000',
            '--notes-bg-rgb': '0, 0, 0',
            '--notes-transparency': '0.8',
            '--date-picker-bg': '#000000',
            '--date-picker-bg-rgb': '0, 0, 0',
            '--date-picker-transparency': '0.8'
        },
        'Light': {
            '--background-color': '#ffffff',
            '--button-color': '#007BFF',
            '--task-bar-color': '#007BFF',
            '--text-color': '#333333',
            '--transparency': '1.0',
            '--background-color-rgb': '255, 255, 255',
            '--button-color-rgb': '0, 123, 255',
            '--task-bar-color-rgb': '0, 123, 255',
            '--sidebar-bg-color': '#f0f0f0',
            '--sidebar-bg-color-rgb': '240, 240, 240',
            '--sidebar-transparency': '1.0',
            '--tab-button-bg': '#e0e0e0',
            '--tab-button-bg-rgb': '224, 224, 224',
            '--tab-button-transparency': '1.0',
            '--tab-button-active-bg': '#007BFF',
            '--tab-button-active-bg-rgb': '0, 123, 255',
            '--tab-button-active-transparency': '1.0',
            '--tab-button-hover-bg': '#cce5ff',
            '--tab-button-hover-bg-rgb': '204, 229, 255',
            '--tab-button-hover-transparency': '1.0',
            '--table-header-bg': '#007BFF',
            '--table-header-bg-rgb': '0, 123, 255',
            '--table-header-transparency': '0.8',
            '--tooltip-bg': '#ffffff',
            '--tooltip-bg-rgb': '255, 255, 255',
            '--tooltip-transparency': '0.9',
            '--tooltip-text-color': '#333333',
            '--modal-header-bg': '#007BFF',
            '--modal-header-bg-rgb': '0, 123, 255',
            '--modal-header-transparency': '1.0',
            '--overdue-highlight': '#ff3333',
            '--overdue-highlight-rgb': '255, 51, 51',
            '--overdue-transparency': '0.4',
            '--calendar-today-bg': '#ccffcc',
            '--calendar-today-bg-rgb': '204, 255, 204',
            '--calendar-today-transparency': '0.5',
            '--today-line-color': '#ff3333',
            '--today-line-color-rgb': '255, 51, 51',
            '--today-line-transparency': '1.0',
            '--calendar-task-popup-bg': '#ffffff',
            '--calendar-task-popup-bg-rgb': '255, 255, 255',
            '--calendar-task-popup-transparency': '0.9',
            '--notes-bg': '#ffffff',
            '--notes-bg-rgb': '255, 255, 255',
            '--notes-transparency': '0.9',
            '--date-picker-bg': '#ffffff',
            '--date-picker-bg-rgb': '255, 255, 255',
            '--date-picker-transparency': '0.9'
        }
    };
    const selectedTheme = themes[themeName];
    if (selectedTheme) {
        Object.entries(selectedTheme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
        saveData();
        updateUI(); // Force full UI refresh after theme switch
        renderSettings(); // Ensure settings inputs reflect new theme values
    }
}

function saveCustomTheme() {
    const themeNameInput = document.getElementById('custom-theme-name');
    const themeName = themeNameInput.value.trim();
    if (!themeName) {
        alert('Please enter a theme name.');
        return;
    }
    if (['Dark', 'Light'].includes(themeName)) {
        alert('Cannot overwrite predefined themes "Dark" or "Light".');
        return;
    }
    const currentStyles = {
        '--background-color': getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim(),
        '--button-color': getComputedStyle(document.documentElement).getPropertyValue('--button-color').trim(),
        '--task-bar-color': getComputedStyle(document.documentElement).getPropertyValue('--task-bar-color').trim(),
        '--text-color': getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim(),
        '--transparency': getComputedStyle(document.documentElement).getPropertyValue('--transparency').trim(),
        '--background-color-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim()),
        '--button-color-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--button-color').trim()),
        '--task-bar-color-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--task-bar-color').trim()),
        '--sidebar-bg-color': getComputedStyle(document.documentElement).getPropertyValue('--sidebar-bg-color').trim(),
        '--sidebar-bg-color-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-bg-color').trim()),
        '--sidebar-transparency': getComputedStyle(document.documentElement).getPropertyValue('--sidebar-transparency').trim(),
        '--tab-button-bg': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-bg').trim(),
        '--tab-button-bg-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--tab-button-bg').trim()),
        '--tab-button-transparency': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-transparency').trim(),
        '--tab-button-active-bg': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-active-bg').trim(),
        '--tab-button-active-bg-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--tab-button-active-bg').trim()),
        '--tab-button-active-transparency': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-active-transparency').trim(),
        '--tab-button-hover-bg': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-hover-bg').trim(),
        '--tab-button-hover-bg-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--tab-button-hover-bg').trim()),
        '--tab-button-hover-transparency': getComputedStyle(document.documentElement).getPropertyValue('--tab-button-hover-transparency').trim(),
        '--table-header-bg': getComputedStyle(document.documentElement).getPropertyValue('--table-header-bg').trim(),
        '--table-header-bg-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--table-header-bg').trim()),
        '--table-header-transparency': getComputedStyle(document.documentElement).getPropertyValue('--table-header-transparency').trim(),
        '--tooltip-bg': getComputedStyle(document.documentElement).getPropertyValue('--tooltip-bg').trim(),
        '--tooltip-bg-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--tooltip-bg').trim()),
        '--tooltip-transparency': getComputedStyle(document.documentElement).getPropertyValue('--tooltip-transparency').trim(),
        '--tooltip-text-color': getComputedStyle(document.documentElement).getPropertyValue('--tooltip-text-color').trim(),
        '--modal-header-bg': getComputedStyle(document.documentElement).getPropertyValue('--modal-header-bg').trim(),
        '--modal-header-bg-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--modal-header-bg').trim()),
        '--modal-header-transparency': getComputedStyle(document.documentElement).getPropertyValue('--modal-header-transparency').trim(),
        '--overdue-highlight': getComputedStyle(document.documentElement).getPropertyValue('--overdue-highlight').trim(),
        '--overdue-highlight-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--overdue-highlight').trim()),
        '--overdue-transparency': getComputedStyle(document.documentElement).getPropertyValue('--overdue-transparency').trim(),
        '--calendar-today-bg': getComputedStyle(document.documentElement).getPropertyValue('--calendar-today-bg').trim(),
        '--calendar-today-bg-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--calendar-today-bg').trim()),
        '--calendar-today-transparency': getComputedStyle(document.documentElement).getPropertyValue('--calendar-today-transparency').trim(),
        '--today-line-color': getComputedStyle(document.documentElement).getPropertyValue('--today-line-color').trim(),
        '--today-line-color-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--today-line-color').trim()),
        '--today-line-transparency': getComputedStyle(document.documentElement).getPropertyValue('--today-line-transparency').trim(),
        '--calendar-task-popup-bg': getComputedStyle(document.documentElement).getPropertyValue('--calendar-task-popup-bg').trim(),
        '--calendar-task-popup-bg-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--calendar-task-popup-bg').trim()),
        '--calendar-task-popup-transparency': getComputedStyle(document.documentElement).getPropertyValue('--calendar-task-popup-transparency').trim(),
        '--notes-bg': getComputedStyle(document.documentElement).getPropertyValue('--notes-bg').trim(),
        '--notes-bg-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--notes-bg').trim()),
        '--notes-transparency': getComputedStyle(document.documentElement).getPropertyValue('--notes-transparency').trim(),
        '--date-picker-bg': getComputedStyle(document.documentElement).getPropertyValue('--date-picker-bg').trim(),
        '--date-picker-bg-rgb': hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--date-picker-bg').trim()),
        '--date-picker-transparency': getComputedStyle(document.documentElement).getPropertyValue('--date-picker-transparency').trim()
    };
    customThemes[themeName] = currentStyles;
    saveData();
    updateUI(); // Force full UI refresh after saving custom theme
    renderSettings(); // Refresh settings inputs
    themeNameInput.value = ''; // Clear input after saving
}

function loadCustomTheme(themeName) {
    if (!themeName) return; // Ignore empty selection
    const customTheme = customThemes[themeName];
    if (customTheme) {
        Object.entries(customTheme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
        saveData();
        updateUI(); // Force full UI refresh after loading custom theme
        renderSettings(); // Refresh settings inputs
    }
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}

function renderSettings() {
    const tbody = document.querySelector(`[data-id="${DOM_IDS.PIC_LIST}"]`);
    if (!tbody) return;
    tbody.innerHTML = '';
    picList.forEach((pic, index) => {
        const tr = document.createElement('tr');
        tr.className = 'pic-row';
        tr.innerHTML = `
            <td>${pic}</td>
            <td><button onclick="deletePIC(${index})">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });

    // Update style settings inputs with current values
    const bgColorInput = document.getElementById('bg-color');
    const buttonColorInput = document.getElementById('button-color');
    const taskBarColorInput = document.getElementById('task-bar-color');
    const textColorInput = document.getElementById('text-color');
    const transparencyInput = document.getElementById('transparency');
    const sidebarBgColorInput = document.getElementById('sidebar-bg-color');
    const sidebarTransparencyInput = document.getElementById('sidebar-transparency');
    const tabButtonBgInput = document.getElementById('tab-button-bg');
    const tabButtonTransparencyInput = document.getElementById('tab-button-transparency');
    const tabButtonActiveBgInput = document.getElementById('tab-button-active-bg');
    const tabButtonActiveTransparencyInput = document.getElementById('tab-button-active-transparency');
    const tabButtonHoverBgInput = document.getElementById('tab-button-hover-bg');
    const tabButtonHoverTransparencyInput = document.getElementById('tab-button-hover-transparency');
    const tableHeaderBgInput = document.getElementById('table-header-bg');
    const tableHeaderTransparencyInput = document.getElementById('table-header-transparency');
    const tooltipBgInput = document.getElementById('tooltip-bg');
    const tooltipTransparencyInput = document.getElementById('tooltip-transparency');
    const tooltipTextColorInput = document.getElementById('tooltip-text-color');
    const modalHeaderBgInput = document.getElementById('modal-header-bg');
    const modalHeaderTransparencyInput = document.getElementById('modal-header-transparency');
    const overdueHighlightInput = document.getElementById('overdue-highlight');
    const overdueTransparencyInput = document.getElementById('overdue-transparency');
    const calendarTodayBgInput = document.getElementById('calendar-today-bg');
    const calendarTodayTransparencyInput = document.getElementById('calendar-today-transparency');
    const todayLineColorInput = document.getElementById('today-line-color');
    const todayLineTransparencyInput = document.getElementById('today-line-transparency');
    const calendarTaskPopupBgInput = document.getElementById('calendar-task-popup-bg');
    const calendarTaskPopupTransparencyInput = document.getElementById('calendar-task-popup-transparency');
    const notesBgInput = document.getElementById('notes-bg');
    const notesTransparencyInput = document.getElementById('notes-transparency');
    const datePickerBgInput = document.getElementById('date-picker-bg');
    const datePickerTransparencyInput = document.getElementById('date-picker-transparency');
    const themeSelect = document.getElementById('theme-select');
    const customThemeSelect = document.getElementById('custom-theme-select');

    if (bgColorInput) bgColorInput.value = getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim();
    if (buttonColorInput) buttonColorInput.value = getComputedStyle(document.documentElement).getPropertyValue('--button-color').trim();
    if (taskBarColorInput) taskBarColorInput.value = getComputedStyle(document.documentElement).getPropertyValue('--task-bar-color').trim();
    if (textColorInput) textColorInput.value = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    if (transparencyInput) transparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--transparency').trim();
    if (sidebarBgColorInput) sidebarBgColorInput.value = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-bg-color').trim();
    if (sidebarTransparencyInput) sidebarTransparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-transparency').trim();
    if (tabButtonBgInput) tabButtonBgInput.value = getComputedStyle(document.documentElement).getPropertyValue('--tab-button-bg').trim();
    if (tabButtonTransparencyInput) tabButtonTransparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--tab-button-transparency').trim();
    if (tabButtonActiveBgInput) tabButtonActiveBgInput.value = getComputedStyle(document.documentElement).getPropertyValue('--tab-button-active-bg').trim();
    if (tabButtonActiveTransparencyInput) tabButtonActiveTransparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--tab-button-active-transparency').trim();
    if (tabButtonHoverBgInput) tabButtonHoverBgInput.value = getComputedStyle(document.documentElement).getPropertyValue('--tab-button-hover-bg').trim();
    if (tabButtonHoverTransparencyInput) tabButtonHoverTransparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--tab-button-hover-transparency').trim();
    if (tableHeaderBgInput) tableHeaderBgInput.value = getComputedStyle(document.documentElement).getPropertyValue('--table-header-bg').trim();
    if (tableHeaderTransparencyInput) tableHeaderTransparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--table-header-transparency').trim();
    if (tooltipBgInput) tooltipBgInput.value = getComputedStyle(document.documentElement).getPropertyValue('--tooltip-bg').trim();
    if (tooltipTransparencyInput) tooltipTransparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--tooltip-transparency').trim();
    if (tooltipTextColorInput) tooltipTextColorInput.value = getComputedStyle(document.documentElement).getPropertyValue('--tooltip-text-color').trim();
    if (modalHeaderBgInput) modalHeaderBgInput.value = getComputedStyle(document.documentElement).getPropertyValue('--modal-header-bg').trim();
    if (modalHeaderTransparencyInput) modalHeaderTransparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--modal-header-transparency').trim();
    if (overdueHighlightInput) overdueHighlightInput.value = getComputedStyle(document.documentElement).getPropertyValue('--overdue-highlight').trim();
    if (overdueTransparencyInput) overdueTransparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--overdue-transparency').trim();
    if (calendarTodayBgInput) calendarTodayBgInput.value = getComputedStyle(document.documentElement).getPropertyValue('--calendar-today-bg').trim();
    if (calendarTodayTransparencyInput) calendarTodayTransparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--calendar-today-transparency').trim();
    if (todayLineColorInput) todayLineColorInput.value = getComputedStyle(document.documentElement).getPropertyValue('--today-line-color').trim();
    if (todayLineTransparencyInput) todayLineTransparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--today-line-transparency').trim();
    if (calendarTaskPopupBgInput) calendarTaskPopupBgInput.value = getComputedStyle(document.documentElement).getPropertyValue('--calendar-task-popup-bg').trim();
    if (calendarTaskPopupTransparencyInput) calendarTaskPopupTransparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--calendar-task-popup-transparency').trim();
    if (notesBgInput) notesBgInput.value = getComputedStyle(document.documentElement).getPropertyValue('--notes-bg').trim();
    if (notesTransparencyInput) notesTransparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--notes-transparency').trim();
    if (datePickerBgInput) datePickerBgInput.value = getComputedStyle(document.documentElement).getPropertyValue('--date-picker-bg').trim();
    if (datePickerTransparencyInput) datePickerTransparencyInput.value = getComputedStyle(document.documentElement).getPropertyValue('--date-picker-transparency').trim();
    if (themeSelect) themeSelect.value = ''; // Reset to allow manual selection

    // Populate custom theme dropdown
    if (customThemeSelect) {
        customThemeSelect.innerHTML = '<option value="">Select a theme</option>';
        Object.keys(customThemes).forEach(themeName => {
            customThemeSelect.innerHTML += `<option value="${themeName}">${themeName}</option>`;
        });
    }
}
/*
 **************************************************************************
 *            END OF BLOCK 26. Manage Style Settings
 *            Block 26 - Manage Style Settings - script.js
 **************************************************************************
 */






// Start the application
initializeApp();