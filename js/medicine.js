/* ==========================================================================
   LIFE OS - STANDALONE MEDICINE TRACKER MODULE (js/medicine.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const MedicineModule = {
    init() {
      // 1. Initialize State & Defaults
      this.medCalendarMonth = 6; // July (0-indexed)
      this.medCalendarYear = 2026;
      this.editingMedId = null;
      this.medSearchQuery = '';

      if (!this.app.state.medicineReminders) this.app.state.medicineReminders = [];
      const hasMockData = this.app.state.medicineReminders.some(m => m.id === 'med_1' || m.id === 'med_2');
      const hasOldFormat = this.app.state.medicineReminders.length > 0 && (!this.app.state.medicineReminders[0].stock || !this.app.state.medicineReminders[0].schedule);
      
      if (hasMockData || hasOldFormat) {
        this.app.state.medicineReminders = [];
        this.app.state.medicineCompliance = {};
        this.app.saveState();
      }

      if (!this.app.state.medicineCompliance) {
        this.app.state.medicineCompliance = {};
        this.app.saveState();
      }

      // Bind toggle form buttons
      const toggleFormBtn = document.getElementById('btn-add-medicine-modal');
      const formContainer = document.getElementById('add-med-form-container');
      const cancelBtn = document.getElementById('btn-cancel-med');

      toggleFormBtn?.addEventListener('click', () => {
        this.editingMedId = null;
        document.getElementById('meds-schedule-form')?.reset();
        formContainer?.classList.toggle('hidden');
      });

      cancelBtn?.addEventListener('click', () => {
        formContainer?.classList.add('hidden');
        this.editingMedId = null;
      });

      // Bind form submission
      const medForm = document.getElementById('meds-schedule-form');
      medForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-med-name').value.trim();
        const type = document.getElementById('new-med-type').value;
        const strength = document.getElementById('new-med-strength').value.trim();
        const dosage = document.getElementById('new-med-dosage').value.trim();
        const freqLabel = document.getElementById('new-med-freq-label').value.trim();
        const timing = document.getElementById('new-med-timing').value;
        const duration = document.getElementById('new-med-duration').value.trim();
        const stock = parseInt(document.getElementById('new-med-stock').value) || 0;

        const morning = document.getElementById('check-morning').checked;
        const timeMorning = document.getElementById('time-morning').value;
        
        const afternoon = document.getElementById('check-afternoon').checked;
        const timeAfternoon = document.getElementById('time-afternoon').value;
        
        const evening = document.getElementById('check-evening').checked;
        const timeEvening = document.getElementById('time-evening').value;
        
        const night = document.getElementById('check-night').checked;
        const timeNight = document.getElementById('time-night').value;

        if (this.editingMedId) {
          const idx = this.app.state.medicineReminders.findIndex(m => m.id === this.editingMedId);
          if (idx !== -1) {
            this.app.state.medicineReminders[idx] = {
              ...this.app.state.medicineReminders[idx],
              name,
              type,
              strength,
              dosage,
              frequency: freqLabel,
              timing,
              duration,
              stock,
              schedule: {
                morning: { enabled: morning, time: timeMorning, taken: this.app.state.medicineReminders[idx].schedule?.morning?.taken || false },
                afternoon: { enabled: afternoon, time: timeAfternoon, taken: this.app.state.medicineReminders[idx].schedule?.afternoon?.taken || false },
                evening: { enabled: evening, time: timeEvening, taken: this.app.state.medicineReminders[idx].schedule?.evening?.taken || false },
                night: { enabled: night, time: timeNight, taken: this.app.state.medicineReminders[idx].schedule?.night?.taken || false }
              }
            };
            this.app.showToast(`Medicine "${name}" updated successfully!`, 'success');
          }
          this.editingMedId = null;
        } else {
          const newMed = {
            id: 'med_' + Date.now(),
            name,
            type,
            strength,
            dosage,
            frequency: freqLabel,
            duration,
            stock,
            status: 'Active',
            timing,
            schedule: {
              morning: { enabled: morning, time: timeMorning, taken: false },
              afternoon: { enabled: afternoon, time: timeAfternoon, taken: false },
              evening: { enabled: evening, time: timeEvening, taken: false },
              night: { enabled: night, time: timeNight, taken: false }
            }
          };
          this.app.state.medicineReminders.push(newMed);
          this.app.showToast(`Medicine "${name}" added successfully!`, 'success');
        }

        this.app.saveState();
        medForm.reset();
        formContainer?.classList.add('hidden');
        this.render();
      });

      // Bind calendar navigation methods
      window.prevMedMonth = () => {
        if (this.medCalendarMonth === 0) {
          this.medCalendarMonth = 11;
          this.medCalendarYear--;
        } else {
          this.medCalendarMonth--;
        }
        this.render();
      };

      window.nextMedMonth = () => {
        if (this.medCalendarMonth === 11) {
          this.medCalendarMonth = 0;
          this.medCalendarYear++;
        } else {
          this.medCalendarMonth++;
        }
        this.render();
      };

      window.selectMedCalendarDay = (dayNum) => {
        const dateStr = `${this.medCalendarYear}-${String(this.medCalendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const currentVal = this.app.state.medicineCompliance[dateStr] || 'none';
        
        // Cycle compliance dots: none -> taken -> missed -> partial -> none
        let nextVal = 'taken';
        if (currentVal === 'taken') nextVal = 'missed';
        else if (currentVal === 'missed') nextVal = 'partial';
        else if (currentVal === 'partial') nextVal = 'none';

        if (nextVal === 'none') {
          delete this.app.state.medicineCompliance[dateStr];
        } else {
          this.app.state.medicineCompliance[dateStr] = nextVal;
        }

        this.app.saveState();
        this.app.showToast(`Compliance updated for ${dateStr}: ${nextVal.toUpperCase()}`, 'info');
        this.render();
      };

      // Table actions & schedule buttons
      window.takeDose = (medId, slotKey) => {
        const med = this.app.state.medicineReminders.find(m => m.id === medId);
        if (med) {
          med.schedule[slotKey].taken = true;
          med.stock = Math.max(0, med.stock - 1);
          
          // Log compliance for today (July 17, 2026)
          const todayStr = '2026-07-17';
          const activeMeds = this.app.state.medicineReminders.filter(m => m.status === 'Active');
          const totalToday = activeMeds.flatMap(m => Object.entries(m.schedule).filter(([k, v]) => v.enabled).map(([k, v]) => v.taken));
          const allTaken = totalToday.every(t => t);
          this.app.state.medicineCompliance[todayStr] = allTaken ? 'taken' : 'partial';

          this.app.saveState();
          this.app.showToast(`Logged dose for ${med.name}!`, 'success');
          this.render();
        }
      };

      window.toggleMedStatus = (medId) => {
        const med = this.app.state.medicineReminders.find(m => m.id === medId);
        if (med) {
          med.status = (med.status === 'Active') ? 'Inactive' : 'Active';
          this.app.saveState();
          this.app.showToast(`Status updated for ${med.name}.`, 'info');
          this.render();
        }
      };

      window.editMed = (medId) => {
        const med = this.app.state.medicineReminders.find(m => m.id === medId);
        if (med) {
          formContainer?.classList.remove('hidden');
          document.getElementById('new-med-name').value = med.name || '';
          document.getElementById('new-med-type').value = med.type || 'Tablet';
          document.getElementById('new-med-strength').value = med.strength || '';
          document.getElementById('new-med-dosage').value = med.dosage || '';
          document.getElementById('new-med-freq-label').value = med.frequency || '';
          document.getElementById('new-med-timing').value = med.timing || 'After Food';
          document.getElementById('new-med-duration').value = med.duration || 'Ongoing';
          document.getElementById('new-med-stock').value = med.stock || 0;
          
          document.getElementById('check-morning').checked = med.schedule?.morning?.enabled || false;
          document.getElementById('time-morning').value = med.schedule?.morning?.time || '8:00 AM';
          
          document.getElementById('check-afternoon').checked = med.schedule?.afternoon?.enabled || false;
          document.getElementById('time-afternoon').value = med.schedule?.afternoon?.time || '1:00 PM';
          
          document.getElementById('check-evening').checked = med.schedule?.evening?.enabled || false;
          document.getElementById('time-evening').value = med.schedule?.evening?.time || '6:00 PM';
          
          document.getElementById('check-night').checked = med.schedule?.night?.enabled || false;
          document.getElementById('time-night').value = med.schedule?.night?.time || '8:00 PM';

          this.editingMedId = medId;
          formContainer?.scrollIntoView({ behavior: 'smooth' });
        }
      };

      window.deleteMed = (medId) => {
        if (confirm('Delete this medicine schedule permanently?')) {
          this.app.state.medicineReminders = this.app.state.medicineReminders.filter(m => m.id !== medId);
          this.app.saveState();
          this.app.showToast('Medicine deleted successfully.', 'info');
          this.render();
        }
      };

      window.filterMedicinesTable = (val) => {
        this.medSearchQuery = val.trim().toLowerCase();
        this.renderMedsTableOnly();
      };
      
      this.render();
    },

    onActive() {
      this.render();
    },

    render() {
      // 1. Calculate & Render Stats
      const meds = this.app.state.medicineReminders || [];
      const activeMeds = meds.filter(m => m.status === 'Active');

      let todayScheduled = 0;
      let takenToday = 0;
      activeMeds.forEach(m => {
        if (m.schedule) {
          Object.values(m.schedule).forEach(s => {
            if (s.enabled) {
              todayScheduled++;
              if (s.taken) takenToday++;
            }
          });
        }
      });

      const totalMeds = meds.length;
      let missedToday = 0;

      if (totalMeds > 0) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        activeMeds.forEach(m => {
          if (m.schedule) {
            Object.values(m.schedule).forEach(s => {
              if (s.enabled && !s.taken) {
                const match = s.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (match) {
                  let hours = parseInt(match[1]);
                  const minutes = parseInt(match[2]);
                  const ampm = match[3].toUpperCase();
                  if (ampm === 'PM' && hours < 12) hours += 12;
                  if (ampm === 'AM' && hours === 12) hours = 0;
                  
                  const doseMinutes = hours * 60 + minutes;
                  if (currentMinutes > doseMinutes) {
                    missedToday++;
                  }
                }
              }
            });
          }
        });
      }

      const pendingToday = Math.max(0, todayScheduled - takenToday - missedToday);

      const tScheduledEl = document.getElementById('stat-meds-today');
      const tTakenEl = document.getElementById('stat-meds-taken');
      const tPendingEl = document.getElementById('stat-meds-pending');
      const tMissedEl = document.getElementById('stat-meds-missed');
      const tTotalEl = document.getElementById('stat-meds-total');

      if (tScheduledEl) tScheduledEl.innerText = todayScheduled;
      if (tTakenEl) tTakenEl.innerText = takenToday;
      if (tPendingEl) tPendingEl.innerText = pendingToday;
      if (tMissedEl) tMissedEl.innerText = missedToday;
      if (tTotalEl) tTotalEl.innerText = totalMeds;

      // 2. Render Left Column Today's Schedule
      const schedContainer = document.getElementById('med-today-schedule-list');
      if (schedContainer) {
        const slots = [
          { key: 'morning', label: 'Morning', icon: '☀️' },
          { key: 'afternoon', label: 'Afternoon', icon: '☀️' },
          { key: 'evening', label: 'Evening', icon: '☀️' },
          { key: 'night', label: 'Night', icon: '🌙' }
        ];

        let schedHtml = '';
        slots.forEach(slot => {
          const slotMeds = activeMeds.filter(m => m.schedule && m.schedule[slot.key] && m.schedule[slot.key].enabled);
          
          if (slotMeds.length > 0) {
            schedHtml += `
              <div style="border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 12px; margin-bottom: 4px;">
                <h5 style="margin: 0 0 8px 0; font-size: 0.78rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                  ${slot.icon} ${slot.label}
                </h5>
                <div style="display: flex; flex-direction: column; gap: 8px;">
            `;

            slotMeds.forEach(m => {
              const isTaken = m.schedule[slot.key].taken;
              const buttonHtml = isTaken ? 
                `<button style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--green); color: var(--green); padding: 5px 12px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; cursor: not-allowed;"><i class="fas fa-check"></i> Taken</button>` :
                `<button onclick="window.takeDose('${m.id}', '${slot.key}')" style="background: transparent; border: 1px solid var(--orange); color: var(--orange); padding: 5px 12px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; cursor: pointer; transition: all 0.2s;">Take Now ></button>`;

              schedHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 10px; border-radius: var(--radius-sm);">
                  <div>
                    <strong style="color: var(--text-main); font-size: 0.8rem; display: block;">${m.name}</strong>
                    <span style="color: var(--text-muted); font-size: 0.65rem;">${m.type} • ${m.dosage}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600;"><i class="far fa-clock"></i> ${m.schedule[slot.key].time}</span>
                    ${buttonHtml}
                  </div>
                </div>
              `;
            });

            schedHtml += `
                </div>
              </div>
            `;
          }
        });

        if (schedHtml === '') {
          schedHtml = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">No active schedules for today.</div>`;
        }
        schedContainer.innerHTML = schedHtml;
      }

      // 3. Render Calendar
      const grid = document.getElementById('med-calendar-grid');
      const monthLabel = document.getElementById('calendar-month-year-label');
      if (grid && monthLabel) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        monthLabel.innerText = `${months[this.medCalendarMonth]} ${this.medCalendarYear}`;

        const firstDay = new Date(this.medCalendarYear, this.medCalendarMonth, 1).getDay();
        const totalDays = new Date(this.medCalendarYear, this.medCalendarMonth + 1, 0).getDate();

        let calHtml = '';
        for (let i = 0; i < firstDay; i++) {
          calHtml += `<div style="padding: 10px 0; border: 1px dashed transparent;"></div>`;
        }

        const compliance = this.app.state.medicineCompliance || {};
        for (let day = 1; day <= totalDays; day++) {
          const dateStr = `${this.medCalendarYear}-${String(this.medCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = compliance[dateStr] || 'none';
          
          let dotColor = 'transparent';
          let dotBorder = 'none';
          if (status === 'taken') dotColor = 'var(--green)';
          else if (status === 'missed') dotColor = 'var(--red)';
          else if (status === 'partial') dotColor = 'var(--yellow)';
          else dotBorder = '1px solid var(--glass-border)';

          const isToday = (day === 17 && this.medCalendarMonth === 6 && this.medCalendarYear === 2026);

          calHtml += `
            <div style="
              position: relative;
              padding: 8px 0;
              border-radius: var(--radius-sm);
              background: ${isToday ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.01)'};
              border: 1px solid ${isToday ? 'var(--primary)' : 'var(--glass-border)'};
              font-size: 0.72rem;
              font-weight: ${isToday ? 'bold' : 'normal'};
              color: ${isToday ? 'var(--primary-light)' : 'var(--text-main)'};
              cursor: pointer;
            " onclick="window.selectMedCalendarDay(${day})">
              <div>${day}</div>
              <div style="
                width: 5px;
                height: 5px;
                border-radius: 50%;
                background: ${dotColor};
                border: ${dotBorder};
                margin: 4px auto 0 auto;
              "></div>
            </div>
          `;
        }
        grid.innerHTML = calHtml;
      }

      // 4. Render Upcoming Reminders
      const remindersContainer = document.getElementById('upcoming-reminders-list');
      if (remindersContainer) {
        let upcomingHtml = '';
        activeMeds.forEach(m => {
          if (m.schedule) {
            Object.entries(m.schedule).forEach(([slotKey, val]) => {
              if (val.enabled && !val.taken) {
                upcomingHtml += `
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 6px;">
                    <div>
                      <strong style="color:var(--text-main);">${m.name}</strong>
                      <span style="color:var(--text-muted); display:block; font-size:0.6rem;">${m.dosage} • ${m.timing}</span>
                    </div>
                    <span style="color:var(--primary); font-weight:600;"><i class="far fa-bell"></i> ${val.time}</span>
                  </div>
                `;
              }
            });
          }
        });
        if (upcomingHtml === '') {
          upcomingHtml = `<div style="text-align:center; color:var(--text-muted); font-size:0.65rem; padding: 10px 0;">No upcoming doses today.</div>`;
        }
        remindersContainer.innerHTML = upcomingHtml;
      }

      // 5. Render Refill Alerts
      const refillContainer = document.getElementById('refill-alerts-list');
      if (refillContainer) {
        let refillHtml = '';
        meds.forEach(m => {
          if (m.stock <= 12) {
            const badgeBg = m.stock <= 4 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
            const badgeColor = m.stock <= 4 ? 'var(--red)' : 'var(--orange)';
            const badgeLabel = m.stock <= 4 ? 'Very Low' : 'Low Stock';
            
            refillHtml += `
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 6px;">
                <div>
                  <strong style="color:var(--text-main);">${m.name}</strong>
                  <span style="color:var(--text-muted); display:block; font-size:0.6rem;">${m.stock} left</span>
                </div>
                <span style="background:${badgeBg}; color:${badgeColor}; font-size:0.58rem; font-weight:bold; padding:2px 6px; border-radius:10px;">${badgeLabel}</span>
              </div>
            `;
          }
        });
        if (refillHtml === '') {
          refillHtml = `<div style="text-align:center; color:var(--text-muted); font-size:0.65rem; padding: 10px 0;">All stock levels healthy.</div>`;
        }
        refillContainer.innerHTML = refillHtml;
      }

      // 6. Render Table
      this.renderMedsTableOnly();
    },

    renderMedsTableOnly() {
      const tbody = document.getElementById('full-meds-list-table-body');
      if (!tbody) return;

      const meds = this.app.state.medicineReminders || [];
      const query = this.medSearchQuery || '';

      const filteredMeds = meds.filter(m => {
        if (query === '') return true;
        return m.name.toLowerCase().includes(query) ||
               (m.type && m.type.toLowerCase().includes(query)) ||
               (m.frequency && m.frequency.toLowerCase().includes(query));
      });

      const titleEl = document.getElementById('medicine-list-title');
      if (titleEl) {
        titleEl.innerText = `Medicine List (${filteredMeds.length})`;
      }

      if (filteredMeds.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" style="padding: 20px; text-align: center; color: var(--text-muted);">
              No matching medicines found.
            </td>
          </tr>
        `;
        return;
      }

      let html = '';
      filteredMeds.forEach(m => {
        const isActive = m.status === 'Active';
        const stockStyle = m.stock <= 5 ? 'color: var(--red); font-weight:bold;' : 
                           m.stock <= 12 ? 'color: var(--orange); font-weight:bold;' : 
                           'color: var(--green);';
        
        const statusBadge = isActive ? 
          `<span style="background: rgba(16, 185, 129, 0.15); color: var(--green); font-size: 0.65rem; font-weight: bold; padding: 2px 8px; border-radius: 10px; cursor: pointer;" onclick="window.toggleMedStatus('${m.id}')">Active</span>` :
          `<span style="background: rgba(255,255,255,0.05); color: var(--text-muted); font-size: 0.65rem; font-weight: bold; padding: 2px 8px; border-radius: 10px; cursor: pointer;" onclick="window.toggleMedStatus('${m.id}')">Inactive</span>`;

        html += `
          <tr style="border-bottom: 1px solid var(--glass-border);">
            <td style="padding: 10px; display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-link" style="color: var(--text-muted); font-size: 0.7rem;"></i>
              <strong style="color: var(--text-main); font-size: 0.8rem;">${m.name}</strong>
            </td>
            <td style="padding: 10px; color: var(--text-main);">${m.type || 'Tablet'}</td>
            <td style="padding: 10px; color: var(--text-muted);">${m.strength || '500 mg'}</td>
            <td style="padding: 10px; color: var(--text-muted);">${m.dosage || '1 Tablet'}</td>
            <td style="padding: 10px; color: var(--text-main);">${m.frequency || 'Twice a day'}</td>
            <td style="padding: 10px; color: var(--text-muted);">${m.duration || 'Ongoing'}</td>
            <td style="padding: 10px; ${stockStyle}">${m.stock} left</td>
            <td style="padding: 10px;">${statusBadge}</td>
            <td style="padding: 10px; text-align: center; white-space: nowrap;">
              <button onclick="window.editMed('${m.id}')" style="background:none; border:none; cursor:pointer; color:var(--primary); font-size:0.8rem; margin-right:8px;"><i class="fas fa-edit"></i></button>
              <button onclick="window.toggleMedStatus('${m.id}')" style="background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:0.8rem; margin-right:8px;"><i class="fas fa-pause"></i></button>
              <button onclick="window.deleteMed('${m.id}')" style="background:none; border:none; cursor:pointer; color:var(--red); font-size:0.8rem;"><i class="fas fa-trash-alt"></i></button>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('medicine', MedicineModule);
  }
});
