/* ==========================================================================
   LIFE OS - HEALTH, NUTRITION & CARDIO MODULE (js/health.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const HealthModule = {
    init() {
      this.setupWaterTracker();
      this.setupSleepTracker();
      this.setupNutritionTracker();
      this.setupWorkoutTracker();
      this.render();
    },

    onActive() {
      this.render();
    },

    render() {
      this.renderWater();
      this.renderSleepHistory();
      this.renderNutrition();
      this.renderWorkouts();
    },

    // --- Water Hydration ---
    setupWaterTracker() {
      const addBtn = document.getElementById('add-water-btn');
      const resetBtn = document.getElementById('reset-water-btn');

      addBtn?.addEventListener('click', () => {
        this.app.state.waterIntake = Math.min((this.app.state.waterIntake || 0) + 1, 12);
        this.app.saveState();
        this.app.showToast('Cup of water logged', 'success');
        this.renderWater();
      });

      resetBtn?.addEventListener('click', () => {
        this.app.state.waterIntake = 0;
        this.app.saveState();
        this.app.showToast('Water counter reset', 'info');
        this.renderWater();
      });
    },

    renderWater() {
      const fill = document.getElementById('water-fill-level');
      const text = document.getElementById('water-fraction');
      const cups = this.app.state.waterIntake || 0;

      if (text) text.textContent = `${cups} / 8 cups`;
      const pct = Math.min(Math.round((cups / 8) * 100), 100);
      if (fill) fill.style.height = `${pct}%`;
    },

    // --- Sleep Monitor ---
    setupSleepTracker() {
      const form = document.getElementById('sleep-form');
      if (!form) return;
      const hrsInput = document.getElementById('sleep-hours');
      const qualSelect = document.getElementById('sleep-quality');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const hrs = parseFloat(hrsInput ? hrsInput.value : '');
        if (isNaN(hrs) || hrs <= 0) return;

        const dateStr = new Date().toDateString();
        if (!this.app.state.sleepLogs) this.app.state.sleepLogs = [];
        const existingIdx = this.app.state.sleepLogs.findIndex(sl => sl.date === dateStr);
        const log = {
          date: dateStr,
          hours: hrs,
          quality: qualSelect ? qualSelect.value : 'Good'
        };

        if (existingIdx !== -1) {
          this.app.state.sleepLogs[existingIdx] = log;
          this.app.showToast('Sleep log overwritten for today.', 'success');
        } else {
          this.app.state.sleepLogs.unshift(log);
          this.app.showToast('Sleep logged successfully!', 'success');
        }

        form.reset();
        this.app.saveState();
        this.renderSleepHistory();
      });
    },

    renderSleepHistory() {
      const container = document.getElementById('sleep-history-list');
      if (!container) return;
      const logs = this.app.state.sleepLogs || [];

      if (logs.length === 0) {
        container.innerHTML = `<li class="empty-state" style="font-size:0.75rem;">No sleep logs.</li>`;
        return;
      }

      let html = '';
      logs.slice(0, 5).forEach(log => {
        html += `
          <li>
            <span>🛌 <strong>${log.hours} hours</strong> (${log.quality})</span>
            <span class="list-time">${log.date === new Date().toDateString() ? 'Today' : log.date.substring(0, 10)}</span>
          </li>
        `;
      });
      container.innerHTML = html;
    },



    // --- Nutrition Tracker ---
    setupNutritionTracker() {
      const form = document.getElementById('nutrition-form');
      const mealInput = document.getElementById('nutr-meal');
      const calsInput = document.getElementById('nutr-cals');
      const proteinInput = document.getElementById('nutr-protein');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const meal = mealInput.value.trim();
        const cals = parseInt(calsInput.value);
        const prot = parseInt(proteinInput.value);

        if (!meal || isNaN(cals) || isNaN(prot)) return;

        this.app.state.nutritionLogs.push({
          id: Date.now(),
          meal: meal,
          cals: cals,
          protein: prot
        });

        this.app.saveState();
        this.app.showToast(`Logged meal: "${meal}"`, 'success');

        form.reset();
        this.renderNutrition();
      });
    },

    renderNutrition() {
      const container = document.getElementById('nutrition-list-container');
      const calsDisplay = document.getElementById('nutr-total-cals');
      const protDisplay = document.getElementById('nutr-total-protein');

      const logs = this.app.state.nutritionLogs;
      let totalCals = 0;
      let totalProt = 0;

      logs.forEach(l => {
        totalCals += l.cals;
        totalProt += l.protein;
      });

      calsDisplay.textContent = `${totalCals} kcal`;
      protDisplay.textContent = `${totalProt}g`;

      if (logs.length === 0) {
        container.innerHTML = `<li class="empty-state" style="font-size:0.75rem;">No meals logged today.</li>`;
        return;
      }

      let html = '';
      logs.slice(0, 5).forEach(l => {
        html += `
          <li>
            <span>🍳 <strong>${l.meal}</strong> (${l.cals} kcal, ${l.protein}g protein)</span>
          </li>
        `;
      });
      container.innerHTML = html;
    },

    // --- Workouts Planner ---
    setupWorkoutTracker() {
      const form = document.getElementById('workout-form');
      const typeInput = document.getElementById('work-type');
      const durInput = document.getElementById('work-dur');
      const calsInput = document.getElementById('work-cals');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = typeInput.value.trim();
        const dur = parseInt(durInput.value);
        const cals = parseInt(calsInput.value);

        if (!type || isNaN(dur) || isNaN(cals)) return;

        this.app.state.workoutLogs.push({
          id: Date.now(),
          type: type,
          duration: dur,
          calories: cals
        });

        this.app.saveState();
        this.app.showToast(`Logged workout: "${type}"`, 'success');

        form.reset();
        this.renderWorkouts();
      });
    },

    renderWorkouts() {
      const container = document.getElementById('workouts-list-container');
      const logs = this.app.state.workoutLogs;

      if (logs.length === 0) {
        container.innerHTML = `<li class="empty-state" style="font-size:0.75rem;">No workouts completed yet.</li>`;
        return;
      }

      let html = '';
      logs.slice(0, 5).forEach(w => {
        html += `
          <li>
            <span>🏃‍♂️ <strong>${w.type}</strong> (${w.duration} mins, burned ${w.calories} kcal)</span>
          </li>
        `;
      });
      container.innerHTML = html;
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('health', HealthModule);
  }
});
