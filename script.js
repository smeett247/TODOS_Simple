class TodoApp {
    constructor() {
        this.storageKey = 'taskflow_todos';
        this.settingsKey = 'taskflow_settings';
        this.todos = this.loadTodos();
        this.settings = this.loadSettings();
        this.currentFilter = this.settings.lastFilter || 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    bindEvents() {
        const todoInput = document.getElementById('todoInput');
        const addBtn = document.getElementById('addBtn');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const clearCompleted = document.getElementById('clearCompleted');

        addBtn.addEventListener('click', () => this.addTodo());
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        clearCompleted.addEventListener('click', () => this.clearCompleted());
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();

        if (!text) return;

        // Remove demo data on first real task
        if (this.settings.showWelcome) {
            this.todos = [];
            this.settings.showWelcome = false;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.settings.totalTasksCreated++;
        input.value = '';
        this.saveTodos();
        this.render();
        this.updateStats();

        // Add animation effect
        input.style.transform = 'scale(0.95)';
        setTimeout(() => {
            input.style.transform = 'scale(1)';
        }, 150);
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            if (todo.completed) {
                todo.completedAt = new Date().toISOString();
                this.settings.totalTasksCompleted++;
            } else {
                delete todo.completedAt;
                this.settings.totalTasksCompleted--;
            }
            this.saveTodos();
            this.render();
            this.updateStats();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.render();
        this.updateStats();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.render();
    }

    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        this.todos = this.todos.filter(t => !t.completed);
        
        // Show success message
        this.showNotification(`Cleared ${completedCount} completed task${completedCount !== 1 ? 's' : ''}`);
        
        this.saveTodos();
        this.render();
        this.updateStats();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    render() {
        const todoList = document.getElementById('todoList');
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            todoList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-clipboard-list" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                    <p>No tasks ${this.currentFilter === 'all' ? 'yet' : this.currentFilter}</p>
                </div>
            `;
            return;
        }

        todoList.innerHTML = filteredTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                     onclick="app.toggleTodo(${todo.id})"></div>
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <button class="delete-btn" onclick="app.deleteTodo(${todo.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    updateStats() {
        const activeTodos = this.todos.filter(t => !t.completed).length;
        const completedTodos = this.todos.filter(t => t.completed).length;
        const todoCount = document.getElementById('todoCount');
        
        if (this.todos.length === 0) {
            todoCount.textContent = 'No tasks yet';
        } else {
            todoCount.innerHTML = `
                <span>${activeTodos} active</span>
                <span style="margin: 0 10px; opacity: 0.5;">•</span>
                <span>${completedTodos} completed</span>
            `;
        }
        
        // Show/hide clear completed button
        const clearBtn = document.getElementById('clearCompleted');
        clearBtn.style.display = completedTodos > 0 ? 'block' : 'none';
        
        // Update page title with task count
        document.title = activeTodos > 0 ? `(${activeTodos}) TaskFlow - Todo App` : 'TaskFlow - Todo App';
    }

    loadTodos() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            return JSON.parse(stored);
        }
        
        // Demo data for first-time users
        return [
            {
                id: Date.now() - 3000,
                text: "Welcome to TaskFlow! 🎉",
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() - 2000,
                text: "Try adding your first task below",
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() - 1000,
                text: "Click this circle to mark as complete",
                completed: true,
                createdAt: new Date().toISOString()
            }
        ];
    }

    loadSettings() {
        const stored = localStorage.getItem(this.settingsKey);
        return stored ? JSON.parse(stored) : {
            lastFilter: 'all',
            showWelcome: true,
            totalTasksCreated: 0,
            totalTasksCompleted: 0
        };
    }

    saveTodos() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.todos));
        this.saveSettings();
    }

    saveSettings() {
        this.settings.lastFilter = this.currentFilter;
        localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-weight: 500;
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the app
const app = new TodoApp();

// Add some nice touch interactions for mobile
document.addEventListener('touchstart', function() {}, {passive: true});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + / to focus input
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        document.getElementById('todoInput').focus();
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
        document.getElementById('todoInput').value = '';
        document.getElementById('todoInput').blur();
    }
});

// Auto-save every 30 seconds
setInterval(() => {
    if (app.todos.length > 0) {
        app.saveTodos();
    }
}, 30000);

// Show welcome message for new users
setTimeout(() => {
    if (app.settings.showWelcome && app.todos.length === 3) {
        app.showNotification('Welcome to TaskFlow! Your tasks are auto-saved.');
    }
}, 2000);