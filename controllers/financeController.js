/* ==========================================================================
   LIFE OS - FINANCE CONTROLLER LAYER (controllers/financeController.js)
   UI Event Handling, Search Debouncing, Multi-Filter, Pagination & Modals
   ========================================================================== */

window.LifeOSFinanceController = {
  app: null,
  activeModule: 'finance-dashboard', // finance-dashboard, finance-ledger, finance-budgets, finance-hub
  
  // Ledger Pagination State
  currentPage: 1,
  pageSize: 10,
  searchQuery: '',
  filterCategory: 'all',
  filterAccount: 'all',
  filterDate: '',
  filterTags: '',
  filterMinAmt: 0,
  filterMaxAmt: Infinity,
  sortField: 'date',
  sortOrder: 'desc',

  init(app) {
    this.app = app || window.LifeOS;
    this.bindGlobalEvents();
  },

  bindGlobalEvents() {
    // 1. Live Search Debouncing
    const searchInput = document.getElementById('finance-search-tx');
    if (searchInput) {
      const debouncedSearch = window.LifeOSFinanceHelper 
        ? window.LifeOSFinanceHelper.debounce((val) => {
            this.searchQuery = val.toLowerCase().trim();
            this.currentPage = 1;
            this.renderLedgerView();
          }, 300)
        : (val) => {
            this.searchQuery = val.toLowerCase().trim();
            this.currentPage = 1;
            this.renderLedgerView();
          };

      searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
      });
    }

    // 2. Filter Controls
    const catSelect = document.getElementById('finance-filter-category-select');
    catSelect?.addEventListener('change', (e) => {
      this.filterCategory = e.target.value;
      this.currentPage = 1;
      this.renderLedgerView();
    });

    const accSelect = document.getElementById('finance-filter-account-select');
    accSelect?.addEventListener('change', (e) => {
      this.filterAccount = e.target.value;
      this.currentPage = 1;
      this.renderLedgerView();
    });

    const dateInput = document.getElementById('finance-filter-date-input');
    dateInput?.addEventListener('change', (e) => {
      this.filterDate = e.target.value;
      this.currentPage = 1;
      this.renderLedgerView();
    });

    const clearFiltersBtn = document.getElementById('finance-btn-clear-filters');
    clearFiltersBtn?.addEventListener('click', () => {
      this.resetFilters();
    });

    // 3. Toggle Filters Drawer
    const toggleFiltersBtn = document.getElementById('finance-btn-toggle-filters');
    toggleFiltersBtn?.addEventListener('click', () => {
      const panel = document.getElementById('finance-ledger-filters-panel');
      if (panel) {
        panel.style.display = (panel.style.display === 'none' || !panel.style.display) ? 'flex' : 'none';
      }
    });

    // 4. Export Buttons
    document.getElementById('btn-export-csv')?.addEventListener('click', () => this.exportCurrentLedger('csv'));
    document.getElementById('btn-export-excel')?.addEventListener('click', () => this.exportCurrentLedger('excel'));
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => this.exportCurrentLedger('pdf'));
  },

  resetFilters() {
    this.searchQuery = '';
    this.filterCategory = 'all';
    this.filterAccount = 'all';
    this.filterDate = '';
    this.filterTags = '';
    this.filterMinAmt = 0;
    this.filterMaxAmt = Infinity;
    this.currentPage = 1;

    const sInput = document.getElementById('finance-search-tx');
    if (sInput) sInput.value = '';

    const catSel = document.getElementById('finance-filter-category-select');
    if (catSel) catSel.value = 'all';

    const accSel = document.getElementById('finance-filter-account-select');
    if (accSel) accSel.value = 'all';

    const dateInp = document.getElementById('finance-filter-date-input');
    if (dateInp) dateInp.value = '';

    const minInp = document.getElementById('finance-filter-min-amount');
    if (minInp) minInp.value = '';

    const maxInp = document.getElementById('finance-filter-max-amount');
    if (maxInp) maxInp.value = '';

    this.renderLedgerView();
    if (window.LifeOS && window.LifeOS.showToast) {
      window.LifeOS.showToast('All transaction filters reset.', 'info');
    }
  },

  getFilteredTransactions() {
    const txs = (this.app && this.app.state && this.app.state.transactions) ? this.app.state.transactions : [];

    return txs.filter(t => {
      if (this.filterCategory !== 'all' && t.categoryId !== this.filterCategory) return false;
      if (this.filterAccount !== 'all' && t.account !== this.filterAccount) return false;
      if (this.filterDate && t.date !== this.filterDate) return false;
      if (this.searchQuery && !t.description.toLowerCase().includes(this.searchQuery)) return false;

      const amt = parseFloat(t.amount) || 0;
      if (amt < this.filterMinAmt || amt > this.filterMaxAmt) return false;

      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return this.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  },

  renderLedgerView() {
    const container = document.getElementById('finance-full-transactions-container');
    const badge = document.getElementById('finance-tx-count');
    if (!container) return;

    const filtered = this.getFilteredTransactions();
    if (badge) badge.textContent = `${filtered.length} Record${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.78rem; padding: 24px;">No matching transactions found. Try adjusting your filters.</div>`;
      return;
    }

    // Pagination Calculation
    const totalPages = Math.ceil(filtered.length / this.pageSize);
    if (this.currentPage > totalPages) this.currentPage = totalPages || 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const paginated = filtered.slice(startIndex, startIndex + this.pageSize);

    const currency = (this.app && this.app.state && this.app.state.financeSettings) ? (this.app.state.financeSettings.currencySymbol || '₹') : '₹';
    const categories = (this.app && this.app.state && this.app.state.categories) ? this.app.state.categories : {};
    const members = (this.app && this.app.state && this.app.state.members) ? this.app.state.members : [];

    let html = '';
    paginated.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      const isExpense = t.type === 'expense';
      const color = isExpense ? 'var(--red)' : 'var(--green)';
      const catObj = categories[t.categoryId] || { name: t.category || 'General', icon: 'fa-tag', color: '#a370f7' };
      const memberObj = members.find(m => m.id === t.memberId) || { avatar: '👤', name: 'User' };

      html += `
        <div class="transaction-item glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: ${catObj.color || '#a370f7'}22; color: ${catObj.color || '#a370f7'}; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
              <i class="fas ${catObj.icon || 'fa-tag'}"></i>
            </div>
            <div>
              <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-main);">${t.description}</div>
              <div style="font-size: 0.68rem; color: var(--text-muted); display: flex; gap: 8px; align-items: center; margin-top: 2px;">
                <span>${t.date || 'Today'}</span> • 
                <span>${memberObj.avatar} ${memberObj.name}</span> • 
                <span class="badge" style="font-size: 0.6rem; padding: 1px 6px; background: rgba(255,255,255,0.05);">${t.account || 'bank'}</span>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="text-align: right;">
              <div style="font-weight: 800; font-size: 0.88rem; color: ${color};">${isExpense ? '-' : '+'}${currency}${amt.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
              <div style="font-size: 0.62rem; color: var(--text-muted); font-family: monospace;">#${t.id ? (t.id.length > 10 ? t.id.substring(0, 8) + '...' : t.id) : 'tx'}</div>
            </div>
            <button onclick="window.deleteTransactionRecord('${t.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; font-size: 0.75rem;" title="Delete Record">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      `;
    });

    // Pagination Footer Controls
    html += `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--glass-border); font-size: 0.75rem;">
        <span style="color: var(--text-muted);">Showing ${startIndex + 1}–${Math.min(startIndex + this.pageSize, filtered.length)} of ${filtered.length} entries</span>
        <div style="display: flex; gap: 6px;">
          <button onclick="window.LifeOSFinanceController.changePage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''} class="btn-glass-subtle" style="padding: 4px 10px; font-size: 0.7rem; cursor: pointer;">Prev</button>
          <span style="padding: 4px 8px; font-weight: 700;">Page ${this.currentPage} of ${totalPages || 1}</span>
          <button onclick="window.LifeOSFinanceController.changePage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''} class="btn-glass-subtle" style="padding: 4px 10px; font-size: 0.7rem; cursor: pointer;">Next</button>
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  changePage(newPage) {
    const filtered = this.getFilteredTransactions();
    const totalPages = Math.ceil(filtered.length / this.pageSize);
    if (newPage >= 1 && newPage <= totalPages) {
      this.currentPage = newPage;
      this.renderLedgerView();
    }
  },

  exportCurrentLedger(format) {
    const filtered = this.getFilteredTransactions();
    const headers = ['ID', 'Date', 'Description', 'Type', 'Category', 'Account', 'Amount'];
    const rows = filtered.map(t => [t.id, t.date, t.description, t.type, t.category, t.account, t.amount]);

    if (format === 'csv') {
      window.LifeOSFinanceHelper.exportToCSV('Finance_Ledger_Report', rows, headers);
    } else if (format === 'excel') {
      window.LifeOSFinanceHelper.exportToExcel('Finance_Ledger_Workbook', rows, headers);
    } else if (format === 'pdf') {
      window.LifeOSFinanceHelper.exportToPDF('Finance Ledger Report', 'finance-ledger-view');
    }
  }
};
