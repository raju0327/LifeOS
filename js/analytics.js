/* ==========================================================================
   LIFE OS - PERFORMANCE ANALYTICS & SYSTEM BACKUP MODULE (js/analytics.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const AnalyticsModule = {
    init() {
      this.setupBackupControls();
      this.setupExportControls();
      this.render();
    },

    onActive() {
      this.render();
      if (window.LifeOS && window.LifeOS.modules.finance && typeof window.LifeOS.modules.finance.renderSyncSettingsValues === 'function') {
        window.LifeOS.modules.finance.renderSyncSettingsValues();
      }
    },

    render() {
      this.renderLifeScore();
      this.renderPerformanceTable();
    },

    // --- Life Score aggregator ---
    renderLifeScore() {
      const scoreDisplay = document.getElementById('analytics-life-score');
      const state = this.app.state;

      // 1. Task component (Max 25 pts)
      const totalTasks = state.tasks.length;
      const compTasks = state.tasks.filter(t => t.completed).length;
      const taskScore = totalTasks > 0 ? (compTasks / totalTasks) * 25 : 20;

      // 2. Water Hydration component (Max 25 pts)
      const waterScore = Math.min((state.waterIntake / 8) * 25, 25);

      // 3. Sleep component (Max 25 pts)
      let sleepScore = 20; // default average
      if (state.sleepLogs.length > 0) {
        const lastSleep = state.sleepLogs[0].hours;
        // Ideal sleep is 8 hours
        const pct = Math.min(lastSleep / 8, 1);
        sleepScore = pct * 25;
      }

      // 4. Financial budget component (Max 25 pts)
      let expenses = 0;
      state.transactions.filter(t => t.type === 'expense').forEach(t => expenses += parseFloat(t.amount));
      // Assume safety budget limit is $1,200
      const budgetScore = Math.max(0, 25 - (expenses / 1200) * 15);

      // Total Life Score
      const totalLifeScore = Math.round(taskScore + waterScore + sleepScore + budgetScore);
      const finalScore = Math.min(totalLifeScore, 100);
      
      scoreDisplay.textContent = finalScore;

      // Update Speedometer SVG fill and needle
      const speedoFill = document.getElementById('speedo-fill-path');
      const speedoNeedle = document.getElementById('speedo-needle');
      if (speedoFill && speedoNeedle) {
        // SVG Arc length is 251.2
        const dashOffset = 251.2 - (finalScore / 100) * 251.2;
        speedoFill.style.strokeDashoffset = dashOffset;
        
        // Needle rotation: starts at -90deg (0 points left), ends at +90deg (100 points right)
        const needleAngle = (finalScore / 100) * 180 - 90;
        speedoNeedle.style.transform = `rotate(${needleAngle}deg)`;
      }
    },

    renderPerformanceTable() {
      const state = this.app.state;

      const waterLevelEl = document.getElementById('table-water-level');
      const sleepLevelEl = document.getElementById('table-sleep-level');
      const savingsLevelEl = document.getElementById('table-savings-level');

      const waterBadge = document.getElementById('badge-water-status');
      const sleepBadge = document.getElementById('badge-sleep-status');
      const savingsBadge = document.getElementById('badge-savings-status');

      // Hydration
      waterLevelEl.textContent = `${state.waterIntake} cups`;
      if (state.waterIntake >= 8) {
        waterBadge.textContent = "Optimal 💧";
        waterBadge.className = "badge text-green";
        waterBadge.style.background = "var(--green-glow)";
      } else {
        waterBadge.textContent = "Dehydrated ⚠️";
        waterBadge.className = "badge text-orange";
        waterBadge.style.background = "var(--orange-glow)";
      }

      // Sleep
      const hours = state.sleepLogs.length > 0 ? state.sleepLogs[0].hours : 0;
      sleepLevelEl.textContent = `${hours} hours`;
      if (hours >= 7.5) {
        sleepBadge.textContent = "Rested 💤";
        sleepBadge.className = "badge text-green";
        sleepBadge.style.background = "var(--green-glow)";
      } else {
        sleepBadge.textContent = "Fatigued 🥱";
        sleepBadge.className = "badge text-orange";
        sleepBadge.style.background = "var(--orange-glow)";
      }

      // Savings Net Status
      let balance = 0;
      state.transactions.forEach(t => {
        const val = parseFloat(t.amount);
        balance = t.type === 'income' ? balance + val : balance - val;
      });

      savingsLevelEl.textContent = `$${balance.toFixed(2)}`;
      if (balance >= 0) {
        savingsBadge.textContent = "Surplus ✅";
        savingsBadge.className = "badge text-green";
        savingsBadge.style.background = "var(--green-glow)";
      } else {
        savingsBadge.textContent = "Deficit 🚨";
        savingsBadge.className = "badge text-red";
        savingsBadge.style.background = "var(--red-glow)";
      }
    },

    // --- Tabular Excel/CSV exports & PDF Printing ---
    setupExportControls() {
      const excelBtn = document.getElementById('export-excel-btn');
      const pdfBtn = document.getElementById('print-pdf-btn');

      // Excel mock download (CSV format)
      excelBtn.addEventListener('click', () => {
        const txs = this.app.state.transactions;
        if (txs.length === 0) {
          this.app.showToast('No transaction data to export!', 'error');
          return;
        }

        // Build CSV string
        let csv = 'ID,Description,Amount,Type,Category,Date\n';
        txs.forEach(t => {
          csv += `"${t.id}","${t.description.replace(/"/g, '""')}","${t.amount}","${t.type}","${t.category}","${t.date}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `LifeOS_Financial_Report_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.app.showToast('Transaction CSV sheet generated!', 'success');
      });

      // PDF print
      pdfBtn.addEventListener('click', () => {
        this.app.showToast('Generating overall system report...', 'info');
        this.generateOverallReport();
        setTimeout(() => {
          window.print();
        }, 800);
      });
    },

    // Dynamically compile all workspace state modules into a printable single report page
    generateOverallReport() {
      const container = document.getElementById('print-overall-report-container');
      if (!container) return;
      
      const state = this.app.state;
      const dateStr = new Date().toLocaleString();
      const settings = state.financeSettings || {};
      const currency = settings.currencySymbol || '₹';

      // 1. Calculations
      const totalTasks = state.tasks.length;
      const compTasks = state.tasks.filter(t => t.completed).length;
      const taskPct = totalTasks > 0 ? Math.round((compTasks / totalTasks) * 100) : 0;

      let totalExpenses = 0;
      let totalIncome = 0;
      state.transactions.forEach(t => {
        const val = parseFloat(t.amount) || 0;
        if (t.type === 'expense') totalExpenses += val;
        else if (t.type === 'income') totalIncome += val;
      });
      const netSavings = totalIncome - totalExpenses;

      let html = `
        <div class="print-header">
          <h1>Life OS - Overall System Summary Report</h1>
          <p>Generated on: ${dateStr} | Workspace: Enterprise Admin</p>
        </div>

        <div class="print-section">
          <h2>1. Executive Summary & Dashboard</h2>
          <div class="print-meta-grid">
            <div class="print-meta-item">
              <span>Task Compliance</span>
              <strong>${taskPct}%</strong>
            </div>
            <div class="print-meta-item">
              <span>Water Intake</span>
              <strong>${state.waterIntake} / 8 cups</strong>
            </div>
            <div class="print-meta-item">
              <span>Net Financials</span>
              <strong>${currency}${netSavings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
            </div>
          </div>
          <table class="print-table">
            <tr>
              <th style="width: 30%">Metric</th>
              <th>Current Status</th>
            </tr>
            <tr>
              <td><strong>Daily Primary Focus</strong></td>
              <td>${state.focus || 'None logged'}</td>
            </tr>
            <tr>
              <td><strong>Notifications Bell Alert Count</strong></td>
              <td>${state.notifications.length} active alerts</td>
            </tr>
          </table>
        </div>
      `;

      // 2. Tasks & Goals
      html += `
        <div class="print-section">
          <h2>2. Tasks & Goals - Task & Projects</h2>
          <div class="print-grid">
            <div class="print-card">
              <h3>Active Checklist (${state.tasks.filter(t => !t.completed).length} items)</h3>
              ${state.tasks.length === 0 ? '<p>No tasks logged.</p>' : `
                <table class="print-table">
                  <tr><th>Task</th><th>Priority</th><th>Category</th></tr>
                  ${state.tasks.map(t => `
                    <tr>
                      <td>[${t.completed ? 'x' : ' '}] ${t.title}</td>
                      <td><span class="print-badge">${t.priority}</span></td>
                      <td>${t.category}</td>
                    </tr>
                  `).join('')}
                </table>
              `}
            </div>
            <div class="print-card">
              <h3>Active Projects (${state.projects.length} items)</h3>
              ${state.projects.length === 0 ? '<p>No projects logged.</p>' : `
                <table class="print-table">
                  <tr><th>Project Title</th><th>Progress</th></tr>
                  ${state.projects.map(p => `
                    <tr>
                      <td>${p.title}</td>
                      <td><strong>${p.progress}%</strong></td>
                    </tr>
                  `).join('')}
                </table>
              `}
            </div>
          </div>
        </div>
      `;

      // 3. Calendar & Routines
      html += `
        <div class="print-section">
          <h2>3. Calendar & Routines</h2>
          <div class="print-grid">
            <div class="print-card">
              <h3>Reminders & Events</h3>
              ${state.events.length === 0 ? '<p>No events logged.</p>' : `
                <table class="print-table">
                  <tr><th>Title</th><th>Date</th><th>Time</th></tr>
                  ${state.events.map(e => `
                    <tr>
                      <td>${e.title}</td>
                      <td>${e.date}</td>
                      <td>${e.time}</td>
                    </tr>
                  `).join('')}
                </table>
              `}
            </div>
            <div class="print-card">
              <h3>Timeblocks Schedule</h3>
              ${Object.keys(state.timeblocks).length === 0 ? '<p>No active routine blocks.</p>' : `
                <table class="print-table">
                  <tr><th>Time</th><th>Label / Event</th></tr>
                  ${Object.keys(state.timeblocks).map(time => {
                    const block = state.timeblocks[time];
                    const label = block.type === 'task' ? `Task (ID: ${block.id})` : block.text;
                    return `
                      <tr>
                        <td><strong>${time}</strong></td>
                        <td>${label}</td>
                      </tr>
                    `;
                  }).join('')}
                </table>
              `}
            </div>
          </div>
        </div>
      `;

      // 4. Notes & Bookmarks
      html += `
        <div class="print-section">
          <h2>4. Notes & Bookmarks</h2>
          <div class="print-grid">
            <div class="print-card">
              <h3>Saved Notes</h3>
              ${state.notes.length === 0 ? '<p>No notes logged.</p>' : state.notes.map(n => `
                <div style="margin-bottom:12px; border-bottom:1px dashed #ddd; padding-bottom:8px;">
                  <strong>${n.title}</strong> <span style="font-size:8pt;color:#666;">(${n.date})</span>
                  <p style="margin:4px 0 0 0;font-size:9pt;">${n.content}</p>
                  <em style="font-size:8pt;color:#888;">Tags: ${n.tags}</em>
                </div>
              `).join('')}
            </div>
            <div class="print-card">
              <h3>Bookmarks & Links</h3>
              ${state.bookmarks.length === 0 ? '<p>No bookmarks logged.</p>' : `
                <table class="print-table">
                  <tr><th>Title</th><th>URL</th></tr>
                  ${state.bookmarks.map(b => `
                    <tr>
                      <td>${b.title}</td>
                      <td><a href="${b.url}" target="_blank" style="text-decoration:none;color:#0066cc;">${b.url}</a></td>
                    </tr>
                  `).join('')}
                </table>
              `}
            </div>
          </div>
        </div>
      `;

      // 5. Journal & Vision
      html += `
        <div class="print-section">
          <h2>5. Journal & Vision</h2>
          <div class="print-grid">
            <div class="print-card">
              <h3>Journal Entries</h3>
              ${state.journalEntries.length === 0 ? '<p>No journal entries logged.</p>' : state.journalEntries.map(j => `
                <div style="margin-bottom:12px; border-bottom:1px dashed #ddd; padding-bottom:8px;">
                  <strong>${j.title || 'Untitled Entry'}</strong> <span style="font-size:8pt;color:#666;">(${j.date})</span>
                  <p style="margin:4px 0;font-size:9pt;">${j.content || j.text}</p>
                  ${j.mood ? `<p style="margin:0;font-size:8pt;"><strong>Mood:</strong> ${j.mood}</p>` : ''}
                  ${j.wins && j.wins.length ? `<p style="margin:2px 0 0 0;font-size:8pt;"><strong>Wins:</strong> ${j.wins.join(', ')}</p>` : ''}
                </div>
              `).join('')}
            </div>
            <div class="print-card">
              <h3>Vision Board Goals</h3>
              ${state.visionBoard.length === 0 ? '<p>No vision board goals logged.</p>' : `
                <table class="print-table">
                  <tr><th>Goal Title</th><th>Image Reference URL</th></tr>
                  ${state.visionBoard.map(v => `
                    <tr>
                      <td>${v.title}</td>
                      <td style="font-size:8pt;word-break:break-all;">${v.url || v.image}</td>
                    </tr>
                  `).join('')}
                </table>
              `}
            </div>
          </div>
        </div>
      `;

      // 6. Documents Hub
      html += `
        <div class="print-section">
          <h2>6. Documents Hub</h2>
          ${state.documents.length === 0 ? '<p>No documents logged.</p>' : `
            <table class="print-table">
              <tr><th>Document Title</th><th>Category</th><th>Reference Code</th><th>Created Date</th></tr>
              ${state.documents.map(d => `
                <tr>
                  <td>${d.title}</td>
                  <td>${d.category || ''}</td>
                  <td><code>${d.ref || ''}</code></td>
                  <td>${d.date || ''}</td>
                </tr>
              `).join('')}
            </table>
          `}
        </div>
      `;

      // 7. Health & Fitness
      html += `
        <div class="print-section">
          <h2>7. Health & Fitness</h2>
          <div class="print-grid">
            <div class="print-card">
              <h3>Sleep Logs</h3>
              ${state.sleepLogs.length === 0 ? '<p>No sleep logs.</p>' : `
                <table class="print-table">
                  <tr><th>Date</th><th>Duration</th><th>Quality</th></tr>
                  ${state.sleepLogs.map(s => `
                    <tr><td>${s.date}</td><td>${s.hours} hours</td><td>${s.quality}</td></tr>
                  `).join('')}
                </table>
              `}
            </div>
            <div class="print-card">
              <h3>Medicine Reminders</h3>
              ${state.medicineReminders.length === 0 ? '<p>No medicine logs.</p>' : `
                <table class="print-table">
                  <tr><th>Medicine</th><th>Schedule Time</th></tr>
                  ${state.medicineReminders.map(m => `
                    <tr><td>${m.name}</td><td>${m.time}</td></tr>
                  `).join('')}
                </table>
              `}
            </div>
          </div>
          <div class="print-grid" style="margin-top:20px;">
            <div class="print-card">
              <h3>Nutrition Logs</h3>
              ${state.nutritionLogs.length === 0 ? '<p>No nutrition logs.</p>' : `
                <table class="print-table">
                  <tr><th>Meal Description</th><th>Calories</th><th>Protein</th></tr>
                  ${state.nutritionLogs.map(n => `
                    <tr><td>${n.meal}</td><td>${n.cals || 0} kcal</td><td>${n.protein || 0}g</td></tr>
                  `).join('')}
                </table>
              `}
            </div>
            <div class="print-card">
              <h3>Workout Logs</h3>
              ${state.workoutLogs.length === 0 ? '<p>No workout logs.</p>' : `
                <table class="print-table">
                  <tr><th>Workout Type</th><th>Duration</th><th>Burned</th></tr>
                  ${state.workoutLogs.map(w => `
                    <tr><td>${w.type}</td><td>${w.duration} mins</td><td>${w.calories || 0} kcal</td></tr>
                  `).join('')}
                </table>
              `}
            </div>
          </div>
        </div>
      `;

      // 8. Personal Vault & Lifestyle
      html += `
        <div class="print-section">
          <h2>8. Personal Vault</h2>
          <div class="print-grid">
            <div class="print-card">
              <h3>Emergency Contacts</h3>
              ${state.contacts.length === 0 ? '<p>No contacts logged.</p>' : `
                <table class="print-table">
                  <tr><th>Name</th><th>Phone</th><th>Relation</th></tr>
                  ${state.contacts.map(c => `
                    <tr><td>${c.name}</td><td>${c.phone}</td><td>${c.relation}</td></tr>
                  `).join('')}
                </table>
              `}
            </div>
            <div class="print-card">
              <h3>Credentials (Masked)</h3>
              ${state.passwords.length === 0 ? '<p>No credentials stored.</p>' : `
                <table class="print-table">
                  <tr><th>Site</th><th>Username</th><th>Password</th></tr>
                  ${state.passwords.map(p => `
                    <tr><td>${p.site}</td><td>${p.user}</td><td><code>********</code></td></tr>
                  `).join('')}
                </table>
              `}
            </div>
          </div>
        </div>

        <div class="print-section">
          <h2>9. Lifestyle & Travel</h2>
          <div class="print-grid">
            <div class="print-card">
              <h3>Trips & Travel Planner</h3>
              ${state.trips.length === 0 ? '<p>No trips planned.</p>' : state.trips.map(t => `
                <div style="margin-bottom:12px; border-bottom:1px dashed #ddd; padding-bottom:8px;">
                  <strong>Destination: ${t.destination}</strong> <span style="font-size:8pt;color:#666;">(${t.dates})</span>
                  <p style="margin:4px 0 0 0;font-size:9pt;"><strong>Packing Checklist:</strong> ${t.packing}</p>
                </div>
              `).join('')}
            </div>
            <div class="print-card">
              <h3>Vehicle Maintenance & Costs</h3>
              ${state.vehicleLogs.length === 0 ? '<p>No logs registered.</p>' : `
                <table class="print-table">
                  <tr><th>Action</th><th>Odometer</th><th>Cost</th></tr>
                  ${state.vehicleLogs.map(v => `
                    <tr><td>${v.action}</td><td>${v.odo || 0} km</td><td>$${(v.cost || 0).toFixed(2)}</td></tr>
                  `).join('')}
                </table>
              `}
            </div>
          </div>
          <div class="print-grid" style="margin-top:20px;">
            <div class="print-card">
              <h3>Media & Reading Tracker</h3>
              ${state.mediaItems.length === 0 ? '<p>No reading logs.</p>' : `
                <table class="print-table">
                  <tr><th>Title</th><th>Type</th><th>Progress</th></tr>
                  ${state.mediaItems.map(m => `
                    <tr><td>${m.name}</td><td>${m.type}</td><td><span class="print-badge ${m.progress === 'Finished' || m.progress === 'Watched' ? 'low' : 'medium'}">${m.progress}</span></td></tr>
                  `).join('')}
                </table>
              `}
            </div>
            <div class="print-card">
              <h3>Shopping List</h3>
              ${state.shoppingList.length === 0 ? '<p>Shopping list is empty.</p>' : `
                <table class="print-table">
                  <tr><th>Item</th><th>Status</th></tr>
                  ${state.shoppingList.map(s => `
                    <tr><td>${s.text}</td><td><span class="print-badge ${s.completed ? 'low' : 'medium'}">${s.completed ? 'Purchased' : 'Pending'}</span></td></tr>
                  `).join('')}
                </table>
              `}
            </div>
          </div>
        </div>
      `;

      // 9. Career
      html += `
        <div class="print-section">
          <h2>10. Career & Milestones</h2>
          <div class="print-grid">
            <div class="print-card">
              <h3>Professional Skills</h3>
              ${state.skills.length === 0 ? '<p>No skills listed.</p>' : `
                <table class="print-table">
                  <tr><th>Skill Name</th><th>Expertise Level</th></tr>
                  ${state.skills.map(s => `
                    <tr><td>${s.name}</td><td>${s.level} / 5</td></tr>
                  `).join('')}
                </table>
              `}
            </div>
            <div class="print-card">
              <h3>Job Applications Tracker</h3>
              ${state.jobApplications.length === 0 ? '<p>No applications logged.</p>' : `
                <table class="print-table">
                  <tr><th>Application Title</th><th>Status</th></tr>
                  ${state.jobApplications.map(j => `
                    <tr><td>${j.title}</td><td><span class="print-badge ${j.status === 'Hired' || j.status === 'Offer' ? 'low' : j.status === 'Rejected' ? 'high' : 'medium'}">${j.status}</span></td></tr>
                  `).join('')}
                </table>
              `}
            </div>
          </div>
        </div>
      `;

      // 10. Financial Tracker
      html += `
        <div class="print-section">
          <h2>11. Financial Tracker Report</h2>
          <div class="print-grid">
            <div class="print-card">
              <h3>Sub-ledger Summary</h3>
              <table class="print-table">
                <tr><td>Total Logged Income</td><td><strong>${currency}${totalIncome.toLocaleString()}</strong></td></tr>
                <tr><td>Total Logged Expenses</td><td><strong style="color:red;">${currency}${totalExpenses.toLocaleString()}</strong></td></tr>
                <tr><td>Net Current Balance</td><td><strong style="color:green;">${currency}${netSavings.toLocaleString()}</strong></td></tr>
              </table>
            </div>
            <div class="print-card">
              <h3>Active Loans Liabilities</h3>
              ${state.loans.length === 0 ? '<p>No loans logged.</p>' : `
                <table class="print-table">
                  <tr><th>Liability Account</th><th>Total Owed</th><th>Monthly EMI</th></tr>
                  ${state.loans.map(l => `
                    <tr><td>${l.name}</td><td>${currency}${l.total.toLocaleString()}</td><td>${currency}${l.emi.toLocaleString()}</td></tr>
                  `).join('')}
                </table>
              `}
            </div>
          </div>
          
          <h3 style="margin-top:20px; font-size:11pt; font-weight:700;">Ongoing Subscriptions</h3>
          ${state.subscriptions.length === 0 ? '<p>No recurring subscriptions.</p>' : `
            <table class="print-table">
              <tr><th>Service Description</th><th>Billing Cost</th><th>Due Date</th><th>Payment Account</th></tr>
              ${state.subscriptions.map(s => `
                <tr><td>${s.name}</td><td>${currency}${s.amount}</td><td>Day ${s.dueDate}</td><td>${s.account}</td></tr>
              `).join('')}
            </table>
          `}
        </div>
      `;

      container.innerHTML = html;
    },

    // --- JSON Backup / Restore Settings ---
    setupBackupControls() {
      const exportDbBtn = document.getElementById('settings-export-db-btn');
      const uploaderInput = document.getElementById('settings-db-uploader');
      const clearDbBtn = document.getElementById('clear-local-db-btn');

      // Export
      exportDbBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.app.state, null, 2));
        const link = document.createElement('a');
        link.setAttribute("href", dataStr);
        link.setAttribute("download", `LifeOS_Backup_${Date.now()}.json`);
        link.click();
        this.app.showToast('JSON database backup exported!', 'success');
      });

      // Import / Restore
      uploaderInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target.result);
            // Verify core keys are present to avoid loading bad files
            if (parsed.user && parsed.tasks) {
              this.app.state = parsed;
              this.app.saveState();
              this.app.showToast('Database backup restored successfully!', 'success');
              
              // Force full page reload to re-instantiate views cleanly
              setTimeout(() => {
                location.reload();
              }, 1000);
            } else {
              this.app.showToast('Error: Invalid JSON database format.', 'error');
            }
          } catch (err) {
            this.app.showToast('Error parsing file.', 'error');
          }
        };
        reader.readAsText(file);
      });

      // Clear / Reset
      clearDbBtn.addEventListener('click', () => {
        const confirmClear = confirm("Are you absolutely sure you want to wipe the Life OS database? All local progress, tasks, files metadata, and transactions will be lost.");
        if (confirmClear) {
          localStorage.removeItem(this.app.STORAGE_KEY);
          this.app.showToast('LocalStorage database wiped clean. Reinitializing...', 'info');
          
          setTimeout(() => {
            location.reload();
          }, 1000);
        }
      });
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('analytics', AnalyticsModule);
    window.LifeOS.registerModule('settings', AnalyticsModule);
  }
});
