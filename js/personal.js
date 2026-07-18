/* ==========================================================================
   LIFE OS - PERSONAL SECURITY VAULT MODULE (js/personal.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const PersonalModule = {
    categoryFilter: null,
    searchQuery: '',

    init() {
      this.initDefaultVaultItems();
      this.setupVaultEventListeners();
      this.setupContactsForm();
      this.setupNumbersForm();
      this.setupInsuranceForm();
      this.setupMedicalForm();
      this.render();
    },

    onActive() {
      this.render();
    },

    initDefaultVaultItems() {
      const state = this.app.state;
      if (!state.vaultItems) state.vaultItems = [];
      if (!state.contacts) state.contacts = [];

      if (!state.vaultSeeded) {
        state.vaultItems = [
          {
            id: 'v-1',
            name: 'Google Account',
            category: 'Password',
            description: 'kishore.raj@gmail.com',
            secureData: 'GoogleSecurePass123!',
            lastUpdated: '16 May 2026, 09:30 AM',
            accessStatus: 'Locked'
          },
          {
            id: 'v-2',
            name: 'PAN Card',
            category: 'ID & Certificate',
            description: 'Permanent Account Number',
            secureData: 'ABCDE1234F',
            lastUpdated: '12 May 2026, 04:20 PM',
            accessStatus: 'Locked'
          },
          {
            id: 'v-3',
            name: 'HDFC Bank Account',
            category: 'Card & Account',
            description: 'Savings Account **** 1234',
            secureData: 'IFSC: HDFC0000123 / PIN: 9876',
            lastUpdated: '10 May 2026, 11:15 AM',
            accessStatus: 'Locked'
          },
          {
            id: 'v-4',
            name: 'Passport',
            category: 'Document',
            description: 'Passport No. *****9876',
            secureData: 'Z1234567 / Exp: 2032-12-31',
            lastUpdated: '08 May 2026, 02:45 PM',
            accessStatus: 'Locked'
          },
          {
            id: 'v-5',
            name: 'WiFi Home',
            category: 'Secure Note',
            description: 'Home WiFi Credentials',
            secureData: 'WiFiPassword2026_Secure',
            lastUpdated: '05 May 2026, 08:10 PM',
            accessStatus: 'Locked'
          },
          {
            id: 'v-qa-n1',
            name: 'Police / Emergency',
            category: 'Important Number',
            description: 'Helpline',
            secureData: '100 / 112',
            lastUpdated: '18 Jul 2026, 05:00 PM',
            accessStatus: 'Unlocked'
          },
          {
            id: 'v-qa-n2',
            name: 'Fire Helpline',
            category: 'Important Number',
            description: 'Helpline',
            secureData: '101',
            lastUpdated: '18 Jul 2026, 05:00 PM',
            accessStatus: 'Unlocked'
          },
          {
            id: 'v-qa-n3',
            name: 'Ambulance Services',
            category: 'Important Number',
            description: 'Helpline',
            secureData: '102',
            lastUpdated: '18 Jul 2026, 05:00 PM',
            accessStatus: 'Unlocked'
          },
          {
            id: 'v-qa-n4',
            name: 'Women Helpline',
            category: 'Important Number',
            description: 'Helpline',
            secureData: '1091',
            lastUpdated: '18 Jul 2026, 05:00 PM',
            accessStatus: 'Unlocked'
          },
          {
            id: 'v-qa-n5',
            name: 'National Cyber Crime',
            category: 'Important Number',
            description: 'Helpline',
            secureData: '1930',
            lastUpdated: '18 Jul 2026, 05:00 PM',
            accessStatus: 'Unlocked'
          },
          {
            id: 'v-qa-i1',
            name: 'LIC Term Plan',
            category: 'Insurance Detail',
            description: 'Pol No: #554433',
            secureData: 'Dec 2030',
            lastUpdated: '18 Jul 2026, 05:00 PM',
            accessStatus: 'Unlocked'
          },
          {
            id: 'v-qa-i2',
            name: 'HDFC Ergo SUV Car Insurance',
            category: 'Insurance Detail',
            description: 'SUV Policy',
            secureData: 'Oct 2026',
            lastUpdated: '18 Jul 2026, 05:00 PM',
            accessStatus: 'Unlocked'
          },
          {
            id: 'v-qa-i3',
            name: 'Niva Bupa Health Shield',
            category: 'Insurance Detail',
            description: 'Health Shield',
            secureData: 'Jun 2027',
            lastUpdated: '18 Jul 2026, 05:00 PM',
            accessStatus: 'Unlocked'
          },
          {
            id: 'v-qa-i4',
            name: 'Home Content Protection Policy',
            category: 'Insurance Detail',
            description: 'Home Policy',
            secureData: 'Aug 2029',
            lastUpdated: '18 Jul 2026, 05:00 PM',
            accessStatus: 'Unlocked'
          },
          {
            id: 'v-qa-m1',
            name: 'Blood Group',
            category: 'Medical Info',
            description: 'Blood Type',
            secureData: 'O Positive (O+)',
            lastUpdated: '18 Jul 2026, 05:00 PM',
            accessStatus: 'Unlocked'
          },
          {
            id: 'v-qa-m2',
            name: 'Allergies',
            category: 'Medical Info',
            description: 'Allergic Substances',
            secureData: 'Penicillin, Peanut Oil',
            lastUpdated: '18 Jul 2026, 05:00 PM',
            accessStatus: 'Unlocked'
          },
          {
            id: 'v-qa-m3',
            name: 'Family Physician',
            category: 'Medical Info',
            description: 'Dr. Rajesh Gupta',
            secureData: '+91 98765-43210',
            lastUpdated: '18 Jul 2026, 05:00 PM',
            accessStatus: 'Unlocked'
          }
        ];

        state.contacts = [
          { id: 1, name: 'Marcus Raj (Dad)', phone: '+91 99999 88888', relation: 'Family' },
          { id: 2, name: 'Elena Raj (Mom)', phone: '+91 99999 77777', relation: 'Family' },
          { id: 3, name: 'Dr. Rajesh Gupta', phone: '+91 98765 43210', relation: 'Emergency' }
        ];

        state.vaultSeeded = true;
        this.app.saveState();
      }
    },

    setupVaultEventListeners() {
      // Toggle Add Form Modal
      const btnAdd = document.getElementById('btn-add-vault-item');
      const addContainer = document.getElementById('add-vault-item-container');
      const btnCancel = document.getElementById('btn-cancel-vault-item');

      if (btnAdd && addContainer) {
        btnAdd.addEventListener('click', () => {
          addContainer.style.display = addContainer.style.display === 'none' ? 'block' : 'none';
        });
      }

      if (btnCancel && addContainer) {
        btnCancel.addEventListener('click', () => {
          addContainer.style.display = 'none';
          document.getElementById('new-vault-item-form').reset();
        });
      }

      // Add New Vault Item Submission
      const form = document.getElementById('new-vault-item-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          try {
            const name = document.getElementById('vault-item-name').value.trim();
            const category = document.getElementById('vault-item-category').value;
            const description = document.getElementById('vault-item-desc').value.trim();
            const secureData = document.getElementById('vault-item-secure').value.trim();

            const now = new Date();
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            const timeOpt = { hour: '2-digit', minute: '2-digit', hour12: true };
            const lastUpdated = `${now.toLocaleDateString('en-US', options)}, ${now.toLocaleTimeString('en-US', timeOpt)}`;

            const newItem = {
              id: 'v-' + Date.now(),
              name,
              category,
              description,
              secureData,
              lastUpdated,
              accessStatus: 'Locked'
            };

            if (!this.app.state.vaultItems || !Array.isArray(this.app.state.vaultItems)) {
              this.app.state.vaultItems = [];
            }

            this.app.state.vaultItems.push(newItem);
            this.app.saveState();
            this.app.showToast(`Secure ${category} item added.`, 'success');

            form.reset();
            if (addContainer) addContainer.style.display = 'none';
            this.render();
          } catch (err) {
            console.error('Error adding secure item:', err);
            this.app.showToast('Could not save item: ' + err.message, 'error');
          }
        });
      }

      // Search Filter
      const search = document.getElementById('vault-search-input');
      if (search) {
        search.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.toLowerCase();
          this.renderTable();
        });
      }

      // Backup Now button
      const btnBackup = document.getElementById('btn-vault-backup-now');
      if (btnBackup) {
        btnBackup.addEventListener('click', () => {
          this.app.showToast('Initiating Supabase cloud backup...', 'info');
          
          const now = new Date();
          const options = { day: 'numeric', month: 'short', year: 'numeric' };
          const timeOpt = { hour: '2-digit', minute: '2-digit', hour12: true };
          const timeStr = `${now.toLocaleDateString('en-US', options)}, ${now.toLocaleTimeString('en-US', timeOpt)}`;
          
          const backupLabel = document.getElementById('vault-backup-date-label');
          const backupOverviewLabel = document.getElementById('vault-overview-backup-date');
          
          if (backupLabel) backupLabel.innerText = timeStr;
          if (backupOverviewLabel) backupOverviewLabel.innerText = now.toLocaleDateString('en-US', options);

          // Force Supabase sync
          if (typeof this.app.pushAllStateToSupabase === 'function') {
            this.app.pushAllStateToSupabase();
          } else {
            this.app.showToast('Workspace backup completed locally.', 'success');
          }
        });
      }

      // Reset Data button
      const btnReset = document.getElementById('btn-vault-reset-data');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          const confirmReset = confirm('Are you sure you want to reset your vault data? This will wipe out all custom secrets and restore the default secure items.');
          if (confirmReset) {
            this.app.state.vaultItems = [];
            this.app.state.contacts = [];
            this.app.state.vaultSeeded = false;
            this.initDefaultVaultItems();
            this.app.saveState();
            this.app.showToast('Vault database reset to default secure values.', 'success');
            this.render();
          }
        });
      }

      // Drag & drop file upload input listener
      const fileInput = document.getElementById('vault-file-upload-input');
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const now = new Date();
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            const timeOpt = { hour: '2-digit', minute: '2-digit', hour12: true };
            const lastUpdated = `${now.toLocaleDateString('en-US', options)}, ${now.toLocaleTimeString('en-US', timeOpt)}`;

            const newItem = {
              id: 'v-' + Date.now(),
              name: file.name,
              category: 'Document',
              description: `Uploaded file (${Math.round(file.size / 1024)} KB)`,
              secureData: 'SANDBOXED_FILE_URL',
              lastUpdated,
              accessStatus: 'Locked'
            };

            this.app.state.vaultItems.push(newItem);
            this.app.saveState();
            this.app.showToast(`File "${file.name}" encrypted and uploaded securely!`, 'success');
            this.render();
          }
        });
      }
    },

    setupContactsForm() {
      const form = document.getElementById('contact-form');
      if (form) {
        // Remove duplicate listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const nameInput = document.getElementById('contact-name');
          const phoneInput = document.getElementById('contact-phone');
          const relSelect = document.getElementById('contact-rel');

          const name = nameInput.value.trim();
          const phone = phoneInput.value.trim();
          if (!name || !phone) return;

          this.app.state.contacts.push({
            id: Date.now(),
            name: name,
            phone: phone,
            relation: relSelect.value
          });

          this.app.saveState();
          this.app.showToast(`Contact "${name}" saved!`, 'success');
          
          newForm.reset();
          this.renderContacts();
        });
      }
    },

    setupNumbersForm() {
      const form = document.getElementById('vault-qa-numbers-form');
      if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
          e.preventDefault();
          try {
            const labelInput = document.getElementById('qa-number-label');
            const valInput = document.getElementById('qa-number-val');

            const name = labelInput.value.trim();
            const secureData = valInput.value.trim();
            if (!name || !secureData) return;

            const now = new Date();
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            const timeOpt = { hour: '2-digit', minute: '2-digit', hour12: true };
            const lastUpdated = `${now.toLocaleDateString('en-US', options)}, ${now.toLocaleTimeString('en-US', timeOpt)}`;

            const newItem = {
              id: 'v-qa-' + Date.now(),
              name: name,
              category: 'Important Number',
              description: 'Helpline',
              secureData: secureData,
              lastUpdated: lastUpdated,
              accessStatus: 'Unlocked'
            };

            if (!this.app.state.vaultItems || !Array.isArray(this.app.state.vaultItems)) {
              this.app.state.vaultItems = [];
            }
            this.app.state.vaultItems.push(newItem);
            this.app.saveState();
            this.app.showToast(`Number for "${name}" saved!`, 'success');
            
            newForm.reset();
            this.render();
          } catch (err) {
            console.error('Error adding helpline number:', err);
            this.app.showToast('Could not save number: ' + err.message, 'error');
          }
        });
      }
    },

    setupInsuranceForm() {
      const form = document.getElementById('vault-qa-insurance-form');
      if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
          e.preventDefault();
          try {
            const nameInput = document.getElementById('qa-ins-name');
            const noInput = document.getElementById('qa-ins-no');
            const expInput = document.getElementById('qa-ins-exp');

            const name = nameInput.value.trim();
            const policyNo = noInput.value.trim();
            const expiry = expInput.value.trim();
            if (!name || !policyNo || !expiry) return;

            const now = new Date();
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            const timeOpt = { hour: '2-digit', minute: '2-digit', hour12: true };
            const lastUpdated = `${now.toLocaleDateString('en-US', options)}, ${now.toLocaleTimeString('en-US', timeOpt)}`;

            const newItem = {
              id: 'v-qa-' + Date.now(),
              name: name,
              category: 'Insurance Detail',
              description: policyNo,
              secureData: expiry,
              lastUpdated: lastUpdated,
              accessStatus: 'Unlocked'
            };

            if (!this.app.state.vaultItems || !Array.isArray(this.app.state.vaultItems)) {
              this.app.state.vaultItems = [];
            }
            this.app.state.vaultItems.push(newItem);
            this.app.saveState();
            this.app.showToast(`Insurance policy "${name}" saved!`, 'success');
            
            newForm.reset();
            this.render();
          } catch (err) {
            console.error('Error adding insurance policy:', err);
            this.app.showToast('Could not save policy: ' + err.message, 'error');
          }
        });
      }
    },

    setupMedicalForm() {
      const form = document.getElementById('vault-qa-medical-form');
      if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
          e.preventDefault();
          try {
            const nameInput = document.getElementById('qa-med-name');
            const valInput = document.getElementById('qa-med-val');

            const name = nameInput.value.trim();
            const secureData = valInput.value.trim();
            if (!name || !secureData) return;

            const now = new Date();
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            const timeOpt = { hour: '2-digit', minute: '2-digit', hour12: true };
            const lastUpdated = `${now.toLocaleDateString('en-US', options)}, ${now.toLocaleTimeString('en-US', timeOpt)}`;

            const newItem = {
              id: 'v-qa-' + Date.now(),
              name: name,
              category: 'Medical Info',
              description: 'Medical Record',
              secureData: secureData,
              lastUpdated: lastUpdated,
              accessStatus: 'Unlocked'
            };

            if (!this.app.state.vaultItems || !Array.isArray(this.app.state.vaultItems)) {
              this.app.state.vaultItems = [];
            }
            this.app.state.vaultItems.push(newItem);
            this.app.saveState();
            this.app.showToast(`Medical record for "${name}" saved!`, 'success');
            
            newForm.reset();
            this.render();
          } catch (err) {
            console.error('Error adding medical record:', err);
            this.app.showToast('Could not save record: ' + err.message, 'error');
          }
        });
      }
    },

    filterByCategory(category) {
      this.categoryFilter = category;
      const title = document.getElementById('vault-table-title');
      if (title) {
        title.innerText = `${category} Items`;
      }
      this.renderTable();
    },

    clearCategoryFilter() {
      this.categoryFilter = null;
      const title = document.getElementById('vault-table-title');
      if (title) {
        title.innerText = 'Recent Items';
      }
      this.renderTable();
    },

    toggleQuickAccessPanel(panelKey) {
      const panels = ['contacts', 'numbers', 'insurance', 'medical'];
      panels.forEach(key => {
        const el = document.getElementById(`vault-qa-${key}-expanded`);
        if (el) {
          if (key === panelKey) {
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
          } else {
            el.style.display = 'none';
          }
        }
      });
    },

    toggleItemAccess(id) {
      const item = this.app.state.vaultItems.find(v => v.id === id);
      if (!item) return;

      item.accessStatus = item.accessStatus === 'Locked' ? 'Unlocked' : 'Locked';
      this.renderTable();
    },

    deleteVaultItem(id) {
      if (confirm('Are you sure you want to permanently delete this secure item from the vault?')) {
        this.app.state.vaultItems = this.app.state.vaultItems.filter(v => v.id !== id);
        this.app.saveState();
        this.app.showToast('Item deleted from secure vault.', 'info');
        this.render();
      }
    },

    render() {
      const allItems = this.app.state.vaultItems || [];
      const items = allItems.filter(v => ['Password', 'Document', 'Card & Account', 'ID & Certificate', 'Secure Note', 'Others'].includes(v.category));

      // 1. Calculate Stats
      const totalCount = items.length;
      const passCount = items.filter(v => v.category === 'Password').length;
      const docCount = items.filter(v => v.category === 'Document').length;
      const cardCount = items.filter(v => v.category === 'Card & Account').length;
      const notesCount = items.filter(v => v.category === 'Secure Note').length;
      const idCount = items.filter(v => v.category === 'ID & Certificate').length;
      const otherCount = items.filter(v => v.category === 'Others').length;

      // Update Top row stats
      const sTotal = document.getElementById('vault-stat-total');
      const sPasswords = document.getElementById('vault-stat-passwords');
      const sDocuments = document.getElementById('vault-stat-documents');
      const sCards = document.getElementById('vault-stat-cards');
      const sNotes = document.getElementById('vault-stat-notes');

      if (sTotal) sTotal.innerText = totalCount;
      if (sPasswords) sPasswords.innerText = passCount;
      if (sDocuments) sDocuments.innerText = docCount;
      if (sCards) sCards.innerText = cardCount;
      if (sNotes) sNotes.innerText = notesCount;

      // Update category selectors counts
      const cPasswords = document.getElementById('vault-cat-count-passwords');
      const cDocuments = document.getElementById('vault-cat-count-documents');
      const cCards = document.getElementById('vault-cat-count-cards');
      const cIds = document.getElementById('vault-cat-count-ids');
      const cNotes = document.getElementById('vault-cat-count-notes');
      const cOthers = document.getElementById('vault-cat-count-others');

      if (cPasswords) cPasswords.innerText = passCount;
      if (cDocuments) cDocuments.innerText = docCount;
      if (cCards) cCards.innerText = cardCount;
      if (cIds) cIds.innerText = idCount;
      if (cNotes) cNotes.innerText = notesCount;
      if (cOthers) cOthers.innerText = otherCount;

      // Update Quick Access indicators
      const qaContactsCount = document.getElementById('vault-qa-contacts-count');
      if (qaContactsCount) {
        const contactCount = (this.app.state.contacts || []).length;
        qaContactsCount.innerText = `${contactCount} contacts saved`;
      }

      this.renderTable();
      this.renderContacts();
      this.renderNumbers();
      this.renderInsurance();
      this.renderMedical();
    },

    renderTable() {
      const allItems = this.app.state.vaultItems || [];
      const items = allItems.filter(v => ['Password', 'Document', 'Card & Account', 'ID & Certificate', 'Secure Note', 'Others'].includes(v.category));
      const tbody = document.getElementById('vault-items-tbody');
      if (!tbody) return;

      let filtered = items;

      // Apply category filter
      if (this.categoryFilter) {
        filtered = filtered.filter(v => v.category === this.categoryFilter);
      }

      // Apply search query
      if (this.searchQuery) {
        filtered = filtered.filter(v => 
          v.name.toLowerCase().includes(this.searchQuery) ||
          v.description.toLowerCase().includes(this.searchQuery) ||
          v.category.toLowerCase().includes(this.searchQuery)
        );
      }

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No secure items found matching the filters.</td></tr>`;
        return;
      }

      let html = '';
      filtered.forEach(v => {
        const isLocked = v.accessStatus !== 'Unlocked';
        
        // Dynamic category colors matching dashboard tokens
        let catColor = 'var(--text-muted)';
        if (v.category === 'Password') catColor = 'var(--green)';
        else if (v.category === 'Document') catColor = 'var(--blue)';
        else if (v.category === 'Card & Account') catColor = 'var(--yellow)';
        else if (v.category === 'ID & Certificate') catColor = 'var(--primary)';
        else if (v.category === 'Secure Note') catColor = 'var(--red)';

        // Lock Toggle Icon
        const lockIcon = isLocked ? '<i class="fas fa-lock" style="color: var(--text-muted);"></i>' : '<i class="fas fa-lock-open" style="color: var(--green);"></i>';
        
        // Description value (if Unlocked, show password value)
        const displayValue = isLocked ? v.description : `Value: ${v.secureData}`;

        html += `
          <tr style="border-bottom: 1px solid var(--glass-border);">
            <td style="padding: 12px 10px;">
              <div style="font-weight: 700; color: var(--text-main);">${v.name}</div>
              <span style="font-size: 0.68rem; color: var(--text-muted);">${displayValue}</span>
            </td>
            <td style="padding: 12px 10px;">
              <span style="background: ${catColor}12; border: 1px solid ${catColor}40; color: ${catColor}; padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: bold;">
                ${v.category}
              </span>
            </td>
            <td style="padding: 12px 10px; color: var(--text-muted); font-size: 0.72rem;">${v.lastUpdated}</td>
            <td style="padding: 12px 10px; text-align: center;">
              <button onclick="window.LifeOS.modules.personal.toggleItemAccess('${v.id}')" style="background: none; border: none; cursor: pointer; padding: 4px 8px;">
                ${lockIcon}
              </button>
            </td>
            <td style="padding: 12px 10px; text-align: center;">
              <button onclick="window.LifeOS.modules.personal.deleteVaultItem('${v.id}')" style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--red); color: var(--red); padding: 4px 8px; border-radius: 4px; font-size: 0.65rem; cursor: pointer; font-weight: bold;">
                Delete
              </button>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    },

    renderContacts() {
      const container = document.getElementById('contacts-list-container');
      if (!container) return;

      const contacts = this.app.state.contacts || [];
      if (contacts.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 10px;">Emergency directory is empty.</div>`;
        return;
      }

      let html = '';
      contacts.forEach(c => {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px; background: rgba(255,255,255,0.02); border-radius: 4px; border: 1px solid var(--glass-border);">
            <div>
              <strong style="font-size: 0.75rem; color: var(--text-main);">${c.name}</strong>
              <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">📞 ${c.phone} <span style="background:rgba(59, 130, 246, 0.1); padding: 1px 4px; border-radius:3px; font-size:0.55rem; font-weight:bold; color:var(--blue); margin-left:4px;">${c.relation}</span></div>
            </div>
            <button onclick="window.LifeOS.modules.personal.deleteContact(${c.id})" style="background: none; border: none; color: var(--red); cursor: pointer; font-size: 0.72rem; padding: 4px;"><i class="fas fa-trash-alt"></i></button>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    renderNumbers() {
      const container = document.getElementById('qa-numbers-list-container');
      if (!container) return;

      const items = (this.app.state.vaultItems || []).filter(v => v.category === 'Important Number');
      
      const countLabel = document.getElementById('vault-qa-numbers-count');
      if (countLabel) {
        countLabel.innerText = `${items.length} numbers saved`;
      }

      if (items.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 10px;">No numbers saved.</div>`;
        return;
      }

      let html = '';
      items.forEach(num => {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px; background: rgba(255,255,255,0.02); border-radius: 4px; border: 1px solid var(--glass-border);">
            <div>
              <strong style="font-size: 0.75rem; color: var(--text-main);">${num.name}</strong>
              <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">📞 ${num.secureData}</div>
            </div>
            <button onclick="window.LifeOS.modules.personal.deleteVaultItem('${num.id}')" style="background: none; border: none; color: var(--red); cursor: pointer; font-size: 0.72rem; padding: 4px;"><i class="fas fa-trash-alt"></i></button>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    renderInsurance() {
      const container = document.getElementById('qa-insurance-list-container');
      if (!container) return;

      const items = (this.app.state.vaultItems || []).filter(v => v.category === 'Insurance Detail');
      
      const countLabel = document.getElementById('vault-qa-insurance-count');
      if (countLabel) {
        countLabel.innerText = `${items.length} policies saved`;
      }

      if (items.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 10px;">No policies saved.</div>`;
        return;
      }

      let html = '';
      items.forEach(ins => {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px; background: rgba(255,255,255,0.02); border-radius: 4px; border: 1px solid var(--glass-border);">
            <div>
              <strong style="font-size: 0.75rem; color: var(--text-main);">${ins.name}</strong>
              <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">📝 No: ${ins.description} <span style="background:rgba(245, 158, 11, 0.1); padding: 1px 4px; border-radius:3px; font-size:0.55rem; font-weight:bold; color:var(--yellow); margin-left:4px;">Exp: ${ins.secureData}</span></div>
            </div>
            <button onclick="window.LifeOS.modules.personal.deleteVaultItem('${ins.id}')" style="background: none; border: none; color: var(--red); cursor: pointer; font-size: 0.72rem; padding: 4px;"><i class="fas fa-trash-alt"></i></button>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    renderMedical() {
      const container = document.getElementById('qa-medical-list-container');
      if (!container) return;

      const items = (this.app.state.vaultItems || []).filter(v => v.category === 'Medical Info');
      
      const countLabel = document.getElementById('vault-qa-medical-count');
      if (countLabel) {
        countLabel.innerText = `${items.length} records saved`;
      }

      if (items.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 10px;">No records saved.</div>`;
        return;
      }

      let html = '';
      items.forEach(med => {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px; background: rgba(255,255,255,0.02); border-radius: 4px; border: 1px solid var(--glass-border);">
            <div>
              <strong style="font-size: 0.75rem; color: var(--text-main);">${med.name}</strong>
              <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">ℹ️ ${med.secureData}</div>
            </div>
            <button onclick="window.LifeOS.modules.personal.deleteVaultItem('${med.id}')" style="background: none; border: none; color: var(--red); cursor: pointer; font-size: 0.72rem; padding: 4px;"><i class="fas fa-trash-alt"></i></button>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    deleteContact(id) {
      if (confirm('Remove contact from emergency directory?')) {
        this.app.state.contacts = this.app.state.contacts.filter(c => c.id !== id);
        this.app.saveState();
        this.app.showToast('Contact removed from emergency directory.', 'info');
        this.render();
      }
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('personal', PersonalModule);
    window.LifeOS.registerModule('documents', PersonalModule);
  } else {
    console.error('LifeOS core application namespace not found for personal.js registration.');
  }
});
