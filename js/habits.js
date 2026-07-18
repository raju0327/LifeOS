/* ==========================================================================
   LIFE OS - HABIT TRACKER MODULE (js/habits.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const HabitsModule = {
    currentCalDate: new Date(),

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
            target: '30 minutes',
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
            target: '20 pages',
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
            target: '10 minutes',
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
            target: '3 Liters',
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
            target: '45 minutes',
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
            target: 'No Junk Food',
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
            target: '5 minutes',
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
            target: 'Before 11:00 PM',
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
          addContainer.style.display = addContainer.style.display === 'none' ? 'block' : 'none';
        });
      }

      if (btnCancel && addContainer) {
        btnCancel.addEventListener('click', () => {
          addContainer.style.display = 'none';
          document.getElementById('new-habit-form').reset();
        });
      }

      // Add Habit Form Submit
      const form = document.getElementById('new-habit-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.getElementById('habit-name-input').value.trim();
          const target = document.getElementById('habit-target-input').value.trim();
          const icon = document.getElementById('habit-icon-input').value;
          const color = document.getElementById('habit-color-input').value;

          const days = [];
          document.querySelectorAll('.habit-day-check').forEach(chk => {
            days.push(chk.checked);
          });

          const newHabit = {
            id: 'h-' + Date.now(),
            name,
            target,
            icon,
            color,
            history: {},
            streak: 0,
            bestStreak: 0,
            weeklySchedule: days
          };

          this.app.state.habits.push(newHabit);
          this.app.saveState();
          this.app.showToast('New habit added successfully!', 'success');

          form.reset();
          if (addContainer) addContainer.style.display = 'none';
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
      const todayDayOfWeek = new Date().getDay();

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
      let bestName = 'N/A';
      let overallCurrentStreakSum = 0;

      habits.forEach(h => {
        if (h.bestStreak > bestStreak) {
          bestStreak = h.bestStreak;
          bestName = h.name;
        }
        overallCurrentStreakSum = Math.max(overallCurrentStreakSum, h.streak || 0);
      });

      // Render stats elements
      const sTotal = document.getElementById('stat-habits-total');
      const sCompleted = document.getElementById('stat-habits-completed');
      const sCompletedPct = document.getElementById('stat-habits-completed-pct');
      const sStreak = document.getElementById('stat-habits-streak');
      const sRate = document.getElementById('stat-habits-rate');
      const sBestStreak = document.getElementById('stat-habits-best-streak');
      const sBestName = document.getElementById('stat-habits-best-name');

      if (sTotal) sTotal.innerText = totalHabits;
      if (sCompleted) sCompleted.innerText = completedToday;
      if (sCompletedPct) sCompletedPct.innerText = `${completionPct}% completed`;
      if (sStreak) sStreak.innerText = `${overallCurrentStreakSum} days`;
      if (sBestStreak) sBestStreak.innerText = `${bestStreak} days`;
      if (sBestName) sBestName.innerText = bestName;

      // Calculate weekly average completion rate for Success Rate
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

      // 2. Render Today's Habits List
      const todayListContainer = document.getElementById('habits-today-list');
      if (todayListContainer) {
        if (habits.length === 0) {
          todayListContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 20px;">No habits added yet. Add a habit to get started!</div>`;
        } else {
          // Render today's weekdays header matching S M T W T F S bubbles
          // Find start of week (Sunday)
          const startOfWeek = new Date();
          const dayOffset = startOfWeek.getDay();
          startOfWeek.setDate(startOfWeek.getDate() - dayOffset);

          const daysAbbr = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
          let weekHeadersHtml = '';
          daysAbbr.forEach((abbr, idx) => {
            const currentWeekDate = new Date(startOfWeek);
            currentWeekDate.setDate(startOfWeek.getDate() + idx);
            const isToday = currentWeekDate.toLocaleDateString('sv').substring(0, 10) === todayStr;
            const highlight = isToday ? 'color: var(--text-main); font-weight: bold; text-decoration: underline;' : 'color: var(--text-muted);';
            weekHeadersHtml += `<span style="font-size: 0.65rem; width: 22px; text-align: center; display: inline-block; ${highlight}">${abbr}</span>`;
          });

          let listHtml = `
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--glass-border); padding-bottom: 8px; margin-bottom: 4px;">
              <span style="font-size: 0.75rem; color: var(--text-muted);">Habit</span>
              <div style="display: flex; gap: 4px; padding-right: 48px;">
                ${weekHeadersHtml}
              </div>
            </div>
          `;

          habits.forEach(h => {
            const currentStatus = h.history[todayStr];
            
            // Build action button indicator based on status
            let actionHtml = '';
            if (currentStatus === 'done') {
              actionHtml = `<div onclick="window.LifeOS.modules.habits.cycleHabitStatus('${h.id}')" style="width: 22px; height: 22px; border-radius: 50%; background: var(--green); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.7rem; cursor: pointer;"><i class="fas fa-check"></i></div>`;
            } else if (currentStatus === 'partial') {
              actionHtml = `
                <div onclick="window.LifeOS.modules.habits.cycleHabitStatus('${h.id}')" style="width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg, var(--yellow) 50%, rgba(255,255,255,0.05) 50%); border: 1.5px solid var(--yellow); display: flex; align-items: center; justify-content: center; cursor: pointer;"></div>
              `;
            } else if (currentStatus === 'missed') {
              actionHtml = `<div onclick="window.LifeOS.modules.habits.cycleHabitStatus('${h.id}')" style="width: 20px; height: 20px; border-radius: 50%; border: 2.2px solid var(--red); display: flex; align-items: center; justify-content: center; cursor: pointer;"></div>`;
            } else {
              actionHtml = `<div onclick="window.LifeOS.modules.habits.cycleHabitStatus('${h.id}')" style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--glass-border); display: flex; align-items: center; justify-content: center; cursor: pointer; background: rgba(255,255,255,0.02);"></div>`;
            }

            // Build historical day dots for current week
            let historyDotsHtml = '';
            for (let idx = 0; idx < 7; idx++) {
              const weekDate = new Date(startOfWeek);
              weekDate.setDate(startOfWeek.getDate() + idx);
              const weekDateStr = weekDate.toLocaleDateString('sv').substring(0, 10);
              
              const isSched = h.weeklySchedule[idx];
              const status = h.history[weekDateStr];

              let dotStyle = 'background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border);';
              let dotContent = '';

              if (isSched) {
                if (status === 'done') {
                  dotStyle = 'background: var(--green); border: none; color: #fff;';
                  dotContent = '<i class="fas fa-check" style="font-size: 0.55rem;"></i>';
                } else if (status === 'partial') {
                  dotStyle = 'background: var(--yellow); border: none; color: #fff;';
                  dotContent = '<i class="fas fa-adjust" style="font-size: 0.55rem;"></i>';
                } else if (status === 'missed') {
                  dotStyle = 'background: var(--red); border: none; color: #fff;';
                  dotContent = '<i class="fas fa-times" style="font-size: 0.55rem;"></i>';
                } else {
                  // Scheduled but not done/unlogged
                  dotStyle = 'background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.15);';
                }
              } else {
                // Not scheduled for this day
                dotStyle = 'opacity: 0.15; pointer-events: none; border: 1px dashed rgba(255,255,255,0.2);';
              }

              historyDotsHtml += `
                <div style="width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; ${dotStyle}">
                  ${dotContent}
                </div>
              `;
            }

            listHtml += `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background: ${h.color}15; border: 1.5px solid ${h.color}; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
                    ${h.icon}
                  </div>
                  <div>
                    <h5 style="margin: 0; font-size: 0.8rem; font-weight: 700; color: var(--text-main);">${h.name}</h5>
                    <span style="font-size: 0.65rem; color: var(--text-muted);">${h.target}</span>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="display: flex; gap: 6px; margin-right: 12px;">
                    ${historyDotsHtml}
                  </div>
                  <div style="width: 30px; display: flex; justify-content: center;">
                    ${actionHtml}
                  </div>
                </div>
              </div>
            `;
          });

          // Add delete buttons inside a View All Habits panel or toggle mode
          listHtml += `
            <div style="text-align: center; margin-top: 16px; border-top: 1px solid var(--glass-border); padding-top: 12px;">
              <a href="javascript:void(0)" onclick="window.LifeOS.modules.habits.toggleDeleteMode()" class="small-link" style="color: var(--text-muted); font-size: 0.72rem; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">
                <i class="fas fa-trash-alt"></i> Manage / Delete Habits
              </a>
            </div>
            <div id="habits-delete-list" style="display: none; flex-direction: column; gap: 8px; margin-top: 12px; padding: 10px; background: rgba(239, 68, 68, 0.02); border: 1px solid rgba(239, 68, 68, 0.1); border-radius: 4px;">
              <h5 style="margin: 0 0 8px 0; font-size: 0.75rem; color: var(--red); font-weight: bold;">Select Habit to Remove:</h5>
              ${habits.map(h => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                  <span style="font-size: 0.75rem; color: var(--text-main);">${h.icon} ${h.name}</span>
                  <button onclick="window.LifeOS.modules.habits.deleteHabit('${h.id}')" style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--red); color: var(--red); padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; cursor: pointer; font-weight: bold;">Delete</button>
                </div>
              `).join('')}
            </div>
          `;

          todayListContainer.innerHTML = listHtml;
        }
      }

      // Render Charts & Calendar View
      this.renderOverviewChart();
      this.renderStreaksList();
      this.renderCalendar();
      this.renderProgressCircles();
    },

    toggleDeleteMode() {
      const panel = document.getElementById('habits-delete-list');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
      }
    },

    deleteHabit(id) {
      if (confirm('Are you sure you want to permanently delete this habit?')) {
        this.app.state.habits = this.app.state.habits.filter(h => h.id !== id);
        this.app.saveState();
        this.app.showToast('Habit deleted successfully.', 'info');
        this.render();
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
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
            <span style="font-size: 0.65rem; color: var(--text-muted); margin-bottom: 4px;">${pct}%</span>
            <div style="width: 14px; height: 120px; background: rgba(255,255,255,0.03); border-radius: 4px; display: flex; align-items: flex-end; overflow: hidden; border: 1px solid var(--glass-border);">
              <div style="width: 100%; height: ${barHeight}px; background: ${h.color}; border-radius: 2px;"></div>
            </div>
            <span style="font-size: 0.6rem; color: var(--text-main); margin-top: 6px; width: 45px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center;" title="${h.name}">${h.name}</span>
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
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 65px;">
            <div style="position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">
              <svg width="56" height="56" viewBox="0 0 56 56">
                <!-- Outer Background Circle -->
                <circle cx="28" cy="28" r="${radius}" stroke="rgba(255,255,255,0.03)" stroke-width="4" fill="none" />
                <!-- Progress Arc -->
                <circle cx="28" cy="28" r="${radius}" stroke="${h.color}" stroke-width="4" fill="none" 
                  stroke-dasharray="${circumference}" 
                  stroke-dashoffset="${strokeDashoffset}" 
                  stroke-linecap="round" 
                  transform="rotate(-90 28 28)" />
              </svg>
              <span style="position: absolute; font-size: 0.68rem; font-weight: bold; color: var(--text-main);">${pct}%</span>
            </div>
            <span style="font-size: 0.62rem; color: var(--text-muted); width: 62px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${h.name}">${h.name}</span>
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
