/* ==========================================================================
   LIFE OS - LIFESTYLE & TRAVEL TRACKER CONTROLLER (js/lifestyle.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const LifestyleModule = {
    activeSubview: 'overview',
    selectedTripId: null,

    // Safe DOM helpers
    setText(id, val) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    },

    setHtml(id, val) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = val;
    },

    setValue(id, val) {
      const el = document.getElementById(id);
      if (el) el.value = val;
    },

    getValue(id) {
      const el = document.getElementById(id);
      return el ? el.value : '';
    },

    init() {
      this.bindTabEvents();
      this.bindTripCrudEvents();
      this.bindLifestyleEvents();
      this.bindBucketListEvents();
      this.bindExpenseEvents();
      this.bindGalleryEvents();
      this.bindVisitedPlacesEvents();
      
      // Default load
      this.render();
    },

    onActive() {
      this.render();
    },

    render() {
      this.renderTabPanelVisibility();
      this.calculateAndRenderStats();
      
      if (this.activeSubview === 'overview') {
        this.renderOverview();
      } else if (this.activeSubview === 'plans') {
        this.renderPlans();
      } else if (this.activeSubview === 'trips') {
        this.renderCompletedTrips();
      } else if (this.activeSubview === 'lifestyle') {
        this.renderLifestyleProgress();
      } else if (this.activeSubview === 'bucket') {
        this.renderBucketList();
      } else if (this.activeSubview === 'expenses') {
        this.renderExpensesLedger();
      } else if (this.activeSubview === 'gallery') {
        this.renderGallery();
      } else if (this.activeSubview === 'map') {
        this.renderMapView();
      }
    },

    // --- Subnavigation Tab Management ---
    bindTabEvents() {
      document.querySelectorAll('.travel-subnav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activeSubview = btn.getAttribute('data-subview');
          
          document.querySelectorAll('.travel-subnav-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          this.render();
        });
      });

      // View All / Navigation Shortcuts inside dashboard
      document.addEventListener('click', (e) => {
        const viewAllBtn = e.target.closest('.travel-view-all-btn');
        if (viewAllBtn) {
          e.preventDefault();
          const target = viewAllBtn.getAttribute('data-subview');
          const tabBtn = document.querySelector(`.travel-subnav-btn[data-subview="${target}"]`);
          if (tabBtn) tabBtn.click();
        }
      });
    },

    renderTabPanelVisibility() {
      document.querySelectorAll('.travel-subview-panel').forEach(panel => {
        const subviewId = panel.id.replace('travel-subview-', '');
        if (subviewId === this.activeSubview) {
          panel.classList.remove('hidden-panel');
        } else {
          panel.classList.add('hidden-panel');
        }
      });
    },

    // --- Global Stats Calculator ---
    calculateAndRenderStats() {
      if (!this.app || !this.app.state) return;
      const trips = this.app.state.travelTrips || [];
      const expenses = this.app.state.travelExpenses || [];
      const photos = this.app.state.travelGallery || [];
      const places = this.app.state.visitedPlaces || [];

      // 1. Trips Count
      const activeTripsCount = trips.length;
      const upcomingCount = trips.filter(t => t.status === 'Planned').length;
      this.setText('travel-stat-trips-count', activeTripsCount);
      this.setText('travel-stat-upcoming-badge', `${upcomingCount} Upcoming`);

      // 2. Days Travelled
      let totalDays = 0;
      trips.forEach(t => {
        if (t.startDate && t.endDate) {
          const start = new Date(t.startDate);
          const end = new Date(t.endDate);
          const diff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
          totalDays += diff;
        }
      });
      this.setText('travel-stat-days-count', totalDays);
      this.setText('travel-stat-days-badge', `+${Math.max(0, totalDays - 12)} days vs last year`);

      // 3. Places Visited
      const countries = new Set(places.map(p => (p.country || '').toLowerCase()));
      this.setText('travel-stat-places-count', places.length);
      this.setText('travel-stat-countries-badge', `${countries.size} Countries`);

      // 4. Total Spent
      const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      this.setText('travel-stat-spent-count', `₹${totalSpent.toLocaleString('en-IN')}`);
      
      const totalBudget = trips.reduce((sum, t) => sum + (Number(t.budget) || 0), 0);
      const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
      this.setText('travel-stat-spent-badge', `${budgetPct}% of budgeted cost`);

      // 5. Photos Captured
      this.setText('travel-stat-photos-count', photos.length);

      // Sync map footprint summary
      this.setText('travel-map-countries-count', countries.size);
      this.setText('travel-map-cities-count', places.length);
      this.setText('travel-map-trips-count', trips.length);
      this.setText('travel-map-days-count', totalDays);

      // Update statistics object in global state
      this.app.state.travelStatistics = {
        countriesCount: countries.size,
        citiesCount: places.length,
        tripsCount: trips.length,
        daysTravelled: totalDays,
        totalSpent: totalSpent,
        photosCaptured: photos.length
      };
    },

    // --- A. Overview View Renders ---
    renderOverview() {
      if (!this.app || !this.app.state) return;
      const trips = this.app.state.travelTrips || [];
      const bucket = this.app.state.bucketList || [];
      const today = new Date();

      // 1. Featured Upcoming Trip Highlight
      const highlightWrapper = document.getElementById('travel-upcoming-highlight-content');
      if (highlightWrapper) {
        const upcomingTrips = trips.filter(t => t.status === 'Planned').sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        if (upcomingTrips.length === 0) {
          highlightWrapper.innerHTML = `
            <div class="empty-state" style="padding: 40px 0; text-align: center; color: var(--text-muted);">
              <i class="fas fa-route" style="font-size: 2rem; opacity: 0.2; margin-bottom: 8px; display: block;"></i>
              No upcoming trips planned. Go to <strong>Travel Plans</strong> to sketch a new destination escape!
            </div>
          `;
        } else {
          const featured = upcomingTrips[0];
          const startDate = new Date(featured.startDate);
          const countdownDays = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
          const countdownStr = countdownDays > 0 ? `In ${countdownDays} Days` : (countdownDays === 0 ? 'Today!' : 'Ongoing');
          const defaultCover = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80';
          
          // Calculate sub-metrics
          const tripDays = Math.max(1, Math.round((new Date(featured.endDate) - startDate) / (1000 * 60 * 60 * 24)) + 1);
          const checklist = this.app.state.packingChecklist || [];
          const tripChecklist = checklist.filter(c => c.tripId === featured.id);
          const thingsToDo = tripChecklist.length;

          highlightWrapper.innerHTML = `
            <div class="featured-trip-layout" style="display: flex; gap: 20px; align-items: start;" class="upcoming-trip-row">
              <!-- Cover image -->
              <div style="flex: 1.1; position: relative; height: 180px; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--glass-border);">
                <img src="${featured.coverImage || defaultCover}" style="width: 100%; height: 100%; object-fit: cover;" alt="${featured.destination}">
                <span style="position: absolute; top: 12px; right: 12px; background: var(--primary); color: #fff; font-size: 0.65rem; font-weight: 700; padding: 4px 8px; border-radius: var(--radius-sm); box-shadow: 0 2px 6px rgba(168,85,247,0.3);">${countdownStr}</span>
              </div>
              
              <!-- Details -->
              <div style="flex: 1.2; display: flex; flex-direction: column; justify-content: space-between; height: 180px; box-sizing: border-box;">
                <div>
                  <h4 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${featured.destination}</h4>
                  <p style="margin: 4px 0 0 0; font-size: 0.72rem; color: var(--text-muted);"><i class="fas fa-map-marker-alt" style="margin-right: 4px; color: var(--primary);"></i> ${featured.destination}</p>
                  <p style="margin: 4px 0 0 0; font-size: 0.72rem; color: var(--text-muted);"><i class="far fa-calendar-alt" style="margin-right: 4px; color: var(--primary);"></i> ${this.formatDateRange(featured.startDate, featured.endDate)}</p>
                </div>

                <!-- Progress bar -->
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 0.65rem; color: var(--text-muted);">Trip Progress</span>
                    <span style="font-size: 0.65rem; font-weight: 700; color: var(--primary);">${featured.progress || 0}%</span>
                  </div>
                  <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; border: 1px solid var(--glass-border);">
                    <div style="width: ${featured.progress || 0}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-light)); border-radius: 3px;"></div>
                  </div>
                </div>

                <!-- Mini metrics -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; border-top: 1px solid var(--glass-border); padding-top: 10px;" class="upcoming-highlight-submetrics">
                  <div style="text-align: center;">
                    <strong style="font-size: 0.85rem; color: var(--text-main); display: block;">${tripDays}</strong>
                    <span style="font-size: 0.58rem; color: var(--text-muted);">Days</span>
                  </div>
                  <div style="text-align: center; border-left: 1px solid var(--glass-border);">
                    <strong style="font-size: 0.85rem; color: var(--text-main); display: block;">${featured.travelers || 1}</strong>
                    <span style="font-size: 0.58rem; color: var(--text-muted);">Travelers</span>
                  </div>
                  <div style="text-align: center; border-left: 1px solid var(--glass-border);">
                    <strong style="font-size: 0.85rem; color: var(--text-main); display: block;">₹${(featured.budget / 1000).toFixed(1)}k</strong>
                    <span style="font-size: 0.58rem; color: var(--text-muted);">Budget</span>
                  </div>
                  <div style="text-align: center; border-left: 1px solid var(--glass-border);">
                    <strong style="font-size: 0.85rem; color: var(--text-main); display: block;">${thingsToDo}</strong>
                    <span style="font-size: 0.58rem; color: var(--text-muted);">To Pack</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
      }

      // 2. Upcoming Plans List
      const upcomingPlansList = document.getElementById('travel-list-upcoming-plans');
      if (upcomingPlansList) {
        const upcomingPlans = trips.filter(t => t.status === 'Planned').slice(0, 3);
        if (upcomingPlans.length === 0) {
          upcomingPlansList.innerHTML = `<div class="empty-state" style="font-size:0.75rem; text-align:center; padding: 20px 0;">No planned getaways.</div>`;
        } else {
          let html = '';
          upcomingPlans.forEach(p => {
            const tripDays = Math.max(1, Math.round((new Date(p.endDate) - new Date(p.startDate)) / (1000 * 60 * 60 * 24)) + 1);
            const defaultCover = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=100&q=80';
            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); border-radius: var(--radius-sm);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <img src="${p.coverImage || defaultCover}" style="width: 38px; height: 38px; border-radius: 6px; object-fit: cover; border: 1px solid var(--glass-border);">
                  <div>
                    <strong style="font-size: 0.78rem; color: var(--text-main); display: block;">${p.destination}</strong>
                    <span style="font-size: 0.65rem; color: var(--text-muted);"><i class="far fa-calendar-alt" style="margin-right: 3px;"></i> ${this.formatMiniDateRange(p.startDate, p.endDate)} • ${tripDays} Days</span>
                  </div>
                </div>
                <span class="status-badge status-badge-planned" style="font-size: 0.6rem; padding: 2px 6px;">Planned</span>
              </div>
            `;
          });
          upcomingPlansList.innerHTML = html;
        }
      }

      // 3. Recent Trips List
      const recentTripsList = document.getElementById('travel-list-recent-trips');
      if (recentTripsList) {
        const recentTrips = trips.filter(t => t.status === 'Completed').sort((a,b) => new Date(b.endDate) - new Date(a.endDate)).slice(0, 3);
        if (recentTrips.length === 0) {
          recentTripsList.innerHTML = `<div class="empty-state" style="font-size:0.75rem; text-align:center; padding: 20px 0;">No completed trips logged.</div>`;
        } else {
          let html = '';
          recentTrips.forEach(p => {
            const tripDays = Math.max(1, Math.round((new Date(p.endDate) - new Date(p.startDate)) / (1000 * 60 * 60 * 24)) + 1);
            const defaultCover = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=100&q=80';
            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); border-radius: var(--radius-sm);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <img src="${p.coverImage || defaultCover}" style="width: 38px; height: 38px; border-radius: 6px; object-fit: cover; border: 1px solid var(--glass-border);">
                  <div>
                    <strong style="font-size: 0.78rem; color: var(--text-main); display: block;">${p.destination}</strong>
                    <span style="font-size: 0.65rem; color: var(--text-muted);"><i class="far fa-calendar-alt" style="margin-right: 3px;"></i> ${this.formatMiniDateRange(p.startDate, p.endDate)} • ${tripDays} Days</span>
                  </div>
                </div>
                <span class="status-badge status-badge-completed" style="font-size: 0.6rem; padding: 2px 6px; background: rgba(16,185,129,0.15); color: var(--green);">Completed</span>
              </div>
            `;
          });
          recentTripsList.innerHTML = html;
        }
      }

      // 4. Bucket List Cards Scrolling Tray
      const bucketTray = document.getElementById('travel-overview-bucket-list-tray');
      if (bucketTray) {
        let bucketHtml = '';
        
        bucket.slice(0, 5).forEach(b => {
          const heartClass = b.liked ? 'fas fa-heart' : 'far fa-heart';
          const heartColor = b.liked ? 'color: var(--red);' : '';
          bucketHtml += `
            <div class="glass-card bucket-tray-card" style="flex: 0 0 160px; height: 160px; position: relative; border-radius: var(--radius-md); overflow: hidden; padding: 0; border: 1px solid var(--glass-border);">
              <img src="${b.imageUrl}" style="width:100%; height:100%; object-fit:cover; position:absolute; z-index:1;" alt="${b.destination}">
              <div style="position:absolute; bottom:0; left:0; right:0; padding:12px; background:linear-gradient(0deg, rgba(0,0,0,0.8), transparent); z-index:2; text-shadow:0 1px 3px rgba(0,0,0,0.8);">
                <strong style="font-size:0.75rem; color:#fff; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b.destination}</strong>
                <span style="font-size:0.58rem; color:rgba(255,255,255,0.6); display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b.country || 'Dream Trip'}</span>
              </div>
              <button class="icon-btn btn-like-bucket" data-bucket-id="${b.id}" style="position:absolute; top:10px; right:10px; z-index:3; width:26px; height:26px; background:rgba(0,0,0,0.4); border:none; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                <i class="${heartClass}" style="${heartColor}"></i>
              </button>
            </div>
          `;
        });

        // Add New destination block card trigger at end
        bucketHtml += `
          <div class="glass-card bucket-tray-card-add" id="travel-btn-overview-add-bucket" style="flex: 0 0 160px; height: 160px; border-radius: var(--radius-md); border: 2px dashed var(--glass-border); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; background: rgba(255,255,255,0.01); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='rgba(255,255,255,0.01)'">
            <i class="fas fa-plus" style="font-size: 1.4rem; color: var(--primary); margin-bottom: 8px;"></i>
            <span style="font-size: 0.72rem; font-weight: 600; color: var(--text-main);">Add New</span>
          </div>
        `;

        bucketTray.innerHTML = bucketHtml;

        // Bind like toggles inside tray
        bucketTray.querySelectorAll('.btn-like-bucket').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bid = btn.getAttribute('data-bucket-id');
            this.toggleBucketItemLike(bid);
          });
        });

        // Bind overview add bucket trigger
        document.getElementById('travel-btn-overview-add-bucket')?.addEventListener('click', () => {
          this.toggleModal('travel-bucket-modal-overlay', true);
        });
      }

      // Render circular gauges in summary
      this.renderCircularRings();
    },

    renderCircularRings() {
      // Update texts in list
      this.setText('travel-lifestyle-steps-val', '7,892');
      this.setText('travel-lifestyle-workout-val', '3 / 5');
      this.setText('travel-lifestyle-water-val', '6 / 8 cups');
      this.setText('travel-lifestyle-sleep-val', '7h 10m');

      document.querySelectorAll('.lifestyle-ring-container').forEach(c => {
        const pct = c.getAttribute('data-pct');
        const color = c.getAttribute('data-color');
        
        const radius = 13;
        const circ = 2 * Math.PI * radius;
        const offset = circ - (pct / 100) * circ;

        c.innerHTML = `
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="${radius}" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="2.5"></circle>
            <circle cx="16" cy="16" r="${radius}" fill="none" stroke="${color}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-width="2.5" stroke-linecap="round" transform="rotate(-90 16 16)"></circle>
          </svg>
        `;
      });
    },

    // --- B. Travel Plans View Renders ---
    renderPlans() {
      if (!this.app || !this.app.state) return;
      const trips = this.app.state.travelTrips || [];
      const searchQuery = this.getValue('travel-plans-search').toLowerCase().trim();
      const listContainer = document.getElementById('travel-plans-trips-list');
      if (!listContainer) return;
      
      const filtered = trips.filter(t => (t.destination || '').toLowerCase().includes(searchQuery));

      if (filtered.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state" style="padding: 40px 0; text-align: center; color: var(--text-muted);">
            No matching planned trips found. Create one by clicking "Plan A Trip"!
          </div>
        `;
        const drawer = document.getElementById('travel-plans-detail-drawer');
        if (drawer) {
          drawer.innerHTML = `
            <div class="empty-state" style="padding: 80px 0; text-align: center; color: var(--text-muted);">
              <i class="fas fa-plane-departure" style="font-size: 2.5rem; opacity: 0.2; margin-bottom: 12px; display: block;"></i>
              Select a planned trip to customize itinerary, checklist, budget expenses, and documents.
            </div>
          `;
        }
        return;
      }

      // Render trips left list
      let listHtml = '';
      filtered.forEach(t => {
        const tripDays = Math.max(1, Math.round((new Date(t.endDate) - new Date(t.startDate)) / (1000 * 60 * 60 * 24)) + 1);
        const isActive = this.selectedTripId === t.id ? 'background: rgba(168, 85, 247, 0.08); border-color: var(--primary);' : '';
        const defaultCover = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=150&q=80';
        const badgeColor = t.status === 'Planned' ? 'background: rgba(168,85,247,0.15); color: var(--primary-light);' : 'background: rgba(16,185,129,0.15); color: var(--green);';
        
        listHtml += `
          <div class="glass-card travel-trip-plan-item" style="padding: 14px; display: flex; gap: 12px; cursor: pointer; align-items: center; border-radius: var(--radius-md); border: 1px solid var(--glass-border); transition: border-color 0.2s; ${isActive}" data-trip-id="${t.id}">
            <img src="${t.coverImage || defaultCover}" style="width: 52px; height: 52px; border-radius: var(--radius-sm); object-fit: cover; border: 1px solid var(--glass-border);">
            <div style="flex-grow: 1;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 0.85rem; color: var(--text-main);">${t.destination}</strong>
                <span class="status-badge" style="font-size: 0.58rem; padding: 2px 6px; ${badgeColor}">${t.status}</span>
              </div>
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 2px;"><i class="far fa-calendar-alt" style="margin-right: 4px;"></i> ${this.formatMiniDateRange(t.startDate, t.endDate)} • ${tripDays} Days</span>
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 1px;"><i class="fas fa-coins" style="margin-right: 4px;"></i> Budget: ₹${Number(t.budget).toLocaleString('en-IN')}</span>
            </div>
          </div>
        `;
      });
      listContainer.innerHTML = listHtml;

      // Select first trip if none is selected
      if (!this.selectedTripId && filtered.length > 0) {
        this.selectedTripId = filtered[0].id;
        this.renderPlans();
        return;
      }

      listContainer.querySelectorAll('.travel-trip-plan-item').forEach(item => {
        item.addEventListener('click', () => {
          this.selectedTripId = item.getAttribute('data-trip-id');
          this.renderPlans();
        });
      });

      this.renderTripDetailDrawer();
    },

    renderTripDetailDrawer() {
      const drawer = document.getElementById('travel-plans-detail-drawer');
      if (!drawer) return;

      const trip = (this.app.state.travelTrips || []).find(t => t.id === this.selectedTripId);
      
      if (!trip) {
        drawer.innerHTML = `
          <div class="empty-state" style="padding: 80px 0; text-align: center; color: var(--text-muted);">
            <i class="fas fa-plane-departure" style="font-size: 2.5rem; opacity: 0.2; margin-bottom: 12px; display: block;"></i>
            Select a planned trip to customize itinerary, checklist, budget expenses, and documents.
          </div>
        `;
        return;
      }

      const itinerary = (this.app.state.travelItinerary || []).filter(i => i.tripId === trip.id).sort((a,b) => a.dayNumber - b.dayNumber || (a.time || '').localeCompare(b.time || ''));
      const checklist = (this.app.state.packingChecklist || []).filter(c => c.tripId === trip.id);
      const expenses = (this.app.state.travelExpenses || []).filter(e => e.tripId === trip.id);
      const documents = (this.app.state.travelDocuments || []).filter(d => d.tripId === trip.id);
      const notes = (this.app.state.travelNotes || []).filter(n => n.tripId === trip.id);

      const packedCount = checklist.filter(c => c.checked).length;
      const totalPack = checklist.length;

      const spent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const budgetRemaining = Math.max(0, trip.budget - spent);

      const statusBtnText = trip.status === 'Planned' ? 'Mark Completed' : 'Mark Planned';
      const statusBtnClass = trip.status === 'Planned' ? 'btn-glass-subtle' : 'btn-primary-glow';

      let itineraryHtml = '';
      if (itinerary.length === 0) {
        itineraryHtml = `<div class="empty-state" style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:20px 0;">No activities scheduled yet.</div>`;
      } else {
        itinerary.forEach(item => {
          itineraryHtml += `
            <div style="display: flex; gap: 12px; align-items: start; padding: 10px; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); margin-bottom: 8px;">
              <div style="font-size: 0.72rem; font-weight: bold; background: var(--primary); color:#fff; padding: 2px 6px; border-radius: 4px; flex-shrink: 0; min-width: 45px; text-align: center;">Day ${item.dayNumber}</div>
              <div style="flex-grow: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="font-size: 0.78rem; color: var(--text-main);">${item.activity}</strong>
                  <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600;"><i class="far fa-clock" style="margin-right: 3px;"></i> ${item.time}</span>
                </div>
                ${item.description ? `<p style="margin: 4px 0 0 0; font-size: 0.72rem; color: var(--text-muted);">${item.description}</p>` : ''}
                ${item.location ? `<p style="margin: 4px 0 0 0; font-size: 0.65rem; color: var(--primary-light); font-weight:600;"><i class="fas fa-map-marker-alt" style="margin-right: 4px;"></i> ${item.location}</p>` : ''}
              </div>
              <button class="icon-btn btn-delete-itinerary" data-itinerary-id="${item.id}" style="color: var(--text-muted);"><i class="fas fa-trash-alt" style="font-size: 0.75rem;"></i></button>
            </div>
          `;
        });
      }

      let checklistHtml = '';
      if (checklist.length === 0) {
        checklistHtml = `<div class="empty-state" style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:20px 0;">Packing checklist is empty.</div>`;
      } else {
        checklist.forEach(item => {
          const checkedAttr = item.checked ? 'checked' : '';
          const lineStrike = item.checked ? 'text-decoration: line-through; color: var(--text-muted);' : 'color: var(--text-main);';
          checklistHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); margin-bottom: 6px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.78rem; ${lineStrike}">
                <input type="checkbox" class="travel-checklist-chk" data-item-id="${item.id}" ${checkedAttr} style="width: 14px; height: 14px;">
                <span>${item.itemName}</span>
                <span style="font-size: 0.6rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 3px;">${item.category}</span>
              </label>
              <button class="icon-btn btn-delete-packing" data-item-id="${item.id}"><i class="fas fa-times" style="font-size: 0.75rem; color: var(--text-muted);"></i></button>
            </div>
          `;
        });
      }

      let docHtml = '';
      if (documents.length === 0) {
        docHtml = `<div class="empty-state" style="font-size:0.72rem; color:var(--text-muted); text-align:center; padding:10px 0;">No documents uploaded.</div>`;
      } else {
        documents.forEach(d => {
          docHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); margin-bottom: 6px; font-size: 0.72rem;">
              <span style="color: var(--text-main); font-weight: 600;"><i class="far fa-file-pdf" style="margin-right: 6px; color: var(--red);"></i> ${d.name} (${d.type})</span>
              <div style="display: flex; gap: 8px;">
                <a href="${d.fileUrl}" target="_blank" class="icon-btn" style="color:var(--primary-light);"><i class="fas fa-external-link-alt" style="font-size:0.7rem;"></i></a>
                <button class="icon-btn btn-delete-document" data-doc-id="${d.id}"><i class="fas fa-trash-alt" style="font-size:0.7rem; color: var(--text-muted);"></i></button>
              </div>
            </div>
          `;
        });
      }

      let notesContent = notes.length > 0 ? notes[0].content : '';

      drawer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h4 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-main);">${trip.destination}</h4>
            <span style="font-size: 0.72rem; color: var(--text-muted);"><i class="far fa-calendar-alt" style="margin-right: 4px;"></i> ${this.formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>
          
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn-glass-subtle btn-sm" id="travel-btn-edit-trip" style="padding: 4px 10px; font-size:0.75rem;"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn-glass-subtle btn-sm" id="travel-btn-delete-trip" style="padding: 4px 10px; font-size:0.75rem; color: var(--red);"><i class="fas fa-trash-alt"></i> Delete</button>
            <button class="${statusBtnClass} btn-sm" id="travel-btn-toggle-status" style="padding: 4px 12px; font-size:0.75rem;">${statusBtnText}</button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;" class="trip-drawer-stats-row">
          <div style="padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); background: rgba(255,255,255,0.01); text-align: center;">
            <strong style="font-size:0.95rem; color: var(--text-main); display:block;">₹${Number(trip.budget).toLocaleString('en-IN')}</strong>
            <span style="font-size:0.6rem; color:var(--text-muted);">Allocated Budget</span>
          </div>
          <div style="padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); background: rgba(255,255,255,0.01); text-align: center;">
            <strong style="font-size:0.95rem; color: var(--yellow); display:block;">₹${spent.toLocaleString('en-IN')}</strong>
            <span style="font-size:0.6rem; color:var(--text-muted);">Total Cost Logged</span>
          </div>
          <div style="padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); background: rgba(255,255,255,0.01); text-align: center;">
            <strong style="font-size:0.95rem; color: var(--green); display:block;">₹${budgetRemaining.toLocaleString('en-IN')}</strong>
            <span style="font-size:0.6rem; color:var(--text-muted);">Budget Left</span>
          </div>
          <div style="padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); background: rgba(255,255,255,0.01); text-align: center;">
            <strong style="font-size:0.95rem; color: var(--primary-light); display:block;">${packedCount} / ${totalPack}</strong>
            <span style="font-size:0.6rem; color:var(--text-muted);">Items Packed</span>
          </div>
        </div>

        <div class="glass-card" style="padding: 16px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 12px 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main);"><i class="fas fa-hotel" style="margin-right: 6px; color: var(--primary);"></i> Lodging & Flights</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;" class="lodging-grid">
            <div class="input-group" style="margin-bottom:0;">
              <label style="font-size: 0.65rem;">Accommodation Hotel</label>
              <input type="text" id="travel-detail-lodging" value="${trip.lodging || ''}" placeholder="e.g. Grand Resort Hotel" style="font-size:0.75rem; padding:6px 10px;">
            </div>
            <div class="input-group" style="margin-bottom:0;">
              <label style="font-size: 0.65rem;">Transportation Info (Flights / Trains)</label>
              <input type="text" id="travel-detail-transport" value="${trip.transport || ''}" placeholder="e.g. Flight AirIndia AI-42" style="font-size:0.75rem; padding:6px 10px;">
            </div>
          </div>
          <button type="button" class="btn-glass-subtle btn-sm" id="travel-btn-save-lodging-details" style="margin-top: 10px; width: 100%; font-size: 0.72rem; padding: 4px;">Update Lodging Details</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start;" class="trip-editor-split-grids">
          <div class="glass-card" style="padding: 16px;">
            <h4 style="margin: 0 0 12px 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main);"><i class="fas fa-route" style="margin-right: 6px; color: var(--primary);"></i> Activities Itinerary</h4>
            
            <form id="travel-add-itinerary-form" style="display: flex; gap: 8px; flex-direction: column; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px dashed var(--glass-border);">
              <div style="display: flex; gap: 6px;">
                <input type="number" id="itinerary-input-day" placeholder="Day (e.g. 1)" min="1" required style="width: 60px; font-size: 0.75rem; padding: 4px 6px;">
                <input type="text" id="itinerary-input-time" placeholder="Time (e.g. 09:00 AM)" required style="flex-grow:1; font-size: 0.75rem; padding: 4px 6px;">
              </div>
              <input type="text" id="itinerary-input-activity" placeholder="Activity name (e.g. Hiking Sunrise)" required style="font-size: 0.75rem; padding: 4px 6px;">
              <input type="text" id="itinerary-input-loc" placeholder="Location coordinates/name" style="font-size: 0.75rem; padding: 4px 6px;">
              <button type="submit" class="btn-primary-glow btn-sm" style="font-size:0.7rem; padding:4px;">Add Activity</button>
            </form>

            <div style="max-height: 250px; overflow-y: auto;" id="travel-itinerary-items-list">
              ${itineraryHtml}
            </div>
          </div>

          <div class="glass-card" style="padding: 16px;">
            <h4 style="margin: 0 0 12px 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main);"><i class="fas fa-box" style="margin-right: 6px; color: var(--primary);"></i> Packing Checklist</h4>
            
            <form id="travel-add-packing-form" style="display: flex; gap: 6px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px dashed var(--glass-border);">
              <input type="text" id="packing-input-name" placeholder="Item (e.g. Camera)" required style="flex-grow: 2; font-size: 0.75rem; padding: 4px 6px;">
              <select id="packing-input-cat" style="flex-grow: 1; font-size: 0.72rem; padding: 2px;">
                <option value="General">General</option>
                <option value="Clothing">Clothing</option>
                <option value="Electronics">Electronics</option>
                <option value="Documents">Docs</option>
              </select>
              <button type="submit" class="btn-primary-glow btn-sm" style="font-size:0.7rem; padding: 4px 8px;"><i class="fas fa-plus"></i></button>
            </form>

            <div style="max-height: 250px; overflow-y: auto;" id="travel-packing-items-list">
              ${checklistHtml}
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-top: 20px; align-items: start;" class="trip-editor-split-grids">
          <div class="glass-card" style="padding: 16px;">
            <h4 style="margin: 0 0 12px 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main);"><i class="far fa-sticky-note" style="margin-right: 6px; color: var(--primary);"></i> Travel Notes</h4>
            <textarea id="travel-note-editor" style="width:100%; height:120px; box-sizing:border-box; background: var(--bg-sidebar); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); color:var(--text-main); font-size: 0.75rem; padding:8px;" placeholder="Write any booking details, flight details, or travel goals...">${notesContent}</textarea>
            <button type="button" class="btn-glass-subtle btn-sm" id="travel-btn-save-notes" style="margin-top: 8px; width: 100%; font-size: 0.72rem; padding:4px;">Save Notes</button>
          </div>

          <div class="glass-card" style="padding: 16px;">
            <h4 style="margin: 0 0 12px 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main);"><i class="far fa-file" style="margin-right: 6px; color: var(--primary);"></i> Travel Documents</h4>
            
            <form id="travel-add-document-form" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed var(--glass-border);">
              <input type="text" id="doc-input-name" placeholder="Document Name (e.g. Visa Copy)" required style="font-size: 0.75rem; padding: 4px 6px;">
              <div style="display:flex; gap:6px;">
                <select id="doc-input-type" style="flex:1; font-size: 0.72rem; padding:2px;">
                  <option value="Ticket">Ticket</option>
                  <option value="Passport">Passport</option>
                  <option value="Hotel Booking">Hotel Book</option>
                  <option value="Other">Other</option>
                </select>
                <input type="url" id="doc-input-url" placeholder="File URL (https://...)" required style="flex:2; font-size: 0.75rem; padding: 4px 6px;">
              </div>
              <button type="submit" class="btn-primary-glow btn-sm" style="font-size:0.7rem; padding: 4px;">Attach Document</button>
            </form>

            <div style="max-height: 150px; overflow-y: auto;" id="travel-documents-items-list">
              ${docHtml}
            </div>
          </div>
        </div>
      `;

      this.bindTripDetailDrawerActions(trip);
    },

    bindTripDetailDrawerActions(trip) {
      document.getElementById('travel-btn-edit-trip')?.addEventListener('click', () => {
        this.setValue('travel-trip-id', trip.id);
        this.setValue('travel-input-dest', trip.destination);
        this.setValue('travel-input-start', trip.startDate);
        this.setValue('travel-input-end', trip.endDate);
        this.setValue('travel-input-budget', trip.budget);
        this.setValue('travel-input-travelers', trip.travelers || 1);
        this.setValue('travel-input-image', trip.coverImage || '');
        
        this.setText('travel-modal-title', 'Edit Trip Plan');
        this.toggleModal('travel-trip-modal-overlay', true);
      });

      document.getElementById('travel-btn-delete-trip')?.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete your trip plan to ${trip.destination}?`)) {
          this.deleteTrip(trip.id);
        }
      });

      document.getElementById('travel-btn-toggle-status')?.addEventListener('click', () => {
        trip.status = trip.status === 'Planned' ? 'Completed' : 'Planned';
        if (trip.status === 'Completed') trip.progress = 100;
        this.app.saveState();
        this.app.showToast(`Trip to ${trip.destination} marked as ${trip.status}.`, 'success');
        this.render();
      });

      document.getElementById('travel-btn-save-lodging-details')?.addEventListener('click', () => {
        const lodging = this.getValue('travel-detail-lodging').trim();
        const transport = this.getValue('travel-detail-transport').trim();
        
        trip.lodging = lodging;
        trip.transport = transport;
        
        this.app.saveState();
        this.app.showToast('Lodging & Flight details updated!', 'success');
        this.render();
      });

      document.getElementById('travel-add-itinerary-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const day = Number(this.getValue('itinerary-input-day')) || 1;
        const time = this.getValue('itinerary-input-time').trim();
        const activity = this.getValue('itinerary-input-activity').trim();
        const location = this.getValue('itinerary-input-loc').trim();

        if (!activity) return;

        this.app.state.travelItinerary.push({
          id: 'itin-' + Date.now(),
          tripId: trip.id,
          dayNumber: day,
          date: '',
          time: time,
          activity: activity,
          description: '',
          location: location
        });

        this.updateTripProgressPct(trip);
        this.app.saveState();
        this.app.showToast('Activity scheduled successfully!', 'success');
        this.render();
      });

      document.querySelectorAll('.btn-delete-itinerary').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-itinerary-id');
          this.app.state.travelItinerary = this.app.state.travelItinerary.filter(i => i.id !== id);
          this.updateTripProgressPct(trip);
          this.app.saveState();
          this.render();
        });
      });

      document.getElementById('travel-add-packing-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = this.getValue('packing-input-name').trim();
        const cat = this.getValue('packing-input-cat');

        if (!name) return;

        this.app.state.packingChecklist.push({
          id: 'pack-' + Date.now(),
          tripId: trip.id,
          itemName: name,
          checked: false,
          category: cat
        });

        this.updateTripProgressPct(trip);
        this.app.saveState();
        this.app.showToast(`${name} added to packing checklist.`, 'success');
        this.render();
      });

      document.querySelectorAll('.btn-delete-packing').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-item-id');
          this.app.state.packingChecklist = this.app.state.packingChecklist.filter(c => c.id !== id);
          this.updateTripProgressPct(trip);
          this.app.saveState();
          this.render();
        });
      });

      document.querySelectorAll('.travel-checklist-chk').forEach(chk => {
        chk.addEventListener('change', () => {
          const id = chk.getAttribute('data-item-id');
          const item = this.app.state.packingChecklist.find(c => c.id === id);
          if (item) {
            item.checked = chk.checked;
            this.updateTripProgressPct(trip);
            this.app.saveState();
            this.render();
          }
        });
      });

      document.getElementById('travel-btn-save-notes')?.addEventListener('click', () => {
        const text = this.getValue('travel-note-editor').trim();
        
        const noteIdx = this.app.state.travelNotes.findIndex(n => n.tripId === trip.id);
        if (noteIdx !== -1) {
          this.app.state.travelNotes[noteIdx].content = text;
        } else {
          this.app.state.travelNotes.push({
            id: 'note-' + Date.now(),
            tripId: trip.id,
            title: 'Trip Notes',
            content: text
          });
        }
        
        this.app.saveState();
        this.app.showToast('Travel notes saved.', 'success');
        this.render();
      });

      document.getElementById('travel-add-document-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = this.getValue('doc-input-name').trim();
        const type = this.getValue('doc-input-type');
        const url = this.getValue('doc-input-url').trim();

        if (!name || !url) return;

        this.app.state.travelDocuments.push({
          id: 'doc-' + Date.now(),
          tripId: trip.id,
          name: name,
          type: type,
          fileUrl: url
        });

        this.app.saveState();
        this.app.showToast('Document attached successfully.', 'success');
        this.render();
      });

      document.querySelectorAll('.btn-delete-document').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-doc-id');
          this.app.state.travelDocuments = this.app.state.travelDocuments.filter(d => d.id !== id);
          this.app.saveState();
          this.render();
        });
      });
    },

    updateTripProgressPct(trip) {
      if (!this.app || !this.app.state) return;
      const checklist = (this.app.state.packingChecklist || []).filter(c => c.tripId === trip.id);
      const itinerary = (this.app.state.travelItinerary || []).filter(i => i.tripId === trip.id);

      const totalItems = checklist.length + itinerary.length;
      if (totalItems === 0) {
        trip.progress = 0;
        return;
      }

      const completedItems = checklist.filter(c => c.checked).length;
      trip.progress = Math.round((completedItems / totalItems) * 100);
    },

    // --- C. Completed Trips View Renders ---
    renderCompletedTrips() {
      if (!this.app || !this.app.state) return;
      const trips = this.app.state.travelTrips || [];
      const grid = document.getElementById('travel-completed-trips-grid');
      if (!grid) return;

      const completed = trips.filter(t => t.status === 'Completed');

      if (completed.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1; padding: 80px 0; text-align: center; color: var(--text-muted);">
            <i class="fas fa-history" style="font-size: 2.5rem; opacity: 0.2; margin-bottom: 12px; display: block;"></i>
            You haven't logged any completed travel trips yet. 
          </div>
        `;
        return;
      }

      let html = '';
      completed.forEach(t => {
        const tripDays = Math.max(1, Math.round((new Date(t.endDate) - new Date(t.startDate)) / (1000 * 60 * 60 * 24)) + 1);
        const defaultCover = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=350&q=80';
        
        const tripExp = (this.app.state.travelExpenses || []).filter(e => e.tripId === t.id);
        const spent = tripExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        html += `
          <div class="glass-card completed-trip-card" style="padding: 0; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--glass-border);">
            <div style="height: 140px; position: relative;">
              <img src="${t.coverImage || defaultCover}" style="width: 100%; height: 100%; object-fit: cover;" alt="${t.destination}">
              <span style="position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px;">Completed</span>
            </div>
            <div style="padding: 16px;">
              <h4 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: var(--text-main);">${t.destination}</h4>
              <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 4px;"><i class="far fa-calendar-alt" style="margin-right: 4px;"></i> ${this.formatMiniDateRange(t.startDate, t.endDate)} • ${tripDays} Days</span>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); margin-top: 12px; padding-top: 10px; font-size: 0.72rem;">
                <span style="color: var(--text-muted);">Spent: <strong style="color:var(--yellow);">₹${spent.toLocaleString('en-IN')}</strong></span>
                <span style="color: var(--text-muted);">Budget: <strong style="color:var(--text-main);">₹${Number(t.budget).toLocaleString('en-IN')}</strong></span>
              </div>
            </div>
          </div>
        `;
      });
      grid.innerHTML = html;
    },

    // --- D. Lifestyle Summary Progress Gauges ---
    renderLifestyleProgress() {
      this.setValue('lifestyle-input-steps', 7892);
      this.setValue('lifestyle-input-workouts-done', 3);
      this.setValue('lifestyle-input-workouts-target', 5);
      this.setValue('lifestyle-input-water-done', 6);
      this.setValue('lifestyle-input-water-target', 8);
      this.setValue('lifestyle-input-sleep-hrs', 7);
      this.setValue('lifestyle-input-sleep-mins', 10);

      this.renderLargeGauges(78, 60, 75, 71);
    },

    renderLargeGauges(stepsPct, workPct, waterPct, sleepPct) {
      this.setText('lifestyle-desc-steps', `7,892 / 10,000 steps`);
      this.drawLargeGauge('lifestyle-gauge-steps', stepsPct, 'var(--green)');

      this.setText('lifestyle-desc-workouts', `3 / 5 workouts`);
      this.drawLargeGauge('lifestyle-gauge-workouts', workPct, 'var(--blue)');

      this.setText('lifestyle-desc-water', `6 / 8 cups water`);
      this.drawLargeGauge('lifestyle-gauge-water', waterPct, 'var(--teal)');

      this.setText('lifestyle-desc-sleep', `7h 10m / 10h sleep`);
      this.drawLargeGauge('lifestyle-gauge-sleep', sleepPct, 'var(--primary)');
    },

    drawLargeGauge(elementId, pct, color) {
      const container = document.getElementById(elementId);
      if (!container) return;

      const radius = 30;
      const circ = 2 * Math.PI * radius;
      const offset = circ - (pct / 100) * circ;

      container.innerHTML = `
        <div style="position: relative; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center;">
          <svg width="70" height="70" viewBox="0 0 70 70">
            <circle cx="35" cy="35" r="${radius}" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="4.5"></circle>
            <circle cx="35" cy="35" r="${radius}" fill="none" stroke="${color}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-width="4.5" stroke-linecap="round" transform="rotate(-90 35 35)"></circle>
          </svg>
          <span style="position: absolute; font-size: 0.8rem; font-weight: 700; color: var(--text-main);">${pct}%</span>
        </div>
      `;
    },

    bindLifestyleEvents() {
      const form = document.getElementById('travel-lifestyle-form');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.app.showToast('Lifestyle activity logged and synced!', 'success');
        
        const steps = Number(this.getValue('lifestyle-input-steps')) || 0;
        const workDone = Number(this.getValue('lifestyle-input-workouts-done')) || 0;
        const workTarget = Number(this.getValue('lifestyle-input-workouts-target')) || 5;
        const waterDone = Number(this.getValue('lifestyle-input-water-done')) || 0;
        const waterTarget = Number(this.getValue('lifestyle-input-water-target')) || 8;
        const sleepHrs = Number(this.getValue('lifestyle-input-sleep-hrs')) || 0;
        const sleepMins = Number(this.getValue('lifestyle-input-sleep-mins')) || 0;

        const stepsPct = Math.min(100, Math.round((steps / 10000) * 100));
        const workPct = Math.min(100, Math.round((workDone / workTarget) * 100));
        const waterPct = Math.min(100, Math.round((waterDone / waterTarget) * 100));
        const sleepPct = Math.min(100, Math.round(((sleepHrs * 60 + sleepMins) / (8 * 60)) * 100));

        this.renderLargeGauges(stepsPct, workPct, waterPct, sleepPct);
      });
    },

    // --- E. Bucket List View Renders ---
    renderBucketList() {
      if (!this.app || !this.app.state) return;
      const bucket = this.app.state.bucketList || [];
      const grid = document.getElementById('travel-bucket-list-grid');
      if (!grid) return;

      if (bucket.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1; padding: 60px 0; text-align: center; color: var(--text-muted);">
            Your wanderlust bucket list is empty. Add your dream travel destinations!
          </div>
        `;
        return;
      }

      let html = '';
      bucket.forEach(b => {
        const heartClass = b.liked ? 'fas fa-heart' : 'far fa-heart';
        const heartColor = b.liked ? 'color: var(--red);' : '';
        html += `
          <div class="glass-card bucket-grid-card" style="padding: 0; border-radius: var(--radius-md); overflow: hidden; position: relative; border: 1px solid var(--glass-border); min-height: 180px;">
            <img src="${b.imageUrl}" style="width: 100%; height: 180px; object-fit: cover; filter: brightness(0.9);" alt="${b.destination}">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 12px; background: linear-gradient(0deg, rgba(0,0,0,0.85), transparent); z-index: 2; text-shadow: 0 1px 3px rgba(0,0,0,0.85);">
              <strong style="font-size: 0.82rem; color: #fff; display: block;">${b.destination}</strong>
              <span style="font-size: 0.65rem; color: rgba(255,255,255,0.6); display: block; margin-top: 1px;">${b.country || 'Dream Trip'}</span>
            </div>
            <div style="position: absolute; top: 10px; right: 10px; z-index: 3; display: flex; gap: 6px;">
              <button class="icon-btn btn-like-bucket-grid" data-bucket-id="${b.id}" style="width: 28px; height: 28px; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5);">
                <i class="${heartClass}" style="${heartColor}"></i>
              </button>
              <button class="icon-btn btn-delete-bucket-grid" data-bucket-id="${b.id}" style="width: 28px; height: 28px; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5);"><i class="fas fa-trash-alt" style="font-size: 0.72rem; color: #fff;"></i></button>
            </div>
          </div>
        `;
      });
      grid.innerHTML = html;

      grid.querySelectorAll('.btn-like-bucket-grid').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-bucket-id');
          this.toggleBucketItemLike(id);
        });
      });

      grid.querySelectorAll('.btn-delete-bucket-grid').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-bucket-id');
          this.deleteBucketItem(id);
        });
      });
    },

    bindBucketListEvents() {
      const openBtn = document.getElementById('travel-btn-open-bucket-modal');
      if (openBtn) {
        openBtn.addEventListener('click', () => this.toggleModal('travel-bucket-modal-overlay', true));
      }
      
      const closeBtn = document.getElementById('travel-btn-close-bucket-modal');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.toggleModal('travel-bucket-modal-overlay', false));
      }

      const form = document.getElementById('travel-bucket-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const dest = this.getValue('bucket-input-dest').trim();
          const country = this.getValue('bucket-input-country').trim();
          const url = this.getValue('bucket-input-image').trim();

          if (!dest || !url) return;

          this.app.state.bucketList.push({
            id: 'bucket-' + Date.now(),
            destination: dest,
            country: country,
            imageUrl: url,
            liked: false
          });

          this.app.saveState();
          this.app.showToast(`${dest} saved to travel bucket list!`, 'success');
          form.reset();
          this.toggleModal('travel-bucket-modal-overlay', false);
          this.render();
        });
      }
    },

    toggleBucketItemLike(id) {
      if (!this.app || !this.app.state) return;
      const item = (this.app.state.bucketList || []).find(b => b.id === id);
      if (item) {
        item.liked = !item.liked;
        this.app.saveState();
        this.render();
      }
    },

    deleteBucketItem(id) {
      if (!this.app || !this.app.state) return;
      if (confirm('Remove this destination from your bucket list?')) {
        this.app.state.bucketList = (this.app.state.bucketList || []).filter(b => b.id !== id);
        this.app.saveState();
        this.render();
      }
    },

    // --- F. Expenses Ledger View Renders ---
    renderExpensesLedger() {
      if (!this.app || !this.app.state) return;
      const expenses = this.app.state.travelExpenses || [];
      const trips = this.app.state.travelTrips || [];
      const ledgerRows = document.getElementById('travel-expenses-ledger-rows');
      const selectTrip = document.getElementById('expense-input-trip');

      if (selectTrip) {
        let selectHtml = '<option value="">Choose trip...</option>';
        trips.forEach(t => {
          selectHtml += `<option value="${t.id}">${t.destination}</option>`;
        });
        selectTrip.innerHTML = selectHtml;
      }

      if (!ledgerRows) return;

      if (expenses.length === 0) {
        ledgerRows.innerHTML = `
          <tr>
            <td colspan="5" style="padding: 24px; text-align: center; color: var(--text-muted);">No travel costs logged.</td>
          </tr>
        `;
        return;
      }

      let ledgerHtml = '';
      expenses.forEach(e => {
        const trip = trips.find(t => t.id === e.tripId);
        const tripName = trip ? trip.destination : 'General';
        
        ledgerHtml += `
          <tr style="border-bottom: 1px solid var(--glass-border);">
            <td style="padding: 10px 6px; font-weight: 600; color: var(--text-main);">${tripName}</td>
            <td style="padding: 10px 6px;"><span style="font-size: 0.65rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">${e.category}</span></td>
            <td style="padding: 10px 6px; font-weight: bold; color: var(--yellow);">₹${Number(e.amount).toLocaleString('en-IN')}</td>
            <td style="padding: 10px 6px; color: var(--text-muted);">${e.date}</td>
            <td style="padding: 10px 6px; text-align: right;"><button class="icon-btn btn-delete-expense" data-expense-id="${e.id}" style="color:var(--text-muted);"><i class="fas fa-trash-alt" style="font-size: 0.72rem;"></i></button></td>
          </tr>
        `;
      });
      ledgerRows.innerHTML = ledgerHtml;

      ledgerRows.querySelectorAll('.btn-delete-expense').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-expense-id');
          this.deleteExpense(id);
        });
      });
    },

    bindExpenseEvents() {
      const form = document.getElementById('travel-expense-form');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const tripId = this.getValue('expense-input-trip');
        const amount = parseFloat(this.getValue('expense-input-amount')) || 0;
        const category = this.getValue('expense-input-category');
        const desc = this.getValue('expense-input-desc').trim();
        const date = this.getValue('expense-input-date');

        if (!tripId || amount <= 0 || !desc) return;

        this.app.state.travelExpenses.push({
          id: 'exp-' + Date.now(),
          tripId: tripId,
          category: category,
          amount: amount,
          description: desc,
          date: date
        });

        const trip = this.app.state.travelTrips.find(t => t.id === tripId);
        const tripName = trip ? trip.destination : 'Travel';
        
        this.app.state.transactions.push({
          id: 'tx-' + Date.now(),
          date: new Date(date).toDateString(),
          description: `Travel: ${tripName} - ${desc}`,
          amount: amount,
          type: 'expense',
          categoryId: 'transportation',
          method: 'Cash',
          memberId: 'all'
        });

        this.app.saveState();
        this.app.showToast(`Logged ₹${amount} spent!`, 'success');
        form.reset();
        this.render();
      });
    },

    deleteExpense(id) {
      if (!this.app || !this.app.state) return;
      if (confirm('Delete this expense log?')) {
        this.app.state.travelExpenses = (this.app.state.travelExpenses || []).filter(e => e.id !== id);
        this.app.saveState();
        this.render();
      }
    },

    // --- G. Memories Photo Gallery Renders ---
    renderGallery() {
      if (!this.app || !this.app.state) return;
      const photos = this.app.state.travelGallery || [];
      const grid = document.getElementById('travel-gallery-grid');
      const trips = this.app.state.travelTrips || [];

      const modalSelect = document.getElementById('gallery-input-trip');
      if (modalSelect) {
        let optionsHtml = '<option value="">No Associated Trip (General)</option>';
        trips.forEach(t => {
          optionsHtml += `<option value="${t.id}">${t.destination}</option>`;
        });
        modalSelect.innerHTML = optionsHtml;
      }

      if (!grid) return;

      if (photos.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1; padding: 60px 0; text-align: center; color: var(--text-muted);">
            Your memory photo gallery is empty. Log a picture memory from your trips!
          </div>
        `;
        return;
      }

      let html = '';
      photos.forEach(p => {
        html += `
          <div class="glass-card gallery-item-card" style="padding: 0; border-radius: var(--radius-md); overflow: hidden; position: relative; border: 1px solid var(--glass-border); min-height: 180px;">
            <img src="${p.imageUrl}" style="width: 100%; height: 180px; object-fit: cover;" alt="Memory Photo">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 12px; background: linear-gradient(0deg, rgba(0,0,0,0.85), transparent); z-index: 2; text-shadow: 0 1px 3px rgba(0,0,0,0.85);">
              <span style="font-size: 0.72rem; color: #fff; display: block; line-height: 1.2;">${p.caption || 'Memory Photo'}</span>
            </div>
            <button class="icon-btn btn-delete-gallery-item" data-photo-id="${p.id}" style="position: absolute; top: 10px; right: 10px; z-index: 3; width: 28px; height: 28px; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5);"><i class="fas fa-trash-alt" style="font-size: 0.72rem; color: #fff;"></i></button>
          </div>
        `;
      });
      grid.innerHTML = html;

      grid.querySelectorAll('.btn-delete-gallery-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-photo-id');
          this.deleteGalleryPhoto(id);
        });
      });
    },

    bindGalleryEvents() {
      const openBtn = document.getElementById('travel-btn-open-gallery-modal');
      if (openBtn) {
        openBtn.addEventListener('click', () => this.toggleModal('travel-gallery-modal-overlay', true));
      }

      const closeBtn = document.getElementById('travel-btn-close-gallery-modal');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.toggleModal('travel-gallery-modal-overlay', false));
      }

      const form = document.getElementById('travel-gallery-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const tripId = this.getValue('gallery-input-trip');
          const url = this.getValue('gallery-input-url').trim();
          const caption = this.getValue('gallery-input-caption').trim();

          if (!url || !caption) return;

          this.app.state.travelGallery.push({
            id: 'photo-' + Date.now(),
            tripId: tripId || null,
            imageUrl: url,
            caption: caption
          });

          this.app.saveState();
          this.app.showToast('Memory photo saved to gallery!', 'success');
          form.reset();
          this.toggleModal('travel-gallery-modal-overlay', false);
          this.render();
        });
      }
    },

    deleteGalleryPhoto(id) {
      if (!this.app || !this.app.state) return;
      if (confirm('Delete this photo memory?')) {
        this.app.state.travelGallery = (this.app.state.travelGallery || []).filter(p => p.id !== id);
        this.app.saveState();
        this.render();
      }
    },

    // --- H. Map & Visited Places View Renders ---
    renderMapView() {
      if (!this.app || !this.app.state) return;
      const places = this.app.state.visitedPlaces || [];
      const listContainer = document.getElementById('travel-visited-places-list');
      const nodesContainer = document.getElementById('travel-map-view-nodes-container');

      if (places.length === 0) {
        if (listContainer) listContainer.innerHTML = `<div class="empty-state" style="font-size:0.75rem; text-align:center; padding:20px 0;">No locations logged yet.</div>`;
        if (nodesContainer) nodesContainer.innerHTML = '';
        return;
      }

      let listHtml = '';
      places.forEach(p => {
        listHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); margin-bottom: 6px; font-size: 0.72rem;">
            <div>
              <strong style="color:var(--text-main);">${p.city}, ${p.country}</strong>
              <span style="color:var(--text-muted); font-size:0.6rem; display:block;">Lat: ${p.lat} • Lng: ${p.lng}</span>
            </div>
            <button class="icon-btn btn-delete-visited-place" data-place-id="${p.id}"><i class="fas fa-trash-alt" style="font-size: 0.72rem; color:var(--text-muted);"></i></button>
          </div>
        `;
      });
      if (listContainer) {
        listContainer.innerHTML = listHtml;
        listContainer.querySelectorAll('.btn-delete-visited-place').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-place-id');
            this.deleteVisitedPlace(id);
          });
        });
      }

      let svgHtml = '';
      places.forEach((p, idx) => {
        const x = Math.round(((Number(p.lng) + 180) / 360) * 800);
        const y = Math.round(((90 - Number(p.lat)) / 180) * 400);

        svgHtml += `
          <g>
            <circle cx="${x}" cy="${y}" r="5" fill="var(--primary)"></circle>
            <circle cx="${x}" cy="${y}" r="10" fill="none" stroke="var(--primary)" stroke-width="1" opacity="0.6">
              <animate attributeName="r" values="5;14;5" dur="${1.5 + (idx % 2)}s" repeatCount="indefinite"/>
            </circle>
            <text x="${x + 8}" y="${y + 4}" fill="#fff" font-size="8" font-family="sans-serif" font-weight="bold" opacity="0.8">${p.city}</text>
          </g>
        `;
      });
      if (nodesContainer) {
        nodesContainer.innerHTML = svgHtml;
      }
    },

    bindVisitedPlacesEvents() {
      const form = document.getElementById('travel-visited-form');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const city = this.getValue('visited-input-city').trim();
        const country = this.getValue('visited-input-country').trim();
        const lat = parseFloat(this.getValue('visited-input-lat')) || 0;
        const lng = parseFloat(this.getValue('visited-input-lng')) || 0;

        if (!city || !country) return;

        this.app.state.visitedPlaces.push({
          id: 'place-' + Date.now(),
          city: city,
          country: country,
          lat: lat,
          lng: lng,
          visitDate: new Date().toDateString()
        });

        this.app.saveState();
        this.app.showToast(`Added ${city} coordinate pins to travel footprint!`, 'success');
        form.reset();
        this.render();
      });
    },

    deleteVisitedPlace(id) {
      if (!this.app || !this.app.state) return;
      if (confirm('Delete this visited location?')) {
        this.app.state.visitedPlaces = (this.app.state.visitedPlaces || []).filter(p => p.id !== id);
        this.app.saveState();
        this.render();
      }
    },

    // --- CRUD: Trips Add / Edit / Delete ---
    bindTripCrudEvents() {
      const addPlansBtn = document.getElementById('travel-btn-add-trip-plan');
      if (addPlansBtn) {
        addPlansBtn.addEventListener('click', () => {
          document.getElementById('travel-trip-form')?.reset();
          this.setValue('travel-trip-id', '');
          this.setText('travel-modal-title', 'Plan New Trip');
          this.toggleModal('travel-trip-modal-overlay', true);
        });
      }

      const quickPlanBtn = document.getElementById('travel-btn-quick-plan');
      if (quickPlanBtn) {
        quickPlanBtn.addEventListener('click', () => {
          document.getElementById('travel-trip-form')?.reset();
          this.setValue('travel-trip-id', '');
          this.setText('travel-modal-title', 'Plan New Trip');
          this.toggleModal('travel-trip-modal-overlay', true);
        });
      }

      document.getElementById('travel-btn-quick-expense')?.addEventListener('click', () => {
        const tabBtn = document.querySelector('.travel-subnav-btn[data-subview="expenses"]');
        if (tabBtn) tabBtn.click();
      });
      document.getElementById('travel-btn-quick-bucket')?.addEventListener('click', () => {
        this.toggleModal('travel-bucket-modal-overlay', true);
      });
      document.getElementById('travel-btn-quick-pack')?.addEventListener('click', () => {
        const tabBtn = document.querySelector('.travel-subnav-btn[data-subview="plans"]');
        if (tabBtn) tabBtn.click();
      });
      document.getElementById('travel-btn-quick-note')?.addEventListener('click', () => {
        const tabBtn = document.querySelector('.travel-subnav-btn[data-subview="plans"]');
        if (tabBtn) tabBtn.click();
      });

      const closeModalBtn = document.getElementById('travel-btn-close-modal');
      if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => this.toggleModal('travel-trip-modal-overlay', false));
      }

      const form = document.getElementById('travel-trip-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const id = this.getValue('travel-trip-id');
          const dest = this.getValue('travel-input-dest').trim();
          const start = this.getValue('travel-input-start');
          const end = this.getValue('travel-input-end');
          const budget = parseFloat(this.getValue('travel-input-budget')) || 0;
          const travelers = parseInt(this.getValue('travel-input-travelers')) || 1;
          const cover = this.getValue('travel-input-image').trim();

          if (!dest || !start || !end) return;

          if (id) {
            const trip = this.app.state.travelTrips.find(t => t.id === id);
            if (trip) {
              trip.destination = dest;
              trip.startDate = start;
              trip.endDate = end;
              trip.budget = budget;
              trip.travelers = travelers;
              if (cover) trip.coverImage = cover;
              
              this.app.showToast(`Trip to ${dest} details updated!`, 'success');
            }
          } else {
            const newTrip = {
              id: 'trip-' + Date.now(),
              destination: dest,
              startDate: start,
              endDate: end,
              budget: budget,
              travelers: travelers,
              progress: 0,
              status: 'Planned',
              coverImage: cover || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
              thingsToDoCount: 0
            };
            this.app.state.travelTrips.push(newTrip);
            this.selectedTripId = newTrip.id;
            this.app.showToast(`Trip plan to ${dest} saved!`, 'success');
          }

          this.app.saveState();
          form.reset();
          this.toggleModal('travel-trip-modal-overlay', false);
          this.render();
        });
      }
    },

    deleteTrip(tripId) {
      if (!this.app || !this.app.state) return;
      const trip = (this.app.state.travelTrips || []).find(t => t.id === tripId);
      const dest = trip ? trip.destination : 'Trip';

      this.app.state.travelTrips = (this.app.state.travelTrips || []).filter(t => t.id !== tripId);
      
      this.app.state.travelItinerary = (this.app.state.travelItinerary || []).filter(i => i.tripId !== tripId);
      this.app.state.packingChecklist = (this.app.state.packingChecklist || []).filter(c => c.tripId !== tripId);
      this.app.state.travelExpenses = (this.app.state.travelExpenses || []).filter(e => e.tripId !== tripId);
      this.app.state.travelDocuments = (this.app.state.travelDocuments || []).filter(d => d.tripId !== tripId);
      this.app.state.travelNotes = (this.app.state.travelNotes || []).filter(n => n.tripId !== tripId);

      if (this.selectedTripId === tripId) {
        this.selectedTripId = null;
      }

      this.app.saveState();
      this.app.showToast(`Trip plan to ${dest} deleted.`, 'success');
      this.render();
    },

    toggleModal(overlayId, show) {
      const modal = document.getElementById(overlayId);
      if (modal) {
        if (show) {
          modal.classList.remove('hidden');
        } else {
          modal.classList.add('hidden');
        }
      }
    },

    formatDateRange(startStr, endStr) {
      if (!startStr || !endStr) return '';
      const start = new Date(startStr);
      const end = new Date(endStr);
      
      const opt = { day: 'numeric', month: 'short', year: 'numeric' };
      return `${start.toLocaleDateString('en-US', opt)} - ${end.toLocaleDateString('en-US', opt)}`;
    },

    formatMiniDateRange(startStr, endStr) {
      if (!startStr || !endStr) return '';
      const start = new Date(startStr);
      const end = new Date(endStr);
      
      const opt = { day: 'numeric', month: 'short' };
      return `${start.toLocaleDateString('en-US', opt)} - ${end.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' })}`;
    }
  };

  if (window.LifeOS) {
    window.LifeOS.registerModule('lifestyle', LifestyleModule);
  }
});
