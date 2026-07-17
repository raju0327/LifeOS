/* ==========================================================================
   LIFE OS - PRODUCTIVITY & FOCUS CONTROLLER (js/productivity.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const ProductivityModule = {
    pomoInterval: null,
    currentTab: 'active', // active, completed
    audioCtx: null,       // Web Audio Context for synthesized sound notifications

    init() {
      this.setupTaskControls();
      this.setupProjectControls();
      this.setupCalendarControls();
      this.setupPomodoroTimer();
      this.setupFocusMode();
      this.render();
    },

    onActive() {
      this.render();
    },

    render() {
      this.renderTasksList();
      this.renderProjects();
      this.renderEvents();
      this.renderTimeblocks();
    },

    // --- Tasks Checklist ---
    setupTaskControls() {
      const form = document.getElementById('task-form');
      const titleInput = document.getElementById('task-title');
      const prioInput = document.getElementById('task-priority');
      const catInput = document.getElementById('task-category');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        if (!title) return;

        const newTask = {
          id: Date.now(),
          title: title,
          priority: prioInput.value,
          category: catInput.value,
          completed: false
        };

        this.app.state.tasks.push(newTask);
        this.app.saveState();
        this.app.showToast(`Task "${title}" created!`, 'success');
        
        titleInput.value = '';
        this.renderTasksList();
      });

      // Tabs click
      const tabs = document.querySelectorAll('.task-tab-btn');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.currentTab = tab.getAttribute('data-tab');
          this.renderTasksList();
        });
      });
    },

    renderTasksList() {
      const listContainer = document.getElementById('task-list-items');
      const badge = document.getElementById('task-count-badge');
      const tasks = this.app.state.tasks;

      let filtered = tasks.filter(t => this.currentTab === 'completed' ? t.completed : !t.completed);
      badge.textContent = `${filtered.length} Task${filtered.length === 1 ? '' : 's'}`;

      if (filtered.length === 0) {
        listContainer.innerHTML = `<div class="empty-state">No ${this.currentTab} tasks found.</div>`;
        return;
      }

      let html = '';
      filtered.forEach(task => {
        const checkboxClass = task.completed ? 'checked' : '';
        const priorityLabel = task.priority.toUpperCase();
        
        html += `
          <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-item-left">
              <div class="task-checkbox ${checkboxClass}" data-task-id="${task.id}">
                ${task.completed ? '<i data-lucide="check" style="width:12px;height:12px;"></i>' : ''}
              </div>
              <div class="task-details">
                <span class="task-text">${task.title}</span>
                <div class="task-meta">
                  <span class="priority-badge priority-${task.priority}">${priorityLabel}</span>
                  <span class="badge">${task.category.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <button class="icon-btn btn-delete-task" data-task-id="${task.id}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        `;
      });

      listContainer.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      // Listeners
      this.setupTaskItemListeners();
    },

    setupTaskItemListeners() {
      const list = document.getElementById('task-list-items');
      
      // Completion Checkboxes
      list.querySelectorAll('.task-checkbox').forEach(box => {
        box.addEventListener('click', () => {
          const taskId = parseInt(box.getAttribute('data-task-id'));
          const task = this.app.state.tasks.find(t => t.id === taskId);
          if (task) {
            task.completed = !task.completed;
            this.app.saveState();
            this.app.showToast(task.completed ? 'Task completed!' : 'Task marked active', 'success');
            this.renderTasksList();
          }
        });
      });

      // Deletion Buttons
      list.querySelectorAll('.btn-delete-task').forEach(btn => {
        btn.addEventListener('click', () => {
          const taskId = parseInt(btn.getAttribute('data-task-id'));
          const idx = this.app.state.tasks.findIndex(t => t.id === taskId);
          if (idx !== -1) {
            this.app.state.tasks.splice(idx, 1);
            this.app.saveState();
            this.app.showToast('Task removed', 'info');
            this.renderTasksList();
          }
        });
      });
    },

    // --- Projects & Milestones ---
    setupProjectControls() {
      const form = document.getElementById('project-form');
      const titleInput = document.getElementById('project-title');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        if (!title) return;

        const newProj = {
          id: Date.now(),
          title: title,
          status: 'Active',
          progress: 10
        };

        this.app.state.projects.push(newProj);
        this.app.saveState();
        this.app.showToast(`Project "${title}" added!`, 'success');
        
        titleInput.value = '';
        this.renderProjects();
      });
    },

    renderProjects() {
      const container = document.getElementById('projects-list-container');
      const projects = this.app.state.projects;

      if (projects.length === 0) {
        container.innerHTML = `<div class="empty-state" style="font-size:0.75rem;">No goals logged.</div>`;
        return;
      }

      let html = '';
      projects.forEach(p => {
        html += `
          <div class="project-item" data-proj-id="${p.id}">
            <div class="project-header-row">
              <span>${p.title}</span>
              <span class="badge" style="cursor:pointer;" class="btn-progress-bump">${p.progress}%</span>
            </div>
            <div class="budget-bar-container" style="cursor:pointer;" class="progress-bar-interactive">
              <div class="budget-bar" style="width: ${p.progress}%; background: var(--primary);"></div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;

      // Click to increment progress
      container.querySelectorAll('.project-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = parseInt(item.getAttribute('data-proj-id'));
          const proj = this.app.state.projects.find(p => p.id === id);
          if (proj) {
            proj.progress = proj.progress >= 100 ? 0 : proj.progress + 20;
            this.app.saveState();
            this.renderProjects();
          }
        });
      });
    },

    // --- Calendar Events ---
    setupCalendarControls() {
      const form = document.getElementById('event-form');
      const titleInput = document.getElementById('event-title');
      const dateInput = document.getElementById('event-date');
      const timeInput = document.getElementById('event-time');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        if (!title) return;

        const newEvent = {
          id: Date.now(),
          title: title,
          date: dateInput.value,
          time: timeInput.value
        };

        this.app.state.events.push(newEvent);
        
        // Push notification alert
        this.app.state.notifications.unshift({
          id: Date.now(),
          text: `Scheduled Reminder: "${title}" on ${dateInput.value}`,
          time: "Just now",
          read: false
        });

        this.app.saveState();
        this.app.showToast(`Scheduled event: "${title}"`, 'success');
        
        titleInput.value = '';
        this.renderEvents();
      });
    },

    renderEvents() {
      const container = document.getElementById('events-list-container');
      const events = this.app.state.events;

      if (events.length === 0) {
        container.innerHTML = `<div class="empty-state" style="font-size:0.75rem;">No appointments scheduled.</div>`;
        return;
      }

      let html = '';
      events.forEach(ev => {
        html += `
          <div class="mini-agenda-item" style="margin-top: 8px;">
            <span class="mini-agenda-time" style="color:var(--orange);">${ev.time}</span>
            <span class="mini-agenda-title" style="flex:1;">${ev.title} (${ev.date})</span>
            <button class="icon-btn btn-delete-event" data-event-id="${ev.id}" style="width:20px;height:20px;"><i data-lucide="x" style="width:10px;height:10px;"></i></button>
          </div>
        `;
      });
      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('.btn-delete-event').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-event-id'));
          const idx = this.app.state.events.findIndex(ev => ev.id === id);
          if (idx !== -1) {
            this.app.state.events.splice(idx, 1);
            this.app.saveState();
            this.renderEvents();
          }
        });
      });
    },

    // --- Hourly Schedule Timeblocker View ---
    renderTimeblocks() {
      const container = document.getElementById('planner-slots-container');
      const timeblocks = this.app.state.timeblocks;
      const tasks = this.app.state.tasks;
      const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

      let html = '';
      hours.forEach(hour => {
        const block = timeblocks[hour];
        let blockHtml = '';

        if (block) {
          if (block.type === 'task') {
            const task = tasks.find(t => t.id === parseInt(block.id));
            blockHtml = `
              <div class="scheduled-item">
                <span>🟢 ${task ? task.title : 'Task deleted'}</span>
                <button class="icon-btn btn-clear-block" data-hour="${hour}"><i data-lucide="x" style="width:12px;height:12px;"></i></button>
              </div>
            `;
          } else {
            blockHtml = `
              <div class="scheduled-item" style="border-left-color: var(--blue);">
                <span>🔌 ${block.text}</span>
                <button class="icon-btn btn-clear-block" data-hour="${hour}"><i data-lucide="x" style="width:12px;height:12px;"></i></button>
              </div>
            `;
          }
        } else {
          blockHtml = `<span class="click-to-add-placeholder" data-hour="${hour}">+ Block time or schedule custom activity...</span>`;
        }

        html += `
          <div class="timeblock-row">
            <div class="timeblock-label">${hour}</div>
            <div class="timeblock-slot" data-hour="${hour}">
              ${blockHtml}
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      this.setupTimeblockSlotListeners();
    },

    setupTimeblockSlotListeners() {
      const container = document.getElementById('planner-slots-container');
      
      container.addEventListener('click', (e) => {
        const slot = e.target.closest('.timeblock-slot');
        const clearBtn = e.target.closest('.btn-clear-block');

        if (clearBtn) {
          e.stopPropagation();
          const hour = clearBtn.getAttribute('data-hour');
          delete this.app.state.timeblocks[hour];
          this.app.saveState();
          this.renderTimeblocks();
          return;
        }

        if (slot) {
          const hour = slot.getAttribute('data-hour');
          if (this.app.state.timeblocks[hour]) return;

          const text = prompt(`Enter agenda event for ${hour}:`);
          if (text && text.trim()) {
            this.app.state.timeblocks[hour] = {
              type: 'custom',
              text: text.trim()
            };
            this.app.saveState();
            this.renderTimeblocks();
          }
        }
      });
    },

    // --- Pomodoro Engine ---
    setupPomodoroTimer() {
      const timeDisplay = document.getElementById('pomo-time-display');
      const startBtn = document.getElementById('pomo-start-btn');
      const pauseBtn = document.getElementById('pomo-pause-btn');
      const resetBtn = document.getElementById('pomo-reset-btn');
      
      const modeTabs = document.querySelectorAll('.pomo-tab-btn');

      const updateTimerDisplay = () => {
        const mins = String(Math.floor(this.app.state.pomodoro.timeRemaining / 60)).padStart(2, '0');
        const secs = String(this.app.state.pomodoro.timeRemaining % 60).padStart(2, '0');
        timeDisplay.textContent = `${mins}:${secs}`;
      };

      // Set initial values
      updateTimerDisplay();

      // Start
      startBtn.addEventListener('click', () => {
        if (this.app.state.pomodoro.isActive) return;
        
        this.app.state.pomodoro.isActive = true;
        this.app.showToast('Pomodoro session started!', 'success');
        
        this.pomoInterval = setInterval(() => {
          if (this.app.state.pomodoro.timeRemaining > 0) {
            this.app.state.pomodoro.timeRemaining--;
            updateTimerDisplay();
          } else {
            // Timer expired
            clearInterval(this.pomoInterval);
            this.app.state.pomodoro.isActive = false;
            this.triggerPomoAlertSound();
            this.app.showToast('Pomodoro session complete! Take a break.', 'info');
            this.app.state.pomodoro.timeRemaining = 300; // default break
            updateTimerDisplay();
          }
        }, 1000);
      });

      // Pause
      pauseBtn.addEventListener('click', () => {
        clearInterval(this.pomoInterval);
        this.app.state.pomodoro.isActive = false;
        this.app.showToast('Timer paused.', 'info');
      });

      // Reset
      resetBtn.addEventListener('click', () => {
        clearInterval(this.pomoInterval);
        this.app.state.pomodoro.isActive = false;
        const mode = this.app.state.pomodoro.mode;
        this.app.state.pomodoro.timeRemaining = mode === 'work' ? 1500 : mode === 'shortBreak' ? 300 : 900;
        updateTimerDisplay();
        this.app.showToast('Timer reset.', 'info');
      });

      // Mode toggles
      modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          modeTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          const mode = tab.getAttribute('data-mode');
          this.app.state.pomodoro.mode = mode;
          this.app.state.pomodoro.timeRemaining = mode === 'work' ? 1500 : mode === 'shortBreak' ? 300 : 900;
          
          clearInterval(this.pomoInterval);
          this.app.state.pomodoro.isActive = false;
          updateTimerDisplay();
        });
      });
    },

    // Play Synthesized sound using Web Audio Context
    triggerPomoAlertSound() {
      try {
        if (!this.audioCtx) {
          this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // Pitch (A5)
        gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
        
        osc.start();
        // Play beep sound for 0.4s
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);
        osc.stop(this.audioCtx.currentTime + 0.4);
      } catch (err) {
        console.error("Synthesizer failed to initialize", err);
      }
    },

    // --- Fullscreen Focus Mode Toggling ---
    setupFocusMode() {
      const toggleBtn = document.getElementById('toggle-focus-screen-btn');
      
      toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('fullscreen-focus');
        
        if (document.body.classList.contains('fullscreen-focus')) {
          toggleBtn.innerHTML = `<i data-lucide="minimize-2"></i> Exit Fullscreen Focus Mode`;
          this.app.showToast('Focus layout activated. Press escape or exit button to leave.', 'info');
        } else {
          toggleBtn.innerHTML = `<i data-lucide="maximize-2"></i> Enter Fullscreen Focus Layout`;
        }
        if (window.lucide) window.lucide.createIcons();
      });

      // Escape key exits focus mode
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('fullscreen-focus')) {
          document.body.classList.remove('fullscreen-focus');
          toggleBtn.innerHTML = `<i data-lucide="maximize-2"></i> Enter Fullscreen Focus Layout`;
          if (window.lucide) window.lucide.createIcons();
        }
      });

      // Ambient mock toggles
      const ambientBtns = document.querySelectorAll('.ambient-sound-btn');
      ambientBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          btn.classList.toggle('active');
          const isPlaying = btn.classList.contains('active');
          this.app.showToast(isPlaying ? `Playing ${btn.textContent} ambient soundtrack (Mock)` : `Paused ambient sound`, 'info');
        });
      });
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('tasks', ProductivityModule);
    window.LifeOS.registerModule('planner', ProductivityModule);
    window.LifeOS.registerModule('focus', ProductivityModule);
  }
});
