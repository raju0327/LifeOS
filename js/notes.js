/* ==========================================================================
   LIFE OS - KNOWLEDGE, JOURNAL & VISION MODULE (js/notes.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const NotesModule = {
    init() {
      this.setupNoteControls();
      this.setupBookmarkControls();
      this.setupJournalControls();
      this.setupVisionControls();
      this.render();
    },

    onActive() {
      this.render();
    },

    render() {
      this.renderNotes();
      this.renderBookmarks();
      this.renderJournal();
      this.renderVisionBoard();
    },

    // --- Notes Board ---
    setupNoteControls() {
      const form = document.getElementById('note-form');
      const titleInput = document.getElementById('note-title');
      const contentInput = document.getElementById('note-content');
      const tagsInput = document.getElementById('note-tags');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) return;

        const newNote = {
          id: Date.now(),
          title: title,
          content: content,
          tags: tagsInput.value.trim(),
          date: new Date().toDateString()
        };

        this.app.state.notes.push(newNote);
        this.app.saveState();
        this.app.showToast(`Note "${title}" saved!`, 'success');

        form.reset();
        this.renderNotes();
      });
    },

    renderNotes() {
      const container = document.getElementById('notes-grid-container');
      const notes = this.app.state.notes;

      if (notes.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">Your knowledge base is empty. Create your first note!</div>`;
        return;
      }

      let html = '';
      notes.forEach(note => {
        const tagsHtml = note.tags 
          ? note.tags.split(',').map(t => `<span class="badge">${t.trim()}</span>`).join(' ') 
          : '';

        html += `
          <div class="note-item-card">
            <div>
              <div class="note-item-title">${note.title}</div>
              <p class="note-item-desc">${note.content}</p>
              <div class="note-item-tags">${tagsHtml}</div>
            </div>
            <div class="note-item-footer">
              <span class="text-muted" style="font-size:0.75rem;">${note.date}</span>
              <button class="icon-btn btn-delete-note" data-note-id="${note.id}" title="Remove Note">
                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
              </button>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('.btn-delete-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-note-id'));
          const idx = this.app.state.notes.findIndex(n => n.id === id);
          if (idx !== -1) {
            this.app.state.notes.splice(idx, 1);
            this.app.saveState();
            this.app.showToast('Note deleted', 'info');
            this.renderNotes();
          }
        });
      });
    },

    // --- Bookmarks Links ---
    setupBookmarkControls() {
      const form = document.getElementById('bookmark-form');
      const titleInput = document.getElementById('bookmark-title');
      const urlInput = document.getElementById('bookmark-url');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        const url = urlInput.value.trim();

        if (!title || !url) return;

        const newLink = {
          id: Date.now(),
          title: title,
          url: url
        };

        this.app.state.bookmarks.push(newLink);
        this.app.saveState();
        this.app.showToast(`Saved bookmark "${title}"`, 'success');

        form.reset();
        this.renderBookmarks();
      });
    },

    renderBookmarks() {
      const container = document.getElementById('bookmarks-list-container');
      const bookmarks = this.app.state.bookmarks;

      if (bookmarks.length === 0) {
        container.innerHTML = `<div class="empty-state" style="font-size:0.75rem;">No bookmarks saved.</div>`;
        return;
      }

      let html = '';
      bookmarks.forEach(b => {
        html += `
          <div class="mini-agenda-item" style="margin-top: 8px;">
            <i data-lucide="link" style="width:12px;height:12px;color:var(--primary);"></i>
            <a href="${b.url}" target="_blank" class="mini-agenda-title" style="flex:1;">${b.title}</a>
            <button class="icon-btn btn-delete-bookmark" data-bookmark-id="${b.id}" style="width:20px;height:20px;">
              <i data-lucide="x" style="width:10px;height:10px;"></i>
            </button>
          </div>
        `;
      });

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('.btn-delete-bookmark').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-bookmark-id'));
          const idx = this.app.state.bookmarks.findIndex(b => b.id === id);
          if (idx !== -1) {
            this.app.state.bookmarks.splice(idx, 1);
            this.app.saveState();
            this.renderBookmarks();
          }
        });
      });
    },

    // --- Journal Logs ---
    setupJournalControls() {
      const form = document.getElementById('journal-form');
      const titleInput = document.getElementById('journal-title');
      const contentInput = document.getElementById('journal-content');
      const grat1 = document.getElementById('journal-grat-1');
      const grat2 = document.getElementById('journal-grat-2');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) return;

        const dateStr = new Date().toDateString();
        const newEntry = {
          date: dateStr,
          title: title,
          content: content,
          gratitude: [grat1.value.trim(), grat2.value.trim()],
          wins: []
        };

        const existingIndex = this.app.state.journalEntries.findIndex(je => je.date === dateStr);
        if (existingIndex !== -1) {
          this.app.state.journalEntries[existingIndex] = newEntry;
          this.app.showToast('Journal overwritten for today.', 'success');
        } else {
          this.app.state.journalEntries.unshift(newEntry);
          this.app.showToast('Journal logged successfully!', 'success');
        }

        form.reset();
        this.app.saveState();
        this.renderJournal();
      });
    },

    renderJournal() {
      const container = document.getElementById('journal-entries-list');
      const entries = this.app.state.journalEntries;

      if (entries.length === 0) {
        container.innerHTML = `<div class="empty-state" style="font-size:0.75rem;">Journal is empty. Write your reflections!</div>`;
        return;
      }

      let html = '';
      entries.forEach(entry => {
        html += `
          <div class="journal-item-card" style="margin-bottom: 8px;">
            <div class="journal-item-meta"><span>${entry.date}</span></div>
            <div class="journal-item-title">${entry.title}</div>
            <div class="journal-item-excerpt" style="font-size: 0.75rem; color: var(--text-muted);">${entry.content}</div>
          </div>
        `;
      });
      container.innerHTML = html;
    },

    // --- Vision Board Creator ---
    setupVisionControls() {
      const btn = document.getElementById('add-vision-btn');

      btn.addEventListener('click', () => {
        const title = prompt("Enter goal / vision title (e.g. Travel Paris, Dream Office):");
        if (!title) return;
        const url = prompt("Enter image URL link (e.g. unsplash web link):");
        if (!url) return;

        this.app.state.visionBoard.push({
          title: title,
          url: url
        });

        this.app.saveState();
        this.app.showToast('Goal visual added to vision board!', 'success');
        this.renderVisionBoard();
      });
    },

    renderVisionBoard() {
      const container = document.getElementById('vision-grid-container');
      const board = this.app.state.visionBoard;

      if (board.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">Vision board is empty. Add goals visual links!</div>`;
        return;
      }

      let html = '';
      board.forEach((item, idx) => {
        html += `
          <div class="vision-card">
            <img src="${item.url}" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'">
            <div class="vision-card-title">${item.title}</div>
            <button class="icon-btn btn-delete-vision" data-index="${idx}" style="position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.5); width:24px; height:24px; color:#fff;">
              <i data-lucide="x" style="width:10px;height:10px;"></i>
            </button>
          </div>
        `;
      });

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('.btn-delete-vision').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-index'));
          this.app.state.visionBoard.splice(idx, 1);
          this.app.saveState();
          this.renderVisionBoard();
        });
      });
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('notes', NotesModule);
    window.LifeOS.registerModule('journal', NotesModule);
  }
});
