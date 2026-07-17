/* ==========================================================================
   LIFE OS - DAILY JOURNAL CONTROLLER (js/journal.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const JournalModule = {
    editingEntryDate: null, // If null, creating new entry for today

    init() {
      this.setupForm();
      this.setupSearch();
      this.render();
    },

    onActive() {
      this.render();
    },

    render() {
      this.renderDateHeaders();
      this.renderHistory();
    },

    // Sync dates in header
    renderDateHeaders() {
      const todayDateStr = new Date().toDateString();
      const todayDateEl = document.getElementById('journal-today-date');
      const writerTitle = document.getElementById('journal-writer-title');

      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      todayDateEl.textContent = now.toLocaleDateString('en-US', options);

      if (this.editingEntryDate) {
        writerTitle.textContent = `Reviewing Entry: ${this.editingEntryDate}`;
      } else {
        writerTitle.textContent = "Write Today's Reflections";
      }
    },

    // Render list of past journal items
    renderHistory(filterQuery = '') {
      const container = document.getElementById('journal-entries-list');
      const emptyState = document.getElementById('journal-empty-state');
      const entries = this.app.state.journalEntries;

      // Filter entries by query
      let filteredEntries = entries;
      if (filterQuery.trim()) {
        const query = filterQuery.toLowerCase().trim();
        filteredEntries = entries.filter(entry => {
          const inTitle = entry.title.toLowerCase().includes(query);
          const inContent = entry.content.toLowerCase().includes(query);
          const inGratitude = entry.gratitude.some(g => g.toLowerCase().includes(query));
          const inWins = entry.wins.some(w => w.toLowerCase().includes(query));
          
          return inTitle || inContent || inGratitude || inWins;
        });
      }

      if (filteredEntries.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }

      emptyState.classList.add('hidden');

      let html = '';
      filteredEntries.forEach(entry => {
        // Excerpt calculation
        const excerpt = entry.content.length > 80 ? entry.content.substring(0, 80) + '...' : entry.content;
        
        // Check if selected
        const isEditingClass = this.editingEntryDate === entry.date ? 'style="border-color: var(--primary); background: rgba(163, 112, 247, 0.05);"' : '';

        html += `
          <div class="journal-item-card" data-date="${entry.date}" ${isEditingClass}>
            <div class="journal-item-meta">
              <span>${entry.date}</span>
            </div>
            <div class="journal-item-title">${entry.title}</div>
            <div class="journal-item-excerpt">${excerpt}</div>
          </div>
        `;
      });

      container.innerHTML = html;
      this.setupHistoryListeners();
    },

    // Configure form submission (Insert or Update)
    setupForm() {
      const form = document.getElementById('journal-form');
      const titleInput = document.getElementById('journal-title');
      const contentInput = document.getElementById('journal-content');
      const grat1 = document.getElementById('journal-gratitude-1');
      const grat2 = document.getElementById('journal-gratitude-2');
      const grat3 = document.getElementById('journal-gratitude-3');
      const win1 = document.getElementById('journal-win-1');
      const win2 = document.getElementById('journal-win-2');

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const gratitude = [
          grat1.value.trim(),
          grat2.value.trim(),
          grat3.value.trim()
        ].filter(Boolean); // removes empty fields

        const wins = [
          win1.value.trim(),
          win2.value.trim()
        ].filter(Boolean);

        if (!title || !content) return;

        // Date string identifier
        const targetDate = this.editingEntryDate || new Date().toDateString();

        const entryObject = {
          date: targetDate,
          title: title,
          content: content,
          gratitude: gratitude,
          wins: wins
        };

        const existingIndex = this.app.state.journalEntries.findIndex(e => e.date === targetDate);

        if (existingIndex !== -1) {
          // Overwrite existing log
          this.app.state.journalEntries[existingIndex] = entryObject;
          this.app.showToast('Journal entry updated!', 'success');
        } else {
          // Add new log to start
          this.app.state.journalEntries.unshift(entryObject);
          this.app.showToast('Journal entry saved!', 'success');
        }

        // Reset editing state and clear form
        this.editingEntryDate = null;
        form.reset();
        
        this.app.saveState();
        this.render();
      });
    },

    // Search bar functionality
    setupSearch() {
      const searchInput = document.getElementById('journal-search');
      searchInput.addEventListener('input', (e) => {
        this.renderHistory(e.target.value);
      });
    },

    // Past logs clicks (loads into editor)
    setupHistoryListeners() {
      const cards = document.querySelectorAll('.journal-item-card');
      const form = document.getElementById('journal-form');
      const titleInput = document.getElementById('journal-title');
      const contentInput = document.getElementById('journal-content');
      const grat1 = document.getElementById('journal-gratitude-1');
      const grat2 = document.getElementById('journal-gratitude-2');
      const grat3 = document.getElementById('journal-gratitude-3');
      const win1 = document.getElementById('journal-win-1');
      const win2 = document.getElementById('journal-win-2');

      cards.forEach(card => {
        card.addEventListener('click', () => {
          const date = card.getAttribute('data-date');
          const entry = this.app.state.journalEntries.find(e => e.date === date);

          if (entry) {
            if (this.editingEntryDate === date) {
              // Clicked already active: toggle off to start a new daily log
              this.editingEntryDate = null;
              form.reset();
              this.app.showToast('Cleared editor to create a new log.', 'info');
            } else {
              // Load entry details into editor form fields
              this.editingEntryDate = date;
              titleInput.value = entry.title;
              contentInput.value = entry.content;
              
              grat1.value = entry.gratitude[0] || '';
              grat2.value = entry.gratitude[1] || '';
              grat3.value = entry.gratitude[2] || '';
              
              win1.value = entry.wins[0] || '';
              win2.value = entry.wins[1] || '';

              this.app.showToast(`Loaded journal from ${date}`, 'info');
            }

            this.render();
          }
        });
      });
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('journal', JournalModule);
  }
});
