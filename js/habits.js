/* ==========================================================================
   LIFE OS - HABIT TRACKER MODULE (js/habits.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const HabitsModule = {
    currentCalDate: new Date(),
    manageMode: false,
    currentFilter: 'all',

    init() {
      this.initDefaultHabits();
      this.setupEventListeners();
      this.render();
    },

    onActive() {
      this.render();
    },

    initDefaultHabits() {
      const state = this.app.state;
      if (!state.habits) state.habits = [];

      if (!state.habitsSeeded) {
        // Seed mockup habits to match USER's screenshot perfectly!
        const today = new Date();
        const getPastDateStr = (daysAgo) => {
          const d = new Date();
          d.setDate(today.getDate() - daysAgo);
          return d.toLocaleDateString('sv').substring(0, 10);
        };

        // Create standard mock history to simulate a realistic tracker state
        const history1 = {}; // Morning Walk: 100% this week
        const history2 = {}; // Read Book: 100% this week
        const history3 = {}; // Meditation: 100% this week
        const history4 = {}; // Drink Water: 71% this week
        const history5 = {}; // Workout: 43% this week
        const history6 = {}; // Eat Healthy: 86% this week
        const history7 = {}; // Write Journal: 100% this week
        const history8 = {}; // Sleep Early: 100% this week

        for (let i = 0; i < 7; i++) {
          const dateStr = getPastDateStr(i);
          // Seed values to match the mockup visual indicators
          history1[dateStr] = 'done';
          history2[dateStr] = 'done';
          history3[dateStr] = 'done';
          
          history4[dateStr] = i === 1 || i === 4 ? 'partial' : (i === 3 || i === 6 ? 'done' : 'done');
          history5[dateStr] = i === 2 || i === 5 ? 'done' : 'missed';
          history6[dateStr] = i === 4 ? 'missed' : 'done';
          
          history7[dateStr] = 'done';
          history8[dateStr] = 'done';
        }

        // Overwrite today's statuses
        const todayStr = getPastDateStr(0);
        history4[todayStr] = 'partial';
        history5[todayStr] = 'missed';
        history6[todayStr] = 'done';

        state.habits = [
          {
            id: 'h-1',
            name: 'Morning Walk',
            category: 'Exercise',
            target: '30 minutes',
            time: '07:00 AM',
            icon: '🏃‍♂️',
            color: 'var(--green)',
            history: history1,
            streak: 12,
            bestStreak: 12,
            weeklySchedule: [true, true, true, true, true, true, true]
          },
          {
            id: 'h-2',
            name: 'Read Book',
            category: 'Learning',
            target: '20 pages',
            time: 'Anytime',
            icon: '📖',
            color: 'var(--blue)',
            history: history2,
            streak: 28,
            bestStreak: 28,
            weeklySchedule: [true, true, true, true, true, true, true]
          },
          {
            id: 'h-3',
            name: 'Meditation',
            category: 'Mindfulness',
            target: '10 minutes',
            time: '09:00 PM',
            icon: '🧘',
            color: 'var(--yellow)',
            history: history3,
            streak: 9,
            bestStreak: 9,
            weeklySchedule: [true, true, true, true, true, true, true]
          },
          {
            id: 'h-4',
            name: 'Drink Water',
            category: 'Health',
            target: '3 Liters',
            time: 'Anytime',
            icon: '💧',
            color: 'var(--primary)',
            history: history4,
            streak: 5,
            bestStreak: 7,
            weeklySchedule: [true, true, true, true, true, true, true]
          },
          {
            id: 'h-5',
            name: 'Workout',
            category: 'Exercise',
            target: '45 minutes',
            time: '07:00 AM',
            icon: '🏋️‍♂️',
            color: 'var(--red)',
            history: history5,
            streak: 2,
            bestStreak: 14,
            weeklySchedule: [false, true, false, true, false, true, false]
          },
          {
            id: 'h-6',
            name: 'Eat Healthy',
            category: 'Nutrition',
            target: 'No Junk Food',
            time: 'Anytime',
            icon: '🍏',
            color: '#06b6d4', // Cyan
            history: history6,
            streak: 6,
            bestStreak: 18,
            weeklySchedule: [true, true, true, true, true, true, true]
          },
          {
            id: 'h-7',
            name: 'Write Journal',
            category: 'Mindfulness',
            target: '5 minutes',
            time: '09:00 PM',
            icon: '📝',
            color: '#f43f5e', // Rose
            history: history7,
            streak: 10,
            bestStreak: 15,
            weeklySchedule: [true, true, true, true, true, true, true]
          },
          {
            id: 'h-8',
            name: 'Sleep Early',
            category: 'Health',
            target: 'Before 11:00 PM',
            time: 'Before 11:00 PM',
            icon: '🌙',
            color: 'var(--yellow)',
            history: history8,
            streak: 15,
            bestStreak: 20,
            weeklySchedule: [true, true, true, true, true, true, true]
          }
        ];
        state.habitsSeeded = true;
        this.app.saveState();
      }
    },

    setupEventListeners() {
      // Toggle Add Form
      const btnAdd = document.getElementById('btn-add-habit-modal');
      const addContainer = document.getElementById('add-habit-container');
      const btnCancel = document.getElementById('btn-cancel-habit');

      if (btnAdd && addContainer) {
        btnAdd.addEventListener('click', () => {
          const formTitle = document.getElementById('habit-form-title');
          if (formTitle) formTitle.innerText = 'Add New Habit';
          const editIdInput = document.getElementById('habit-edit-id');
          if (editIdInput) editIdInput.value = '';
          const form = document.getElementById('new-habit-form');
          if (form) form.reset();
          addContainer.style.display = addContainer.style.display === 'none' ? 'block' : 'none';
        });
      }

      if (btnCancel && addContainer) {
        btnCancel.addEventListener('click', () => {
          addContainer.style.display = 'none';
          const form = document.getElementById('new-habit-form');
          if (form) form.reset();
        });
      }

      // Add/Edit Habit Form Submit
      const form = document.getElementById('new-habit-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const editId = document.getElementById('habit-edit-id').value;
          const name = document.getElementById('habit-name-input').value.trim();
          const category = document.getElementById('habit-category-input').value;
          const target = document.getElementById('habit-target-input').value.trim();
          const time = document.getElementById('habit-time-input').value.trim() || 'Anytime';
          const icon = document.getElementById('habit-icon-input').value;
          const color = document.getElementById('habit-color-input').value;

          const days = [];
          form.querySelectorAll('.habit-day-check').forEach(chk => {
            days.push(chk.checked);
          });

          if (editId) {
            // Edit existing habit
            const habit = this.app.state.habits.find(h => h.id === editId);
            if (habit) {
              habit.name = name;
              habit.category = category;
              habit.target = target;
              habit.time = time;
              habit.icon = icon;
              habit.color = color;
              habit.weeklySchedule = days;
              this.app.showToast('Habit updated successfully!', 'success');
            }
          } else {
            // Create new habit
            const newHabit = {
              id: 'h-' + Date.now(),
              name,
              category,
              target,
              time,
              icon,
              color,
              history: {},
              streak: 0,
              bestStreak: 0,
              weeklySchedule: days
            };
            this.app.state.habits.push(newHabit);
            this.app.showToast('New habit added successfully!', 'success');
          }

          this.app.saveState();
          form.reset();
          if (addContainer) addContainer.style.display = 'none';
          this.render();
        });
      }

      // Search input
      const searchInput = document.getElementById('habit-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          this.render();
        });
      }

      // Filter buttons
      const filterContainer = document.getElementById('habit-filter-buttons');
      if (filterContainer) {
        filterContainer.addEventListener('click', (e) => {
          const btn = e.target.closest('button');
          if (!btn) return;
          filterContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentFilter = btn.dataset.filter;
          this.render();
        });
      }

      // Toggle Manage Mode
      const btnToggle = document.getElementById('btn-toggle-manage-mode');
      const btnDone = document.getElementById('btn-done-manage-mode');
      const legend = document.getElementById('habits-manage-legend');

      if (btnToggle) {
        btnToggle.addEventListener('click', () => {
          this.manageMode = true;
          btnToggle.classList.add('hidden');
          if (btnDone) btnDone.classList.remove('hidden');
          if (legend) legend.classList.remove('hidden');
          this.render();
        });
      }
      if (btnDone) {
        btnDone.addEventListener('click', () => {
          this.manageMode = false;
          if (btnToggle) btnToggle.classList.remove('hidden');
          btnDone.classList.add('hidden');
          if (legend) legend.classList.add('hidden');
          this.render();
        });
      }

      // Calendar controls
      const calPrev = document.getElementById('habits-cal-prev');
      const calNext = document.getElementById('habits-cal-next');

      if (calPrev) {
        calPrev.addEventListener('click', () => {
          this.currentCalDate.setMonth(this.currentCalDate.getMonth() - 1);
          this.renderCalendar();
        });
      }
      if (calNext) {
        calNext.addEventListener('click', () => {
          this.currentCalDate.setMonth(this.currentCalDate.getMonth() + 1);
          this.renderCalendar();
        });
      }

      // Dropdown selector for Completion Overview
      const overviewSel = document.getElementById('habits-overview-range');
      if (overviewSel) {
        overviewSel.addEventListener('change', () => {
          this.renderOverviewChart();
        });
      }
    },

    calculateStreak(history, schedule) {
      let streak = 0;
      let date = new Date();
      const todayStr = date.toLocaleDateString('sv').substring(0, 10);
      
      // If completed today, count it; otherwise check if yesterday was completed
      let dateCheck = new Date();
      let checkStr = dateCheck.toLocaleDateString('sv').substring(0, 10);
      
      if (history[checkStr] !== 'done' && history[checkStr] !== 'partial') {
        // If not logged today, start checking from yesterday
        dateCheck.setDate(dateCheck.getDate() - 1);
        checkStr = dateCheck.toLocaleDateString('sv').substring(0, 10);
      }

      while (true) {
        const dayOfWeek = dateCheck.getDay();
        const isScheduled = schedule[dayOfWeek];

        if (isScheduled) {
          const status = history[checkStr];
          if (status === 'done' || status === 'partial') {
            streak++;
          } else {
            break;
          }
        }
        
        dateCheck.setDate(dateCheck.getDate() - 1);
        checkStr = dateCheck.toLocaleDateString('sv').substring(0, 10);
        
        // Safeguard to avoid infinite loop
        if (streak > 365) break;
      }
      return streak;
    },

    cycleHabitStatus(habitId) {
      const habits = this.app.state.habits;
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const todayStr = new Date().toLocaleDateString('sv').substring(0, 10);
      const currentStatus = habit.history[todayStr];

      let newStatus;
      if (!currentStatus) {
        newStatus = 'done';
      } else if (currentStatus === 'done') {
        newStatus = 'partial';
      } else if (currentStatus === 'partial') {
        newStatus = 'missed';
      } else {
        newStatus = null; // Reset
      }

      if (newStatus) {
        habit.history[todayStr] = newStatus;
      } else {
        delete habit.history[todayStr];
      }

      // Recalculate active streaks
      habit.streak = this.calculateStreak(habit.history, habit.weeklySchedule);
      if (habit.streak > habit.bestStreak) {
        habit.bestStreak = habit.streak;
      }

      this.app.saveState();
      this.render();
    },

    render() {
      const habits = this.app.state.habits || [];
      const todayStr = new Date().toLocaleDateString('sv').substring(0, 10);
      const todayDayOfWeek = new Date().getDay();

      // Date Label
      const dateLabel = document.getElementById('habits-today-date-label');
      if (dateLabel) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateLabel.innerText = new Date().toLocaleDateString('en-US', options);
      }

      // 1. Calculate Stats
      const totalHabits = habits.length;
      let completedToday = 0;
      let scheduledToday = 0;

      habits.forEach(h => {
        if (h.weeklySchedule[todayDayOfWeek]) {
          scheduledToday++;
          if (h.history[todayStr] === 'done') {
            completedToday++;
          }
        }
      });

      const completionPct = scheduledToday > 0 ? Math.round((completedToday / scheduledToday) * 100) : 0;

      // Find best streak
      let bestStreak = 0;
      let overallCurrentStreakSum = 0;

      habits.forEach(h => {
        if (h.bestStreak > bestStreak) {
          bestStreak = h.bestStreak;
        }
        overallCurrentStreakSum = Math.max(overallCurrentStreakSum, h.streak || 0);
      });

      // Render premium stats elements
      const sCompletedToday = document.getElementById('stat-habits-completed-today');
      const sPctLabel = document.getElementById('stat-habits-pct-label');
      const sCircleProgress = document.getElementById('stat-habits-circle-progress');
      const sStreakFlame = document.getElementById('stat-habits-streak-flame');
      const sBestStreakNum = document.getElementById('stat-habits-best-streak-num');
      const sActiveCount = document.getElementById('stat-habits-active-count');

      if (sCompletedToday) sCompletedToday.innerText = `${completedToday}/${scheduledToday}`;
      if (sPctLabel) sPctLabel.innerText = `${completionPct}%`;
      if (sCircleProgress) {
        const strokeDashOffset = 100 - completionPct;
        sCircleProgress.setAttribute('stroke-dashoffset', strokeDashOffset);
        sCircleProgress.setAttribute('stroke-dasharray', '100');
      }
      if (sStreakFlame) sStreakFlame.innerText = overallCurrentStreakSum;
      if (sBestStreakNum) sBestStreakNum.innerText = bestStreak;
      if (sActiveCount) sActiveCount.innerText = totalHabits;

      // Calculate weekly average completion rate for Success Rate (needed by right side charts if any)
      const sRate = document.getElementById('stat-habits-rate');
      let weeklyCompletionRates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toLocaleDateString('sv').substring(0, 10);
        const dayOfWeek = d.getDay();

        let daySched = 0;
        let dayDone = 0;
        habits.forEach(h => {
          if (h.weeklySchedule[dayOfWeek]) {
            daySched++;
            if (h.history[dStr] === 'done') dayDone++;
          }
        });
        if (daySched > 0) {
          weeklyCompletionRates.push(dayDone / daySched);
        }
      }
      const successRate = weeklyCompletionRates.length > 0 ? 
        Math.round((weeklyCompletionRates.reduce((a, b) => a + b, 0) / weeklyCompletionRates.length) * 100) : 0;
      
      if (sRate) sRate.innerText = `${successRate}%`;

      // 2. Filter & Search Habits
      const searchInput = document.getElementById('habit-search-input');
      const searchVal = (searchInput?.value || '').toLowerCase().trim();
      const filterVal = this.currentFilter || 'all';

      let filteredHabits = habits.filter(h => {
        // Search filter
        if (searchVal && !h.name.toLowerCase().includes(searchVal) && !(h.category || '').toLowerCase().includes(searchVal)) {
          return false;
        }

        // Status filters:
        const status = h.history[todayStr];
        const isScheduled = h.weeklySchedule[todayDayOfWeek];

        if (filterVal === 'active') {
          return isScheduled && status !== 'done';
        } else if (filterVal === 'completed') {
          return status === 'done';
        } else if (filterVal === 'missed') {
          return isScheduled && status === 'missed';
        }
        return true;
      });

      // 3. Render Today's Habits List
      const todayListContainer = document.getElementById('habits-today-list');
      if (todayListContainer) {
        if (filteredHabits.length === 0) {
          todayListContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 30px;">No habits match the search or filter query.</div>`;
        } else {
          // Find start of week (Sunday)
          const startOfWeek = new Date();
          const dayOffset = startOfWeek.getDay();
          startOfWeek.setDate(startOfWeek.getDate() - dayOffset);

          let listHtml = '';

          filteredHabits.forEach(h => {
            const currentStatus = h.history[todayStr];
            const isCompletedToday = currentStatus === 'done';
            
            // Weekly completion calculation
            let weeklySchedCount = 0;
            let weeklyDoneCount = 0;
            for (let idx = 0; idx < 7; idx++) {
              const weekDate = new Date(startOfWeek);
              weekDate.setDate(startOfWeek.getDate() + idx);
              const weekDateStr = weekDate.toLocaleDateString('sv').substring(0, 10);
              
              const isSched = h.weeklySchedule[idx];
              if (isSched) {
                weeklySchedCount++;
                if (h.history[weekDateStr] === 'done') {
                  weeklyDoneCount++;
                }
              }
            }
            const weeklyPct = weeklySchedCount > 0 ? Math.round((weeklyDoneCount / weeklySchedCount) * 100) : 0;

            // Day dots and headers aligned above them
            const daysAbbr = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            let headersHtml = '';
            daysAbbr.forEach((abbr, idx) => {
              const currentWeekDate = new Date(startOfWeek);
              currentWeekDate.setDate(startOfWeek.getDate() + idx);
              const isToday = currentWeekDate.toLocaleDateString('sv').substring(0, 10) === todayStr;
              const highlight = isToday ? 'color: var(--text-main); font-weight: bold;' : 'color: var(--text-muted);';
              headersHtml += `<span style="font-size: 0.6rem; width: 22px; text-align: center; display: inline-block; ${highlight}">${abbr}</span>`;
            });

            let historyDotsHtml = '';
            for (let idx = 0; idx < 7; idx++) {
              const weekDate = new Date(startOfWeek);
              weekDate.setDate(startOfWeek.getDate() + idx);
              const weekDateStr = weekDate.toLocaleDateString('sv').substring(0, 10);
              const isSched = h.weeklySchedule[idx];
              const status = h.history[weekDateStr];

              let dotStyle = 'background: rgba(128,128,128,0.05); border: 1.5px dashed var(--glass-border);';
              let dotContent = '';

              if (isSched) {
                if (status === 'done') {
                  dotStyle = 'background: var(--green); border: none; color: #fff; box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);';
                  dotContent = '<i class="fas fa-check" style="font-size: 0.55rem;"></i>';
                } else if (status === 'partial') {
                  dotStyle = 'background: var(--yellow); border: none; color: #fff;';
                  dotContent = '<i class="fas fa-adjust" style="font-size: 0.55rem;"></i>';
                } else if (status === 'missed') {
                  dotStyle = 'background: var(--red); border: none; color: #fff;';
                  dotContent = '<i class="fas fa-times" style="font-size: 0.55rem;"></i>';
                } else {
                  dotStyle = 'background: rgba(128,128,128,0.02); border: 1.5px solid var(--glass-border);';
                }
              } else {
                dotStyle = 'opacity: 0.15; pointer-events: none; border: 1.5px dashed var(--glass-border);';
              }

              historyDotsHtml += `
                <div style="width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-sizing: border-box; ${dotStyle}">
                  ${dotContent}
                </div>
              `;
            }

            // Build action buttons (Complete, Edit, Delete)
            let actionButtonsHtml = '';
            if (this.manageMode) {
              actionButtonsHtml = `
                <div style="display: flex; gap: 8px;">
                  <button onclick="window.LifeOS.modules.habits.cycleHabitStatus('${h.id}')" class="btn-primary-glow" style="background: ${isCompletedToday ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${isCompletedToday ? 'var(--green)' : 'var(--glass-border)'}; color: ${isCompletedToday ? 'var(--green)' : '#fff'}; padding: 6px 12px; font-size: 0.72rem; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: bold;"><i class="fas fa-check"></i> ${isCompletedToday ? 'Completed' : 'Complete'}</button>
                  <button onclick="window.LifeOS.modules.habits.editHabit('${h.id}')" style="width: 28px; height: 28px; border-radius: var(--radius-sm); background: rgba(59, 130, 246, 0.1); border: 1.5px solid var(--blue); color: var(--blue); display: flex; align-items: center; justify-content: center; cursor: pointer;" title="Edit Habit"><i class="fas fa-pencil-alt" style="font-size: 0.72rem;"></i></button>
                  <button onclick="window.LifeOS.modules.habits.deleteHabit('${h.id}')" style="width: 28px; height: 28px; border-radius: var(--radius-sm); background: rgba(239, 68, 68, 0.1); border: 1.5px solid var(--red); color: var(--red); display: flex; align-items: center; justify-content: center; cursor: pointer;" title="Delete Habit"><i class="fas fa-trash-alt" style="font-size: 0.72rem;"></i></button>
                </div>
              `;
            } else {
              actionButtonsHtml = `
                <button onclick="window.LifeOS.modules.habits.cycleHabitStatus('${h.id}')" class="btn-primary-glow" style="background: ${isCompletedToday ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${isCompletedToday ? 'var(--green)' : 'var(--glass-border)'}; color: ${isCompletedToday ? 'var(--green)' : '#fff'}; padding: 6px 12px; font-size: 0.72rem; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: bold;"><i class="fas fa-check"></i> ${isCompletedToday ? 'Completed' : 'Complete'}</button>
              `;
            }

            // Build status tag
            let statusTagHtml = '';
            if (isCompletedToday) {
              statusTagHtml = `<span style="font-size: 0.58rem; font-weight: bold; background: rgba(16, 185, 129, 0.1); color: var(--green); padding: 2px 6px; border-radius: 4px; text-transform: uppercase; margin-left: 6px;">Completed</span>`;
            } else if (currentStatus === 'missed') {
              statusTagHtml = `<span style="font-size: 0.58rem; font-weight: bold; background: rgba(239, 68, 68, 0.1); color: var(--red); padding: 2px 6px; border-radius: 4px; text-transform: uppercase; margin-left: 6px;">Missed</span>`;
            } else {
              statusTagHtml = `<span style="font-size: 0.58rem; font-weight: bold; background: rgba(168, 85, 247, 0.1); color: var(--primary); padding: 2px 6px; border-radius: 4px; text-transform: uppercase; margin-left: 6px;">Active</span>`;
            }

            listHtml += `
              <!-- Habit Item Card -->
              <div class="habit-card-container" onmouseover="this.style.borderColor='${h.color}33'" onmouseout="this.style.borderColor='var(--glass-border)'">
                <!-- Left Details -->
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: ${h.color}15; border: 2px solid ${h.color}; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; box-shadow: 0 0 10px ${h.color}20;">
                    ${h.icon}
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; flex-wrap: wrap;">
                      <h4 style="margin: 0; font-size: 0.88rem; font-weight: 700; color: var(--text-main);">${h.name}</h4>
                      ${statusTagHtml}
                    </div>
                    <span style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-top: 2px;">
                      <i class="fas fa-tag" style="font-size: 0.6rem; margin-right: 3px;"></i> ${h.category || 'General'}
                    </span>
                    <span style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-top: 1px;">
                      <i class="far fa-clock" style="font-size: 0.6rem; margin-right: 3px;"></i> ${h.target} • ${h.time || 'Anytime'}
                    </span>
                  </div>
                </div>

                <!-- Middle Tracker & Streak -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">
                      <i class="fas fa-fire" style="color: var(--yellow); margin-right: 4px;"></i> ${h.streak || 0} Day Streak
                    </span>
                    <span style="font-size: 0.65rem; color: var(--text-muted);">${weeklyPct}% this week</span>
                  </div>
                  
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; gap: 6px; line-height: 1;">
                      ${headersHtml}
                    </div>
                    <div style="display: flex; gap: 6px;">
                      ${historyDotsHtml}
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; margin-top: 2px;">
                    <div style="width: ${weeklyPct}%; height: 100%; background: var(--green); border-radius: 2px; transition: width 0.3s ease;"></div>
                  </div>
                </div>

                <!-- Right Actions -->
                <div style="display: flex; justify-content: flex-end;">
                  ${actionButtonsHtml}
                </div>
              </div>
            `;
          });

          todayListContainer.innerHTML = listHtml;
        }
      }

      // Render Charts & Calendar View
      this.renderOverviewChart();
      this.renderStreaksList();
      this.renderCalendar();
      this.renderProgressCircles();
    },

    deleteHabit(id) {
      if (confirm('Are you sure you want to permanently delete this habit?')) {
        this.app.state.habits = this.app.state.habits.filter(h => h.id !== id);
        this.app.saveState();
        this.app.showToast('Habit deleted successfully.', 'info');
        this.render();
      }
    },

    editHabit(id) {
      const habit = this.app.state.habits.find(h => h.id === id);
      if (!habit) return;

      const addContainer = document.getElementById('add-habit-container');
      if (addContainer) {
        addContainer.style.display = 'block';
        
        const formTitle = document.getElementById('habit-form-title');
        if (formTitle) formTitle.innerText = 'Edit Habit';
        const editIdInput = document.getElementById('habit-edit-id');
        if (editIdInput) editIdInput.value = habit.id;
        document.getElementById('habit-name-input').value = habit.name;
        document.getElementById('habit-category-input').value = habit.category || 'General';
        document.getElementById('habit-target-input').value = habit.target;
        document.getElementById('habit-time-input').value = habit.time || 'Anytime';
        document.getElementById('habit-icon-input').value = habit.icon;
        document.getElementById('habit-color-input').value = habit.color;

        // Set weekly schedule checkmarks
        const daysChecks = addContainer.querySelectorAll('.habit-day-check');
        daysChecks.forEach((chk, idx) => {
          chk.checked = !!habit.weeklySchedule[idx];
        });

        // Scroll to container
        addContainer.scrollIntoView({ behavior: 'smooth' });
      }
    },

    renderOverviewChart() {
      const habits = this.app.state.habits || [];
      const container = document.getElementById('habits-bar-chart-container');
      if (!container) return;

      if (habits.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; width: 100%;">No overview data available.</div>`;
        return;
      }

      const range = document.getElementById('habits-overview-range')?.value || 'week';
      const daysCount = range === 'week' ? 7 : 30;

      let html = '';
      habits.forEach(h => {
        let scheduledDays = 0;
        let completedDays = 0;

        for (let i = 0; i < daysCount; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dStr = d.toLocaleDateString('sv').substring(0, 10);
          const dayOfWeek = d.getDay();

          if (h.weeklySchedule[dayOfWeek]) {
            scheduledDays++;
            if (h.history[dStr] === 'done') {
              completedDays++;
            }
          }
        }

        const pct = scheduledDays > 0 ? Math.round((completedDays / scheduledDays) * 100) : 0;
        const barHeight = Math.max(8, Math.round(pct * 1.2)); // Scale to max 120px height

        html += `
          <div style="display: flex; flex-direction: column; align-items: center; flex-shrink: 0; width: 65px;">
            <span style="font-size: 0.65rem; color: var(--text-muted); margin-bottom: 4px;">${pct}%</span>
            <div style="width: 14px; height: 120px; background: rgba(255,255,255,0.03); border-radius: 4px; display: flex; align-items: flex-end; overflow: hidden; border: 1px solid var(--glass-border);">
              <div style="width: 100%; height: ${barHeight}px; background: ${h.color}; border-radius: 2px;"></div>
            </div>
            <span style="font-size: 0.6rem; color: var(--text-main); margin-top: 6px; width: 62px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center;" title="${h.name}">${h.name}</span>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    renderStreaksList() {
      const habits = this.app.state.habits || [];
      const container = document.getElementById('habits-streaks-list');
      if (!container) return;

      if (habits.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem;">No streak logs available.</div>`;
        return;
      }

      let html = '';
      // Sort habits by current streak descending
      const sorted = [...habits].sort((a, b) => (b.streak || 0) - (a.streak || 0));

      sorted.forEach(h => {
        const streakCount = h.streak || 0;
        const flameStyle = streakCount > 0 ? `color: var(--yellow); text-shadow: 0 0 6px rgba(245, 158, 11, 0.4);` : `color: var(--text-muted); opacity: 0.4;`;

        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1rem;">${h.icon}</span>
              <span style="font-size: 0.78rem; font-weight: 600; color: var(--text-main);">${h.name}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 0.75rem; font-weight: bold; color: var(--text-main);">${streakCount} days</span>
              <i class="fas fa-fire" style="${flameStyle}"></i>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    renderCalendar() {
      const habits = this.app.state.habits || [];
      const container = document.getElementById('habits-cal-grid');
      const label = document.getElementById('habits-cal-month-label');
      if (!container || !label) return;

      const year = this.currentCalDate.getFullYear();
      const month = this.currentCalDate.getMonth();

      // Month name
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      label.innerText = `${months[month]} ${year}`;

      // First day of month
      const firstDay = new Date(year, month, 1).getDay();
      // Total days in month
      const totalDays = new Date(year, month + 1, 0).getDate();

      let gridHtml = '';

      // Blank slots
      for (let i = 0; i < firstDay; i++) {
        gridHtml += `<div style="height: 28px; display: flex; align-items: center; justify-content: center; opacity: 0.05;">-</div>`;
      }

      // Populate days
      const today = new Date();
      const todayStr = today.toLocaleDateString('sv').substring(0, 10);

      for (let day = 1; day <= totalDays; day++) {
        const loopDate = new Date(year, month, day);
        const loopDateStr = loopDate.toLocaleDateString('sv').substring(0, 10);
        const dayOfWeek = loopDate.getDay();

        const isToday = loopDateStr === todayStr;

        // Calculate compliance status of scheduled habits on this day
        let daySchedCount = 0;
        let dayDoneCount = 0;
        let dayPartialCount = 0;
        let dayMissedCount = 0;

        habits.forEach(h => {
          if (h.weeklySchedule[dayOfWeek]) {
            daySchedCount++;
            const status = h.history[loopDateStr];
            if (status === 'done') dayDoneCount++;
            else if (status === 'partial') dayPartialCount++;
            else if (status === 'missed') dayMissedCount++;
          }
        });

        // Determine dot highlight
        let dotHtml = '';
        if (daySchedCount > 0) {
          if (dayDoneCount === daySchedCount) {
            dotHtml = `<span style="width: 5px; height: 5px; border-radius: 50%; background: var(--green); display: block; margin: 2px auto 0 auto;"></span>`;
          } else if (dayMissedCount > 0 && dayDoneCount === 0 && dayPartialCount === 0) {
            dotHtml = `<span style="width: 5px; height: 5px; border-radius: 50%; background: var(--red); display: block; margin: 2px auto 0 auto;"></span>`;
          } else if (dayDoneCount > 0 || dayPartialCount > 0) {
            dotHtml = `<span style="width: 5px; height: 5px; border-radius: 50%; background: var(--yellow); display: block; margin: 2px auto 0 auto;"></span>`;
          }
        }

        // Today highlight style
        const todayStyle = isToday ? `background: rgba(168, 85, 247, 0.15); border: 1.5px solid var(--primary); border-radius: 4px;` : '';

        gridHtml += `
          <div style="height: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.72rem; ${todayStyle}">
            <span style="font-weight: ${isToday ? 'bold' : 'normal'}; color: ${isToday ? 'var(--text-main)' : 'var(--text-muted)'};">${day}</span>
            ${dotHtml}
          </div>
        `;
      }

      container.innerHTML = gridHtml;
    },

    renderProgressCircles() {
      const habits = this.app.state.habits || [];
      const container = document.getElementById('habits-progress-circles-container');
      if (!container) return;

      if (habits.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 20px;">No progress data available.</div>`;
        return;
      }

      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const totalDays = new Date(year, month + 1, 0).getDate();

      let html = '';
      habits.forEach(h => {
        let scheduledDays = 0;
        let completedDays = 0;

        for (let day = 1; day <= totalDays; day++) {
          const loopDate = new Date(year, month, day);
          const loopDateStr = loopDate.toLocaleDateString('sv').substring(0, 10);
          const dayOfWeek = loopDate.getDay();

          if (h.weeklySchedule[dayOfWeek]) {
            scheduledDays++;
            if (h.history[loopDateStr] === 'done') {
              completedDays++;
            }
          }
        }

        const pct = scheduledDays > 0 ? Math.round((completedDays / scheduledDays) * 100) : 0;
        
        // SVG circle gauge coordinates
        const radius = 24;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (pct / 100) * circumference;

        html += `
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 80px;">
            <div style="position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">
              <svg width="56" height="56" viewBox="0 0 56 56">
                <!-- Outer Background Circle -->
                <circle cx="28" cy="28" r="${radius}" stroke="rgba(128,128,128,0.15)" stroke-width="4" fill="none" />
                <!-- Progress Arc -->
                <circle cx="28" cy="28" r="${radius}" stroke="${h.color}" stroke-width="4" fill="none" 
                  stroke-dasharray="${circumference}" 
                  stroke-dashoffset="${strokeDashoffset}" 
                  stroke-linecap="round" 
                  transform="rotate(-90 28 28)" />
              </svg>
              <span style="position: absolute; font-size: 0.68rem; font-weight: bold; color: var(--text-main);">${pct}%</span>
            </div>
            <span style="font-size: 0.62rem; color: var(--text-muted); width: 76px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${h.name}">${h.name}</span>
          </div>
        `;
      });

      container.innerHTML = html;
    }
  };

  // Register in LifeOS
  if (window.LifeOS) {
    window.LifeOS.registerModule('habits', HabitsModule);
  } else {
    console.error('LifeOS base application not found for habits.js module registration.');
  }
});
