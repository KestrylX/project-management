let projects = [];
let currentMonth = new Date();
let openTabs = ['dashboard'];
let calendarView = 'full';
let picList = [];
let contextTarget = null;
let undoStack = [];
let isTaskListVisible = false;
let draggedItem = null; // To store the dragged task/sub-task

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateTabs();
    renderProjects();
    renderCalendar();
    renderPICList();
    setupContextMenu();
    populateFilterOptions();
    showTab('dashboard');
    checkNotifications();
});

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
}

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

function populateFilterOptions() {
    const filterPic = document.getElementById('filter-pic');
    if (filterPic) {
        filterPic.innerHTML = '<option value="">All</option>';
        picList.forEach(pic => {
            filterPic.innerHTML += `<option value="${pic}">${pic}</option>`;
        });
    }
}

function filterProjects() {
    const filterPic = document.getElementById('filter-pic').value;
    const filterOverdue = document.getElementById('filter-overdue').value;
    const filterCompletion = document.getElementById('filter-completion').value;

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
    const tbody = document.getElementById('project-list');
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
            <td oncontextmenu="showContextMenu(event, 'project', '${project.id}')">
                <span class="project-toggle" onclick="toggleProject('${project.id}', this)">
                    ${hasTasks ? (expanded ? '–' : '+') : ''} 
                </span>
                <span class="project-name">
                    <a href="#" onclick="openProjectTab('${project.id}')">${project.name}</a>
                </span>
            </td>
            <td></td> <!-- StartDate (not applicable for project) -->
            <td>${getProjectDeadline(project)}</td>
            <td>${getProjectCompletion(project)}%</td>
            <td>
                <select onchange="assignProjectPIC('${project.id}', this.value)">
                    <option value="">None</option>
                    ${picList.map(pic => `<option value="${pic}" ${project.pic === pic ? 'selected' : ''}>${pic}</option>`).join('')}
                </select>
            </td>
            <td></td> <!-- Notes (not applicable for project) -->
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
    project.tasks.sort((a, b) => new Date(a.due) - new Date(b.due));
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
            <td style="padding-left: ${level * 30}px" oncontextmenu="showContextMenu(event, 'task', '${project.id}', ${idx}, ${parentIdx})">
                <span class="task-toggle" onclick="toggleTask('${project.id}', ${idx}, ${parentIdx}, this)">
                    ${hasSubTasks ? (expanded ? '–' : '+') : ''} 
                </span>
                <a href="#" onclick="openProjectTab('${project.id}')">${task.name}</a>
            </td>
            <td>${task.startDate}</td>
            <td>${task.due}</td>
            <td>${hasSubTasks ? `${task.completion}%` : `<input type="number" min="0" max="100" value="${task.completion}" onchange="updateTaskCompletion('${project.id}', ${idx}, ${parentIdx}, this.value)" style="width: 50px;">`}</td>
            <td>
                <select onchange="assignTaskPIC('${project.id}', ${idx}, ${parentIdx}, this.value)">
                    <option value="">None</option>
                    ${picList.map(pic => `<option value="${pic}" ${task.pic === pic ? 'selected' : ''}>${pic}</option>`).join('')}
                </select>
            </td>
            <td>${task.notes || ''}</td>
        `;
        task.expanded = expanded;
        tbody.appendChild(tr);

        if (hasSubTasks && expanded) {
            renderSubTasks(project, tbody, task.subTasks, idx, level + 1);
        }
    });
}

function renderSubTasks(project, tbody, subTasks, parentIdx, level) {
    subTasks.sort((a, b) => new Date(a.due) - new Date(b.due));
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
            <td style="padding-left: ${level * 30}px" oncontextmenu="showContextMenu(event, 'subTask', '${project.id}', ${parentIdx}, ${idx})">
                <span class="sub-task">
                    <a href="#" onclick="openProjectTab('${project.id}')">${subTask.name}</a>
                </span>
            </td>
            <td>${subTask.startDate}</td>
            <td>${subTask.due}</td>
            <td><input type="number" min="0" max="100" value="${subTask.completion}" onchange="updateSubTaskCompletion('${project.id}', ${parentIdx}, ${idx}, this.value)" style="width: 50px;"></td>
            <td>
                <select onchange="assignTaskPIC('${project.id}', ${parentIdx}, ${idx}, this.value)">
                    <option value="">None</option>
                    ${picList.map(pic => `<option value="${pic}" ${subTask.pic === pic ? 'selected' : ''}>${pic}</option>`).join('')}
                </select>
            </td>
            <td>${subTask.notes || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function toggleProject(projectId, toggleElement) {
    const project = projects.find(p => p.id === projectId);
    project.expanded = !project.expanded;
    toggleElement.textContent = project.expanded ? '–' : '+';
    renderProjects();
}

function toggleTask(projectId, taskIdx, parentIdx, toggleElement) {
    const project = projects.find(p => p.id === projectId);
    const task = parentIdx === null ? project.tasks[taskIdx] : project.tasks[parentIdx].subTasks[taskIdx];
    task.expanded = !task.expanded;
    toggleElement.textContent = task.expanded ? '–' : '+';
    renderProjects();
}

function toggleAllTasks(projectId) {
    const project = projects.find(p => p.id === projectId);
    const allExpanded = project.tasks.every(task => task.expanded);
    project.expanded = !allExpanded;
    project.tasks.forEach(task => {
        task.expanded = !allExpanded;
    });
    renderProjects();
}

function assignProjectPIC(projectId, pic) {
    const project = projects.find(p => p.id === projectId);
    project.pic = pic;
    saveData();
    renderProjects();
    renderCalendar();
    checkNotifications();
    openTabs.forEach(tabId => {
        if (tabId.startsWith('project-')) {
            const projId = tabId.replace('project-', '');
            renderGanttChart(projId);
        }
    });
}

function assignTaskPIC(projectId, taskIdx, parentIdx, pic) {
    const project = projects.find(p => p.id === projectId);
    const task = parentIdx === null ? project.tasks[taskIdx] : project.tasks[taskIdx].subTasks[parentIdx];
    task.pic = pic;
    saveData();
    renderProjects();
    renderCalendar();
    checkNotifications();
    openTabs.forEach(tabId => {
        if (tabId.startsWith('project-')) {
            const projId = tabId.replace('project-', '');
            renderGanttChart(projId);
        }
    });
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
    saveData();
    renderProjects();
    renderCalendar();
    checkNotifications();
    openTabs.forEach(tabId => {
        if (tabId.startsWith('project-')) {
            const projId = tabId.replace('project-', '');
            renderGanttChart(projId);
        }
    });
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
    saveData();
    renderProjects();
    renderCalendar();
    checkNotifications();
    openTabs.forEach(tabId => {
        if (tabId.startsWith('project-')) {
            const projId = tabId.replace('project-', '');
            renderGanttChart(projId);
        }
    });
}

function updateTabs() {
    const tabsDiv = document.querySelector('.tabs');
    const projectTabsDiv = document.querySelector('.project-tabs');
    if (!tabsDiv || !projectTabsDiv) return;

    tabsDiv.innerHTML = `
        <button class="tab-button ${openTabs[0] === 'dashboard' ? 'active' : ''}" onclick="showTab('dashboard')" role="tab" aria-selected="${openTabs[0] === 'dashboard'}" aria-controls="dashboard">Dashboard</button>
        <button class="tab-button ${openTabs[0] === 'calendar' ? 'active' : ''}" onclick="showTab('calendar')" role="tab" aria-selected="${openTabs[0] === 'calendar'}" aria-controls="calendar">Calendar</button>
        <button class="tab-button ${openTabs[0] === 'settings' ? 'active' : ''}" onclick="showTab('settings')" role="tab" aria-selected="${openTabs[0] === 'settings'}" aria-controls="settings">Settings</button>
    `;

    projectTabsDiv.innerHTML = '';
    openTabs.forEach(tabId => {
        if (tabId.startsWith('project-')) {
            const projectId = tabId.replace('project-', '');
            const project = projects.find(p => p.id === projectId);
            if (project) {
                projectTabsDiv.innerHTML += `
                    <button class="tab-button ${openTabs[0] === tabId ? 'active' : ''}" onclick="showTab('${tabId}')" role="tab" aria-selected="${openTabs[0] === tabId}" aria-controls="${tabId}">
                        ${project.name}
                        <span onclick="closeProjectTab('${tabId}', event)">×</span>
                    </button>
                `;
            }
        }
    });
}

function showTab(tabId) {
    const previousTab = openTabs[0];
    if (tabId.startsWith('project-') && !openTabs.includes(tabId)) {
        openTabs.push(tabId);
    }
    
    openTabs = [tabId, ...openTabs.filter(t => t !== tabId && t !== previousTab), previousTab].filter(t => t);

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.action-bar').forEach(bar => {
        bar.style.display = 'none';
    });

    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.add('active');
        const actionBar = activeTab.querySelector('.action-bar');
        if (actionBar) {
            actionBar.style.display = 'flex';
        }
    }

    updateTabs();

    if (tabId.startsWith('project-')) {
        const projectId = tabId.replace('project-', '');
        renderGanttChart(projectId);
    } else if (tabId === 'calendar') {
        renderCalendar();
    } else if (tabId === 'settings') {
        renderPICList();
    } else {
        renderProjects();
    }
}

function openProjectTab(projectId) {
    const tabId = `project-${projectId}`;
    if (!openTabs.includes(tabId)) {
        openTabs.push(tabId);
        const tabContent = document.createElement('div');
        tabContent.id = tabId;
        tabContent.className = 'tab-content';
        tabContent.innerHTML = `
            <h2>${projects.find(p => p.id === projectId).name}</h2>
            <div class="action-bar">
                <button class="button" onclick="printGanttSchedule('${projectId}')">Print Schedule</button>
            </div>
            <div class="gantt-note">Note: Drag the handles to reschedule. Click the 📝 icon to add/edit notes. Drag tasks to reorder or nest them.</div>
            <div class="gantt-timeline-header" id="gantt-timeline-${projectId}"></div>
            <table class="gantt-table">
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Timeline</th>
                    </tr>
                </thead>
                <tbody id="gantt-${projectId}"></tbody>
            </table>
        `;
        document.querySelector('.container').appendChild(tabContent);
    }
    showTab(tabId);
}

function closeProjectTab(tabId, event) {
    event.stopPropagation();
    openTabs = openTabs.filter(t => t !== tabId);
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
        tabContent.remove();
    }
    showTab('dashboard');
}

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
        renderProjects();
        checkNotifications();
    }
}

function deleteProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (project && confirm(`Are you sure you want to delete the project "${project.name}"?`)) {
        undoStack.push({ action: 'deleteProject', data: { project: { ...project }, index: projects.findIndex(p => p.id === projectId) } });
        projects = projects.filter(p => p.id !== projectId);
        openTabs = openTabs.filter(t => t !== `project-${projectId}`);
        const tabContent = document.getElementById(`project-${projectId}`);
        if (tabContent) tabContent.remove();
        saveData();
        renderProjects();
        updateTabs();
        showTab('dashboard');
        showUndoButton();
        checkNotifications();
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

            const startDateObj = new Date(startDate);
            const dueDateObj = new Date(dueDate);
            if (isNaN(startDateObj.getTime()) || isNaN(dueDateObj.getTime()) || startDateObj > dueDateObj) {
                alert('Invalid dates. Start date must be before or equal to due date.');
                return;
            }

            const newTask = {
                name: taskName,
                due: dueDate,
                startDate: startDate,
                subTasks: [],
                notes: notes || '',
                expanded: false,
                pic: '',
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
                renderProjects();
                renderCalendar();
                checkNotifications();
                if (openTabs.includes(`project-${projectId}`)) {
                    renderGanttChart(projectId);
                }
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
    renderProjects();
    renderCalendar();
    checkNotifications();
    if (openTabs.includes(`project-${projectId}`)) {
        renderGanttChart(projectId);
    }
    showUndoButton();
}

function editTask(projectId, taskIdx, parentIdx = null) {
    const project = projects.find(p => p.id === projectId);
    const task = parentIdx === null ? project.tasks[taskIdx] : project.tasks[parentIdx].subTasks[taskIdx];
    const newName = prompt('Enter new task name:', task.name);
    if (newName) {
        task.name = newName;
        saveData();
        renderProjects();
        renderCalendar();
        checkNotifications();
        if (openTabs.includes(`project-${projectId}`)) {
            renderGanttChart(projectId);
        }
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
            const newDueDate = new Date(dueDateInput);
            const newStartDate = new Date(startDateInput);
            if (newDueDate < newStartDate) {
                alert('Due date cannot be before start date.');
                return;
            }
            if (task.subTasks.length > 0) {
                const latestSubTaskDue = task.subTasks.reduce((latest, subTask) => {
                    const subDue = new Date(subTask.due);
                    return subDue > latest ? subDue : latest;
                }, new Date(task.subTasks[0].due));
                if (newDueDate < latestSubTaskDue) {
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
            renderProjects();
            renderCalendar();
            checkNotifications();
            if (openTabs.includes(`project-${projectId}`)) {
                renderGanttChart(projectId);
            }
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

function setupContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });
    document.addEventListener('contextmenu', (e) => {
        if (!e.target.closest('td') && !e.target.closest('.task-bar')) {
            contextMenu.style.display = 'none';
        }
    });
}

function showContextMenu(event, type, projectId, taskIdx = null, subIdx = null) {
    event.preventDefault();
    contextTarget = { type, projectId, taskIdx, subIdx };
    const contextMenu = document.getElementById('context-menu');
    contextMenu.innerHTML = '';

    if (type === 'project') {
        contextMenu.innerHTML = `
            <div class="menu-item" onclick="addTask('${projectId}')">Add Task</div>
            <div class="menu-item" onclick="deleteProject('${projectId}')">Delete Project</div>
            <div class="menu-item" onclick="toggleAllTasks('${projectId}')">Toggle All Tasks</div>
        `;
    } else if (type === 'task') {
        contextMenu.innerHTML = `
            <div class="menu-item" onclick="addTask('${projectId}', ${taskIdx})">Add Sub-Task</div>
            <div class="menu-item" onclick="editTask('${projectId}', ${taskIdx}, ${subIdx})">Edit Task</div>
            <div class="menu-item" onclick="editTaskDueDate('${projectId}', ${taskIdx}, ${subIdx})">Edit Dates</div>
            <div class="menu-item" onclick="deleteTask('${projectId}', ${taskIdx}, ${subIdx})">Delete Task</div>
        `;
    } else if (type === 'subTask') {
        contextMenu.innerHTML = `
            <div class="menu-item" onclick="editTask('${projectId}', ${subIdx}, ${taskIdx})">Edit Sub-Task</div>
            <div class="menu-item" onclick="editTaskDueDate('${projectId}', ${subIdx}, ${taskIdx})">Edit Dates</div>
            <div class="menu-item" onclick="deleteTask('${projectId}', ${subIdx}, ${taskIdx})">Delete Sub-Task</div>
        `;
    } else if (type === 'ganttTask') {
        contextMenu.innerHTML = `
            <div class="menu-item" onclick="addTask('${projectId}', ${taskIdx})">Add Sub-Task</div>
            <div class="menu-item" onclick="editTask('${projectId}', ${taskIdx}, ${subIdx})">Edit Task</div>
            <div class="menu-item" onclick="editTaskDueDate('${projectId}', ${taskIdx}, ${subIdx})">Edit Dates</div>
            <div class="menu-item" onclick="deleteTask('${projectId}', ${taskIdx}, ${subIdx})">Delete Task</div>
        `;
    } else if (type === 'ganttSubTask') {
        contextMenu.innerHTML = `
            <div class="menu-item" onclick="editTask('${projectId}', ${subIdx}, ${taskIdx})">Edit Sub-Task</div>
            <div class="menu-item" onclick="editTaskDueDate('${projectId}', ${subIdx}, ${taskIdx})">Edit Dates</div>
            <div class="menu-item" onclick="deleteTask('${projectId}', ${subIdx}, ${taskIdx})">Delete Sub-Task</div>
        `;
    }

    contextMenu.style.display = 'block';
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
}

function renderCalendar() {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const monthYear = document.getElementById('month-year');
    if (monthYear) {
        monthYear.textContent = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
        console.error('month-year element not found');
    }

    if (calendarView === 'full') {
        const calendarFull = document.getElementById('calendar-full');
        const calendarList = document.getElementById('calendar-list');
        if (calendarFull && calendarList) {
            calendarFull.style.display = 'block';
            calendarList.style.display = 'none';
            renderFullCalendar(monthStart, monthEnd);
        } else {
            console.error('calendar-full or calendar-list element not found');
        }
    } else {
        const calendarFull = document.getElementById('calendar-full');
        const calendarList = document.getElementById('calendar-list');
        if (calendarFull && calendarList) {
            calendarFull.style.display = 'none';
            calendarList.style.display = 'block';
            renderListCalendar(monthStart, monthEnd);
        } else {
            console.error('calendar-full or calendar-list element not found');
        }
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
    const tbody = document.getElementById('calendar-body');
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
                td.style.backgroundColor = 'rgba(0, 204, 0, 0.3)';
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
    const list = document.getElementById('calendar-list');
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
    const toggleBtn = document.getElementById('toggle-view-btn');
    if (toggleBtn) {
        toggleBtn.textContent = calendarView === 'full' ? 'Full View' : 'List View';
    }
    renderCalendar();
}

function renderGanttChart(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const tbody = document.getElementById(`gantt-${projectId}`);
    const timelineHeader = document.getElementById(`gantt-timeline-${projectId}`);
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
            <td>
                ${task.name}
                ${task.notes ? `<span class="notes-icon has-notes" onclick="openNotesPopup('${projectId}', ${taskIdx}, null, event)">📝</span>` : `<span class="notes-icon" onclick="openNotesPopup('${projectId}', ${taskIdx}, null, event)">📝</span>`}
            </td>
            <td>
                <div class="gantt-container">
                    <div class="task-bar" style="left: ${leftPercent}%; width: ${widthPercent}%; background: ${isOverdue ? '#ff0000' : '#004EA1'};" data-project-id="${projectId}" data-task-idx="${taskIdx}" data-sub-idx="null" data-total-days="${totalDays}" data-min-date="${minDate.toISOString().split('T')[0]}" oncontextmenu="showContextMenu(event, 'ganttTask', '${projectId}', ${taskIdx}, null)">
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
                <td style="padding-left: 30px;">
                    ${subTask.name}
                    ${subTask.notes ? `<span class="notes-icon has-notes" onclick="openNotesPopup('${projectId}', ${taskIdx}, ${subIdx}, event)">📝</span>` : `<span class="notes-icon" onclick="openNotesPopup('${projectId}', ${taskIdx}, ${subIdx}, event)">📝</span>`}
                </td>
                <td>
                    <div class="gantt-container">
                        <div class="task-bar" style="left: ${subLeftPercent}%; width: ${subWidthPercent}%; background: ${subIsOverdue ? '#ff0000' : '#004EA1'};" data-project-id="${projectId}" data-task-idx="${taskIdx}" data-sub-idx="${subIdx}" data-total-days="${totalDays}" data-min-date="${minDate.toISOString().split('T')[0]}" oncontextmenu="showContextMenu(event, 'ganttSubTask', '${projectId}', ${taskIdx}, ${subIdx})">
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
    let offsetDays = 0; // Track extension beyond minDate

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
        task.startDate = newStartDate.toISOString().split('T')[0];

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
        saveData();
        renderGanttChart(projectId);
        renderCalendar();
        renderProjects();
        checkNotifications();
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
            renderGanttChart(projectId);
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
        task.due = newEndDate.toISOString().split('T')[0];

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

        saveData();
        renderGanttChart(projectId);
        renderCalendar();
        renderProjects();
        checkNotifications();
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
            renderGanttChart(projectId);
            return;
        }

        if (newLeft + initialWidth > 100) {
            const excessDays = ((newLeft + initialWidth - 100) / 100) * totalDays;
            const newMaxDate = new Date(minDate);
            newMaxDate.setDate(newMaxDate.getDate() + totalDays + Math.ceil(excessDays));
            totalDays = (newMaxDate - minDate) / (1000 * 60 * 60 * 24);
            taskBar.dataset.totalDays = totalDays;
            renderGanttChart(projectId);
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

        task.startDate = newStartDate.toISOString().split('T')[0];
        task.due = newEndDate.toISOString().split('T')[0];

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

        saveData();
        renderGanttChart(projectId);
        renderCalendar();
        renderProjects();
        checkNotifications();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// Drag-and-Drop Functions
function handleDragStart(event) {
    draggedItem = event.target;
    event.dataTransfer.setData('text/plain', ''); // Required for Firefox
    event.target.style.opacity = '0.5';
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(event) {
    event.preventDefault();
    const target = event.target.closest('tr');
    if (!target || target === draggedItem) return;

    const rect = target.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const height = rect.height;

    // Determine drop intent based on vertical position
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

    const sourceProjectId = draggedItem.dataset.projectId;
    const targetProjectId = target.dataset.projectId;
    if (sourceProjectId !== targetProjectId) return; // Prevent moving between projects

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

    // Remove the source task from its original location
    sourceArray.splice(sourceIndex, 1);

    try {
        if (target.classList.contains('drop-onto') && !isProjectDrop) {
            // Nest as sub-task
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
            // Reorder within the same level
            let targetArray, insertIdx;
            if (isProjectDrop) {
                targetArray = project.tasks;
                insertIdx = 0; // Drop at start if onto project
            } else if (targetIsSubtask) {
                targetArray = project.tasks[targetTaskIdx].subTasks;
                insertIdx = targetSubtaskIdx + (target.classList.contains('drop-below') ? 1 : 0);
                sourceTask.dependencies = ['parent'];
            } else {
                targetArray = project.tasks;
                insertIdx = targetTaskIdx + (target.classList.contains('drop-below') ? 1 : 0);
                sourceTask.dependencies = sourceTask.dependencies.filter(dep => dep !== 'parent');
            }

            // Adjust insertIdx if dropping after removal affects position
            if (targetArray === sourceArray && sourceIndex < insertIdx) {
                insertIdx--;
            }
            targetArray.splice(insertIdx, 0, sourceTask);
        }

        getProjectCompletion(project);
        saveData();
        renderProjects();
        renderCalendar();
        checkNotifications();
        if (openTabs.includes(`project-${sourceProjectId}`)) {
            renderGanttChart(sourceProjectId);
        }
    } catch (error) {
        console.error('Error during drop:', error);
        // Restore source task if drop fails
        sourceArray.splice(sourceIndex, 0, sourceTask);
        saveData();
        renderProjects();
        renderGanttChart(sourceProjectId);
    }
}

function handleDragEnd(event) {
    event.target.style.opacity = '1';
    document.querySelectorAll('tr').forEach(row => {
        row.classList.remove('drop-above', 'drop-onto', 'drop-below');
    });
    draggedItem = null;
}

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
    renderGanttChart(projectId);
    renderProjects();
    button.parentElement.remove();
}

function renderPICList() {
    const tbody = document.getElementById('pic-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    picList.forEach((pic, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${pic}</td>
            <td><button class="button" onclick="deletePIC(${index})">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function addPIC() {
    const picName = prompt('Enter Person-in-Charge name:');
    if (picName && !picList.includes(picName)) {
        picList.push(picName);
        saveData();
        renderPICList();
        populateFilterOptions();
    }
}

function deletePIC(index) {
    const pic = picList[index];
    if (confirm(`Are you sure you want to delete ${pic} from the PIC list?`)) {
        picList.splice(index, 1);
        projects.forEach(project => {
            if (project.pic === pic) project.pic = '';
            project.tasks.forEach(task => {
                if (task.pic === pic) task.pic = '';
                task.subTasks.forEach(subTask => {
                    if (subTask.pic === pic) subTask.pic = '';
                });
            });
        });
        saveData();
        renderPICList();
        renderProjects();
        renderCalendar();
        populateFilterOptions();
        checkNotifications();
        openTabs.forEach(tabId => {
            if (tabId.startsWith('project-')) {
                const projId = tabId.replace('project-', '');
                renderGanttChart(projId);
            }
        });
    }
}

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
                renderProjects();
                renderCalendar();
                populateFilterOptions();
                checkNotifications();
                openTabs.forEach(tabId => {
                    if (tabId.startsWith('project-')) {
                        const projId = tabId.replace('project-', '');
                        renderGanttChart(projId);
                    }
                });
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

function toggleTaskList() {
    const taskListPopup = document.getElementById('task-list-popup');
    if (!taskListPopup) return;

    isTaskListVisible = !isTaskListVisible;
    taskListPopup.style.display = isTaskListVisible ? 'block' : 'none';

    if (isTaskListVisible) {
        renderTaskList();
    }

    const toggleBtn = document.getElementById('toggle-task-list');
    if (toggleBtn) {
        toggleBtn.classList.toggle('active', isTaskListVisible);
    }
}

function closeTaskList() {
    const taskListPopup = document.getElementById('task-list-popup');
    if (!taskListPopup) return;

    isTaskListVisible = false;
    taskListPopup.style.display = 'none';

    const toggleBtn = document.getElementById('toggle-task-list');
    if (toggleBtn) {
        toggleBtn.classList.remove('active');
    }
}

function renderTaskList() {
    const taskListContent = document.getElementById('task-list-content');
    if (!taskListContent) return;

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
    sortedDates.forEach(date => {
        const tasks = tasksByDate[date];
        html += `<li><strong>${new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong><ul>`;
        tasks.forEach(task => {
            html += `<li class="${task.overdue ? 'overdue' : ''}"><a href="#" onclick="openProjectTab('${task.projectId}')">${task.project}: ${task.task}</a></li>`;
        });
        html += '</ul></li>';
    });
    html += '</ul>';
    taskListContent.innerHTML = html;
}

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

function saveModal(button, onSave) {
    onSave();
    button.closest('.modal').remove();
}

function showUndoButton() {
    const undoButton = document.getElementById('undo-button');
    if (undoButton) {
        undoButton.style.display = 'block';
        setTimeout(() => {
            undoButton.style.display = 'none';
        }, 5000);
    }
}

function undoLastAction() {
    const lastAction = undoStack.pop();
    if (!lastAction) return;

    if (lastAction.action === 'deleteProject') {
        projects.splice(lastAction.data.index, 0, lastAction.data.project);
        if (!openTabs.includes(`project-${lastAction.data.project.id}`)) {
            openTabs.push(`project-${lastAction.data.project.id}`);
        }
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
    renderProjects();
    renderCalendar();
    updateTabs();
    checkNotifications();
    openTabs.forEach(tabId => {
        if (tabId.startsWith('project-')) {
            const projId = tabId.replace('project-', '');
            renderGanttChart(projId);
        }
    });

    const undoButton = document.getElementById('undo-button');
    if (undoButton && undoStack.length === 0) {
        undoButton.style.display = 'none';
    }
}

// Notification Functions
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications.");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            document.getElementById('notification-permission').style.display = 'none';
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

// Print Gantt Schedule Function
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
    const currentDate = new Date('2025-03-25'); // Current date as per the system

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

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateTabs();
    renderProjects();
    renderCalendar();
    renderPICList();
    setupContextMenu();
    populateFilterOptions();
    showTab('dashboard');
    if (Notification.permission === "granted") {
        document.getElementById('notification-permission').style.display = 'none';
        checkNotifications();
    }
});