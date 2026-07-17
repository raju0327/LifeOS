/* ==========================================================================
   LIFE OS - TASK MANAGER MODULE (js/tasks.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const TasksModule = {
    currentFilter: 'all',

    init() {
      this.setupForm();
      this.setupFilters();
      this.render();
    },

    onActive() {
      this.render();
    },

    render() {
      const tasks = this.app.state.tasks;
      const listContainer = document.getElementById('task-list-items');
      const emptyState = document.getElementById('tasks-empty-state');
      const countBadge = document.getElementById('task-count-badge');
      const listTitle = document.getElementById('current-task-list-title');

      // Filter tasks
      let filteredTasks = tasks;
      if (this.currentFilter === 'today') {
        filteredTasks = tasks.filter(t => t.category === 'today' && !t.completed);
        listTitle.textContent = "☀️ Today's Active Tasks";
      } else if (this.currentFilter === 'upcoming') {
        filteredTasks = tasks.filter(t => t.category === 'upcoming' && !t.completed);
        listTitle.textContent = "📅 Upcoming Tasks";
      } else if (this.currentFilter === 'inbox') {
        filteredTasks = tasks.filter(t => t.category === 'inbox' && !t.completed);
        listTitle.textContent = "📥 Inbox Tasks";
      } else if (this.currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
        listTitle.textContent = "✅ Completed Tasks";
      } else {
        listTitle.textContent = "📁 All Tasks";
      }

      // Update count badge
      countBadge.textContent = `${filteredTasks.length} Task${filteredTasks.length === 1 ? '' : 's'}`;

      if (filteredTasks.length === 0) {
        listContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }

      emptyState.classList.add('hidden');

      let html = '';
      filteredTasks.forEach(task => {
        const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        const categoryIcon = task.category === 'today' ? 'sun' : task.category === 'upcoming' ? 'calendar' : 'inbox';
        const checkboxClass = task.completed ? 'checked' : '';
        const taskCompletedClass = task.completed ? 'completed' : '';

        html += `
          <div class="task-item ${taskCompletedClass}" data-id="${task.id}">
            <div class="task-item-left">
              <div class="task-checkbox ${checkboxClass}" data-task-id="${task.id}">
                ${task.completed ? '<i data-lucide="check" style="width: 14px; height: 14px;"></i>' : ''}
              </div>
              <div class="task-details">
                <span class="task-text">${task.title}</span>
                <div class="task-meta">
                  <span class="priority-badge priority-${task.priority}">${priorityLabel}</span>
                  <span class="badge">
                    <i data-lucide="${categoryIcon}" style="width: 10px; height: 10px; display: inline; vertical-align: middle; margin-right: 2px;"></i>
                    ${task.category.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <div class="task-item-right">
              <span class="task-duration">
                <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                ${task.est || 30}m
              </span>
              <button class="icon-btn btn-delete-task" data-task-id="${task.id}" title="Delete Task">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `;
      });

      listContainer.innerHTML = html;

      // Create Lucide icons for the list items
      if (window.lucide) {
        window.lucide.createIcons();
      }

      this.setupListListeners();
    },

    setupForm() {
      const form = document.getElementById('task-form');
      const titleInput = document.getElementById('task-title');
      const priorityInput = document.getElementById('task-priority');
      const categoryInput = document.getElementById('task-category');
      const estInput = document.getElementById('task-est');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        const priority = priorityInput.value;
        const category = categoryInput.value;
        const est = parseInt(estInput.value) || 30;

        if (!title) return;

        const newTask = {
          id: Date.now(),
          title: title,
          priority: priority,
          category: category,
          est: est,
          completed: false
        };

        this.app.state.tasks.push(newTask);
        this.app.saveState();
        this.app.showToast(`Task added to ${category}!`, 'success');

        // Clear input field
        titleInput.value = '';
        this.render();
      });
    },

    setupFilters() {
      const filterBtns = document.querySelectorAll('.filter-btn');
      
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentFilter = btn.getAttribute('data-filter');
          this.render();
        });
      });
    },

    setupListListeners() {
      const listContainer = document.getElementById('task-list-items');

      // Completion toggle (click checkbox)
      listContainer.addEventListener('click', (e) => {
        const checkbox = e.target.closest('.task-checkbox');
        if (checkbox) {
          const taskId = parseInt(checkbox.getAttribute('data-task-id'));
          const task = this.app.state.tasks.find(t => t.id === taskId);
          if (task) {
            task.completed = !task.completed;
            this.app.saveState();
            this.app.showToast(task.completed ? 'Task completed! Good job.' : 'Task marked active.', 'success');
            this.render();
          }
        }
      });

      // Delete buttons
      listContainer.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-delete-task');
        if (deleteBtn) {
          const taskId = parseInt(deleteBtn.getAttribute('data-task-id'));
          const index = this.app.state.tasks.findIndex(t => t.id === taskId);

          if (index !== -1) {
            const title = this.app.state.tasks[index].title;
            this.app.state.tasks.splice(index, 1);
            
            // Clean up timeblock if this task was scheduled
            Object.keys(this.app.state.timeblocks).forEach(hour => {
              const block = this.app.state.timeblocks[hour];
              if (block.type === 'task' && block.id === taskId) {
                delete this.app.state.timeblocks[hour];
              }
            });

            this.app.saveState();
            this.app.showToast(`Deleted task "${title}"`, 'info');
            this.render();
          }
        }
      });
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('tasks', TasksModule);
  }
});
