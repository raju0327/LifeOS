/* ==========================================================================
   LIFE OS - LIFESTYLE, VEHICLES & TRAVEL PLANNER (js/lifestyle.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const LifestyleModule = {
    init() {
      this.setupTravelControls();
      this.setupVehicleControls();
      this.setupMediaControls();
      this.setupShoppingControls();
      this.render();
    },

    onActive() {
      this.render();
    },

    render() {
      this.renderTrips();
      this.renderVehicleLogs();
      this.renderMedia();
      this.renderShoppingList();
    },

    // --- Travel & Trip Planner ---
    setupTravelControls() {
      const form = document.getElementById('travel-form');
      const destInput = document.getElementById('trip-dest');
      const datesInput = document.getElementById('trip-dates');
      const packInput = document.getElementById('trip-packing');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dest = destInput.value.trim();
        if (!dest) return;

        this.app.state.trips.push({
          id: Date.now(),
          destination: dest,
          dates: datesInput.value.trim(),
          packing: packInput.value.trim()
        });

        this.app.saveState();
        this.app.showToast(`Trip to ${dest} created!`, 'success');

        form.reset();
        this.renderTrips();
      });
    },

    renderTrips() {
      const container = document.getElementById('trips-list-container');
      const trips = this.app.state.trips;

      if (trips.length === 0) {
        container.innerHTML = `<div class="empty-state" style="font-size:0.75rem;">No trips logged. Plan a travel getaway!</div>`;
        return;
      }

      let html = '';
      trips.forEach(t => {
        html += `
          <div class="project-item" style="margin-top: 8px;">
            <div class="project-header-row">
              <span>✈️ <strong>${t.destination}</strong></span>
              <button class="icon-btn btn-delete-trip" data-trip-id="${t.id}" style="width:20px;height:20px;"><i data-lucide="x" style="width:10px;height:10px;"></i></button>
            </div>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Dates: ${t.dates}</p>
            <p style="font-size:0.75rem; color:var(--primary); margin-top:2px;">Checklist: ${t.packing || 'None'}</p>
          </div>
        `;
      });

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('.btn-delete-trip').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-trip-id'));
          const idx = this.app.state.trips.findIndex(t => t.id === id);
          if (idx !== -1) {
            this.app.state.trips.splice(idx, 1);
            this.app.saveState();
            this.renderTrips();
          }
        });
      });
    },

    // --- Vehicle Refills & Service History ---
    setupVehicleControls() {
      const form = document.getElementById('vehicle-form');
      const actionSelect = document.getElementById('veh-action');
      const odoInput = document.getElementById('veh-odo');
      const costInput = document.getElementById('veh-cost');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const odo = parseInt(odoInput.value);
        const cost = parseFloat(costInput.value);

        if (isNaN(odo) || isNaN(cost)) return;

        const action = actionSelect.value;
        const newLog = {
          id: Date.now(),
          action: action,
          odo: odo,
          cost: cost
        };

        this.app.state.vehicleLogs.push(newLog);

        // Map as finance expense
        this.app.state.transactions.push({
          id: Date.now(),
          description: `Vehicle: ${action}`,
          amount: cost,
          type: 'expense',
          category: 'Travel',
          date: new Date().toDateString()
        });

        this.app.saveState();
        this.app.showToast('Vehicle log saved to ledger!', 'success');

        form.reset();
        this.renderVehicleLogs();
      });
    },

    renderVehicleLogs() {
      const container = document.getElementById('vehicle-logs-container');
      const logs = this.app.state.vehicleLogs;

      if (logs.length === 0) {
        container.innerHTML = `<li class="empty-state" style="font-size:0.75rem;">No service logs recorded.</li>`;
        return;
      }

      let html = '';
      logs.slice(0, 5).forEach(l => {
        html += `
          <li>
            <span>🚗 <strong>${l.action}</strong> at ${l.odo} mi - Cost: $${parseFloat(l.cost).toFixed(2)}</span>
          </li>
        `;
      });
      container.innerHTML = html;
    },

    // --- Books & Movie library watchlist ---
    setupMediaControls() {
      const form = document.getElementById('media-form');
      const nameInput = document.getElementById('media-name');
      const typeSelect = document.getElementById('media-type');
      const progInput = document.getElementById('media-progress');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const progress = progInput.value.trim();

        if (!name || !progress) return;

        this.app.state.mediaItems.push({
          id: Date.now(),
          name: name,
          type: typeSelect.value,
          progress: progress
        });

        this.app.saveState();
        this.app.showToast(`Saved to ${typeSelect.value} list!`, 'success');

        form.reset();
        this.renderMedia();
      });
    },

    renderMedia() {
      const container = document.getElementById('media-list-container');
      const media = this.app.state.mediaItems;

      if (media.length === 0) {
        container.innerHTML = `<li class="empty-state" style="font-size:0.75rem;">Library is empty. Catalog book titles or movies!</li>`;
        return;
      }

      let html = '';
      media.forEach(m => {
        const icon = m.type === 'Book' ? '📖' : '🎬';
        html += `
          <li>
            <span>${icon} <strong>${m.name}</strong> (${m.type}) - status: ${m.progress}</span>
            <button class="icon-btn btn-delete-media" data-media-id="${m.id}" style="width:20px;height:20px;"><i data-lucide="x" style="width:10px;height:10px;"></i></button>
          </li>
        `;
      });

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('.btn-delete-media').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-media-id'));
          const idx = this.app.state.mediaItems.findIndex(m => m.id === id);
          if (idx !== -1) {
            this.app.state.mediaItems.splice(idx, 1);
            this.app.saveState();
            this.renderMedia();
          }
        });
      });
    },

    // --- Shopping list checklist ---
    setupShoppingControls() {
      const form = document.getElementById('shopping-form');
      const itemInput = document.getElementById('shop-item');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = itemInput.value.trim();
        if (!text) return;

        this.app.state.shoppingList.push({
          id: Date.now(),
          text: text,
          completed: false
        });

        this.app.saveState();
        itemInput.value = '';
        this.renderShoppingList();
      });
    },

    renderShoppingList() {
      const container = document.getElementById('shopping-list-container');
      const list = this.app.state.shoppingList;

      if (list.length === 0) {
        container.innerHTML = `<li class="empty-state" style="font-size:0.75rem;">Shopping list is empty.</li>`;
        return;
      }

      let html = '';
      list.forEach(item => {
        html += `
          <li>
            <span style="cursor:pointer; text-decoration:${item.completed ? 'line-through' : 'none'}; color:${item.completed ? 'var(--text-dim)' : 'inherit'};" class="btn-toggle-shop" data-item-id="${item.id}">
              🛒 ${item.text}
            </span>
            <button class="icon-btn btn-delete-shop" data-item-id="${item.id}"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
          </li>
        `;
      });

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      // Toggle item state
      container.querySelectorAll('.btn-toggle-shop').forEach(span => {
        span.addEventListener('click', () => {
          const id = parseInt(span.getAttribute('data-item-id'));
          const item = this.app.state.shoppingList.find(i => i.id === id);
          if (item) {
            item.completed = !item.completed;
            this.app.saveState();
            this.renderShoppingList();
          }
        });
      });

      // Delete item
      container.querySelectorAll('.btn-delete-shop').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-item-id'));
          const idx = this.app.state.shoppingList.findIndex(i => i.id === id);
          if (idx !== -1) {
            this.app.state.shoppingList.splice(idx, 1);
            this.app.saveState();
            this.renderShoppingList();
          }
        });
      });
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('lifestyle', LifestyleModule);
  }
});
