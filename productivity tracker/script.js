document.addEventListener('DOMContentLoaded', () => {
    // Motivation quotes
    const quotes = [
        "Small progress every day leads to big success.",
        "The secret of getting ahead is getting started.",
        "Don't watch the clock; do what it does. Keep going.",
        "Quality means doing it right when no one is looking.",
        "You don't have to be great to start, but you have to start to be great.",
        "Focus on being productive instead of busy.",
        "Action is the foundational key to all success."
    ];

    // DOM Elements
    const quoteElement = document.getElementById('motivation-quote');
    const taskForm = document.getElementById('task-form');
    const titleInput = document.getElementById('task-title');
    const categoryInput = document.getElementById('task-category');
    const priorityInput = document.getElementById('task-priority');
    const deadlineInput = document.getElementById('task-deadline');

    const pendingList = document.getElementById('pending-list');
    const completedList = document.getElementById('completed-list');
    const pendingEmpty = document.getElementById('pending-empty');
    const completedEmpty = document.getElementById('completed-empty');

    const totalTasksEl = document.getElementById('total-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const scoreValEl = document.getElementById('score-val');
    const clearCompletedBtn = document.getElementById('clear-completed');

    // State
    let tasks = JSON.parse(localStorage.getItem('smartPlannerTasks')) || [];
    let productivityScore = parseInt(localStorage.getItem('smartPlannerScore')) || 0;

    // Set Date input minimum to today
    const today = new Date().toISOString().split('T')[0];
    deadlineInput.setAttribute('min', today);
    deadlineInput.value = today;

    // Initialize Random Quote
    function setRandomQuote() {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteElement.textContent = `"${quotes[randomIndex]}"`;
    }
    setRandomQuote();

    // Prevent default form submission via enter key on input fields inside form if needed
    // The form event listener handles it.

    function saveState() {
        localStorage.setItem('smartPlannerTasks', JSON.stringify(tasks));
        localStorage.setItem('smartPlannerScore', productivityScore.toString());
        updateUI();
    }

    function generateId() {
        return Math.random().toString(36).substring(2, 9);
    }

    // Format Date nicely
    function formatDate(dateStr) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const date = new Date(dateStr);
        // Correct for timezone offset to show correct local date chosen
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        return date.toLocaleDateString('en-US', options);
    }

    function addTask(e) {
        e.preventDefault();

        const title = titleInput.value.trim();
        if (!title) return;

        const newTask = {
            id: generateId(),
            title: title,
            category: categoryInput.value,
            priority: priorityInput.value,
            deadline: deadlineInput.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);

        // Reset form except category/priority
        titleInput.value = '';
        deadlineInput.value = today;
        titleInput.focus();

        saveState();
    }

    function toggleTaskStatus(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const wasCompleted = task.completed;
            task.completed = !task.completed;

            // Update score
            if (task.completed && !wasCompleted) {
                productivityScore += 10;
            } else if (!task.completed && wasCompleted) {
                productivityScore = Math.max(0, productivityScore - 10);
            }

            saveState();
        }
    }

    function deleteTask(id) {
        const task = tasks.find(t => t.id === id);

        // Find if we should decrement score if deleting completed task
        // We'll optionally let users keep score of deleted tasks, 
        // but here we align score with active completed tasks.
        if (task && task.completed) {
            productivityScore = Math.max(0, productivityScore - 10);
        }

        tasks = tasks.filter(t => t.id !== id);
        saveState();
    }

    function clearCompleted() {
        // Find completed tasks
        const completedCount = tasks.filter(t => t.completed).length;
        if (completedCount > 0) {
            if (confirm(`Are you sure you want to remove ${completedCount} completed task(s)?`)) {
                // Keep only pending
                tasks = tasks.filter(t => !t.completed);
                saveState();
            }
        }
    }

    function createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = `task-card ${task.completed ? 'completed' : ''}`;
        taskEl.innerHTML = `
            <div class="task-content">
                <div class="custom-checkbox" onclick="toggleTaskStatus('${task.id}')">
                    <i class="fa-solid fa-check"></i>
                </div>
                <div class="task-details">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
                        <span class="badge category-${task.category.toLowerCase()}">${task.category}</span>
                        <span class="task-date"><i class="fa-regular fa-calendar-days"></i> ${formatDate(task.deadline)}</span>
                    </div>
                </div>
            </div>
            <button class="delete-btn" onclick="deleteTask('${task.id}')" title="Delete Task">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        return taskEl;
    }

    function updateUI() {
        const pendingTasks = tasks.filter(t => !t.completed);
        const completedTasks = tasks.filter(t => t.completed);

        // Update Stats
        totalTasksEl.textContent = tasks.length;
        pendingTasksEl.textContent = pendingTasks.length;
        completedTasksEl.textContent = completedTasks.length;
        scoreValEl.textContent = productivityScore;

        // Update Progress Bar
        const total = tasks.length;
        const complete = completedTasks.length;
        const progressPercent = total === 0 ? 0 : Math.round((complete / total) * 100);

        progressBar.style.width = `${progressPercent}%`;
        progressText.textContent = `${progressPercent}%`;

        // Render Lists
        pendingList.innerHTML = '';
        completedList.innerHTML = '';

        if (pendingTasks.length === 0) {
            pendingList.appendChild(pendingEmpty);
            pendingEmpty.style.display = 'block';
        } else {
            pendingEmpty.style.display = 'none';
            // Sort by nearest deadline, then by priority (High, Medium, Low)
            const priorityWeight = { 'High': 1, 'Medium': 2, 'Low': 3 };
            pendingTasks.sort((a, b) => {
                if (a.deadline !== b.deadline) {
                    return new Date(a.deadline) - new Date(b.deadline);
                }
                return priorityWeight[a.priority] - priorityWeight[b.priority];
            });
            pendingTasks.forEach(task => pendingList.appendChild(createTaskElement(task)));
        }

        if (completedTasks.length === 0) {
            completedList.appendChild(completedEmpty);
            completedEmpty.style.display = 'block';
        } else {
            completedEmpty.style.display = 'none';
            // Sort completed by most recently added/completed (can use reverse array order)
            [...completedTasks].reverse().forEach(task => completedList.appendChild(createTaskElement(task)));
        }
    }

    // Expose functions to window for inline event handlers
    window.toggleTaskStatus = toggleTaskStatus;
    window.deleteTask = deleteTask;

    // Event Listeners
    taskForm.addEventListener('submit', addTask);
    clearCompletedBtn.addEventListener('click', clearCompleted);

    // Initial render
    updateUI();
});
