/* ==========================================================================
   LIFE OS - PRODUCTIVITY & FOCUS CONTROLLER (js/productivity.js)
   Enterprise Tasks & Goals Dashboard & Real-Time State Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const ProductivityModule = {
    pomoInterval: null,
    currentTab: 'active', // active, completed
    activeSubtab: 'overview',
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

      // Ensure state arrays are initialized without inserting fake sample items
      if (!Array.isArray(this.app.state.tasks)) {
        this.app.state.tasks = [];
      }
      if (!Array.isArray(this.app.state.goals)) {
        this.app.state.goals = [];
      }
      if (!Array.isArray(this.app.state.activityLog)) {
        this.app.state.activityLog = [];
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
    },

    // --- 1. TOP KPI SUMMARY CARDS ---
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

    // --- 2. MY TASKS LIST WITH FILTERS ---
    setupTaskControls() {
      const catFilter = document.getElementById('tasks-filter-category');
      const prioFilter = document.getElementById('tasks-filter-priority');

      if (catFilter) {
        catFilter.addEventListener('change', () => this.renderTasksList());
      }
      if (prioFilter) {
        prioFilter.addEventListener('change', () => this.renderTasksList());
      }
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
        let catBg = 'rgba(168, 85, 247, 0.15)';
        let catColor = '#a855f7';
        const catName = (t.category || 'Work');
        if (catName.toLowerCase() === 'work') { catBg = 'rgba(59, 130, 246, 0.15)'; catColor = '#3b82f6'; }
        else if (catName.toLowerCase() === 'health') { catBg = 'rgba(16, 185, 129, 0.15)'; catColor = '#10b981'; }
        else if (catName.toLowerCase() === 'personal') { catBg = 'rgba(245, 158, 11, 0.15)'; catColor = '#f59e0b'; }

        let prioBg = 'rgba(245, 158, 11, 0.15)';
        let prioColor = '#f59e0b';
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

    // --- 3. TASKS BY PRIORITY DONUT CHART ---
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
        <div style="display:flex; justify-space-between; align-items:center;">
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

    // --- 4. THIS WEEK OVERVIEW BAR CHART ---
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

    // --- 5. UPCOMING DEADLINES ---
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

        let badgeBg = 'rgba(59, 130, 246, 0.15)';
        let badgeColor = '#3b82f6';
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

    // --- 6. RECENT ACTIVITY TIMELINE ---
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

    // --- 7. GOALS OVERVIEW CARD GRID ---
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

    // --- SUBTAB RENDERERS ---
    renderFullTasksList() {
      const container = document.getElementById('full-tasks-list-container');
      if (!container) return;
      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];

      if (tasks.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 40px 0;">No tasks recorded in database.</div>`;
        return;
      }

      let html = '';
      tasks.forEach(t => {
        html += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="checkbox" ${t.completed ? 'checked' : ''} class="task-checkbox-toggle" data-id="${t.id}" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary);">
              <div>
                <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); ${t.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${t.title}</div>
                <div style="font-size: 0.68rem; color: var(--text-muted);">${t.description || 'No description'} &bull; Due ${t.dueDate || 'N/A'}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge" style="background: rgba(168, 85, 247, 0.15); color: #a855f7;">${t.category || 'Work'}</span>
              <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;">${(t.priority || 'medium').toUpperCase()}</span>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    renderFullGoalsGrid() {
      const container = document.getElementById('full-goals-grid-container');
      if (!container) return;
      this.renderGoalsOverview();
      const overviewGrid = document.getElementById('goals-overview-grid-container');
      if (overviewGrid) container.innerHTML = overviewGrid.innerHTML;
    },

    renderKanbanBoard() {
      const todoEl = document.getElementById('kanban-todo-container');
      const inProgEl = document.getElementById('kanban-in-progress-container');
      const reviewEl = document.getElementById('kanban-review-container');
      const compEl = document.getElementById('kanban-completed-container');

      if (!todoEl || !inProgEl || !reviewEl || !compEl) return;

      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];

      let todoHtml = '', inProgHtml = '', reviewHtml = '', compHtml = '';

      tasks.forEach(t => {
        const cardHtml = `
          <div style="padding: 10px 12px; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
            <div style="font-weight: 700; font-size: 0.8rem; color: var(--text-main); margin-bottom: 4px;">${t.title}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); display: flex; justify-content: space-between;">
              <span>${t.category || 'Work'}</span>
              <span style="font-weight: 700;">${(t.priority || 'medium').toUpperCase()}</span>
            </div>
          </div>
        `;

        if (t.completed) {
          compHtml += cardHtml;
        } else if (t.status === 'In Progress') {
          inProgHtml += cardHtml;
        } else if (t.status === 'Review') {
          reviewHtml += cardHtml;
        } else {
          todoHtml += cardHtml;
        }
      });

      todoEl.innerHTML = todoHtml || `<span style="font-size:0.7rem; color:var(--text-muted);">No tasks</span>`;
      inProgEl.innerHTML = inProgHtml || `<span style="font-size:0.7rem; color:var(--text-muted);">No active tasks</span>`;
      reviewEl.innerHTML = reviewHtml || `<span style="font-size:0.7rem; color:var(--text-muted);">No items in review</span>`;
      compEl.innerHTML = compHtml || `<span style="font-size:0.7rem; color:var(--text-muted);">No completed tasks</span>`;
    },

    renderTasksCalendar() {
      const container = document.getElementById('tasks-calendar-container');
      if (!container) return;
      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];
      container.innerHTML = `
        <div style="width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-main);">Calendar Matrix</h4>
            <span class="badge" style="background: rgba(168, 85, 247, 0.15); color: #a855f7;">${tasks.length} Scheduled Events</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; font-weight: 700; font-size: 0.72rem; color: var(--text-muted); text-align: center;">
            <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
          </div>
        </div>
      `;
    },

    renderTasksTimeline() {
      const container = document.getElementById('tasks-timeline-container');
      if (!container) return;
      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];
      if (tasks.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 40px 0;">No timeline milestones logged.</div>`;
        return;
      }
      let html = '';
      tasks.forEach(t => {
        html += `
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 120px; font-size: 0.75rem; font-weight: 700; color: var(--text-main); flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.title}</div>
            <div style="flex-grow: 1; height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; position: relative;">
              <div style="width: ${t.completed ? 100 : 40}%; height: 100%; background: var(--primary); border-radius: 5px;"></div>
            </div>
            <span style="font-size: 0.65rem; color: var(--text-muted); flex-shrink: 0;">${t.dueDate || 'No Date'}</span>
          </div>
        `;
      });
      container.innerHTML = html;
    },

    renderTasksAnalytics() {
      const container = document.getElementById('tasks-analytics-container');
      if (!container) return;
      const tasks = (this.app && this.app.state && Array.isArray(this.app.state.tasks)) ? this.app.state.tasks : [];
      const completed = tasks.filter(t => t.completed).length;
      const pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
      container.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 800; color: var(--primary);">${pct}%</div>
          <span style="font-size: 0.78rem; color: var(--text-muted);">Overall Velocity Completion Rate (${completed} of ${tasks.length} tasks completed)</span>
        </div>
      `;
    },

    // --- 8. MODAL CONTROLS & EVENT HANDLERS ---
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
    setupCalendarControls() {},
    renderEvents() {},
    renderTimeblocks() {}
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('tasks', ProductivityModule);
    window.LifeOS.registerModule('planner', ProductivityModule);
    window.LifeOS.registerModule('focus', ProductivityModule);
    window.LifeOS.modules.productivity = ProductivityModule;
  }
});
