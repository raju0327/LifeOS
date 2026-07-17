/* ==========================================================================
   LIFE OS - TIMEBLOCKER VIEW MODULE (js/timeblocks.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const TimeblocksModule = {
    selectedTaskId: null,
    hours: [
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", 
      "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", 
      "20:00", "21:00", "22:00"
    ],

    init() {
      this.render();
    },

    onActive() {
      // Clear selection on entry
      this.selectedTaskId = null;
      this.render();
    },

    render() {
      this.renderDateHeader();
      this.renderSchedule();
      this.renderUnscheduledPool();
    },

    renderDateHeader() {
      const dateEl = document.getElementById('timeblock-date');
      const now = new Date();
      const options = { weekday: 'long', month: 'short', day: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-US', options);
    },

    renderSchedule() {
      const container = document.getElementById('timeblock-slots-container');
      const timeblocks = this.app.state.timeblocks;
      const tasks = this.app.state.tasks;

      let html = '';

      this.hours.forEach(hour => {
        const block = timeblocks[hour];
        let slotContentHtml = '';

        if (block) {
          if (block.type === 'task') {
            const task = tasks.find(t => t.id === parseInt(block.id));
            if (task) {
              const priorityClass = `priority-${task.priority}`;
              slotContentHtml = `
                <div class="scheduled-item">
                  <div class="scheduled-item-content">
                    <span class="priority-badge ${priorityClass}">${task.priority.toUpperCase()}</span>
                    <span>${task.title}</span>
                    <span class="badge font-normal">${task.est}m</span>
                  </div>
                  <button class="btn-remove-schedule" data-hour="${hour}">
                    <i data-lucide="x"></i>
                  </button>
                </div>
              `;
            } else {
              // Task was deleted, clean up slot
              delete timeblocks[hour];
              slotContentHtml = `<span class="click-to-add-placeholder" data-hour="${hour}">+ Block custom agenda or click pool task to assign...</span>`;
            }
          } else {
            // Custom item
            slotContentHtml = `
              <div class="scheduled-item" style="border-left-color: var(--blue);">
                <div class="scheduled-item-content">
                  <span class="priority-badge" style="background: var(--blue-glow); color: var(--blue);">EVENT</span>
                  <span>${block.text}</span>
                </div>
                <button class="btn-remove-schedule" data-hour="${hour}">
                  <i data-lucide="x"></i>
                </button>
              </div>
            `;
          }
        } else {
          slotContentHtml = `<span class="click-to-add-placeholder" data-hour="${hour}">+ Block custom agenda or click pool task to assign...</span>`;
        }

        html += `
          <div class="timeblock-row">
            <div class="timeblock-label">${hour}</div>
            <div class="timeblock-slot" data-hour="${hour}">
              ${slotContentHtml}
            </div>
          </div>
        `;
      });

      container.innerHTML = html;

      // Enable Lucide icons for the schedule slots
      if (window.lucide) {
        window.lucide.createIcons();
      }

      this.setupScheduleListeners();
    },

    renderUnscheduledPool() {
      const poolContainer = document.getElementById('unscheduled-tasks-pool');
      const emptyState = document.getElementById('unscheduled-empty-state');
      const tasks = this.app.state.tasks;
      const timeblocks = this.app.state.timeblocks;

      // Extract IDs of scheduled tasks
      const scheduledIds = Object.keys(timeblocks)
        .filter(hour => timeblocks[hour].type === 'task')
        .map(hour => parseInt(timeblocks[hour].id));

      // Get unscheduled, non-completed tasks
      const unscheduledTasks = tasks.filter(t => !t.completed && !scheduledIds.includes(t.id));

      if (unscheduledTasks.length === 0) {
        poolContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }

      emptyState.classList.add('hidden');

      let html = '';
      unscheduledTasks.forEach(task => {
        const isSelected = this.selectedTaskId === task.id ? 'style="border-color: var(--primary); box-shadow: var(--shadow-neon);"' : '';
        html += `
          <div class="pool-task-item" data-id="${task.id}" ${isSelected}>
            <span>${task.title}</span>
            <span class="badge">${task.est}m</span>
          </div>
        `;
      });

      poolContainer.innerHTML = html;
      this.setupPoolListeners();
    },

    setupPoolListeners() {
      const items = document.querySelectorAll('.pool-task-item');
      items.forEach(item => {
        item.addEventListener('click', () => {
          const taskId = parseInt(item.getAttribute('data-id'));
          
          if (this.selectedTaskId === taskId) {
            // Toggle off
            this.selectedTaskId = null;
            this.app.showToast('Task deselected', 'info');
          } else {
            this.selectedTaskId = taskId;
            const task = this.app.state.tasks.find(t => t.id === taskId);
            this.app.showToast(`Selected "${task.title}". Click a time block to assign.`, 'info');
          }
          this.render();
        });
      });
    },

    setupScheduleListeners() {
      const container = document.getElementById('timeblock-slots-container');

      // Click to Assign Task or Write Custom Event
      container.addEventListener('click', (e) => {
        const slot = e.target.closest('.timeblock-slot');
        const removeBtn = e.target.closest('.btn-remove-schedule');

        // Handle deletion of scheduled event
        if (removeBtn) {
          e.stopPropagation();
          const hour = removeBtn.getAttribute('data-hour');
          delete this.app.state.timeblocks[hour];
          this.app.saveState();
          this.app.showToast('Timeblock removed', 'info');
          this.render();
          return;
        }

        // Handle assignment/creation when clicking slot itself
        if (slot) {
          const hour = slot.getAttribute('data-hour');
          const isSlotOccupied = this.app.state.timeblocks[hour];

          if (isSlotOccupied) return; // Can't block an already occupied slot

          if (this.selectedTaskId !== null) {
            // Assign selected task to this hour
            this.app.state.timeblocks[hour] = {
              type: 'task',
              id: this.selectedTaskId
            };

            const task = this.app.state.tasks.find(t => t.id === this.selectedTaskId);
            this.app.showToast(`Scheduled "${task.title}" at ${hour}`, 'success');
            this.selectedTaskId = null; // Reset selection
            this.app.saveState();
            this.render();
          } else {
            // No task selected, prompt for custom event
            const customEventText = prompt(`Enter custom agenda / event for ${hour}:`);
            if (customEventText && customEventText.trim()) {
              this.app.state.timeblocks[hour] = {
                type: 'custom',
                text: customEventText.trim()
              };
              this.app.showToast(`Created custom event at ${hour}`, 'success');
              this.app.saveState();
              this.render();
            }
          }
        }
      });
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('timeblocks', TimeblocksModule);
  }
});
