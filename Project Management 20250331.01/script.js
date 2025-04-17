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
    { id: DOM_IDS.SETTINGS, label: "Settings", controls: DOM_IDS.SETTINGS },
    { id: DOM_IDS.GANTT, label: "Gantt Chart", controls: DOM_IDS.GANTT }
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





//**************************************************************************
//            BLOCK 1. Initialize Application
//**************************************************************************
function initializeApp() {
    document.addEventListener('DOMContentLoaded', () => {
        loadData();
        updateTabs();
        renderProjects();
        renderCalendar();
        renderPICList();
        setupContextMenu();
        populateFilterOptions();
        showTab(DOM_IDS.DASHBOARD);
        const notificationButton = document.querySelector(`[data-id="${DOM_IDS.NOTIFICATION_PERMISSION}"]`);
        if (notificationButton) {
            if (window.location.protocol === 'file:') {
                notificationButton.classList.add('hidden');
            } else if (Notification.permission === "granted") {
                notificationButton.classList.add('hidden');
                checkNotifications();
            }
        }
        const taskListPopup = document.querySelector(`[data-id="${DOM_IDS.TASK_LIST_POPUP}"]`);
        if (taskListPopup) {
            taskListPopup.classList.add('hidden');
            isTaskListVisible = false;
            console.log('Task List initialized as hidden');
        } else {
            console.error('Task List popup not found on init');
        }
    });
    window.addEventListener('dataUpdated', updateUI);
}
//**************************************************************************
//            END OF BLOCK 1. Initialize Application
//**************************************************************************



//**************************************************************************
//            BLOCK 2. Manage Data Storage
//**************************************************************************
function loadData() {
    const storedProjects = localStorage.getItem('projects');
    projects = storedProjects ? JSON.parse(storedProjects) : [];
    projects.forEach(project => {
        project.id = project.id || (projects.length + 1).toString();
        project.pic = project.pic || '';
        project.completion = project.completion || 0;
        project.expanded = project.expanded || false;
        project.calendarExpanded = project.calendarExpanded || false;
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
}

function saveData() {
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('picList', JSON.stringify(picList));
    window.dispatchEvent(new CustomEvent('dataUpdated'));
}

//**************************************************************************
//            END OF BLOCK 2. Manage Data Storage
//**************************************************************************


//**************************************************************************
//            BLOCK 3. Parse and Serialize CSV Data
//**************************************************************************

function parseCsv(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];
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

        if (!currentProject || currentProject.id !== projectId) {
            currentProject = { id: projectId, name: projectName, tasks: [], pic: '', completion: 0, expanded: false, calendarExpanded: false };
            result.push(currentProject);
            currentTask = null;
        }
        if (taskName) {
            const dueDateObj = new Date(due);
            const startDateObj = new Date(startDate);
            if (isNaN(dueDateObj.getTime())) throw new Error(`Invalid due date in CSV: ${due}`);
            if (startDate && isNaN(startDateObj.getTime())) throw new Error(`Invalid start date in CSV: ${startDate}`);
            if (startDate && startDateObj > dueDateObj) {
                console.warn(`Start date ${startDate} after due date ${due} for task ${taskName}; using due date as start.`);
                startDate = due;
            }

            const task = {
                name: taskName,
                due,
                startDate: startDate || due,
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
                task.startDate = task.startDate || task.due;
                task.dependencies = task.dependencies.length ? task.dependencies : ['parent'];
                currentTask.subTasks.push(task);
            }
        }
    });
    return result;
}

function serializeCsv(data) {
    let csv = 'ProjectID,ProjectName,TaskName,DueDate,,SubTaskLevel,ParentTaskID,PIC,Completion,Notes,StartDate,Dependencies\n';
    data.forEach(project => {
        project.tasks.forEach((task, taskIdx) => {
            csv += `${project.id},${project.name},${task.name},${task.due},,0,,${task.pic},${task.completion},${task.notes || ''},${task.startDate},${task.dependencies.join('|')}\n`;
            task.subTasks.forEach((subTask) => {
                csv += `${project.id},${project.name},${subTask.name},${subTask.due},,1,${taskIdx},${subTask.pic},${subTask.completion},${subTask.notes || ''},${subTask.startDate},${subTask.dependencies.join('|')}\n`;
            });
        });
        if (project.tasks.length === 0) {
            csv += `${project.id},${project.name},,,,0,,${project.pic},${project.completion},,,,\n`;
        }
    });
    csv += `PICList,${picList.join(',')}\n`;
    return csv;
}

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
    return project.completion;
}

function isProjectOverdue(project) {
    return project.tasks.some(task => 
        (task.completion < 100 && new Date(task.due) < new Date()) || 
        task.subTasks.some(subTask => subTask.completion < 100 && new Date(subTask.due) < new Date())
    );
}

/*
 *************************************************************************
//            BLOCK 5. Filter and Render Projects
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
}

function filterProjects() {
    const filterPic = document.querySelector(`[data-id="${DOM_IDS.FILTER_PIC}"]`).value;
    const filterOverdue = document.querySelector(`[data-id="${DOM_IDS.FILTER_OVERDUE}"]`).value;
    const filterCompletion = document.querySelector(`[data-id="${DOM_IDS.FILTER_COMPLETION}"]`).value;

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
            return filterCompletion === 'completed' ? completion === 100 : completion < 100;
        });
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
        const isOverdue = isProjectOverdue(project);
        tr.className = isOverdue ? 'overdue-row' : '';
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
                    <a href="javascript:void(0)" onclick="openProjectTab('${project.id}'); return false;">${project.name}</a>
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
        const isOverdue = task.completion < 100 && new Date(task.due) < new Date();
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
        tr.innerHTML = `
            <td style="width: ${CONFIG.PROJECT_WIDTH}; padding-left: ${level * 30}px" oncontextmenu="showContextMenu(event, 'task', '${project.id}', ${idx}, ${parentIdx})">
                <span class="task-toggle" onclick="toggleTask('${project.id}', ${idx}, ${parentIdx}, this)">
                    ${hasSubTasks ? (expanded ? '–' : '+') : ''} 
                </span>
                <span class="task-name"><a href="javascript:void(0)" onclick="openProjectTab('${project.id}'); return false;">${task.name}</a></span>
            </td>
            <td style="width: ${CONFIG.START_DATE_WIDTH}">${task.startDate}</td>
            <td style="width: ${CONFIG.DEADLINE_WIDTH}">${task.due}</td>
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
        const isOverdue = subTask.completion < 100 && new Date(subTask.due) < new Date();
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
        tr.innerHTML = `
            <td style="width: ${CONFIG.PROJECT_WIDTH}; padding-left: ${level * 30}px" oncontextmenu="showContextMenu(event, 'subTask', '${project.id}', ${parentIdx}, ${idx})">
                <span class="sub-task">
                    <a href="javascript:void(0)" onclick="openProjectTab('${project.id}'); return false;">${subTask.name}</a>
                </span>
            </td>
            <td style="width: ${CONFIG.START_DATE_WIDTH}">${subTask.startDate}</td>
            <td style="width: ${CONFIG.DEADLINE_WIDTH}">${subTask.due}</td>
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
        renderPICList();
    } else {
        renderProjects();
    }
}

function openProjectTab(projectId) {
    selectedProjectId = projectId;
    showTab(DOM_IDS.GANTT);
    // Ensure the Gantt tab is rendered immediately
    if (selectedProjectId) {
        renderGanttChart(selectedProjectId);
    }
}
/*
 *************************************************************************
 *            END OF BLOCK 7. Manage Tabs and Navigation
 *************************************************************************
*/



//**************************************************************************
//            BLOCK 8. Add and Delete Projects/Tasks
//**************************************************************************
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
            calendarExpanded: false
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
                if (latestSubTaskDue < new Date(parentTask.due)) {
                    parentTask.due = latestSubTaskDue.toISOString().split('T')[0];
                }
            }
        }
    }
    getProjectCompletion(project);
    saveData();
    showUndoButton();
}

//**************************************************************************
//            END OF BLOCK 8. Add and Delete Projects/Tasks
//**************************************************************************




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
}

function updateTaskDueDateWithSubTasks(task, dueDate, startDate) {
    task.startDate = startDate;
    task.due = dueDate;

    if (task.subTasks && task.subTasks.length > 0) {
        task.subTasks.forEach(subTask => {
            if (subTask.dependencies.includes('parent')) {
                const parentDue = new Date(dueDate);
                subTask.startDate = dueDate;
                const subTaskDuration = (new Date(subTask.due) - new Date(subTask.startDate)) / (1000 * 60 * 60 * 24) || 1;
                const newSubDue = new Date(parentDue);
                newSubDue.setDate(parentDue.getDate() + subTaskDuration);
                subTask.due = newSubDue.toISOString().split('T')[0];
            }
            updateTaskDueDateWithSubTasks(subTask, subTask.due, subTask.startDate);
        });
    }
}

//**************************************************************************
//            END OF BLOCK 9. Edit Tasks
//**************************************************************************




//**************************************************************************
//            BLOCK 10. Handle Context Menu
//**************************************************************************
function setupContextMenu() {
    const contextMenu = document.querySelector(`[data-id="${DOM_IDS.CONTEXT_MENU}"]`);
    document.addEventListener('click', (e) => {
        if (!e.target.closest(`[data-id="${DOM_IDS.CONTEXT_MENU}"]`) && contextMenu) {
            contextMenu.classList.add('hidden'); // Use class instead of style
        }
    });
    document.addEventListener('contextmenu', (e) => {
        if (!e.target.closest('td') && !e.target.closest('.task-bar') && contextMenu) {
            contextMenu.classList.add('hidden');
        }
    });
}

function showContextMenu(event, type, projectId, taskIdx = null, subIdx = null) {
    event.preventDefault();
    contextTarget = { type, projectId, taskIdx, subIdx };
    const contextMenu = document.querySelector(`[data-id="${DOM_IDS.CONTEXT_MENU}"]`);
    if (!contextMenu) return;
    contextMenu.innerHTML = '';

    if (type === 'project') {
        contextMenu.innerHTML = `
            <div class="menu-item" onclick="addTask('${projectId}'); hideContextMenu();">Add Task</div>
            <div class="menu-item" onclick="deleteProject('${projectId}'); hideContextMenu();">Delete Project</div>
            <div class="menu-item" onclick="toggleAllTasks('${projectId}'); hideContextMenu();">Toggle All Tasks</div>
        `;
    } else if (type === 'task') {
        contextMenu.innerHTML = `
            <div class="menu-item" onclick="addTask('${projectId}', ${taskIdx}); hideContextMenu();">Add Sub-Task</div>
            <div class="menu-item" onclick="editTask('${projectId}', ${taskIdx}, ${subIdx}); hideContextMenu();">Edit Task</div>
            <div class="menu-item" onclick="editTaskDueDate('${projectId}', ${taskIdx}, ${subIdx}); hideContextMenu();">Edit Dates</div>
            <div class="menu-item" onclick="deleteTask('${projectId}', ${taskIdx}, ${subIdx}); hideContextMenu();">Delete Task</div>
        `;
    } else if (type === 'subTask') {
        contextMenu.innerHTML = `
            <div class="menu-item" onclick="editTask('${projectId}', ${subIdx}, ${taskIdx}); hideContextMenu();">Edit Sub-Task</div>
            <div class="menu-item" onclick="editTaskDueDate('${projectId}', ${subIdx}, ${taskIdx}); hideContextMenu();">Edit Dates</div>
            <div class="menu-item" onclick="deleteTask('${projectId}', ${subIdx}, ${taskIdx}); hideContextMenu();">Delete Sub-Task</div>
        `;
    } else if (type === 'ganttTask') {
        contextMenu.innerHTML = `
            <div class="menu-item" onclick="addTask('${projectId}', ${taskIdx}); hideContextMenu();">Add Sub-Task</div>
            <div class="menu-item" onclick="editTask('${projectId}', ${taskIdx}, ${subIdx}); hideContextMenu();">Edit Task</div>
            <div class="menu-item" onclick="editTaskDueDate('${projectId}', ${taskIdx}, ${subIdx}); hideContextMenu();">Edit Dates</div>
            <div class="menu-item" onclick="deleteTask('${projectId}', ${taskIdx}, ${subIdx}); hideContextMenu();">Delete Task</div>
        `;
    } else if (type === 'ganttSubTask') {
        contextMenu.innerHTML = `
            <div class="menu-item" onclick="editTask('${projectId}', ${subIdx}, ${taskIdx}); hideContextMenu();">Edit Sub-Task</div>
            <div class="menu-item" onclick="editTaskDueDate('${projectId}', ${subIdx}, ${taskIdx}); hideContextMenu();">Edit Dates</div>
            <div class="menu-item" onclick="deleteTask('${projectId}', ${subIdx}, ${taskIdx}); hideContextMenu();">Delete Sub-Task</div>
        `;
    } else if (type === 'addTask') {
        contextMenu.innerHTML = `
            <div class="menu-item" onclick="addTask('${projectId}'); hideContextMenu();">Add Task</div>
        `;
    }

    contextMenu.classList.remove('hidden');
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
}

function hideContextMenu() {
    const contextMenu = document.querySelector(`[data-id="${DOM_IDS.CONTEXT_MENU}"]`);
    if (contextMenu) {
        contextMenu.classList.add('hidden');
    }
}
//**************************************************************************
//            END OF BLOCK 10. Handle Context Menu
//**************************************************************************





//**************************************************************************
//            BLOCK 11. Render Calendar
//**************************************************************************
function renderCalendar() {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const monthYear = document.querySelector(`[data-id="${DOM_IDS.MONTH_YEAR}"]`);
    if (monthYear) {
        monthYear.textContent = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
        console.error('month-year element not found');
    }

    const calendarFull = document.querySelector(`[data-id="${DOM_IDS.CALENDAR_FULL}"]`);
    const calendarList = document.querySelector(`[data-id="${DOM_IDS.CALENDAR_LIST}"]`);
    if (calendarFull && calendarList) {
        if (calendarView === 'full') {
            calendarFull.classList.remove('hidden');
            calendarList.classList.add('hidden');
            renderFullCalendar(monthStart, monthEnd);
        } else {
            calendarFull.classList.add('hidden');
            calendarList.classList.remove('hidden');
            renderListCalendar(monthStart, monthEnd);
        }
    } else {
        console.error('calendar-full or calendar-list element not found');
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

function renderFullCalendar(monthStart, monthEnd) {
    const tbody = document.querySelector(`[data-id="${DOM_IDS.CALENDAR_BODY}"]`);
    if (!tbody) {
        console.error('calendar-body element not found');
        return;
    }
    tbody.innerHTML = '';

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

            const currentDate = new Date(monthStart.getFullYear(), currentMonth.getMonth(), currentDay);
            td.innerHTML = `<div class="day-number">${currentDay}</div>`;
            if (currentDate.getTime() === today.getTime()) {
                td.style.backgroundColor = CONFIG.TODAY_COLOR;
            }

            const tasksOnDay = [];
            projects.forEach(project => {
                project.tasks.forEach(task => {
                    const dueDate = new Date(task.due);
                    if (dueDate.getFullYear() === currentDate.getFullYear() &&
                        dueDate.getMonth() === currentDate.getMonth() &&
                        dueDate.getDate() === currentDate.getDate()) {
                        tasksOnDay.push({ project: project.name, task: task.name, completion: task.completion, overdue: task.completion < 100 && dueDate < today, projectId: project.id });
                    }
                    task.subTasks.forEach(subTask => {
                        const subDueDate = new Date(subTask.due);
                        if (subDueDate.getFullYear() === currentDate.getFullYear() &&
                            subDueDate.getMonth() === currentDate.getMonth() &&
                            subDueDate.getDate() === currentDate.getDate()) {
                            tasksOnDay.push({ project: project.name, task: subTask.name, completion: subTask.completion, overdue: subTask.completion < 100 && subDueDate < today, projectId: project.id });
                        }
                    });
                });
            });

            const taskContainer = document.createElement('div');
            taskContainer.className = 'task-container';
            tasksOnDay.forEach(task => {
                const taskDiv = document.createElement('div');
                taskDiv.className = 'calendar-task';
                taskDiv.innerHTML = `<a href="#" onclick="openProjectTab('${task.projectId}')">${task.project}: ${task.task}</a>`;
                taskDiv.className += task.overdue ? ' overdue' : '';
                taskContainer.appendChild(taskDiv);
            });

            const tooltip = document.createElement('div');
            tooltip.className = 'task-tooltip';
            tasksOnDay.forEach(task => {
                const taskLink = document.createElement('a');
                taskLink.href = '#';
                taskLink.onclick = () => openProjectTab(task.projectId);
                taskLink.textContent = `${task.project}: ${task.task}${task.overdue ? ' (Overdue)' : ''}`;
                tooltip.appendChild(taskLink);
            });
            td.appendChild(taskContainer);
            td.appendChild(tooltip);

            tr.appendChild(td);
            currentDay++;
        }
        tbody.appendChild(tr);
        if (currentDay > daysInMonth) break;
    }
}

function renderListCalendar(monthStart, monthEnd) {
    const list = document.querySelector(`[data-id="${DOM_IDS.CALENDAR_LIST}"]`);
    if (!list) return;
    list.innerHTML = '';

    const tasksByDate = {};
    projects.forEach(project => {
        project.tasks.forEach(task => {
            const dueDate = new Date(task.due);
            if (dueDate >= monthStart && dueDate <= monthEnd) {
                const dateKey = dueDate.toISOString().split('T')[0];
                if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
                tasksByDate[dateKey].push({ project: project.name, task: task.name, projectId: project.id });
            }
            task.subTasks.forEach(subTask => {
                const subDueDate = new Date(subTask.due);
                if (subDueDate >= monthStart && subDueDate <= monthEnd) {
                    const dateKey = subDueDate.toISOString().split('T')[0];
                    if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
                    tasksByDate[dateKey].push({ project: project.name, task: subTask.name, projectId: project.id });
                }
            });
        });
    });

    const sortedDates = Object.keys(tasksByDate).sort();
    sortedDates.forEach(date => {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'calendar-list-date';
        dateDiv.innerHTML = `<strong>${new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</strong>`;
        const taskList = document.createElement('ul');
        tasksByDate[date].forEach(task => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" onclick="openProjectTab('${task.projectId}')">${task.project}: ${task.task}</a>`;
            taskList.appendChild(li);
        });
        dateDiv.appendChild(taskList);
        list.appendChild(dateDiv);
    });
}

function toggleCalendarView() {
    calendarView = calendarView === 'full' ? 'list' : 'full';
    const toggleBtn = document.querySelector(`[data-id="${DOM_IDS.TOGGLE_VIEW_BTN}"]`);
    if (toggleBtn) {
        toggleBtn.textContent = calendarView === 'full' ? 'Full View' : 'List View';
    }
    renderCalendar();
}

//**************************************************************************
//            END OF BLOCK 11. Render Calendar
//**************************************************************************



//**************************************************************************
//            BLOCK 12. Render Gantt Chart
//**************************************************************************
function renderGanttChart(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const tbody = document.querySelector(`[data-id="${DOM_IDS.GANTT_BODY}"]`);
    const timelineHeader = document.querySelector(`[data-id="${DOM_IDS.GANTT_TIMELINE}"]`);
    if (!tbody || !timelineHeader) return;

    const allDates = [];
    project.tasks.forEach(task => {
        allDates.push(new Date(task.startDate));
        allDates.push(new Date(task.due));
        task.subTasks.forEach(subTask => {
            allDates.push(new Date(subTask.startDate));
            allDates.push(new Date(subTask.due));
        });
    });

    if (allDates.length === 0) {
        tbody.innerHTML = '';
        timelineHeader.innerHTML = '';
        return;
    }

    let minDate = new Date(Math.min(...allDates));
    let maxDate = new Date(Math.max(...allDates));
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 1);

    const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPosition = today >= minDate && today <= maxDate ? ((today - minDate) / (1000 * 60 * 60 * 24) / totalDays) * 100 : -1;

    renderGanttTimelineHeader(timelineHeader, minDate, maxDate, totalDays);

    tbody.innerHTML = '';
    project.tasks.forEach((task, taskIdx) => {
        const isOverdue = task.completion < 100 && new Date(task.due) < today;
        const startDate = new Date(task.startDate);
        const endDate = new Date(task.due);
        const daysFromMinStart = (startDate - minDate) / (1000 * 60 * 60 * 24);
        const durationDays = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
        const leftPercent = (daysFromMinStart / totalDays) * 100;
        const widthPercent = (durationDays / totalDays) * 100;

        const tr = document.createElement('tr');
        tr.className = isOverdue ? 'overdue-row' : '';
        tr.draggable = true;
        tr.dataset.projectId = projectId;
        tr.dataset.taskIdx = taskIdx;
        tr.dataset.isSubtask = "false";
        tr.dataset.dropZone = "task";
        tr.addEventListener('dragstart', handleDragStart);
        tr.addEventListener('dragover', handleDragOver);
        tr.addEventListener('dragenter', handleDragEnter);
        tr.addEventListener('dragleave', handleDragLeave);
        tr.addEventListener('drop', handleDrop);
        tr.addEventListener('dragend', handleDragEnd);
        tr.innerHTML = `
            <td style="width: ${CONFIG.GANTT_TASK_WIDTH}" oncontextmenu="showContextMenu(event, 'ganttTask', '${projectId}', ${taskIdx}, null)">
                ${task.name}
                ${task.notes ? `<span class="notes-icon has-notes" onclick="openNotesPopup('${projectId}', ${taskIdx}, null, event)">📝</span>` : `<span class="notes-icon" onclick="openNotesPopup('${projectId}', ${taskIdx}, null, event)">📝</span>`}
            </td>
            <td style="width: ${CONFIG.GANTT_TIMELINE_WIDTH}">
                <div class="gantt-container">
                    <div class="task-bar" style="left: ${leftPercent}%; width: ${widthPercent}%; background: ${isOverdue ? CONFIG.OVERDUE_COLOR : CONFIG.ON_TRACK_COLOR};" data-project-id="${projectId}" data-task-idx="${taskIdx}" data-sub-idx="null" data-total-days="${totalDays}" data-min-date="${minDate.toISOString().split('T')[0]}">
                        <span class="date-label start-date">${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span class="date-label end-date">${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <div class="resize-start"></div>
                        <div class="resize-end"></div>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);

        task.subTasks.forEach((subTask, subIdx) => {
            const subIsOverdue = subTask.completion < 100 && new Date(subTask.due) < today;
            const subStartDate = new Date(subTask.startDate);
            const subEndDate = new Date(subTask.due);
            const subDaysFromMinStart = (subStartDate - minDate) / (1000 * 60 * 60 * 24);
            const subDurationDays = Math.max(1, (subEndDate - subStartDate) / (1000 * 60 * 60 * 24));
            const subLeftPercent = (subDaysFromMinStart / totalDays) * 100;
            const subWidthPercent = (subDurationDays / totalDays) * 100;

            const subTr = document.createElement('tr');
            subTr.className = subIsOverdue ? 'overdue-row' : '';
            subTr.draggable = true;
            subTr.dataset.projectId = projectId;
            subTr.dataset.taskIdx = taskIdx;
            subTr.dataset.subtaskIdx = subIdx;
            subTr.dataset.isSubtask = "true";
            subTr.dataset.dropZone = "subtask";
            subTr.addEventListener('dragstart', handleDragStart);
            subTr.addEventListener('dragover', handleDragOver);
            subTr.addEventListener('dragenter', handleDragEnter);
            subTr.addEventListener('dragleave', handleDragLeave);
            subTr.addEventListener('drop', handleDrop);
            subTr.addEventListener('dragend', handleDragEnd);
            subTr.innerHTML = `
                <td style="width: ${CONFIG.GANTT_TASK_WIDTH}; padding-left: 30px;" oncontextmenu="showContextMenu(event, 'ganttSubTask', '${projectId}', ${taskIdx}, ${subIdx})">
                    ${subTask.name}
                    ${subTask.notes ? `<span class="notes-icon has-notes" onclick="openNotesPopup('${projectId}', ${taskIdx}, ${subIdx}, event)">📝</span>` : `<span class="notes-icon" onclick="openNotesPopup('${projectId}', ${taskIdx}, ${subIdx}, event)">📝</span>`}
                </td>
                <td style="width: ${CONFIG.GANTT_TIMELINE_WIDTH}">
                    <div class="gantt-container">
                        <div class="task-bar" style="left: ${subLeftPercent}%; width: ${subWidthPercent}%; background: ${subIsOverdue ? CONFIG.OVERDUE_COLOR : CONFIG.ON_TRACK_COLOR};" data-project-id="${projectId}" data-task-idx="${taskIdx}" data-sub-idx="${subIdx}" data-total-days="${totalDays}" data-min-date="${minDate.toISOString().split('T')[0]}">
                            <span class="date-label start-date">${subStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span class="date-label end-date">${subEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <div class="resize-start"></div>
                            <div class="resize-end"></div>
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(subTr);
        });
    });

    if (todayPosition >= 0) {
        const todayLine = document.createElement('div');
        todayLine.className = 'today-line';
        todayLine.style.left = `${todayPosition}%`;
        tbody.querySelectorAll('.gantt-container').forEach(container => {
            container.appendChild(todayLine.cloneNode());
        });
    }

    const resizeStarts = tbody.querySelectorAll('.resize-start');
    const resizeEnds = tbody.querySelectorAll('.resize-end');
    const taskBars = tbody.querySelectorAll('.task-bar');
    resizeStarts.forEach(resizeStart => {
        resizeStart.addEventListener('mousedown', startResizeStart);
    });
    resizeEnds.forEach(resizeEnd => {
        resizeEnd.addEventListener('mousedown', startResizeEnd);
    });
    taskBars.forEach(taskBar => {
        taskBar.addEventListener('mousedown', startDragTaskBar);
    });
}

function renderGanttTimelineHeader(timelineHeader, minDate, maxDate, totalDays) {
    timelineHeader.innerHTML = '';

    const scaleType = totalDays <= 14 ? 'days' : totalDays <= 60 ? 'weeks' : 'months';
    const timelineDiv = document.createElement('div');
    timelineDiv.className = 'gantt-timeline';
    timelineDiv.style.position = 'relative';
    timelineDiv.style.height = '30px';
    timelineDiv.style.width = '100%';

    let currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
        const daysFromMin = (currentDate - minDate) / (1000 * 60 * 60 * 24);
        const leftPercent = (daysFromMin / totalDays) * 100;

        const marker = document.createElement('div');
        marker.className = 'timeline-marker';
        marker.style.left = `${leftPercent}%`;
        marker.style.height = '100%';
        marker.style.borderLeft = '1px solid #f0f0f0';

        const label = document.createElement('span');
        label.className = 'timeline-label';
        label.style.left = `${leftPercent}%`;
        label.style.transform = 'translateX(-50%)';

        if (scaleType === 'days') {
            label.textContent = currentDate.getDate();
            currentDate.setDate(currentDate.getDate() + 1);
        } else if (scaleType === 'weeks') {
            label.textContent = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            currentDate.setDate(currentDate.getDate() + 7);
        } else {
            label.textContent = currentDate.toLocaleDateString('en-US', { month: 'short' });
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        timelineDiv.appendChild(marker);
        timelineDiv.appendChild(label);
    }

    timelineHeader.appendChild(timelineDiv);
}

//**************************************************************************
//            END OF BLOCK 12. Render Gantt Chart
//**************************************************************************






//**************************************************************************
//            BLOCK 13. Handle Gantt Chart Interactions
//**************************************************************************
function startResizeStart(event) {
    event.preventDefault();
    const taskBar = event.target.closest('.task-bar');
    if (!taskBar) return;

    const projectId = taskBar.dataset.projectId;
    const taskIdx = parseInt(taskBar.dataset.taskIdx);
    const subIdx = taskBar.dataset.subIdx === 'null' ? null : parseInt(taskBar.dataset.subIdx);
    let totalDays = parseFloat(taskBar.dataset.totalDays);
    let minDate = new Date(taskBar.dataset.minDate);

    const parentDiv = taskBar.parentElement;
    const parentRect = parentDiv.getBoundingClientRect();
    const startX = event.clientX;
    let initialLeft = parseFloat(taskBar.style.left) || 0;
    let initialWidth = parseFloat(taskBar.style.width) || 0;
    let offsetDays = 0;

    const startLabel = taskBar.querySelector('.start-date');
    const endLabel = taskBar.querySelector('.end-date');
    const endDate = new Date(endLabel.textContent.split(' ').reverse().join('-'));

    function onMouseMove(e) {
        const deltaX = e.clientX - startX;
        const deltaPercent = (deltaX / parentRect.width) * 100;
        let newLeft = initialLeft + deltaPercent;
        let newWidth = initialWidth - deltaPercent;

        if (newLeft < 0) {
            offsetDays = -Math.ceil(Math.abs(newLeft) * totalDays / 100);
            newLeft = 0;
            newWidth = initialWidth + (initialLeft - newLeft);
        } else {
            offsetDays = 0;
        }

        const minWidthPercent = (1 / totalDays) * 100;
        newWidth = Math.max(minWidthPercent, newWidth);
        newLeft = Math.min(initialLeft + initialWidth - minWidthPercent, newLeft);

        taskBar.style.left = `${newLeft}%`;
        taskBar.style.width = `${newWidth}%`;

        const daysFromMinStart = (newLeft / 100) * totalDays + offsetDays;
        const newStartDate = new Date(minDate);
        newStartDate.setDate(newStartDate.getDate() + Math.round(daysFromMinStart));
        startLabel.textContent = newStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const project = projects.find(p => p.id === projectId);
        const task = subIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[subIdx];
        const daysFromMinStart = (parseFloat(taskBar.style.left) / 100) * totalDays + offsetDays;
        const newStartDate = new Date(minDate);
        newStartDate.setDate(newStartDate.getDate() + Math.round(daysFromMinStart));
        const originalStartDate = task.startDate;
        task.startDate = newStartDate.toISOString().split('T')[0];

        if (checkForOverlaps(projectId)) {
            task.startDate = originalStartDate;
            alert('This change would cause a scheduling conflict. Reverting.');
        } else {
            updateTaskDueDateWithSubTasks(task, task.due, task.startDate);
            if (subIdx !== null) {
                const parentTask = project.tasks[taskIdx];
                const parentDue = new Date(parentTask.due);
                const taskDue = new Date(task.due);
                if (taskDue > parentDue) {
                    parentTask.due = task.due;
                    updateTaskDueDateWithSubTasks(parentTask, parentTask.due, parentTask.startDate);
                }
            }
        }
        saveData(); // Dispatches 'dataUpdated' event
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
    let minDate = new Date(taskBar.dataset.minDate);

    const parentDiv = taskBar.parentElement;
    const parentRect = parentDiv.getBoundingClientRect();
    const startX = event.clientX;
    let initialWidth = parseFloat(taskBar.style.width) || 0;
    let initialLeft = parseFloat(taskBar.style.left) || 0;

    const startLabel = taskBar.querySelector('.start-date');
    const endLabel = taskBar.querySelector('.end-date');

    const project = projects.find(p => p.id === projectId);
    const task = subIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[subIdx];
    const latestSubTaskDue = task.subTasks.length > 0 ? task.subTasks.reduce((latest, subTask) => {
        const subDue = new Date(subTask.due);
        return subDue > latest ? subDue : latest;
    }, new Date(task.subTasks[0].due)) : null;

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
            updateUI(); // Retained for real-time update during resize
            return;
        }

        const daysFromMinStart = (initialLeft / 100) * totalDays;
        const durationDays = (newWidth / 100) * totalDays;
        const newEndDate = new Date(minDate);
        newEndDate.setDate(newEndDate.getDate() + Math.round(daysFromMinStart + durationDays));

        if (latestSubTaskDue && newEndDate < latestSubTaskDue) {
            newWidth = ((latestSubTaskDue - minDate) / (1000 * 60 * 60 * 24) - daysFromMinStart) / totalDays * 100;
            newEndDate.setTime(latestSubTaskDue.getTime());
        }

        taskBar.style.width = `${newWidth}%`;
        endLabel.textContent = newEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const daysFromMinEnd = ((parseFloat(taskBar.style.left) + parseFloat(taskBar.style.width)) / 100) * totalDays;
        const newEndDate = new Date(minDate);
        newEndDate.setDate(newEndDate.getDate() + Math.round(daysFromMinEnd));
        const originalDue = task.due;
        task.due = newEndDate.toISOString().split('T')[0];

        if (checkForOverlaps(projectId)) {
            task.due = originalDue;
            alert('This change would cause a scheduling conflict. Reverting.');
        } else {
            updateTaskDueDateWithSubTasks(task, task.due, task.startDate);
            if (subIdx !== null) {
                const parentTask = project.tasks[taskIdx];
                const parentDue = new Date(parentTask.due);
                const taskDue = new Date(task.due);
                if (taskDue > parentDue) {
                    parentTask.due = task.due;
                    updateTaskDueDateWithSubTasks(parentTask, parentTask.due, parentTask.startDate);
                }
            }
        }
        saveData(); // Dispatches 'dataUpdated' event
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
    let minDate = new Date(taskBar.dataset.minDate);

    const parentDiv = taskBar.parentElement;
    const parentRect = parentDiv.getBoundingClientRect();
    const startX = event.clientX;
    let initialLeft = parseFloat(taskBar.style.left) || 0;
    let initialWidth = parseFloat(taskBar.style.width) || 0;

    const startLabel = taskBar.querySelector('.start-date');
    const endLabel = taskBar.querySelector('.end-date');

    const project = projects.find(p => p.id === projectId);
    const task = subIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[subIdx];
    const latestSubTaskDue = task.subTasks.length > 0 ? task.subTasks.reduce((latest, subTask) => {
        const subDue = new Date(subTask.due);
        return subDue > latest ? subDue : latest;
    }, new Date(task.subTasks[0].due)) : null;

    function onMouseMove(e) {
        const deltaX = e.clientX - startX;
        const deltaPercent = (deltaX / parentRect.width) * 100;
        let newLeft = initialLeft + deltaPercent;

        if (newLeft < 0) {
            const daysToExtend = Math.abs(newLeft) * totalDays / 100;
            minDate.setDate(minDate.getDate() - Math.ceil(daysToExtend));
            const newTotalDays = (new Date(endLabel.textContent.split(' ').reverse().join('-')) - minDate) / (1000 * 60 * 60 * 24);
            newLeft = 0;
            initialLeft = 0;
            totalDays = newTotalDays;
            taskBar.dataset.totalDays = totalDays;
            taskBar.dataset.minDate = minDate.toISOString().split('T')[0];
            updateUI(); // Retained for real-time update during drag
            return;
        }

        if (newLeft + initialWidth > 100) {
            const excessDays = ((newLeft + initialWidth - 100) / 100) * totalDays;
            const newMaxDate = new Date(minDate);
            newMaxDate.setDate(newMaxDate.getDate() + totalDays + Math.ceil(excessDays));
            totalDays = (newMaxDate - minDate) / (1000 * 60 * 60 * 24);
            taskBar.dataset.totalDays = totalDays;
            updateUI(); // Retained for real-time update during drag
            return;
        }

        taskBar.style.left = `${newLeft}%`;

        const daysFromMinStart = (newLeft / 100) * totalDays;
        const snappedDaysStart = Math.round(daysFromMinStart);
        const newStartDate = new Date(minDate);
        newStartDate.setDate(newStartDate.getDate() + snappedDaysStart);
        const durationDays = (initialWidth / 100) * totalDays;
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + Math.round(durationDays));

        if (latestSubTaskDue && newEndDate < latestSubTaskDue) {
            newEndDate.setTime(latestSubTaskDue.getTime());
            const newDurationDays = (newEndDate - newStartDate) / (1000 * 60 * 60 * 24);
            taskBar.style.left = `${((newStartDate - minDate) / (1000 * 60 * 60 * 24)) / totalDays * 100}%`;
            taskBar.style.width = `${newDurationDays / totalDays * 100}%`;
        }

        startLabel.textContent = newStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        endLabel.textContent = newEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const daysFromMinStart = (parseFloat(taskBar.style.left) / 100) * totalDays;
        const newStartDate = new Date(minDate);
        newStartDate.setDate(newStartDate.getDate() + Math.round(daysFromMinStart));
        const durationDays = (initialWidth / 100) * totalDays;
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + Math.round(durationDays));

        if (latestSubTaskDue && newEndDate < latestSubTaskDue) {
            newEndDate.setTime(latestSubTaskDue.getTime());
        }

        const originalStartDate = task.startDate;
        const originalDue = task.due;
        task.startDate = newStartDate.toISOString().split('T')[0];
        task.due = newEndDate.toISOString().split('T')[0];

        if (checkForOverlaps(projectId)) {
            task.startDate = originalStartDate;
            task.due = originalDue;
            alert('This change would cause a scheduling conflict. Reverting.');
        } else {
            updateTaskDueDateWithSubTasks(task, task.due, task.startDate);
            if (subIdx !== null) {
                const parentTask = project.tasks[taskIdx];
                const parentDue = new Date(parentTask.due);
                const taskDue = new Date(task.due);
                if (taskDue > parentDue) {
                    parentTask.due = task.due;
                    updateTaskDueDateWithSubTasks(parentTask, parentTask.due, parentTask.startDate);
                }
            }
        }

        saveData(); // Dispatches 'dataUpdated' event
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
    notesPopup.style.left = `${event.pageX}px`;
    notesPopup.style.top = `${event.pageY}px`;
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





//**************************************************************************
//            BLOCK 16. Manage PIC List
//**************************************************************************
function renderPICList() {
    const tbody = document.querySelector(`[data-id="${DOM_IDS.PIC_LIST}"]`);
    if (!tbody) return;
    tbody.innerHTML = '';
    picList.forEach((pic, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${pic}</td>
            <button onclick="deletePIC(${index})">Delete</button>
        `;
        tbody.appendChild(tr);
    });
}

function addPIC() {
    const picName = prompt('Enter PIC name:');
    if (picName && !picList.includes(picName)) {
        picList.push(picName);
        saveData();
        renderPICList();
        populateFilterOptions();
    }
}

function deletePIC(index) {
    const pic = picList[index];
    if (confirm(`Delete PIC: ${pic}?`)) {
        picList.splice(index, 1);
        saveData();
        renderPICList();
        populateFilterOptions();
    }
}

//**************************************************************************
//            END OF BLOCK 16. Manage PIC List
//**************************************************************************





//**************************************************************************
//            BLOCK 17. Import and Export Data
//**************************************************************************
function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const importedProjects = parseCsv(text);
                projects = importedProjects;
                saveData();
                populateFilterOptions();
            } catch (error) {
                console.error('Error importing CSV:', error);
                alert('Failed to import CSV. Check console for details.');
            }
        };
        reader.readAsText(file);
    }
}

function exportData() {
    const csv = serializeCsv(projects);
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
//**************************************************************************





//**************************************************************************
//            BLOCK 18. Manage Task List Popup
//**************************************************************************
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
    const taskListContent = document.querySelector(`[data-id="${DOM_IDS.TASK_LIST_CONTENT}"]`);
    if (!taskListContent) {
        console.error('Task list content not found');
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
            tasksByDate[dateKey].push({ project: project.name, task: task.name, due: task.due, overdue: task.completion < 100 && dueDate < today, projectId: project.id, taskIdx });
            task.subTasks.forEach((subTask, subIdx) => {
                const subDueDate = new Date(subTask.due);
                const subDateKey = subDueDate.toISOString().split('T')[0];
                if (!tasksByDate[subDateKey]) tasksByDate[subDateKey] = [];
                tasksByDate[subDateKey].push({ project: project.name, task: subTask.name, due: subTask.due, overdue: subTask.completion < 100 && subDueDate < today, projectId: project.id, taskIdx: subIdx });
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
                html += `<li class="${task.overdue ? 'overdue' : ''}"><a href="#" onclick="openProjectTab('${task.projectId}')">${task.project}: ${task.task}</a></li>`;
            });
            html += '</ul></li>';
        });
    }
    html += '</ul>';
    taskListContent.innerHTML = html;
}
//**************************************************************************
//            END OF BLOCK 18. Manage Task List Popup
//**************************************************************************





//**************************************************************************
//            BLOCK 19. Manage Modals and Undo
//**************************************************************************
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
    }

    saveData();
    const undoButton = document.querySelector(`[data-id="${DOM_IDS.UNDO_BUTTON}"]`);
    if (undoButton && undoStack.length === 0) {
        undoButton.classList.add('hidden');
    }
}

//**************************************************************************
//            END OF BLOCK 19. Manage Modals and Undo
//**************************************************************************







//**************************************************************************
//            BLOCK 20. Manage Notifications
//**************************************************************************
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications.");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            const notificationButton = document.querySelector(`[data-id="${DOM_IDS.NOTIFICATION_PERMISSION}"]`);
            if (notificationButton) {
                notificationButton.classList.add('hidden');
            }
            checkNotifications();
        }
    });
}

function checkNotifications() {
    if (Notification.permission !== "granted") return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    projects.forEach(project => {
        project.tasks.forEach(task => {
            const dueDate = new Date(task.due);
            if (task.completion < 100 && dueDate < today) {
                new Notification(`Overdue Task: ${project.name}`, {
                    body: `${task.name} was due on ${dueDate.toLocaleDateString()}`,
                    icon: 'https://via.placeholder.com/16/ff0000/000000?text=!'
                });
            } else if (dueDate.getTime() === today.getTime() || dueDate.getTime() === tomorrow.getTime()) {
                new Notification(`Upcoming Task: ${project.name}`, {
                    body: `${task.name} is due on ${dueDate.toLocaleDateString()}`,
                    icon: 'https://via.placeholder.com/16/ffff00/000000?text=!'
                });
            }
            task.subTasks.forEach(subTask => {
                const subDueDate = new Date(subTask.due);
                if (subTask.completion < 100 && subDueDate < today) {
                    new Notification(`Overdue Sub-Task: ${project.name}`, {
                        body: `${subTask.name} was due on ${subDueDate.toLocaleDateString()}`,
                        icon: 'https://via.placeholder.com/16/ff0000/000000?text=!'
                    });
                } else if (subDueDate.getTime() === today.getTime() || subDueDate.getTime() === tomorrow.getTime()) {
                    new Notification(`Upcoming Sub-Task: ${project.name}`, {
                        body: `${subTask.name} is due on ${subDueDate.toLocaleDateString()}`,
                        icon: 'https://via.placeholder.com/16/ffff00/000000?text=!'
                    });
                }
            });
        });
    });
}

//**************************************************************************
//            END OF BLOCK 20. Manage Notifications
//**************************************************************************



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
        const dueDate = new Date(task.due);
        const status = task.completion < 100 && dueDate < currentDate ? 'Past Due' : 'On Track';
        const statusClass = task.completion < 100 && dueDate < currentDate ? 'status-past-due' : 'status-on-track';

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
            const subDueDate = new Date(subTask.due);
            const subStatus = subTask.completion < 100 && subDueDate < currentDate ? 'Past Due' : 'On Track';
            const subStatusClass = subTask.completion < 100 && subDueDate < currentDate ? 'status-past-due' : 'status-on-track';

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
//            BLOCK 22. Manage Calendar Popup
//**************************************************************************
function toggleCalendarPopup() {
    const calendarPopup = document.getElementById(DOM_IDS.CALENDAR_POPUP);
    if (!calendarPopup) return;
    calendarPopupVisible = !calendarPopupVisible;
    calendarPopup.style.display = calendarPopupVisible ? 'block' : 'none';
    if (calendarPopupVisible) {
        renderPopupCalendar();
    }
}

function renderPopupCalendar() {
    const calendarPopup = document.getElementById(DOM_IDS.CALENDAR_POPUP);
    if (!calendarPopup) return;

    const monthStart = new Date(popupMonth.getFullYear(), popupMonth.getMonth(), 1);
    const monthEnd = new Date(popupMonth.getFullYear(), popupMonth.getMonth() + 1, 0);

    calendarPopup.innerHTML = `
        <div class="calendar-nav">
            <button class="button" onclick="prevPopupMonth()">Previous</button>
            <div class="month-year-wrapper">
                <span id="${DOM_IDS.POPUP_MONTH_YEAR}">${popupMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
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

    const tbody = document.getElementById('popup-calendar-body');
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
    const calendarPopup = document.getElementById(DOM_IDS.CALENDAR_POPUP);
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

//**************************************************************************
//            END OF BLOCK 22. Manage Calendar Popup
//**************************************************************************




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

//**************************************************************************
//            END OF BLOCK 23. Miscellaneous Utilities
//**************************************************************************




//**************************************************************************
//            BLOCK 24. UI Utilities
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
//                       END BLOCK
//**************************************************************************



// Start the application
initializeApp();