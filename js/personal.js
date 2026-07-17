/* ==========================================================================
   LIFE OS - PERSONAL SECURITY VAULT & DOCUMENTS MODULE (js/personal.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const PersonalModule = {
    init() {
      this.setupContactsForm();
      this.setupPasswordForm();
      this.setupDocumentsForm();
      this.render();
    },

    onActive() {
      this.render();
    },

    render() {
      this.renderContacts();
      this.renderPasswords();
      this.renderDocuments();
    },

    // --- Contacts Directory ---
    setupContactsForm() {
      const form = document.getElementById('contact-form');
      const nameInput = document.getElementById('contact-name');
      const phoneInput = document.getElementById('contact-phone');
      const relSelect = document.getElementById('contact-rel');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
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
        this.app.showToast(`Contact "${name}" logged!`, 'success');
        
        form.reset();
        this.renderContacts();
      });
    },

    renderContacts() {
      const container = document.getElementById('contacts-list-container');
      const contacts = this.app.state.contacts;

      if (contacts.length === 0) {
        container.innerHTML = `<div class="empty-state" style="font-size:0.75rem;">Your contacts directory is empty.</div>`;
        return;
      }

      let html = '';
      contacts.forEach(c => {
        html += `
          <div class="vault-item-row">
            <div>
              <strong>${c.name}</strong>
              <span class="badge" style="margin-left:8px; font-size:0.65rem;">${c.relation}</span>
              <p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">📞 ${c.phone}</p>
            </div>
            <button class="icon-btn btn-delete-contact" data-contact-id="${c.id}">
              <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
            </button>
          </div>
        `;
      });

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('.btn-delete-contact').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-contact-id'));
          const idx = this.app.state.contacts.findIndex(c => c.id === id);
          if (idx !== -1) {
            this.app.state.contacts.splice(idx, 1);
            this.app.saveState();
            this.renderContacts();
          }
        });
      });
    },

    // --- Password Vault Keeper ---
    setupPasswordForm() {
      const form = document.getElementById('password-vault-form');
      const siteInput = document.getElementById('pass-site');
      const userInput = document.getElementById('pass-user');
      const passInput = document.getElementById('pass-val');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const site = siteInput.value.trim();
        const user = userInput.value.trim();
        const pass = passInput.value.trim();

        if (!site || !user || !pass) return;

        this.app.state.passwords.push({
          id: Date.now(),
          site: site,
          user: user,
          pass: pass
        });

        this.app.saveState();
        this.app.showToast('Credentials card secured!', 'success');

        form.reset();
        this.renderPasswords();
      });
    },

    renderPasswords() {
      const container = document.getElementById('passwords-list-container');
      const passwords = this.app.state.passwords;

      if (passwords.length === 0) {
        container.innerHTML = `<div class="empty-state" style="font-size:0.75rem;">Password vault is empty.</div>`;
        return;
      }

      let html = '';
      passwords.forEach(p => {
        html += `
          <div class="vault-item-row" data-pass-id="${p.id}">
            <div>
              <strong>🌐 ${p.site}</strong>
              <p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">User: ${p.user}</p>
              <p class="pass-val-text" style="font-size:0.8rem; color:var(--primary); margin-top:2px; display:none;">Pass: ${p.pass}</p>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="icon-btn btn-show-pass" data-pass-id="${p.id}"><i data-lucide="eye" style="width:12px;height:12px;"></i></button>
              <button class="icon-btn btn-delete-pass" data-pass-id="${p.id}"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      // Show/Hide Toggle
      container.querySelectorAll('.btn-show-pass').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-pass-id'));
          const card = container.querySelector(`.vault-item-row[data-pass-id="${id}"]`);
          const text = card.querySelector('.pass-val-text');
          
          const icon = btn.querySelector('i');

          if (text.style.display === 'none') {
            text.style.display = 'block';
            icon.setAttribute('data-lucide', 'eye-off');
          } else {
            text.style.display = 'none';
            icon.setAttribute('data-lucide', 'eye');
          }
          if (window.lucide) window.lucide.createIcons();
        });
      });

      // Delete pass card
      container.querySelectorAll('.btn-delete-pass').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-pass-id'));
          const idx = this.app.state.passwords.findIndex(p => p.id === id);
          if (idx !== -1) {
            this.app.state.passwords.splice(idx, 1);
            this.app.saveState();
            this.renderPasswords();
          }
        });
      });
    },

    // --- Documents Indexer ---
    setupDocumentsForm() {
      const form = document.getElementById('doc-form');
      const titleInput = document.getElementById('doc-title');
      const catSelect = document.getElementById('doc-category');
      const refInput = document.getElementById('doc-ref');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        if (!title) return;

        this.app.state.documents.push({
          id: Date.now(),
          title: title,
          category: catSelect.value,
          ref: refInput.value.trim() || 'N/A',
          date: new Date().toLocaleDateString()
        });

        this.app.saveState();
        this.app.showToast(`Document logged under category ${catSelect.value}`, 'success');

        form.reset();
        this.renderDocuments();
      });
    },

    renderDocuments() {
      const listBody = document.getElementById('docs-list-body');
      const docs = this.app.state.documents;

      if (docs.length === 0) {
        listBody.innerHTML = `<tr><td colspan="5" class="empty-state" style="font-size:0.75rem;">No documents catalogued.</td></tr>`;
        return;
      }

      let html = '';
      docs.forEach(doc => {
        html += `
          <tr data-doc-id="${doc.id}">
            <td>📂 <strong>${doc.title}</strong></td>
            <td><span class="badge">${doc.category.toUpperCase()}</span></td>
            <td><code>${doc.ref}</code></td>
            <td>${doc.date}</td>
            <td style="text-align:right;">
              <button class="icon-btn btn-delete-doc" data-doc-id="${doc.id}">
                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
              </button>
            </td>
          </tr>
        `;
      });

      listBody.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      // Delete doc
      listBody.querySelectorAll('.btn-delete-doc').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-doc-id'));
          const idx = this.app.state.documents.findIndex(d => d.id === id);
          if (idx !== -1) {
            this.app.state.documents.splice(idx, 1);
            this.app.saveState();
            this.renderDocuments();
          }
        });
      });
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('personal', PersonalModule);
    window.LifeOS.registerModule('documents', PersonalModule);
  }
});
