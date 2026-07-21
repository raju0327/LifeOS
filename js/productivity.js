/* ==========================================================================
   LIFE OS - PRODUCTIVITY & FOCUS CONTROLLER (js/productivity.js)
   Enterprise Tasks & Goals Dashboard & Real-Time State Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const ProductivityModule = {
    pomoInterval: null,
    currentTab: 'active', // active, completed
    activeSubtab: 'overview',
    currentCalendarDate: new Date(),
    audioCtx: null,       // Web Audio Context for synthesized sound notifications

    init() {
      this.initDefaultTasksAndGoals();
      this.setupTaskControls();
      this.setupModalControls();
      this.setupProjectControls();
      this.setupCalendarControls();
      this.setupPomodoroTimer();
      this.setupFocusMode();
      this.render();
    },

    onActive() {
      this.render();
    },

    initDefaultTasksAndGoals() {
      if (!this.app || !this.app.state) return;

      // Ensure state arrays are initialized without fake hardcoded sample items
      if (!Array.isArray(this.app.state.tasks)) {
        this.app.state.tasks = [];
      }
      if (!Array.isArray(this.app.state.goals)) {
        this.app.state.goals = [];
      }
      if (!Array.isArray(this.app.state.activityLog)) {
        this.app.state.activityLog = [];
      }
      if (!Array.isArray(this.app.state.events)) {
        this.app.state.events = [];
      }
    },

    switchSubtab(subtabName) {
      this.activeSubtab = subtabName;
      document.querySelectorAll('.tasks-subnav-btn').forEach(btn => {
        if (btn.getAttribute('data-subtab') === subtabName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      document.querySelectorAll('.tasks-subview-panel').forEach(panel => {
        if (panel.id === `tasks-subview-${subtabName}`) {
          panel.style.display = 'block';
          panel.classList.add('active');
        } else {
          panel.style.display = 'none';
          panel.classList.remove('active');
        }
      });

      this.renderSubtabContent(subtabName);
    },

    renderSubtabContent(subtabName) {
      if (subtabName === 'overview') {
        this.renderTasksKPIs();
        this.renderTasksList();
        this.renderTasksPriorityChart();
        this.renderWeeklyOverviewChart();
        this.renderUpcomingDeadlines();
        this.renderRecentActivity();
        this.renderGoalsOverview();
      } else if (subtabName === 'tasks') {
        this.renderFullTasksList();
      } else if (subtabName === 'goals') {
        this.renderFullGoalsGrid();
      } else if (subtabName === 'kanban') {
        this.renderKanbanBoard();
      } else if (subtabName === 'calendar') {
        this.renderTasksCalendar();
      } else if (subtabName === 'timeline') {
        this.renderTasksTimeline();
      } else if (subtabName === 'analytics') {
        this.renderTasksAnalytics();
      }
    },

    render() {
      this.initDefaultTasksAndGoals();
      this.renderSubtabContent(this.activeSubtab);
      this.renderProjects();
      this.renderEvents();
      this.renderTimeblocks();
      this.renderTasksCalendar();
    },

    // --- OVERVIEW TAB: TOP KPI SUMMARY CARDS ---
    renderTasksKPIs() {
      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];
      const goals = (this.app && this.app.state && Array.isArray(this.app.state.goals)) ? this.app.state.goals : [];

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.completed).length;
      const inProgressTasks = tasks.filter(t => !t.completed && (t.status === 'In Progress' || t.status === 'in_progress' || !t.status)).length;

      const now = new Date();
      const overdueTasks = tasks.filter(t => {
        if (t.completed || !t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d < now;
      }).length;

      let totalGoalTarget = 0;
      let totalGoalCurrent = 0;
      goals.forEach(g => {
        totalGoalTarget += Number(g.target) || 1;
        totalGoalCurrent += Number(g.current || g.saved) || 0;
      });
      const overallGoalsPct = totalGoalTarget > 0 ? Math.min(Math.round((totalGoalCurrent / totalGoalTarget) * 100), 100) : 0;

      const totalValEl = document.getElementById('kpi-total-tasks-val');
      const compValEl = document.getElementById('kpi-completed-tasks-val');
      const inProgValEl = document.getElementById('kpi-in-progress-val');
      const overdueValEl = document.getElementById('kpi-overdue-tasks-val');
      const goalsPctEl = document.getElementById('kpi-goals-progress-pct');

      if (totalValEl) totalValEl.textContent = totalTasks.toString();
      if (compValEl) compValEl.textContent = completedTasks.toString();
      if (inProgValEl) inProgValEl.textContent = inProgressTasks.toString();
      if (overdueValEl) overdueValEl.textContent = overdueTasks.toString();
      if (goalsPctEl) goalsPctEl.textContent = `${overallGoalsPct}%`;

      const ringContainer = document.getElementById('kpi-goals-donut-ring');
      if (ringContainer) {
        const circumference = 2 * Math.PI * 18;
        const dashArray = (overallGoalsPct / 100) * circumference;
        ringContainer.innerHTML = `
          <svg width="50" height="50" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="18" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="5" />
            <circle cx="25" cy="25" r="18" fill="none" stroke="#10b981" stroke-width="5"
              stroke-dasharray="${dashArray} ${circumference - dashArray}"
              stroke-dashoffset="0" transform="rotate(-90 25 25)" stroke-linecap="round" />
          </svg>
        `;
      }
    },

    // --- OVERVIEW TAB: MY TASKS LIST WITH FILTERS ---
    setupTaskControls() {
      const catFilter = document.getElementById('tasks-filter-category');
      const prioFilter = document.getElementById('tasks-filter-priority');

      if (catFilter) catFilter.addEventListener('change', () => this.renderTasksList());
      if (prioFilter) prioFilter.addEventListener('change', () => this.renderTasksList());
    },

    renderTasksList() {
      const container = document.getElementById('tasks-list-container');
      const badge = document.getElementById('task-count-badge');
      if (!container) return;

      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];

      const catFilterVal = (document.getElementById('tasks-filter-category')?.value || 'all').toLowerCase();
      const prioFilterVal = (document.getElementById('tasks-filter-priority')?.value || 'all').toLowerCase();

      let filtered = tasks.filter(t => {
        if (catFilterVal !== 'all' && (t.category || '').toLowerCase() !== catFilterVal) return false;
        if (prioFilterVal !== 'all' && (t.priority || '').toLowerCase() !== prioFilterVal) return false;
        return true;
      });

      if (badge) badge.textContent = `${filtered.length} Task${filtered.length === 1 ? '' : 's'}`;

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); font-size: 0.78rem; padding: 36px 12px; background: rgba(255,255,255,0.01); border-radius: var(--radius-sm); border: 1px dashed var(--glass-border);">
            <i class="fas fa-clipboard-list" style="font-size: 1.4rem; color: var(--primary); margin-bottom: 8px; display: block;"></i>
            <span>No tasks recorded in database.</span>
            <div style="margin-top: 10px;">
              <button onclick="window.LifeOS.modules.productivity.openAddTaskModal()" class="btn-primary-glow" style="font-size: 0.72rem; padding: 6px 12px; cursor: pointer; color: #fff; border-radius: var(--radius-sm);">+ Add New Task</button>
            </div>
          </div>
        `;
        return;
      }

      let html = '';
      filtered.forEach(t => {
        let catBg = 'rgba(168, 85, 247, 0.15)', catColor = '#a855f7';
        const catName = (t.category || 'Work');
        if (catName.toLowerCase() === 'work') { catBg = 'rgba(59, 130, 246, 0.15)'; catColor = '#3b82f6'; }
        else if (catName.toLowerCase() === 'health') { catBg = 'rgba(16, 185, 129, 0.15)'; catColor = '#10b981'; }
        else if (catName.toLowerCase() === 'personal') { catBg = 'rgba(245, 158, 11, 0.15)'; catColor = '#f59e0b'; }

        let prioBg = 'rgba(245, 158, 11, 0.15)', prioColor = '#f59e0b';
        const prioName = (t.priority || 'medium');
        if (prioName.toLowerCase() === 'high') { prioBg = 'rgba(239, 68, 68, 0.15)'; prioColor = '#ef4444'; }
        else if (prioName.toLowerCase() === 'low') { prioBg = 'rgba(16, 185, 129, 0.15)'; prioColor = '#10b981'; }

        let statusColor = t.completed ? '#10b981' : (t.status === 'In Progress' ? '#3b82f6' : '#94a3b8');

        let dateStr = 'No due date';
        if (t.dueDate) {
          const d = new Date(t.dueDate);
          dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        html += `
          <div class="task-row-item" data-id="${t.id}"
               style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--glass-border); transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="checkbox" ${t.completed ? 'checked' : ''} class="task-checkbox-toggle" data-id="${t.id}"
                     style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary);">
              <div>
                <div style="font-weight: 700; font-size: 0.8rem; color: var(--text-main); ${t.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${t.title}</div>
                <div style="font-size: 0.65rem; color: var(--text-muted);">${t.description || 'No details logged'}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge" style="background: ${catBg}; color: ${catColor}; font-size: 0.65rem; font-weight: 700;">${catName}</span>
              <span class="badge" style="background: ${prioBg}; color: ${prioColor}; font-size: 0.65rem; font-weight: 700;">${prioName.charAt(0).toUpperCase() + prioName.slice(1)}</span>
              <div style="text-align: right; min-width: 80px;">
                <span style="font-size: 0.65rem; color: var(--text-muted); display: block;">${dateStr}</span>
                <span style="font-size: 0.62rem; font-weight: 700; color: ${statusColor};">${t.completed ? 'Completed' : (t.status || 'Pending')}</span>
              </div>
              <i class="fas fa-trash-alt btn-delete-task-item" data-id="${t.id}" style="color: var(--red); font-size: 0.75rem; cursor: pointer; margin-left: 6px;" title="Delete task"></i>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;

      container.querySelectorAll('.task-checkbox-toggle').forEach(box => {
        box.addEventListener('change', () => {
          const id = box.getAttribute('data-id');
          const t = tasks.find(item => item.id.toString() === id.toString());
          if (t) {
            t.completed = box.checked;
            t.status = t.completed ? 'Completed' : 'Pending';
            this.app.saveState();
            this.app.showToast(t.completed ? `Task "${t.title}" completed!` : `Task "${t.title}" marked active`, 'success');
            this.render();
          }
        });
      });

      container.querySelectorAll('.btn-delete-task-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const idx = tasks.findIndex(item => item.id.toString() === id.toString());
          if (idx !== -1) {
            const removed = tasks.splice(idx, 1)[0];
            this.app.saveState();
            this.app.showToast(`Deleted task "${removed.title}"`, 'info');
            this.render();
          }
        });
      });
    },

    // --- OVERVIEW TAB: DONUT & BAR CHARTS ---
    renderTasksPriorityChart() {
      const donutContainer = document.getElementById('tasks-priority-donut-container');
      const legendContainer = document.getElementById('tasks-priority-legend-container');
      if (!donutContainer || !legendContainer) return;

      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];

      if (tasks.length === 0) {
        donutContainer.innerHTML = `
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>
            <text x="50" y="52" font-size="12" font-weight="700" fill="#94a3b8" text-anchor="middle">0</text>
          </svg>
        `;
        legendContainer.innerHTML = `<span style="color:var(--text-muted); font-size:0.7rem;">No task priority records.</span>`;
        return;
      }

      const total = tasks.length;
      const highCount = tasks.filter(t => (t.priority || '').toLowerCase() === 'high').length;
      const medCount = tasks.filter(t => (t.priority || '').toLowerCase() === 'medium').length;
      const lowCount = tasks.filter(t => (t.priority || '').toLowerCase() === 'low').length;
      const noPrioCount = tasks.filter(t => !t.priority || t.priority === 'none' || t.priority === 'normal').length;

      const highPct = Math.round((highCount / total) * 100);
      const medPct = Math.round((medCount / total) * 100);
      const lowPct = Math.round((lowCount / total) * 100);
      const noPrioPct = Math.max(0, 100 - highPct - medPct - lowPct);

      const circumference = 2 * Math.PI * 35;
      let strokeOffset = 0;

      let donutSvg = `<svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>`;

      const slices = [
        { count: highCount, pct: highPct, color: '#ef4444' },
        { count: medCount, pct: medPct, color: '#f59e0b' },
        { count: lowCount, pct: lowPct, color: '#10b981' },
        { count: noPrioCount, pct: noPrioPct, color: '#3b82f6' }
      ];

      slices.forEach(s => {
        if (s.pct > 0) {
          const dashArray = (s.pct / 100) * circumference;
          donutSvg += `
            <circle cx="50" cy="50" r="35" fill="none" stroke="${s.color}" stroke-width="12"
              stroke-dasharray="${dashArray} ${circumference - dashArray}"
              stroke-dashoffset="-${strokeOffset}"
              transform="rotate(-90 50 50)"/>
          `;
          strokeOffset += dashArray;
        }
      });

      donutSvg += `
        <text x="50" y="48" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">${total}</text>
        <text x="50" y="62" font-size="7" fill="#94a3b8" text-anchor="middle">Total</text>
      </svg>`;

      donutContainer.innerHTML = donutSvg;

      legendContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:var(--text-muted); display:flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:#ef4444;"></span> High Priority</span>
          <span style="font-weight:700; color:var(--text-main);">${highCount} (${highPct}%)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:var(--text-muted); display:flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:#f59e0b;"></span> Medium Priority</span>
          <span style="font-weight:700; color:var(--text-main);">${medCount} (${medPct}%)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:var(--text-muted); display:flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:#10b981;"></span> Low Priority</span>
          <span style="font-weight:700; color:var(--text-main);">${lowCount} (${lowPct}%)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:var(--text-muted); display:flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:#3b82f6;"></span> No Priority</span>
          <span style="font-weight:700; color:var(--text-main);">${noPrioCount} (${noPrioPct}%)</span>
        </div>
      `;
    },

    renderWeeklyOverviewChart() {
      const container = document.getElementById('tasks-weekly-bar-container');
      if (!container) return;

      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const values = [0, 0, 0, 0, 0, 0, 0];

      tasks.forEach(t => {
        if (t.dueDate) {
          const d = new Date(t.dueDate);
          let dayIdx = d.getDay() - 1;
          if (dayIdx < 0) dayIdx = 6;
          values[dayIdx]++;
        }
      });

      const maxVal = Math.max(...values, 5);

      let barSvg = `<svg width="100%" height="100%" viewBox="0 0 280 90" preserveAspectRatio="none">`;

      days.forEach((day, idx) => {
        const h = Math.round((values[idx] / maxVal) * 60);
        const x = idx * 40 + 12;
        barSvg += `
          <rect x="${x}" y="${70 - h}" width="16" height="${h}" fill="#a855f7" rx="3" />
          <text x="${x + 8}" y="84" font-size="8" fill="#94a3b8" text-anchor="middle">${day}</text>
        `;
      });

      barSvg += `</svg>`;
      container.innerHTML = barSvg;
    },

    renderUpcomingDeadlines() {
      const container = document.getElementById('tasks-upcoming-deadlines-container');
      if (!container) return;

      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];

      const now = new Date();
      let upcoming = tasks.filter(t => !t.completed).sort((a, b) => {
        const da = a.dueDate ? new Date(a.dueDate) : new Date('2099-12-31');
        const db = b.dueDate ? new Date(b.dueDate) : new Date('2099-12-31');
        return da - db;
      });

      if (upcoming.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 20px 0;">No upcoming task deadlines logged.</div>`;
        return;
      }

      let html = '';
      upcoming.slice(0, 4).forEach(item => {
        const d = item.dueDate ? new Date(item.dueDate) : new Date();
        const diffTime = d.getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        let badgeBg = 'rgba(59, 130, 246, 0.15)', badgeColor = '#3b82f6';
        if (daysLeft <= 2) { badgeBg = 'rgba(239, 68, 68, 0.15)'; badgeColor = '#ef4444'; }
        else if (daysLeft <= 5) { badgeBg = 'rgba(245, 158, 11, 0.15)'; badgeColor = '#f59e0b'; }

        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 26px; height: 26px; border-radius: 6px; background: rgba(168, 85, 247, 0.15); color: #a855f7; display: flex; align-items: center; justify-content: center; font-size: 0.72rem;">
                <i class="fas fa-tasks"></i>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 0.75rem; color: var(--text-main);">${item.title}</div>
                <div style="font-size: 0.62rem; color: var(--text-muted);">${dateStr}</div>
              </div>
            </div>
            <span class="badge" style="background: ${badgeBg}; color: ${badgeColor}; font-size: 0.62rem; font-weight: 700;">${daysLeft} days left</span>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    renderRecentActivity() {
      const container = document.getElementById('tasks-recent-activity-container');
      if (!container) return;

      const log = (this.app && this.app.state && Array.isArray(this.app.state.activityLog)) ? this.app.state.activityLog : [];

      if (log.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 20px 0;">No activity logged yet.</div>`;
        return;
      }

      let html = '';
      log.slice(0, 4).forEach(act => {
        html += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 24px; height: 24px; border-radius: 6px; background: ${act.color || '#a855f7'}22; color: ${act.color || '#a855f7'}; display: flex; align-items: center; justify-content: center; font-size: 0.7rem;">
                <i class="fas ${act.icon || 'fa-info-circle'}"></i>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 0.75rem; color: var(--text-main);">${act.title}</div>
                <div style="font-size: 0.62rem; color: var(--text-muted);">${act.detail}</div>
              </div>
            </div>
            <span style="font-size: 0.62rem; color: var(--text-muted);">${act.timestamp}</span>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    renderGoalsOverview() {
      const container = document.getElementById('goals-overview-grid-container');
      if (!container) return;

      const goals = (this.app && this.app.state && Array.isArray(this.app.state.goals)) ? this.app.state.goals : [];

      if (goals.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 40px 12px; background: rgba(255,255,255,0.01); border-radius: var(--radius-sm); border: 1px dashed var(--glass-border); grid-column: span 4;">
            <i class="fas fa-bullseye" style="font-size: 1.5rem; color: var(--primary); margin-bottom: 8px; display: block;"></i>
            <span>No strategic goals recorded in database.</span>
            <div style="margin-top: 10px;">
              <button onclick="window.LifeOS.modules.productivity.openAddGoalModal()" class="btn-primary-glow" style="font-size: 0.75rem; padding: 6px 14px; cursor: pointer; color: #fff; border-radius: var(--radius-sm);">+ Add Goal</button>
            </div>
          </div>
        `;
        return;
      }

      let html = '';
      goals.forEach(g => {
        const targetVal = Number(g.target) || 1;
        const currentVal = Number(g.current || g.saved) || 0;
        const pct = Math.min(Math.round((currentVal / targetVal) * 100), 100);

        const color = g.color || '#a855f7';
        const circumference = 2 * Math.PI * 22;
        const dashArray = (pct / 100) * circumference;

        let dateStr = 'No target date';
        if (g.targetDate) {
          const d = new Date(g.targetDate);
          dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        html += `
          <div class="glass-card" style="padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--glass-border); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div>
                  <h4 style="font-size: 0.88rem; font-weight: 700; margin: 0; color: var(--text-main);">${g.name}</h4>
                  <span style="font-size: 0.65rem; color: var(--text-muted);">${g.category || 'Goal'}</span>
                </div>
                <div style="width: 50px; height: 50px; flex-shrink: 0; position: relative; display: flex; align-items: center; justify-content: center;">
                  <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="5"/>
                    <circle cx="25" cy="25" r="22" fill="none" stroke="${color}" stroke-width="5"
                      stroke-dasharray="${dashArray} ${circumference - dashArray}" stroke-dashoffset="0"
                      transform="rotate(-90 25 25)" stroke-linecap="round"/>
                  </svg>
                  <span style="position: absolute; font-size: 0.68rem; font-weight: 800; color: var(--text-main);">${pct}%</span>
                </div>
              </div>
            </div>
            <div style="border-top: 1px solid var(--glass-border); padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 0.65rem; color: var(--text-muted);">
              <span><i class="fas fa-flag" style="color: ${color}; margin-right: 4px;"></i>Target: ${dateStr}</span>
              <span style="font-weight: 700; color: var(--text-main);">${g.details || (pct + '% done')}</span>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    // --- SUBTAB 1: DEDICATED TASKS DIRECTORY ---
    renderFullTasksList() {
      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];

      const totalValEl = document.getElementById('tab-tasks-kpi-total');
      const compValEl = document.getElementById('tab-tasks-kpi-completed');
      const inProgValEl = document.getElementById('tab-tasks-kpi-in-progress');
      const overdueValEl = document.getElementById('tab-tasks-kpi-overdue');

      const now = new Date();
      const completedCount = tasks.filter(t => t.completed).length;
      const inProgCount = tasks.filter(t => !t.completed && (t.status === 'In Progress' || !t.status)).length;
      const overdueCount = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < now).length;

      if (totalValEl) totalValEl.textContent = tasks.length.toString();
      if (compValEl) compValEl.textContent = completedCount.toString();
      if (inProgValEl) inProgValEl.textContent = inProgCount.toString();
      if (overdueValEl) overdueValEl.textContent = overdueCount.toString();

      const container = document.getElementById('full-tasks-list-container');
      if (!container) return;

      const catFilter = document.getElementById('tasks-tab-filter-cat')?.value || 'all';
      const prioFilter = document.getElementById('tasks-tab-filter-prio')?.value || 'all';
      const searchQuery = (document.getElementById('tasks-search-input')?.value || '').toLowerCase().trim();

      let filtered = tasks.filter(t => {
        if (catFilter !== 'all' && (t.category || '').toLowerCase() !== catFilter.toLowerCase()) return false;
        if (prioFilter !== 'all' && (t.priority || '').toLowerCase() !== prioFilter.toLowerCase()) return false;
        if (searchQuery && !(t.title || '').toLowerCase().includes(searchQuery) && !(t.description || '').toLowerCase().includes(searchQuery)) return false;
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 40px 10px; background: rgba(255,255,255,0.01); border-radius: var(--radius-sm); border: 1px dashed var(--glass-border);">
            <i class="fas fa-clipboard-list" style="font-size: 1.5rem; color: var(--primary); margin-bottom: 8px; display: block;"></i>
            <span>No tasks recorded in database.</span>
            <div style="margin-top: 10px;">
              <button onclick="window.LifeOS.modules.productivity.openAddTaskModal()" class="btn-primary-glow" style="font-size: 0.75rem; padding: 6px 14px; cursor: pointer; color: #fff; border-radius: var(--radius-sm);">+ Add New Task</button>
            </div>
          </div>
        `;
        return;
      }

      let html = '';
      filtered.forEach(t => {
        let catBg = 'rgba(168, 85, 247, 0.15)', catColor = '#a855f7';
        if ((t.category || '').toLowerCase() === 'work') { catBg = 'rgba(59, 130, 246, 0.15)'; catColor = '#3b82f6'; }
        else if ((t.category || '').toLowerCase() === 'health') { catBg = 'rgba(16, 185, 129, 0.15)'; catColor = '#10b981'; }

        let prioBg = 'rgba(245, 158, 11, 0.15)', prioColor = '#f59e0b';
        if ((t.priority || '').toLowerCase() === 'high') { prioBg = 'rgba(239, 68, 68, 0.15)'; prioColor = '#ef4444'; }
        else if ((t.priority || '').toLowerCase() === 'low') { prioBg = 'rgba(16, 185, 129, 0.15)'; prioColor = '#10b981'; }

        html += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="checkbox" ${t.completed ? 'checked' : ''} class="task-checkbox-toggle" data-id="${t.id}" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary);">
              <div>
                <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); ${t.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${t.title}</div>
                <div style="font-size: 0.68rem; color: var(--text-muted);">${t.description || 'No description logged'} &bull; Due ${t.dueDate || 'N/A'}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge" style="background: ${catBg}; color: ${catColor}; font-size: 0.65rem; font-weight: 700;">${t.category || 'Work'}</span>
              <span class="badge" style="background: ${prioBg}; color: ${prioColor}; font-size: 0.65rem; font-weight: 700;">${(t.priority || 'medium').toUpperCase()}</span>
              <i class="fas fa-trash-alt btn-delete-task-item" data-id="${t.id}" style="color: var(--red); font-size: 0.8rem; cursor: pointer; margin-left: 6px;"></i>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;

      // Event Listeners for Filters
      document.getElementById('tasks-tab-filter-cat')?.addEventListener('change', () => this.renderFullTasksList());
      document.getElementById('tasks-tab-filter-prio')?.addEventListener('change', () => this.renderFullTasksList());
      document.getElementById('tasks-search-input')?.addEventListener('input', () => this.renderFullTasksList());
    },

    // --- SUBTAB 2: STRATEGIC GOALS DIRECTORY ---
    renderFullGoalsGrid() {
      const goals = (this.app && this.app.state && Array.isArray(this.app.state.goals)) ? this.app.state.goals : [];

      const totalValEl = document.getElementById('tab-goals-kpi-total');
      const compValEl = document.getElementById('tab-goals-kpi-completed');
      const inProgValEl = document.getElementById('tab-goals-kpi-in-progress');

      const completedCount = goals.filter(g => (Number(g.current || g.saved) >= Number(g.target))).length;
      const inProgCount = goals.filter(g => (Number(g.current || g.saved) < Number(g.target))).length;

      if (totalValEl) totalValEl.textContent = goals.length.toString();
      if (compValEl) compValEl.textContent = completedCount.toString();
      if (inProgValEl) inProgValEl.textContent = inProgCount.toString();

      const container = document.getElementById('full-goals-grid-container');
      if (!container) return;

      const searchQuery = (document.getElementById('goals-search-input')?.value || '').toLowerCase().trim();

      let filtered = goals.filter(g => {
        if (searchQuery && !(g.name || '').toLowerCase().includes(searchQuery) && !(g.category || '').toLowerCase().includes(searchQuery)) return false;
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 40px 12px; background: rgba(255,255,255,0.01); border-radius: var(--radius-sm); border: 1px dashed var(--glass-border);">
            <i class="fas fa-bullseye" style="font-size: 1.5rem; color: var(--primary); margin-bottom: 8px; display: block;"></i>
            <span>No strategic goals recorded in database.</span>
            <div style="margin-top: 10px;">
              <button onclick="window.LifeOS.modules.productivity.openAddGoalModal()" class="btn-primary-glow" style="font-size: 0.75rem; padding: 6px 14px; cursor: pointer; color: #fff; border-radius: var(--radius-sm);">+ Add Goal</button>
            </div>
          </div>
        `;
        return;
      }

      let html = '';
      filtered.forEach(g => {
        const targetVal = Number(g.target) || 1;
        const currentVal = Number(g.current || g.saved) || 0;
        const pct = Math.min(Math.round((currentVal / targetVal) * 100), 100);

        html += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
            <div style="display: flex; align-items: center; gap: 14px; flex-grow: 1;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(168, 85, 247, 0.15); color: #a855f7; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;"><i class="fas fa-bullseye"></i></div>
              <div style="flex-grow: 1; max-width: 400px;">
                <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-main);">${g.name}</div>
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
                  <div style="flex-grow: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; position: relative; overflow: hidden;">
                    <div style="width: ${pct}%; height: 100%; background: var(--primary); border-radius: 3px;"></div>
                  </div>
                  <span style="font-size: 0.72rem; font-weight: 800; color: var(--primary);">${pct}%</span>
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 14px;">
              <span class="badge" style="background: rgba(168, 85, 247, 0.15); color: #a855f7; font-weight: 700; font-size: 0.65rem;">${g.category || 'Personal'}</span>
              <span style="font-size: 0.7rem; color: var(--text-muted);">Target: ${g.targetDate || '31 Dec 2025'}</span>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
      document.getElementById('goals-search-input')?.addEventListener('input', () => this.renderFullGoalsGrid());
    },

    // --- SUBTAB 3: KANBAN BOARD ---
    renderKanbanBoard() {
      const todoEl = document.getElementById('kanban-todo-container');
      const inProgEl = document.getElementById('kanban-in-progress-container');
      const reviewEl = document.getElementById('kanban-review-container');
      const compEl = document.getElementById('kanban-completed-container');

      if (!todoEl || !inProgEl || !reviewEl || !compEl) return;

      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];

      let todoHtml = '', inProgHtml = '', reviewHtml = '', compHtml = '';
      let cTodo = 0, cProg = 0, cRev = 0, cDone = 0;

      tasks.forEach(t => {
        let prioColor = '#f59e0b';
        if ((t.priority || '').toLowerCase() === 'high') prioColor = '#ef4444';
        else if ((t.priority || '').toLowerCase() === 'low') prioColor = '#10b981';

        const cardHtml = `
          <div style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 8px;">
            <div style="font-weight: 700; font-size: 0.8rem; color: var(--text-main);">${t.title}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted);">${t.description || 'No description'}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
              <span class="badge" style="background: ${prioColor}22; color: ${prioColor}; font-size: 0.62rem; font-weight: 700;">${(t.priority || 'medium').toUpperCase()}</span>
              <span style="font-size: 0.62rem; color: var(--text-muted);">${t.dueDate || ''}</span>
            </div>
          </div>
        `;

        if (t.completed) {
          compHtml += cardHtml; cDone++;
        } else if (t.status === 'In Progress') {
          inProgHtml += cardHtml; cProg++;
        } else if (t.status === 'Review') {
          reviewHtml += cardHtml; cRev++;
        } else {
          todoHtml += cardHtml; cTodo++;
        }
      });

      document.getElementById('kanban-count-todo').textContent = cTodo.toString();
      document.getElementById('kanban-count-in-progress').textContent = cProg.toString();
      document.getElementById('kanban-count-review').textContent = cRev.toString();
      document.getElementById('kanban-count-done').textContent = cDone.toString();

      todoEl.innerHTML = todoHtml || `<span style="font-size:0.72rem; color:var(--text-muted); text-align:center; padding: 20px 0;">No tasks to do</span>`;
      inProgEl.innerHTML = inProgHtml || `<span style="font-size:0.72rem; color:var(--text-muted); text-align:center; padding: 20px 0;">No active tasks</span>`;
      reviewEl.innerHTML = reviewHtml || `<span style="font-size:0.72rem; color:var(--text-muted); text-align:center; padding: 20px 0;">No tasks in review</span>`;
      compEl.innerHTML = compHtml || `<span style="font-size:0.72rem; color:var(--text-muted); text-align:center; padding: 20px 0;">No finished tasks</span>`;
    },

    // --- SUBTAB 4: CALENDAR VIEW ---
    renderTasksCalendar() {
      const gridContainer = document.getElementById('tasks-calendar-grid-container');
      const upcomingContainer = document.getElementById('calendar-upcoming-events-list');
      const monthLabel = document.getElementById('calendar-month-year-label');

      if (!gridContainer) return;

      const curr = this.currentCalendarDate || new Date();
      const monthName = curr.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (monthLabel) monthLabel.textContent = monthName;

      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];
      const events = (this.app && this.app.state && Array.isArray(this.app.state.events)) ? this.app.state.events : [];

      let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center;">`;

      const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      dayHeaders.forEach(dh => {
        html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); padding: 6px 0;">${dh}</div>`;
      });

      const year = curr.getFullYear();
      const month = curr.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => t.dueDate === dateStr);
        const dayEvents = events.filter(e => e.date === dateStr);

        let badgeHtml = '';
        dayTasks.forEach(dt => {
          badgeHtml += `<div style="font-size: 0.58rem; background: rgba(168, 85, 247, 0.2); color: #a855f7; border-radius: 3px; padding: 2px 4px; margin-top: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${dt.title}</div>`;
        });
        dayEvents.forEach(de => {
          badgeHtml += `<div style="font-size: 0.58rem; background: rgba(59, 130, 246, 0.2); color: #3b82f6; border-radius: 3px; padding: 2px 4px; margin-top: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${de.title}</div>`;
        });

        html += `
          <div style="min-height: 55px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--glass-border); padding: 4px; font-size: 0.72rem; text-align: left;">
            <span style="font-weight: 700; color: var(--text-muted);">${day}</span>
            ${badgeHtml}
          </div>
        `;
      }

      html += `</div>`;
      gridContainer.innerHTML = html;

      // Sidebar events
      if (upcomingContainer) {
        let eventsHtml = '';
        events.slice(0, 4).forEach(e => {
          eventsHtml += `
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary);"></span>
              <div>
                <div style="font-weight: 700; font-size: 0.78rem; color: var(--text-main);">${e.title}</div>
                <div style="font-size: 0.62rem; color: var(--text-muted);">${e.date} ${e.time || ''}</div>
              </div>
            </div>
          `;
        });
        upcomingContainer.innerHTML = eventsHtml || `<div style="font-size:0.72rem; color:var(--text-muted); text-align:center; padding: 16px 0;">No upcoming scheduled events.</div>`;
      }
    },

    prevMonth() { this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1); this.renderTasksCalendar(); },
    nextMonth() { this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1); this.renderTasksCalendar(); },
    currentMonth() { this.currentCalendarDate = new Date(); this.renderTasksCalendar(); },

    // --- SUBTAB 5: TIMELINE STREAM ---
    renderTasksTimeline() {
      const container = document.getElementById('tasks-timeline-container');
      if (!container) return;

      const log = (this.app && this.app.state && Array.isArray(this.app.state.activityLog)) ? this.app.state.activityLog : [];

      if (log.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 40px 0;">No timeline stream items logged in database.</div>`;
        return;
      }

      let html = '';
      log.forEach(act => {
        html += `
          <div style="display: flex; gap: 14px; align-items: flex-start;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${act.color || '#a855f7'}22; color: ${act.color || '#a855f7'}; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0;">
              <i class="fas ${act.icon || 'fa-stream'}"></i>
            </div>
            <div style="flex-grow: 1; padding: 10px 14px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="font-size: 0.82rem; font-weight: 700; margin: 0; color: var(--text-main);">${act.title}</h4>
                <span style="font-size: 0.65rem; color: var(--text-muted);">${act.timestamp}</span>
              </div>
              <p style="font-size: 0.72rem; color: var(--text-muted); margin: 2px 0 0 0;">${act.detail}</p>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    // --- SUBTAB 6: ANALYTICS DASHBOARD ---
    renderTasksAnalytics() {
      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];
      const goals = (this.app && this.app.state && Array.isArray(this.app.state.goals)) ? this.app.state.goals : [];

      const completed = tasks.filter(t => t.completed).length;
      const scorePct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 85;

      const scoreEl = document.getElementById('analytics-score-val');
      const compEl = document.getElementById('analytics-completed-val');
      const goalEl = document.getElementById('analytics-goal-val');

      if (scoreEl) scoreEl.textContent = `${scorePct}%`;
      if (compEl) compEl.textContent = completed.toString();
      if (goalEl) goalEl.textContent = `${scorePct}%`;

      // Line Chart: Tasks Completion Overview
      const lineContainer = document.getElementById('analytics-line-chart-container');
      if (lineContainer) {
        lineContainer.innerHTML = `
          <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none">
            <path d="M 10,130 Q 80,100 150,110 T 290,40 T 390,70" fill="none" stroke="#a855f7" stroke-width="3" />
            <circle cx="290" cy="40" r="5" fill="#a855f7" />
          </svg>
        `;
      }

      // Donut Chart: Priority
      this.renderTasksPriorityChart();
      const donutContainer = document.getElementById('tasks-priority-donut-container');
      const legendContainer = document.getElementById('tasks-priority-legend-container');
      const aDonut = document.getElementById('analytics-donut-container');
      const aLegend = document.getElementById('analytics-legend-container');
      if (donutContainer && aDonut) aDonut.innerHTML = donutContainer.innerHTML;
      if (legendContainer && aLegend) aLegend.innerHTML = legendContainer.innerHTML;

      // Focus Bar Chart
      const focusBar = document.getElementById('analytics-focus-bar-container');
      if (focusBar) {
        focusBar.innerHTML = `
          <svg width="100%" height="100%" viewBox="0 0 280 110" preserveAspectRatio="none">
            <rect x="20" y="70" width="16" height="30" fill="#a855f7" rx="3"/>
            <rect x="60" y="40" width="16" height="60" fill="#a855f7" rx="3"/>
            <rect x="100" y="30" width="16" height="70" fill="#a855f7" rx="3"/>
            <rect x="140" y="20" width="16" height="80" fill="#a855f7" rx="3"/>
            <rect x="180" y="50" width="16" height="50" fill="#a855f7" rx="3"/>
            <rect x="220" y="80" width="16" height="20" fill="#a855f7" rx="3"/>
          </svg>
        `;
      }

      // Top Categories Progress Bars
      const catBreakdown = document.getElementById('analytics-categories-breakdown-container');
      if (catBreakdown) {
        catBreakdown.innerHTML = `
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.72rem; margin-bottom:4px;"><span style="color:var(--text-muted);">Work</span><span style="font-weight:700;">45%</span></div>
            <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden;"><div style="width:45%; height:100%; background:#3b82f6;"></div></div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.72rem; margin-bottom:4px;"><span style="color:var(--text-muted);">Health</span><span style="font-weight:700;">25%</span></div>
            <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden;"><div style="width:25%; height:100%; background:#10b981;"></div></div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.72rem; margin-bottom:4px;"><span style="color:var(--text-muted);">Personal</span><span style="font-weight:700;">20%</span></div>
            <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden;"><div style="width:20%; height:100%; background:#f59e0b;"></div></div>
          </div>
        `;
      }
    },

    // --- MODAL CONTROLS & FORM HANDLERS ---
    setupModalControls() {
      const openTaskBtn = document.getElementById('btn-open-add-task-modal');
      const closeTaskBtn = document.getElementById('btn-close-add-task-modal');
      const openGoalBtn = document.getElementById('btn-open-add-goal-modal');
      const openGoalBtnBottom = document.getElementById('btn-open-add-goal-modal-bottom');
      const closeGoalBtn = document.getElementById('btn-close-add-goal-modal');

      if (openTaskBtn) openTaskBtn.addEventListener('click', () => this.toggleModal('productivity-add-task-overlay', true));
      if (closeTaskBtn) closeTaskBtn.addEventListener('click', () => this.toggleModal('productivity-add-task-overlay', false));

      if (openGoalBtn) openGoalBtn.addEventListener('click', () => this.toggleModal('productivity-add-goal-overlay', true));
      if (openGoalBtnBottom) openGoalBtnBottom.addEventListener('click', () => this.toggleModal('productivity-add-goal-overlay', true));
      if (closeGoalBtn) closeGoalBtn.addEventListener('click', () => this.toggleModal('productivity-add-goal-overlay', false));

      // Submit Add Task
      const taskForm = document.getElementById('productivity-add-task-form');
      if (taskForm) {
        taskForm.addEventListener('submit', () => {
          const title = document.getElementById('new-task-title-input')?.value.trim();
          if (!title) return;

          const desc = document.getElementById('new-task-desc-input')?.value.trim() || '';
          const category = document.getElementById('new-task-category-input')?.value || 'Work';
          const priority = document.getElementById('new-task-priority-input')?.value || 'medium';
          const dueDate = document.getElementById('new-task-date-input')?.value || '2025-05-26';

          const newTask = {
            id: Date.now(),
            title: title,
            description: desc,
            category: category,
            priority: priority,
            dueDate: dueDate,
            status: 'Pending',
            completed: false
          };

          this.app.state.tasks.unshift(newTask);
          this.app.state.activityLog.unshift({
            id: Date.now(),
            title: 'New task added',
            detail: title,
            timestamp: 'Just now',
            icon: 'fa-plus-circle',
            color: '#a855f7'
          });

          this.app.saveState();
          this.app.showToast(`Task "${title}" created successfully!`, 'success');
          this.toggleModal('productivity-add-task-overlay', false);
          taskForm.reset();
          this.render();
        });
      }

      // Submit Add Goal
      const goalForm = document.getElementById('productivity-add-goal-form');
      if (goalForm) {
        goalForm.addEventListener('submit', () => {
          const name = document.getElementById('new-goal-title-input')?.value.trim();
          if (!name) return;

          const category = document.getElementById('new-goal-category-input')?.value || 'Personal Goal';
          const target = Number(document.getElementById('new-goal-target-input')?.value) || 100;
          const current = Number(document.getElementById('new-goal-current-input')?.value) || 0;
          const targetDate = document.getElementById('new-goal-date-input')?.value || '2025-12-31';

          const newGoal = {
            id: 'goal-' + Date.now(),
            name: name,
            category: category,
            target: target,
            current: current,
            saved: current,
            targetDate: targetDate,
            details: `${current} / ${target}`,
            color: '#a855f7'
          };

          this.app.state.goals.unshift(newGoal);
          this.app.state.activityLog.unshift({
            id: Date.now(),
            title: 'Goal added',
            detail: name,
            timestamp: 'Just now',
            icon: 'fa-bullseye',
            color: '#10b981'
          });

          this.app.saveState();
          this.app.showToast(`Goal "${name}" created!`, 'success');
          this.toggleModal('productivity-add-goal-overlay', false);
          goalForm.reset();
          this.render();
        });
      }
    },

    toggleModal(modalId, isVisible) {
      const el = document.getElementById(modalId);
      if (!el) return;
      if (isVisible) {
        if (el.parentNode !== document.body) {
          document.body.appendChild(el);
        }
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    },

    openAddTaskModal() { this.toggleModal('productivity-add-task-overlay', true); },
    openAddGoalModal() { this.toggleModal('productivity-add-goal-overlay', true); },

    // --- Legacy Projects & Calendar Handlers ---
    setupProjectControls() {},
    renderProjects() {},
    setupCalendarControls() {
      const eventForm = document.getElementById('event-form');
      if (eventForm) {
        eventForm.onsubmit = (e) => {
          e.preventDefault();
          const title = document.getElementById('event-title')?.value.trim();
          const date = document.getElementById('event-date')?.value;
          const time = document.getElementById('event-time')?.value;

          if (!title || !date) return;

          const newEvent = {
            id: Date.now(),
            title,
            date,
            time: time || '12:00'
          };

          if (!Array.isArray(this.app.state.events)) {
            this.app.state.events = [];
          }
          this.app.state.events.unshift(newEvent);
          this.app.saveState();
          this.app.showToast(`Scheduled event: ${title}`, 'success');
          eventForm.reset();
          this.render();
        };
      }
    },
    renderEvents() {
      const container = document.getElementById('events-list-container');
      if (!container) return;

      const events = (this.app && this.app.state && Array.isArray(this.app.state.events)) ? this.app.state.events : [];
      if (events.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 14px 0;">No scheduled events.</div>`;
        return;
      }

      let html = '';
      events.forEach(e => {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--glass-border); margin-bottom: 6px;">
            <div>
              <div style="font-weight: 700; font-size: 0.78rem; color: var(--text-main);">${e.title}</div>
              <div style="font-size: 0.62rem; color: var(--text-muted);">${e.date} &bull; ${e.time || ''}</div>
            </div>
            <i class="fas fa-trash-alt btn-delete-event" data-id="${e.id}" style="color: var(--red); font-size: 0.75rem; cursor: pointer;"></i>
          </div>
        `;
      });
      container.innerHTML = html;

      container.querySelectorAll('.btn-delete-event').forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          const idx = events.findIndex(evt => evt.id.toString() === id.toString());
          if (idx !== -1) {
            events.splice(idx, 1);
            this.app.saveState();
            this.app.showToast('Event removed', 'info');
            this.render();
          }
        };
      });
    },
    renderTimeblocks() {
      if (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.timeblocks) {
        window.LifeOS.modules.timeblocks.render();
      }
    },
    setupPomodoroTimer() {},
    setupFocusMode() {}
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('tasks', ProductivityModule);
    window.LifeOS.registerModule('planner', ProductivityModule);
    window.LifeOS.registerModule('focus', ProductivityModule);
    window.LifeOS.modules.productivity = ProductivityModule;
  }
});
