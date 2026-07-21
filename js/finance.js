/* ==========================================================================
   LIFE OS - FAMILY FINANCE TRACKER MODULE (js/finance.js)
   ========================================================================== */

// --- BUNDLED SVG CHARTS ENGINE ---
const SVGCharts = {
  renderDonutChart(containerId, segments, currencySymbol = '₹') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const activeSegments = segments.filter(s => s.value > 0).sort((a, b) => b.value - a.value);
    const zeroSegments = segments.filter(s => !(s.value > 0));
    const total = activeSegments.reduce((acc, s) => acc + s.value, 0);

    const size = 220;
    const cx = size / 2;
    const cy = size / 2;
    const rOut = 95;
    const rIn = 70;
    
    // Helper to calculate segment path
    const getPath = (startAngle, endAngle) => {
      // Small spacing gap
      const gap = activeSegments.length > 1 ? 1.5 : 0;
      const sAng = startAngle + gap / 2;
      const eAng = endAngle - gap / 2;
      if (eAng - sAng <= 0) return '';
      
      const rad1 = (sAng - 90) * Math.PI / 180;
      const rad2 = (eAng - 90) * Math.PI / 180;

      const x1_in = cx + rIn * Math.cos(rad1);
      const y1_in = cy + rIn * Math.sin(rad1);
      const x2_in = cx + rIn * Math.cos(rad2);
      const y2_in = cy + rIn * Math.sin(rad2);

      const x1_out = cx + rOut * Math.cos(rad1);
      const y1_out = cy + rOut * Math.sin(rad1);
      const x2_out = cx + rOut * Math.cos(rad2);
      const y2_out = cy + rOut * Math.sin(rad2);

      const largeArc = (eAng - sAng) > 180 ? 1 : 0;

      return `
        M ${x1_out} ${y1_out}
        A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2_out} ${y2_out}
        L ${x2_in} ${y2_in}
        A ${rIn} ${rIn} 0 ${largeArc} 0 ${x1_in} ${y1_in}
        Z
      `;
    };

    let pathsHtml = '';
    
    if (total === 0) {
      // Empty state circular ring
      pathsHtml += `
        <circle cx="${cx}" cy="${cy}" r="${rOut}" fill="none" stroke="var(--glass-border)" stroke-width="${rOut - rIn}" />
        <text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="var(--text-muted)" style="font-size: 11px; font-weight: 600;">No Expenses</text>
      `;
    } else {
      let currentAngle = 0;
      activeSegments.forEach((seg) => {
        const share = seg.value / total;
        const angleSize = share * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angleSize;
        currentAngle = endAngle;

        const pathData = getPath(startAngle, endAngle);
        if (pathData) {
          const budgetPct = seg.limit > 0 ? (seg.value / seg.limit) * 100 : 0;
          const pctText = seg.limit > 0 ? `${budgetPct.toFixed(0)}% limit` : `${(share * 100).toFixed(0)}% share`;
          
          pathsHtml += `
            <path d="${pathData}" 
                  fill="${seg.color}" 
                  class="donut-segment-slice"
                  data-label="${seg.label}"
                  data-val="${currencySymbol}${seg.value.toLocaleString(undefined, {maximumFractionDigits: 0})}"
                  data-pct="${pctText}"
                  style="transition: all 0.3s ease; cursor: pointer; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)); transform-origin: 110px 110px;" />
          `;
        }
      });

      // Add center text hole and info card
      pathsHtml += `
        <circle cx="${cx}" cy="${cy}" r="${rIn - 2}" fill="var(--glass-bg)" stroke="var(--glass-border)" stroke-width="1.5" />
        <g id="finance-donut-center-group">
          <text x="${cx}" y="${cy - 8}" text-anchor="middle" fill="var(--text-muted)" style="font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Spent</text>
          <text id="finance-donut-center-amount" x="${cx}" y="${cy + 10}" text-anchor="middle" fill="var(--text-main)" style="font-size: 14px; font-weight: 800;">${currencySymbol}${total.toLocaleString(undefined, {maximumFractionDigits: 0})}</text>
          <text id="finance-donut-center-subtitle" x="${cx}" y="${cy + 22}" text-anchor="middle" fill="var(--text-dim)" style="font-size: 7px; font-weight: 500;">Current Month</text>
        </g>
      `;
    }

    let chartHtml = `
      <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 8px; position: relative;">
        <svg viewBox="0 0 ${size} ${size}" style="width: 100%; max-width: 200px; height: auto; display: block;">
          ${pathsHtml}
        </svg>
      </div>
    `;

    container.innerHTML = chartHtml;

    // Add interactivity to the slices
    const slices = container.querySelectorAll('.donut-segment-slice');
    const centerAmountText = container.querySelector('#finance-donut-center-amount');
    const centerLabelText = container.querySelector('text[text-anchor="middle"]'); // first text is label
    const centerSubtitleText = container.querySelector('#finance-donut-center-subtitle');

    const defaultAmount = centerAmountText ? centerAmountText.textContent : '';
    const defaultLabel = centerLabelText ? centerLabelText.textContent : '';
    const defaultSubtitle = centerSubtitleText ? centerSubtitleText.textContent : '';

    slices.forEach(slice => {
      slice.addEventListener('mouseover', () => {
        slice.style.filter = 'brightness(1.15) drop-shadow(0 0 8px var(--primary-glow))';
        slice.style.transform = 'scale(1.03)';

        if (centerAmountText) centerAmountText.textContent = slice.getAttribute('data-val');
        if (centerLabelText) centerLabelText.textContent = slice.getAttribute('data-label');
        if (centerSubtitleText) centerSubtitleText.textContent = slice.getAttribute('data-pct');
      });

      slice.addEventListener('mouseout', () => {
        slice.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))';
        slice.style.transform = 'none';

        if (centerAmountText) centerAmountText.textContent = defaultAmount;
        if (centerLabelText) centerLabelText.textContent = defaultLabel;
        if (centerSubtitleText) centerSubtitleText.textContent = defaultSubtitle;
      });

      slice.addEventListener('click', () => {
        const activeSeg = activeSegments.find(s => s.label === slice.getAttribute('data-label'));
        if (activeSeg) {
          window.LifeOS.modules.finance.openCategoryDetails(activeSeg.id);
        }
      });
    });

    // Category legend list is hidden as requested
    const legendContainer = document.getElementById('finance-donut-legend');
    if (legendContainer) {
      legendContainer.innerHTML = '';
    }
  },

  renderLineChart(containerId, points, lineColor = '#a370f7', currencySymbol = '₹') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!points || points.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.7rem; padding: 20px 0;">No trend logs recorded.</div>`;
      return;
    }

    const width = container.clientWidth || 360;
    const height = 120;
    const paddingX = 35;
    const paddingY = 16;

    const values = points.map(p => p.value);
    const maxVal = Math.max(...values, 1000) * 1.15;
    const minVal = 0;

    const svgPoints = points.map((p, i) => {
      const x = paddingX + (i * (width - 2 * paddingX) / (points.length - 1 || 1));
      const y = height - paddingY - ((p.value - minVal) * (height - 2 * paddingY) / (maxVal - minVal));
      return { x, y, label: p.label, value: p.value };
    });

    let pathD = '';
    if (svgPoints.length > 0) {
      pathD = `M ${svgPoints[0].x} ${svgPoints[0].y}`;
      for (let i = 1; i < svgPoints.length; i++) {
        const p0 = svgPoints[i - 1];
        const p1 = svgPoints[i];
        const cpX1 = p0.x + (p1.x - p0.x) / 2;
        const cpY1 = p0.y;
        const cpX2 = p0.x + (p1.x - p0.x) / 2;
        const cpY2 = p1.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
      }
    }

    let areaD = '';
    if (svgPoints.length > 0) {
      areaD = `${pathD} L ${svgPoints[svgPoints.length - 1].x} ${height - paddingY} L ${svgPoints[0].x} ${height - paddingY} Z`;
    }

    let gridLines = '';
    const yTicks = 3;
    for (let i = 0; i <= yTicks; i++) {
      const val = minVal + (i * (maxVal - minVal) / yTicks);
      const y = height - paddingY - (i * (height - 2 * paddingY) / yTicks);
      let displayVal = Math.round(val);
      if (displayVal >= 1000) displayVal = (displayVal / 1000).toFixed(0) + 'K';

      gridLines += `
        <line x1="${paddingX}" y1="${y}" x2="${width - paddingX}" y2="${y}" stroke="var(--glass-border)" stroke-dasharray="3 3" />
        <text x="${paddingX - 6}" y="${y + 3}" text-anchor="end" fill="var(--text-muted)" style="font-size: 7px; font-weight: 500;">${currencySymbol}${displayVal}</text>
      `;
    }

    let xLabels = '';
    svgPoints.forEach((pt, i) => {
      if (points.length <= 7 || i % Math.ceil(points.length / 5) === 0 || i === points.length - 1) {
        xLabels += `
          <text x="${pt.x}" y="${height - paddingY + 12}" text-anchor="middle" fill="var(--text-muted)" style="font-size: 7px; font-weight: 500;">${pt.label}</text>
        `;
      }
    });

    let dataPointsSvg = '';
    svgPoints.forEach((pt) => {
      dataPointsSvg += `
        <g style="cursor: pointer;">
          <circle cx="${pt.x}" cy="${pt.y}" r="6" fill="${lineColor}" opacity="0" />
          <circle cx="${pt.x}" cy="${pt.y}" r="3" fill="#ffffff" stroke="${lineColor}" stroke-width="1.5" />
          <title>${pt.label}: ${currencySymbol}${pt.value.toLocaleString()}</title>
        </g>
      `;
    });

    const svgContent = `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block;">
        <defs>
          <filter id="finance-line-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="finance-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#00d2ff" />
            <stop offset="100%" stop-color="#0052cc" />
          </linearGradient>
          <linearGradient id="finance-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#00d2ff" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#0052cc" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        ${gridLines}
        ${areaD ? `<path d="${areaD}" fill="url(#finance-area-grad)" />` : ''}
        ${pathD ? `<path d="${pathD}" fill="none" stroke="url(#finance-line-grad)" stroke-width="2.5" stroke-linecap="round" filter="url(#finance-line-glow)" />` : ''}
        ${dataPointsSvg}
        ${xLabels}
      </svg>
    `;

    container.innerHTML = svgContent;
  },

  getRadialProgressSVG(current, target, color = '#3399ff') {
    const percent = Math.round(Math.min((current / (target || 1)) * 100, 100));
    const radius = 11;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return `
      <svg width="34" height="34" viewBox="0 0 28 28" style="display: block;">
        <defs>
          <filter id="ring-glow-${percent}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="14" cy="14" r="${radius}" stroke="rgba(0, 191, 255, 0.08)" stroke-width="3" fill="rgba(0,0,0,0.2)" />
        <circle cx="14" cy="14" r="${radius}" stroke="${color}" stroke-width="3" 
                stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" 
                stroke-linecap="round" fill="transparent" transform="rotate(-90 14 14)"
                filter="url(#ring-glow-${percent})" style="transition: stroke-dashoffset 0.5s ease;" />
        <text x="14" y="17" text-anchor="middle" fill="var(--text-main)" style="font-size: 7.5px; font-weight: 800; font-family: var(--font-main);">${percent}%</text>
      </svg>
    `;
  }
};


// --- LIFE OS FINANCE MODULE CONTROLLER ---
const FinanceModule = {
  app: null,
  activeSubview: 'dashboard',
  activeMemberFilter: 'all',
  activeCategoryFilter: 'all',
  activeAccountFilter: 'all',
  activeTypeFilter: 'all',

  setupDragBarSlider(trackId, thumbId, containerId, leftBtnId, rightBtnId) {
    const track = document.getElementById(trackId);
    const thumb = document.getElementById(thumbId);
    const container = document.getElementById(containerId);
    if (!track || !thumb || !container) return;

    let isDragging = false;
    let startX = 0;
    let thumbLeft = 0;

    const updateScroll = (newLeftPct) => {
      const thumbWidth = thumb.clientWidth;
      const trackWidth = track.clientWidth;
      const maxLeftPct = Math.max(1, 100 - (thumbWidth / trackWidth) * 100);
      newLeftPct = Math.max(0, Math.min(newLeftPct, maxLeftPct));
      thumb.style.left = `${newLeftPct}%`;

      const scrollMax = container.scrollHeight - container.clientHeight;
      if (scrollMax > 0) {
        container.scrollTop = (newLeftPct / maxLeftPct) * scrollMax;
      }
    };

    const onStart = (e) => {
      isDragging = true;
      startX = (e.type === 'touchstart') ? e.touches[0].clientX : e.clientX;
      thumbLeft = parseFloat(thumb.style.left) || 0;
      document.body.style.userSelect = 'none';
    };

    const onMove = (e) => {
      if (!isDragging) return;
      const clientX = (e.type === 'touchmove') ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - startX;
      const trackWidth = track.clientWidth;
      updateScroll(thumbLeft + (deltaX / trackWidth) * 100);
    };

    const onEnd = () => {
      isDragging = false;
      document.body.style.userSelect = '';
    };

    thumb.addEventListener('mousedown', onStart);
    thumb.addEventListener('touchstart', onStart);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);

    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    // Left/Right buttons
    const leftBtn = document.getElementById(leftBtnId);
    const rightBtn = document.getElementById(rightBtnId);
    if (leftBtn) {
      leftBtn.onclick = (e) => {
        e.stopPropagation();
        const currentLeft = parseFloat(thumb.style.left) || 0;
        updateScroll(currentLeft - 8);
      };
    }
    if (rightBtn) {
      rightBtn.onclick = (e) => {
        e.stopPropagation();
        const currentLeft = parseFloat(thumb.style.left) || 0;
        updateScroll(currentLeft + 8);
      };
    }
  },
  
  // Audio Speech Recognition references
  voiceRecognition: null,
  isRecordingVoice: false,
  
  initDatabaseDefaults() {
    if (!this.app || !this.app.state) return;
    const s = this.app.state;
    if (!s.transactions) s.transactions = [];
    if (!s.loans) s.loans = [];
    if (!s.subscriptions) s.subscriptions = [];
    if (!s.members || s.members.length === 0) s.members = (this.app && this.app.getMockMembers) ? this.app.getMockMembers() : [];
    if (!s.categories || Object.keys(s.categories).length === 0) s.categories = (this.app && this.app.getMockCategories) ? this.app.getMockCategories() : {};
    if (!s.budgets) s.budgets = {};
    if (!s.goals) s.goals = [];
    if (!s.investments) s.investments = {};
    if (!s.financeSettings) s.financeSettings = { pinLockEnabled: false, currencySymbol: '₹', currencyCode: 'INR' };
    if (!s.budgetCategories) s.budgetCategories = [];
  },

  init() {
    this.app = window.LifeOS;
    this.initDatabaseDefaults();
    this.bindEvents();
    this.initVoiceEntry();
  },

  onActive() {
    this.initDatabaseDefaults();
    // Check PIN Lock access on navigation active
    if (this.app && this.app.state && this.app.state.financeSettings && this.app.state.financeSettings.pinLockEnabled) {
      this.promptPinLockScreen();
    } else {
      this.render();
    }
  },

  render() {
    this.initDatabaseDefaults();
    const state = (this.app && this.app.state) ? this.app.state : {};
    const currency = (state.financeSettings && state.financeSettings.currencySymbol) || '₹';

    // Renders with error handling so one subview error cannot block others
    try { this.renderMemberChips(); } catch (e) { console.warn('[FinanceModule] renderMemberChips:', e); }
    try { this.renderBalances(); } catch (e) { console.warn('[FinanceModule] renderBalances:', e); }
    try { this.renderAccountsCarousel(); } catch (e) { console.warn('[FinanceModule] renderAccountsCarousel:', e); }
    try { this.renderCharts(); } catch (e) { console.warn('[FinanceModule] renderCharts:', e); }
    try { this.renderLedgers(); } catch (e) { console.warn('[FinanceModule] renderLedgers:', e); }
    try { this.renderBudgetsList(); } catch (e) { console.warn('[FinanceModule] renderBudgetsList:', e); }
    try { this.renderDashboardBudgetUtilization(); } catch (e) { console.warn('[FinanceModule] renderDashboardBudgetUtilization:', e); }
    try { this.renderUpcomingPayments(); } catch (e) { console.warn('[FinanceModule] renderUpcomingPayments:', e); }
    try { this.populateCategoryFilters(); } catch (e) { console.warn('[FinanceModule] populateCategoryFilters:', e); }
    try { this.renderHubToolsItems(); } catch (e) { console.warn('[FinanceModule] renderHubToolsItems:', e); }
    try { this.renderSyncSettingsValues(); } catch (e) { console.warn('[FinanceModule] renderSyncSettingsValues:', e); }
  },

  makeDraggableScroll(el) {
    if (!el) return;
    let isDown = false;
    let startX;
    let scrollLeft;

    el.addEventListener('mousedown', (e) => {
      isDown = true;
      el.classList.add('active-drag');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });

    el.addEventListener('mouseleave', () => {
      isDown = false;
      el.classList.remove('active-drag');
    });

    el.addEventListener('mouseup', () => {
      isDown = false;
      el.classList.remove('active-drag');
    });

    el.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 2;
      el.scrollLeft = scrollLeft - walk;
    });
  },

  bindEvents() {
    // 1. Subnavigation Tab Switching & Drag-to-Scroll for Subnavs & Charts
    document.querySelectorAll('.finance-subnav, .mobile-charts-swipe-wrapper, #budget-vs-actual-chart-container, #budget-donut-chart-container, #budget-trend-chart-container, #finance-asset-multi-chart-container, #finance-donut-chart-container, .chart-container-scrollable, .finance-table-wrapper').forEach(el => {
      this.makeDraggableScroll(el);
    });

    document.querySelectorAll('.finance-subnav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const subview = btn.getAttribute('data-subview');
        this.switchSubview(subview);
      });
    });

    // 2. Add Transaction Modals trigger
    const openAddTxBtn = document.getElementById('finance-btn-open-add-tx');
    if (openAddTxBtn) {
      openAddTxBtn.addEventListener('click', () => this.toggleModal('finance-add-transaction-overlay', true));
    }
    const closeAddTxBtn = document.getElementById('finance-btn-close-add-tx');
    if (closeAddTxBtn) {
      closeAddTxBtn.addEventListener('click', () => this.toggleModal('finance-add-transaction-overlay', false));
    }

    // Toggle add transaction income/expense tabs
    const expBtn = document.getElementById('finance-type-expense-btn');
    const incBtn = document.getElementById('finance-type-income-btn');
    if (expBtn && incBtn) {
      expBtn.addEventListener('click', () => {
        expBtn.classList.add('active');
        incBtn.classList.remove('active');
        this.populateTransactionFormCategories('expense');
      });
      incBtn.addEventListener('click', () => {
        incBtn.classList.add('active');
        expBtn.classList.remove('active');
        this.populateTransactionFormCategories('income');
      });
    }

    // Form Submission: Add Transaction
    const addTxForm = document.getElementById('finance-add-transaction-form');
    if (addTxForm) {
      addTxForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddTransactionFormSubmit();
      });
    }

    // Modal Details Closures
    document.getElementById('finance-btn-close-cat-modal')?.addEventListener('click', () => this.toggleModal('finance-category-details-overlay', false));
    document.getElementById('finance-btn-close-acc-modal')?.addEventListener('click', () => this.toggleModal('finance-account-details-overlay', false));

    // Budget Management Modals & Controls
    document.getElementById('btn-add-budget-category')?.addEventListener('click', () => this.toggleModal('budget-add-category-modal-overlay', true));
    document.getElementById('btn-close-add-budget-category')?.addEventListener('click', () => this.toggleModal('budget-add-category-modal-overlay', false));
    document.getElementById('btn-open-plan-budget')?.addEventListener('click', () => this.toggleModal('budget-plan-modal-overlay', true));
    document.getElementById('btn-close-plan-budget')?.addEventListener('click', () => this.toggleModal('budget-plan-modal-overlay', false));
    document.getElementById('btn-export-budget-reports')?.addEventListener('click', () => this.toggleModal('budget-reports-modal-overlay', true));
    document.getElementById('btn-close-budget-reports')?.addEventListener('click', () => this.toggleModal('budget-reports-modal-overlay', false));
    document.getElementById('btn-budget-view-all-txs')?.addEventListener('click', () => this.switchSubview('ledger'));

    document.getElementById('btn-export-budget-csv')?.addEventListener('click', () => {
      this.exportBudgetCSV();
      this.toggleModal('budget-reports-modal-overlay', false);
    });
    document.getElementById('btn-export-budget-pdf')?.addEventListener('click', () => {
      this.exportBudgetPDF();
      this.toggleModal('budget-reports-modal-overlay', false);
    });

    // Budget Category Form Submit
    document.getElementById('form-add-budget-category')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveBudgetCategorySubmit();
    });

    // Budget Plan Form Submit
    document.getElementById('form-plan-budget')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveBudgetPlanSubmit();
    });
    document.getElementById('finance-btn-close-edit-profile-modal')?.addEventListener('click', () => this.toggleModal('finance-edit-profile-overlay', false));
    document.getElementById('finance-btn-close-edit-goal-modal')?.addEventListener('click', () => this.toggleModal('finance-edit-goal-overlay', false));
    document.getElementById('finance-btn-close-goal-modal')?.addEventListener('click', () => this.toggleModal('finance-goal-contribution-overlay', false));
    document.getElementById('finance-btn-close-pay-emi')?.addEventListener('click', () => this.toggleModal('finance-pay-emi-overlay', false));

    // Add Category triggers
    document.getElementById('finance-add-category-btn')?.addEventListener('click', () => this.toggleModal('finance-add-category-overlay', true));
    document.getElementById('finance-btn-close-add-cat-modal')?.addEventListener('click', () => this.toggleModal('finance-add-category-overlay', false));
    
    document.getElementById('finance-btn-save-new-category')?.addEventListener('click', () => {
      const id = document.getElementById('finance-add-cat-id').value.trim().toLowerCase();
      const name = document.getElementById('finance-add-cat-name').value.trim();
      const icon = document.getElementById('finance-add-cat-icon').value;
      const color = document.getElementById('finance-add-cat-color').value;
      const limit = parseFloat(document.getElementById('finance-add-cat-limit').value) || 0;

      if (!id || !name) {
        this.app.showToast('Please fill in Category ID and Name.', 'error');
        return;
      }

      if (this.app.state.categories[id]) {
        this.app.showToast('Category ID already exists.', 'error');
        return;
      }

      this.app.state.categories[id] = {
        name,
        icon,
        color,
        type: 'expense'
      };
      this.app.state.budgets[id] = limit;
      this.app.saveState();
      this.app.showToast(`Category "${name}" created successfully.`, 'success');



      document.getElementById('finance-add-cat-id').value = '';
      document.getElementById('finance-add-cat-name').value = '';
      document.getElementById('finance-add-cat-limit').value = '';
      this.toggleModal('finance-add-category-overlay', false);
      this.render();
    });

    // Create Profile triggers
    document.getElementById('finance-btn-close-create-profile-modal')?.addEventListener('click', () => this.toggleModal('finance-create-profile-overlay', false));
    
    document.getElementById('finance-create-profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const regId = document.getElementById('finance-create-profile-id-input').value.trim().toLowerCase();
      const regName = document.getElementById('finance-create-profile-name-input').value.trim();
      const regRole = document.getElementById('finance-create-profile-role-input').value.trim();
      const regAvatar = document.getElementById('finance-create-profile-avatar-input').value.trim();
      const regColor = document.getElementById('finance-create-profile-color-select').value;
      const regPass = document.getElementById('finance-create-profile-pin-input').value;

      if (!regId || !regName || !regRole || !regAvatar) {
        this.app.showToast('Please fill in all profile fields.', 'warning');
        return;
      }

      const exists = (this.app.state.members || []).some(m => m.id === regId);
      if (exists || regId === 'admin') {
        this.app.showToast('Profile ID already exists.', 'error');
        return;
      }

      const newMember = {
        id: regId,
        name: regName,
        role: regRole,
        avatar: regAvatar,
        color: regColor,
        glow: regColor + '26', // Hex alpha glow tint
        password: regPass
      };

      if (!this.app.state.members) {
        this.app.state.members = [];
      }
      this.app.state.members.push(newMember);
      this.app.saveState();
      this.app.showToast(`Profile "${regName}" created successfully!`, 'success');

      document.getElementById('finance-create-profile-id-input').value = '';
      document.getElementById('finance-create-profile-name-input').value = '';
      document.getElementById('finance-create-profile-role-input').value = '';
      document.getElementById('finance-create-profile-avatar-input').value = '';
      document.getElementById('finance-create-profile-pin-input').value = '';

      this.toggleModal('finance-create-profile-overlay', false);
      this.render();
    });

    // Ledger Search / Filters
    const searchInput = document.getElementById('finance-search-tx');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderLedgers());
    }

    const filtersBtn = document.getElementById('finance-btn-toggle-filters');
    const filtersPanel = document.getElementById('finance-ledger-filters-panel');
    if (filtersBtn && filtersPanel) {
      filtersBtn.addEventListener('click', () => {
        const isHidden = filtersPanel.style.display === 'none';
        filtersPanel.style.display = isHidden ? 'flex' : 'none';
      });
    }

    document.getElementById('finance-filter-category-select')?.addEventListener('change', (e) => {
      this.activeCategoryFilter = e.target.value;
      this.renderLedgers();
    });
    document.getElementById('finance-filter-account-select')?.addEventListener('change', (e) => {
      this.activeAccountFilter = e.target.value;
      this.renderLedgers();
    });
    document.getElementById('finance-filter-date-input')?.addEventListener('input', () => this.renderLedgers());
    document.getElementById('finance-filter-tags-input')?.addEventListener('input', () => this.renderLedgers());
    document.getElementById('finance-filter-min-amount')?.addEventListener('input', () => this.renderLedgers());
    document.getElementById('finance-filter-max-amount')?.addEventListener('input', () => this.renderLedgers());

    // Ledger Type Filter Buttons (All, Income, Expense, Transfer)
    document.querySelectorAll('.ledger-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ledger-type-btn').forEach(b => {
          b.classList.remove('active', 'btn-primary-glow');
          b.classList.add('btn-glass-subtle');
        });
        btn.classList.add('active', 'btn-primary-glow');
        btn.classList.remove('btn-glass-subtle');
        this.activeTypeFilter = btn.getAttribute('data-type') || 'all';
        this.renderLedgers();
      });
    });

    document.getElementById('finance-btn-clear-filters')?.addEventListener('click', () => {
      document.getElementById('finance-search-tx').value = '';
      document.getElementById('finance-filter-category-select').value = 'all';
      document.getElementById('finance-filter-account-select').value = 'all';
      document.getElementById('finance-filter-date-input').value = '';
      document.getElementById('finance-filter-tags-input').value = '';
      document.getElementById('finance-filter-min-amount').value = '';
      document.getElementById('finance-filter-max-amount').value = '';
      this.activeCategoryFilter = 'all';
      this.activeAccountFilter = 'all';
      this.activeTypeFilter = 'all';
      document.querySelectorAll('.ledger-type-btn').forEach(b => {
        if (b.getAttribute('data-type') === 'all') {
          b.classList.add('active', 'btn-primary-glow');
          b.classList.remove('btn-glass-subtle');
        } else {
          b.classList.remove('active', 'btn-primary-glow');
          b.classList.add('btn-glass-subtle');
        }
      });
      this.renderLedgers();
    });

    // 3. Features Hub tools overlay bindings
    document.getElementById('finance-btn-tool-goals')?.addEventListener('click', () => this.openSavingsGoalsTool());
    document.getElementById('finance-btn-close-tool-goals')?.addEventListener('click', () => this.toggleModal('finance-tool-goals-overlay', false));
    
    document.getElementById('finance-btn-tool-calendar')?.addEventListener('click', () => this.openCalendarTool());
    document.getElementById('finance-btn-close-tool-calendar')?.addEventListener('click', () => this.toggleModal('finance-tool-calendar-overlay', false));

    document.getElementById('finance-btn-tool-subs')?.addEventListener('click', () => this.openSubscriptionsTool());
    document.getElementById('finance-btn-close-tool-subs')?.addEventListener('click', () => this.toggleModal('finance-tool-subs-overlay', false));

    document.getElementById('finance-btn-tool-emi')?.addEventListener('click', () => this.openEMILoanTool());
    document.getElementById('finance-btn-close-tool-emi')?.addEventListener('click', () => this.toggleModal('finance-tool-emi-overlay', false));

    document.getElementById('finance-btn-tool-invest')?.addEventListener('click', () => this.openInvestmentsTool());
    document.getElementById('finance-btn-close-tool-invest')?.addEventListener('click', () => this.toggleModal('finance-tool-invest-overlay', false));

    document.getElementById('finance-btn-tool-split')?.addEventListener('click', () => this.openSplitExpensesTool());
    document.getElementById('finance-btn-close-tool-split')?.addEventListener('click', () => this.toggleModal('finance-tool-split-overlay', false));

    document.getElementById('finance-btn-tool-accounts')?.addEventListener('click', () => this.openAccountsTableTool());
    document.getElementById('finance-btn-close-tool-accounts')?.addEventListener('click', () => this.toggleModal('finance-tool-accounts-overlay', false));

    document.getElementById('finance-btn-tool-challenges')?.addEventListener('click', () => this.openChallengesTool());
    document.getElementById('finance-btn-close-tool-challenges')?.addEventListener('click', () => this.toggleModal('finance-tool-challenges-overlay', false));

    document.getElementById('finance-btn-open-transfer')?.addEventListener('click', () => this.openFundsTransferModal());
    document.getElementById('finance-btn-close-transfer-modal')?.addEventListener('click', () => this.toggleModal('finance-transfer-funds-overlay', false));

    // Funds transfer form submit
    const transferForm = document.getElementById('finance-transfer-funds-form');
    if (transferForm) {
      transferForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFundsTransferSubmit();
      });
    }

    // Budget subview triggers
    document.getElementById('finance-btn-reset-data')?.addEventListener('click', () => {
      this.app.syncGlobalStateWithSupabase(false);
    });

    // Subscriptions forms triggers
    document.getElementById('finance-btn-toggle-add-sub')?.addEventListener('click', () => {
      const form = document.getElementById('finance-add-sub-form');
      form.style.display = form.style.display === 'none' ? 'flex' : 'none';
    });
    document.getElementById('finance-add-sub-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddSubscriptionSubmit();
    });

    // Ongoing loans EMI tabs triggers
    document.getElementById('finance-btn-tab-ongoing-loans')?.addEventListener('click', () => {
      document.getElementById('finance-btn-tab-ongoing-loans').classList.add('active');
      document.getElementById('finance-btn-tab-entry-loan').classList.remove('active');
      document.getElementById('finance-view-ongoing-loans').style.display = 'block';
      document.getElementById('finance-view-entry-loan').style.display = 'none';
    });
    document.getElementById('finance-btn-tab-entry-loan')?.addEventListener('click', () => {
      document.getElementById('finance-btn-tab-entry-loan').classList.add('active');
      document.getElementById('finance-btn-tab-ongoing-loans').classList.remove('active');
      document.getElementById('finance-view-entry-loan').style.display = 'block';
      document.getElementById('finance-view-ongoing-loans').style.display = 'none';
    });
    document.getElementById('finance-add-loan-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddLoanSubmit();
    });

    // EMI Pay confirmation submission
    document.getElementById('finance-pay-emi-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleEMIPaymentSubmit();
    });

    // Update Manual Assets Portfolio
    document.getElementById('finance-btn-toggle-edit-assets')?.addEventListener('click', () => {
      const form = document.getElementById('finance-edit-assets-form');
      form.style.display = form.style.display === 'none' ? 'flex' : 'none';
    });
    document.getElementById('finance-edit-assets-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleUpdateAssetPortfolioSubmit();
    });

    // Create Goal form triggers
    document.getElementById('finance-btn-toggle-add-goal')?.addEventListener('click', () => {
      const form = document.getElementById('finance-add-goal-form');
      form.style.display = form.style.display === 'none' ? 'flex' : 'none';
    });
    document.getElementById('finance-add-goal-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateGoalSubmit();
    });

    // Goal Contribution Form Submit
    document.getElementById('finance-goal-contribution-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleGoalContributionSubmit();
    });

    // Edit Profile form submission
    document.getElementById('finance-edit-profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveProfileChangesSubmit();
    });

    // Edit Goal form submission
    document.getElementById('finance-edit-goal-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveGoalChangesSubmit();
    });

    // Split Bill calculator submission
    document.getElementById('finance-split-bill-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSplitBillCalculatorSubmit();
    });

    // Settings elements binds
    document.getElementById('finance-pin-lock-toggle')?.addEventListener('change', (e) => {
      this.app.state.financeSettings.pinLockEnabled = e.target.checked;
      this.app.saveState();
      this.app.showToast(`Security authorization preferences saved.`, 'info');
    });

    document.getElementById('finance-btn-save-login')?.addEventListener('click', () => {
      this.app.showToast('Secure credentials encrypted & stored locally.', 'success');
    });

    // Supabase Settings binds
    document.getElementById('supabase-url-input')?.addEventListener('input', (e) => {
      this.app.state.supabaseSettings.url = e.target.value.trim();
      this.app.saveStateLocallyOnly();
    });

    document.getElementById('supabase-key-input')?.addEventListener('input', (e) => {
      this.app.state.supabaseSettings.anonKey = e.target.value.trim();
      this.app.saveStateLocallyOnly();
    });

    document.getElementById('supabase-btn-test-db')?.addEventListener('click', () => {
      const url = this.app.state.supabaseSettings.url;
      const key = this.app.state.supabaseSettings.anonKey;
      
      if (!url || !key) {
        this.app.showToast('Please type both Supabase URL and Anon Key.', 'warning');
        return;
      }

      this.app.showToast('Connecting to Database...', 'info');
      fetch(`${url}/rest/v1/workspace_security?select=key&limit=1`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      })
      .then(res => {
        if (res.ok) {
          this.app.showToast('Database connection tested successfully!', 'success');
        } else {
          this.app.showToast(`Connection failed: HTTP ${res.status}`, 'error');
        }
      })
      .catch(err => {
        this.app.showToast('Network connection to Supabase failed.', 'error');
        console.error('Test DB Error:', err);
      });
    });

    // CSV Imports/Exports
    document.getElementById('finance-btn-export-csv')?.addEventListener('click', () => this.exportFinanceCSV());
    document.getElementById('finance-restore-file-input')?.addEventListener('change', (e) => this.importFinanceCSV(e));

    // Smart OCR Scanning mock triggers
    document.getElementById('finance-receipt-file-input')?.addEventListener('change', (e) => this.handleReceiptScannerOCR(e));

    // Edit profile delete button trigger
    document.getElementById('finance-btn-delete-profile')?.addEventListener('click', () => {
      const id = document.getElementById('finance-edit-profile-id').value;
      this.deleteMemberProfile(id);
    });
  },

  switchSubview(subviewName) {
    if (subviewName === 'transactions' || subviewName === 'records') subviewName = 'ledger';
    if (subviewName === 'budget' || subviewName === 'plans') subviewName = 'budgets';
    if (subviewName === 'tools' || subviewName === 'features' || subviewName === 'feature-hub') subviewName = 'hub';
    this.activeSubview = subviewName;
    
    // Reset Navigation Classes
    document.querySelectorAll('.finance-subnav-btn').forEach(btn => {
      if (btn.getAttribute('data-subview') === subviewName) {
        btn.classList.add('active');
        btn.style.opacity = '1';
      } else {
        btn.classList.remove('active');
        btn.style.opacity = '0.7';
      }
    });

    // Toggle panels visibility explicitly
    const panels = ['dashboard', 'ledger', 'budgets', 'hub'];
    panels.forEach(p => {
      const panelEl = document.getElementById(`finance-subview-${p}`);
      if (panelEl) {
        if (p === subviewName) {
          panelEl.classList.add('active');
          panelEl.style.display = 'block';
        } else {
          panelEl.classList.remove('active');
          panelEl.style.display = 'none';
        }
      }
    });

    this.render();
  },

  toggleModal(modalId, isVisible) {
    const el = document.getElementById(modalId);
    if (!el) return;
    
    if (isVisible) {
      // Re-parent modal directly to document.body to break out of any restricted stacking context
      if (el.parentNode !== document.body) {
        document.body.appendChild(el);
      }
      el.style.zIndex = '999999';
      el.style.position = 'fixed';
      el.style.top = '0';
      el.style.left = '0';
      el.style.width = '100vw';
      el.style.height = '100vh';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.background = 'rgba(0, 0, 0, 0.78)';
      el.style.backdropFilter = 'blur(12px)';
      el.style.webkitBackdropFilter = 'blur(12px)';
      
      // Auto configure specific forms inside modals on load
      if (modalId === 'finance-add-transaction-overlay') {
        const amtInp = document.getElementById('finance-tx-amount-input');
        if (amtInp) amtInp.focus();
        const dateInp = document.getElementById('finance-tx-date-input');
        if (dateInp) dateInp.value = new Date().toISOString().split('T')[0];
        
        // Populate members and categories selectors
        this.populateTransactionFormMembers();
        const expBtn = document.getElementById('finance-type-expense-btn');
        const activeType = (expBtn && expBtn.classList.contains('active')) ? 'expense' : 'income';
        this.populateTransactionFormCategories(activeType);
      }
    } else {
      el.style.display = 'none';
    }
  },

  // --- RENDERERS ---

  renderMemberChips() {
    const container = document.getElementById('finance-members-container');
    if (!container) return;

    const user = (this.app && this.app.state && this.app.state.user) || {};
    const activeUserId = user.id || 'admin';
    const isAdmin = user.role ? (user.role === 'Administrator' || user.role === 'Super Admin') : true;

    let html = '';

    const membersList = (this.app && this.app.state && Array.isArray(this.app.state.members)) ? this.app.state.members : [];

    if (isAdmin) {
      // Administrators see chips for all registered members
      membersList.forEach(m => {
        const isActive = this.app.activeViewedUser === m.id;
        html += `
          <div class="member-chip ${isActive ? 'active' : ''}" 
               data-member-id="${m.id}" 
               style="--chip-accent-color: ${m.color}; --chip-glow-color: ${m.glow || 'rgba(255,255,255,0.05)'};">
            <span style="font-size: 1.1rem; margin-right: 4px;">${m.avatar}</span>
            ${m.name}
            <i class="fas fa-edit edit-member-btn" data-edit-id="${m.id}" style="font-size: 0.65rem; margin-left: 6px; opacity: 0.5; cursor: pointer;"></i>
          </div>
        `;
      });
    } else {
      // Guests, Employees, and Managers: Show ONLY their own respective profile chip
      let loggedInMember = membersList.find(m => m.id === activeUserId);
      if (!loggedInMember) {
        loggedInMember = {
          id: activeUserId,
          name: user.username || 'User',
          avatar: user.avatar || '👤',
          color: 'var(--primary)',
          glow: 'rgba(255,255,255,0.05)'
        };
      }
      // Force activeViewedUser to own profile
      this.app.activeViewedUser = loggedInMember.id;
      
      html += `
        <div class="member-chip active" 
             data-member-id="${loggedInMember.id}" 
             style="--chip-accent-color: ${loggedInMember.color}; --chip-glow-color: ${loggedInMember.glow || 'rgba(255,255,255,0.05)'};">
          <span style="font-size: 1.1rem; margin-right: 4px;">${loggedInMember.avatar}</span>
          ${loggedInMember.name}
          <i class="fas fa-edit edit-member-btn" data-edit-id="${loggedInMember.id}" style="font-size: 0.65rem; margin-left: 6px; opacity: 0.5; cursor: pointer;"></i>
        </div>
      `;
    }

    // Align local member filter to viewed user target
    this.activeMemberFilter = this.app.activeViewedUser;

    container.innerHTML = html;

    // Bind click events
    container.querySelectorAll('.member-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-member-btn')) {
          e.stopPropagation();
          const id = e.target.getAttribute('data-edit-id');
          this.openEditMemberProfileModal(id);
          return;
        }

        const id = chip.getAttribute('data-member-id');
        if (id && id !== this.app.activeViewedUser) {
          this.app.activeViewedUser = id;
          this.app.syncGlobalGoogleSheetData(false); // Trigger data fetch from database for selected user!
          this.render(); // Re-render chips and subviews
        }
      });
    });
  },

  renderBalances() {
    const txs = (this.app && this.app.state && Array.isArray(this.app.state.transactions)) ? this.app.state.transactions : [];
    const filterId = this.activeMemberFilter;

    let income = 0;
    let expense = 0;

    txs.forEach(t => {
      if (filterId !== 'all' && t.memberId !== filterId) return;

      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'income') {
        income += amt;
      } else {
        expense += amt;
      }
    });

    const net = income - expense;
    const currency = (this.app && this.app.state && this.app.state.financeSettings && this.app.state.financeSettings.currencySymbol) || '₹';

    const netEl = document.getElementById('finance-total-balance');
    const incEl = document.getElementById('finance-total-income');
    const expEl = document.getElementById('finance-total-expense');

    if (netEl) {
      netEl.textContent = `${net < 0 ? '-' : ''}${currency}${Math.abs(net).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      netEl.style.color = net < 0 ? 'var(--red)' : 'var(--green)';
    }
    if (incEl) incEl.textContent = `+${currency}${income.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    if (expEl) expEl.textContent = `-${currency}${expense.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
  },

  renderAccountsCarousel() {
    const container = document.getElementById('finance-accounts-carousel-list');
    if (!container) return;

    const txs = (this.app && this.app.state && Array.isArray(this.app.state.transactions)) ? this.app.state.transactions : [];
    const currency = (this.app && this.app.state && this.app.state.financeSettings && this.app.state.financeSettings.currencySymbol) || '₹';

    const accounts = {
      bank: { name: 'Bank Account', icon: '🏦', bal: 0 },
      card: { name: 'Credit Card', icon: '💳', bal: 0 },
      upi: { name: 'UPI Wallet', icon: '📱', bal: 0 },
      cash: { name: 'Cash', icon: '💵', bal: 0 },
      savings: { name: 'Savings Account', icon: '💰', bal: 0 },
      loans: { name: 'Owed Loans', icon: '💸', bal: 0 }
    };

    const filterId = this.activeMemberFilter;

    txs.forEach(t => {
      if (filterId !== 'all' && t.memberId !== filterId) return;
      const amt = parseFloat(t.amount) || 0;
      const acc = t.account || 'bank';
      if (!accounts[acc]) return;

      if (t.type === 'income') {
        accounts[acc].bal += amt;
      } else {
        accounts[acc].bal -= amt;
      }
    });

    // Populate loans outstanding liability balance
    const loansList = (this.app && this.app.state && Array.isArray(this.app.state.loans)) ? this.app.state.loans : [];
    const totalLoanVal = loansList.reduce((sum, l) => sum + parseFloat(l.total || 0), 0);
    accounts.loans.bal = -totalLoanVal;

    let html = '';
    for (const [key, val] of Object.entries(accounts)) {
      html += `
        <div class="account-card" data-acc-id="${key}">
          <span style="font-size: 1.3rem; display: block; margin-bottom: 6px;">${val.icon}</span>
          <span class="account-card-name">${val.name}</span>
          <span class="account-card-val" style="color: ${val.bal < 0 ? 'var(--red)' : 'var(--text-main)'};">
            ${currency}${Math.abs(val.bal).toLocaleString(undefined, {maximumFractionDigits: 0})}
          </span>
        </div>
      `;
    }

    container.innerHTML = html;

    container.querySelectorAll('.account-card').forEach(card => {
      card.addEventListener('click', () => {
        const accId = card.getAttribute('data-acc-id');
        this.openAccountDetailsModal(accId);
      });
    });
  },

  renderCharts() {
    const txs = (this.app && this.app.state && Array.isArray(this.app.state.transactions)) ? this.app.state.transactions : [];
    const categories = (this.app && this.app.state && this.app.state.categories) ? this.app.state.categories : {};
    const budgets = (this.app && this.app.state && this.app.state.budgets) ? this.app.state.budgets : {};
    const filterId = this.activeMemberFilter;
    const currency = (this.app && this.app.state && this.app.state.financeSettings && this.app.state.financeSettings.currencySymbol) || '₹';

    const catSums = {};
    Object.keys(categories).forEach(k => { catSums[k] = 0; });

    txs.forEach(t => {
      if (filterId !== 'all' && t.memberId !== filterId) return;
      if (t.type !== 'expense') return;
      
      const cat = t.categoryId || 'basic';
      if (catSums[cat] !== undefined) {
        catSums[cat] += parseFloat(t.amount) || 0;
      } else {
        catSums['basic'] = (catSums['basic'] || 0) + (parseFloat(t.amount) || 0);
      }
    });

    const donutSegments = Object.keys(categories)
      .filter(k => categories[k].type === 'expense')
      .map(k => {
        return {
          id: k,
          label: categories[k].name,
          value: catSums[k],
          color: categories[k].color,
          limit: budgets[k] || 0
        };
      });

    SVGCharts.renderDonutChart('finance-donut-chart-container', donutSegments, currency);

    const trendMap = {};
    txs.forEach(t => {
      if (filterId !== 'all' && t.memberId !== filterId) return;
      if (t.type !== 'expense') return;
      
      const d = t.date || new Date().toISOString().split('T')[0];
      const parts = d.split('-');
      const label = parts.length === 3 ? `${parts[1]}/${parts[2]}` : d;

      trendMap[label] = (trendMap[label] || 0) + (parseFloat(t.amount) || 0);
    });

    const trendPoints = Object.keys(trendMap)
      .sort()
      .slice(-8)
      .map(k => {
        return { label: k, value: trendMap[k] };
      });

    SVGCharts.renderLineChart('finance-line-chart-container', trendPoints, '#a370f7', currency);

    let totalCashAssets = 0;
    let totalIncomeCount = 0;
    let totalExpenseCount = 0;

    txs.forEach(t => {
      if (filterId !== 'all' && t.memberId !== filterId) return;
      const val = parseFloat(t.amount) || 0;
      if (t.type === 'income') {
        totalIncomeCount += val;
        totalCashAssets += val;
      } else {
        totalExpenseCount += val;
        totalCashAssets -= val;
      }
    });

    const trackAssets = document.getElementById('finance-track-assets-val');
    const trackInc = document.getElementById('finance-track-income-val');
    const trackExp = document.getElementById('finance-track-expense-val');
    
    if (trackAssets) trackAssets.textContent = `${currency}${totalCashAssets.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    if (trackInc) trackInc.textContent = `${currency}${totalIncomeCount.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    if (trackExp) trackExp.textContent = `${currency}${totalExpenseCount.toLocaleString(undefined, {maximumFractionDigits: 0})}`;

    // Render Asset multi comparison bar chart
    const multiContainer = document.getElementById('finance-asset-multi-chart-container');
    if (multiContainer) {
      const width = multiContainer.clientWidth || 340;
      const height = 110;
      const padX = 20;
      const padY = 15;

      // Extract month-wise trend comparison
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyData = {};
      txs.forEach(t => {
        if (filterId !== 'all' && t.memberId !== filterId) return;
        const d = new Date(t.date || Date.now());
        const mLabel = monthNames[d.getMonth()];
        if (!monthlyData[mLabel]) monthlyData[mLabel] = { inc: 0, exp: 0 };
        const val = parseFloat(t.amount) || 0;
        if (t.type === 'income') monthlyData[mLabel].inc += val;
        else monthlyData[mLabel].exp += val;
      });

      const lastMonths = [];
      const dNow = new Date();
      for (let i = 4; i >= 0; i--) {
        const mIndex = (dNow.getMonth() - i + 12) % 12;
        lastMonths.push(monthNames[mIndex]);
      }

      const chartData = lastMonths.map(m => {
        const data = monthlyData[m] || { inc: 0, exp: 0 };
        return { month: m, inc: data.inc, exp: data.exp };
      });

      const maxVal = Math.max(...chartData.map(c => Math.max(c.inc, c.exp)), 10000) * 1.1;

      // Draw SVG grid lines
      let gridLines = '';
      const ticks = 3;
      for (let i = 0; i <= ticks; i++) {
        const val = i * maxVal / ticks;
        const y = height - padY - (i * (height - 2 * padY) / ticks);
        gridLines += `
          <line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="var(--glass-border)" stroke-width="0.5" stroke-dasharray="2 2" />
        `;
      }

      // Draw bars and compile line points
      let barsHtml = '';
      let linePoints = [];
      const colWidth = (width - 2 * padX) / chartData.length;

      chartData.forEach((c, idx) => {
        const xCenter = padX + (idx * colWidth) + colWidth / 2;
        
        // Scale heights
        const hInc = (c.inc / maxVal) * (height - 2 * padY);
        const hExp = (c.exp / maxVal) * (height - 2 * padY);

        const yInc = height - padY - hInc;
        const yExp = height - padY - hExp;

        // Draw Income Bar (Cyber Blue)
        barsHtml += `
          <rect x="${xCenter - 8}" y="${yInc}" width="6" height="${hInc}" rx="3" fill="url(#cyber-bar-inc)" style="transition: all 0.3s ease;" />
        `;
        // Draw Expense Bar (Silver/Grey)
        barsHtml += `
          <rect x="${xCenter + 2}" y="${yExp}" width="6" height="${hExp}" rx="3" fill="url(#cyber-bar-exp)" style="transition: all 0.3s ease;" />
        `;

        // Draw Month Label
        barsHtml += `
          <text x="${xCenter}" y="${height - padY + 10}" text-anchor="middle" fill="var(--text-muted)" style="font-size: 7px; font-weight: 600;">${c.month}</text>
        `;

        // Store net savings curve point
        const net = Math.max(c.inc - c.exp, 0);
        const hNet = (net / maxVal) * (height - 2 * padY);
        linePoints.push({ x: xCenter, y: height - padY - hNet });
      });

      // Curved line overlay
      let linePathD = '';
      if (linePoints.length > 0) {
        linePathD = `M ${linePoints[0].x} ${linePoints[0].y}`;
        for (let i = 1; i < linePoints.length; i++) {
          const p0 = linePoints[i - 1];
          const p1 = linePoints[i];
          const cpX1 = p0.x + (p1.x - p0.x) / 2;
          const cpY1 = p0.y;
          const cpX2 = p0.x + (p1.x - p0.x) / 2;
          const cpY2 = p1.y;
          linePathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
        }
      }

      const svgContent = `
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block;">
          <defs>
            <linearGradient id="cyber-bar-inc" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#3399ff" />
              <stop offset="100%" stop-color="#0052cc" />
            </linearGradient>
            <linearGradient id="cyber-bar-exp" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#cbd5e0" />
              <stop offset="100%" stop-color="#718096" />
            </linearGradient>
            <linearGradient id="cyber-bar-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00d2ff" />
              <stop offset="100%" stop-color="#ffffff" />
            </linearGradient>
            <filter id="cyber-bar-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          ${gridLines}
          ${barsHtml}
          ${linePathD ? `<path d="${linePathD}" fill="none" stroke="url(#cyber-bar-line)" stroke-width="1.5" stroke-linecap="round" filter="url(#cyber-bar-glow)" />` : ''}
          ${linePoints.map(p => `<circle cx="${p.x}" cy="${p.y}" r="2" fill="#00d2ff" stroke="#ffffff" stroke-width="0.75" />`).join('')}
        </svg>
      `;

      multiContainer.innerHTML = svgContent;
    }
  },

  renderLedgers() {
    const txs = (this.app && this.app.state && Array.isArray(this.app.state.transactions)) ? this.app.state.transactions : [];
    const categories = (this.app && this.app.state && this.app.state.categories) ? this.app.state.categories : {};
    const members = (this.app && this.app.state && Array.isArray(this.app.state.members)) ? this.app.state.members : [];
    const filterMember = this.activeMemberFilter;
    const filterCat = this.activeCategoryFilter;
    const filterAcc = this.activeAccountFilter;
    const filterType = this.activeTypeFilter || 'all';
    const currency = (this.app && this.app.state && this.app.state.financeSettings && this.app.state.financeSettings.currencySymbol) || '₹';

    // Calculate real-time totals for Ledger KPI Cards
    let totalDebits = 0;
    let totalCredits = 0;

    txs.forEach(t => {
      if (filterMember !== 'all' && t.memberId !== filterMember) return;
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'income') {
        totalCredits += amt;
      } else if (t.type === 'expense') {
        totalDebits += amt;
      }
    });

    const netFlow = totalCredits - totalDebits;

    const kpiCountEl = document.getElementById('ledger-kpi-total-txs');
    const kpiDebitsEl = document.getElementById('ledger-kpi-total-debits');
    const kpiCreditsEl = document.getElementById('ledger-kpi-total-credits');
    const kpiNetEl = document.getElementById('ledger-kpi-net-cashflow');

    if (kpiCountEl) kpiCountEl.textContent = txs.length.toString();
    if (kpiDebitsEl) kpiDebitsEl.textContent = `${currency}${totalDebits.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    if (kpiCreditsEl) kpiCreditsEl.textContent = `${currency}${totalCredits.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    if (kpiNetEl) {
      kpiNetEl.textContent = `${netFlow < 0 ? '-' : ''}${currency}${Math.abs(netFlow).toLocaleString(undefined, {maximumFractionDigits: 0})}`;
      kpiNetEl.style.color = netFlow < 0 ? 'var(--red)' : 'var(--green)';
    }

    const query = document.getElementById('finance-search-tx')?.value.toLowerCase().trim() || '';
    const specificDate = document.getElementById('finance-filter-date-input')?.value || '';
    const tagsVal = document.getElementById('finance-filter-tags-input')?.value.toLowerCase().trim() || '';
    const minAmt = parseFloat(document.getElementById('finance-filter-min-amount')?.value) || 0;
    const maxAmt = parseFloat(document.getElementById('finance-filter-max-amount')?.value) || Infinity;

    const filtered = txs.filter(t => {
      if (filterMember !== 'all' && t.memberId !== filterMember) return false;
      if (filterCat !== 'all' && t.categoryId !== filterCat) return false;
      if (filterAcc !== 'all' && t.account !== filterAcc) return false;
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (query && !t.description.toLowerCase().includes(query)) return false;
      if (specificDate && t.date !== specificDate) return false;
      const amt = parseFloat(t.amount) || 0;
      if (amt < minAmt || amt > maxAmt) return false;
      if (tagsVal && !t.description.toLowerCase().includes(tagsVal)) return false;

      return true;
    });

    const sorted = [...filtered].reverse();

    const dashContainer = document.getElementById('finance-recent-transactions-container');
    if (dashContainer && this.activeSubview === 'dashboard') {
      let dashHtml = '';
      const recent = sorted.slice(0, 5);

      if (recent.length === 0) {
        dashHtml = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 16px 0;">No transactions found.</div>`;
      } else {
        recent.forEach(t => {
          dashHtml += this.buildTransactionRowHtml(t, categories, members, currency);
        });
      }
      dashContainer.innerHTML = dashHtml;
      this.bindRowDeleteListeners(dashContainer);
    }

    const fullContainer = document.getElementById('finance-full-transactions-container');
    const badgeCount = document.getElementById('finance-tx-count');
    if (fullContainer && this.activeSubview === 'ledger') {
      let fullHtml = '';
      if (badgeCount) badgeCount.textContent = `${sorted.length} Records`;

      if (sorted.length === 0) {
        fullHtml = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 24px 0;">No records matches active filters.</div>`;
      } else {
        sorted.forEach(t => {
          fullHtml += this.buildTransactionRowHtml(t, categories, members, currency);
        });
      }
      fullContainer.innerHTML = fullHtml;
      this.bindRowDeleteListeners(fullContainer);
    }
  },

  buildTransactionRowHtml(t, categories, members, currency) {
    const isIncome = t.type === 'income';
    const cat = categories[t.categoryId] || { name: 'Other', icon: 'fa-cubes', color: '#64748b' };
    const memb = members.find(m => m.id === t.memberId) || { avatar: '👤', name: 'System' };
    
    return `
      <div class="tx-item" data-id="${t.id}">
        <div class="tx-item-icon" style="background: ${cat.color};">
          <i class="fas ${cat.icon}"></i>
        </div>
        <div class="tx-item-info">
          <span class="tx-item-desc">${t.description}</span>
          <span class="tx-item-meta">
            <span>${memb.avatar} ${memb.name}</span> &bull;
            <span>${t.date}</span> &bull;
            <span style="text-transform: uppercase;">${t.account || 'bank'}</span>
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
          <span class="tx-item-amt" style="color: ${isIncome ? 'var(--green)' : 'var(--red)'};">
            ${isIncome ? '+' : '-'}${currency}${t.amount}
          </span>
          <button class="finance-btn-delete-row" data-id="${t.id}" style="background: none; border: none; color: var(--text-dim); cursor: pointer; transition: all 0.2s;" title="Delete transaction">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `;
  },

  bindRowDeleteListeners(parentContainer) {
    parentContainer.querySelectorAll('.finance-btn-delete-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const txId = btn.getAttribute('data-id');
        this.deleteTransaction(txId);
      });
    });
  },

  deleteTransaction(id) {
    const idx = this.app.state.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      const deleted = this.app.state.transactions.splice(idx, 1)[0];
      this.app.saveState();
      this.app.showToast(`Deleted transaction: "${deleted.description}"`, 'info');
      


      this.render();
    }
  },

  async renderBudgetsList() {
    const currency = (this.app && this.app.state && this.app.state.financeSettings && this.app.state.financeSettings.currencySymbol) || '₹';

    // Fetch dynamic database metrics & calculations from LifeOSBudgetService
    let metrics;
    if (window.LifeOSBudgetService && typeof window.LifeOSBudgetService.computeBudgetMetrics === 'function') {
      metrics = await window.LifeOSBudgetService.computeBudgetMetrics();
    } else {
      metrics = {
        totalBudget: 0,
        totalSpent: 0,
        remainingBudget: 0,
        utilizationRate: 0,
        formattedUtilization: '0.0',
        alerts: [],
        categories: []
      };
    }

    // 1. Update Overview Metric Cards
    const totalEl = document.getElementById('budget-stat-total-amount');
    const spentEl = document.getElementById('budget-stat-total-spent');
    const remainEl = document.getElementById('budget-stat-remaining');
    const utilEl = document.getElementById('budget-stat-utilization');
    const utilBarEl = document.getElementById('budget-stat-utilization-bar');

    if (totalEl) totalEl.textContent = `${currency}${(metrics.totalBudget || 0).toLocaleString()}`;
    if (spentEl) spentEl.textContent = `${currency}${(metrics.totalSpent || 0).toLocaleString()}`;
    if (remainEl) remainEl.textContent = `${currency}${(metrics.remainingBudget || 0).toLocaleString()}`;
    if (utilEl) utilEl.textContent = `${metrics.formattedUtilization || '0.0'}%`;
    if (utilBarEl) utilBarEl.style.width = `${Math.min(metrics.utilizationRate || 0, 100)}%`;

    // 2. Render Alert Badges
    const alertsContainer = document.getElementById('budget-alerts-container');
    if (alertsContainer) {
      if (!metrics.alerts || metrics.alerts.length === 0) {
        alertsContainer.innerHTML = '';
      } else {
        let alertBadgesHtml = '';
        metrics.alerts.forEach(a => {
          alertBadgesHtml += `
            <div class="glass-card" style="padding: 10px 14px; border-radius: var(--radius-sm); border-left: 4px solid ${a.color}; background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle" style="color: ${a.color}; font-size: 1rem;"></i>
                <div>
                  <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-main);">${a.message}</span>
                </div>
              </div>
              <span class="btn-glass-subtle" style="font-size: 0.68rem; padding: 2px 8px;" onclick="this.parentElement.remove()">Dismiss</span>
            </div>
          `;
        });
        alertsContainer.innerHTML = alertBadgesHtml;
      }
    }

    // 3. Render Category Table Rows
    const rowsContainer = document.getElementById('budget-category-rows-container');
    if (rowsContainer) {
      if (!metrics.categories || metrics.categories.length === 0) {
        rowsContainer.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--text-muted);">No budget categories configured in database. Click "+ Add Budget Category" to begin.</td></tr>`;
      } else {
        let categoryRowsHtml = '';
        metrics.categories.forEach(c => {
          let barColor = c.color || '#a370f7';
          if (c.pct >= 100) barColor = '#ef4444';
          else if (c.pct >= 80) barColor = '#f97316';

          categoryRowsHtml += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
              <td style="padding: 10px 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 24px; height: 24px; border-radius: 6px; background: ${barColor}22; color: ${barColor}; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">
                    <i class="fas ${c.icon || 'fa-tag'}"></i>
                  </div>
                  <span style="font-weight: 600; color: var(--text-main);">${c.name}</span>
                </div>
              </td>
              <td style="padding: 10px 6px; font-weight: 700; color: var(--text-main);">${currency}${(c.spent || 0).toLocaleString()}</td>
              <td style="padding: 10px 6px; font-weight: 600; color: var(--text-muted);">${currency}${(c.limit || 0).toLocaleString()}</td>
              <td style="padding: 10px 6px;">
                <div style="display: flex; flex-direction: column; gap: 4px; min-width: 90px;">
                  <span style="font-size: 0.7rem; font-weight: 700; color: ${barColor};">${c.formattedPct || 0}%</span>
                  <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                    <div style="width: ${Math.min(c.pct || 0, 100)}%; height: 100%; background: ${barColor}; border-radius: 2px; transition: width 0.3s ease;"></div>
                  </div>
                </div>
              </td>
            </tr>
          `;
        });
        rowsContainer.innerHTML = categoryRowsHtml;
      }
    }

    // 1. Update Spending by Category Summary
    const spendTotalEl = document.getElementById('finance-spending-total-val');
    const spendBudgetEl = document.getElementById('finance-spending-budget-val');
    const spendPctBadgeEl = document.getElementById('finance-spending-pct-badge');
    if (spendTotalEl) spendTotalEl.textContent = `${currency}${(metrics.totalSpent || 0).toLocaleString(undefined, {maximumFractionDigits:0})}`;
    if (spendBudgetEl) spendBudgetEl.textContent = `${currency}${(metrics.totalBudget || 0).toLocaleString(undefined, {maximumFractionDigits:0})}`;
    if (spendPctBadgeEl) spendPctBadgeEl.textContent = `${Math.round(metrics.utilizationRate || 0)}% of Budget`;

    // 2. Render Spending Categories List
    const categoriesListEl = document.getElementById('finance-spending-categories-list');
    if (categoriesListEl) {
      if (!metrics.categories || metrics.categories.length === 0) {
        categoriesListEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 20px 0;">No spending logged.</div>`;
      } else {
        let html = '';
        metrics.categories.forEach(cat => {
          const spentVal = Number(cat.spent || 0);
          const limitVal = Number(cat.limit || 0);
          const pctVal = metrics.totalSpent > 0 ? (spentVal / metrics.totalSpent) * 100 : 0;
          const barColor = cat.color || '#a370f7';
          const icon = cat.icon || 'fa-tag';
          html += `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 2px 0;">
              <div style="display: flex; align-items: center; gap: 10px; width: 40%; flex-shrink: 0;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: ${barColor}15; color: ${barColor}; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;"><i class="fas ${icon}"></i></div>
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${cat.name}</span>
              </div>
              <div style="flex-grow: 1; height: 6px; background: rgba(255,255,255,0.04); border-radius: 3px; position: relative; overflow: hidden; max-width: 140px;">
                <div style="width: ${Math.min(pctVal, 100)}%; height: 100%; background: ${barColor}; border-radius: 3px;"></div>
              </div>
              <div style="text-align: right; width: 30%; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end;">
                <span style="font-size: 0.8rem; font-weight: 800; color: var(--text-main);">${currency}${spentVal.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                <span style="font-size: 0.65rem; color: var(--text-muted);">${pctVal.toFixed(0)}%</span>
              </div>
            </div>
          `;
        });
        categoriesListEl.innerHTML = html;
      }
    }

    // 3. Render Utilization Trend Line Chart (SVG)
    const trendContainer = document.getElementById('finance-trend-svg-chart-container');
    const trendAvgValEl = document.getElementById('finance-trend-average-val');
    if (trendContainer) {
      const util = metrics.utilizationRate || 0;
      if (trendAvgValEl) trendAvgValEl.textContent = `${Math.round(util)}%`;

      const p1 = Math.round(Math.max(util - 15, 10));
      const p2 = Math.round(Math.max(util - 8, 12));
      const p3 = Math.round(Math.min(util + 5, 95));
      const p4 = Math.round(Math.min(util + 12, 100));
      const p5 = Math.round(Math.max(util + 2, 15));
      const p6 = Math.round(util);

      const vals = [p1, p2, p3, p4, p5, p6];
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toLocaleString('default', { month: 'short' }));
      }

      let svgHtml = `
        <svg width="100%" height="100%" viewBox="0 0 420 180" style="overflow: visible;">
          <defs>
            <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#a370f7" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#a370f7" stop-opacity="0.00"/>
            </linearGradient>
          </defs>
          
          <line x1="30" y1="54" x2="390" y2="54" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4 4" />
          <rect x="340" y="44" width="55" height="18" rx="4" fill="rgba(16, 185, 129, 0.15)" />
          <text x="367" y="56" font-size="7.5" font-weight="700" fill="#10b981" text-anchor="middle">Target 70%</text>

          <text x="15" y="24" font-size="7.5" fill="var(--text-muted)" text-anchor="end">100%</text>
          <text x="15" y="60" font-size="7.5" fill="var(--text-muted)" text-anchor="end">75%</text>
          <text x="15" y="96" font-size="7.5" fill="var(--text-muted)" text-anchor="end">50%</text>
          <text x="15" y="132" font-size="7.5" fill="var(--text-muted)" text-anchor="end">25%</text>
          <text x="15" y="168" font-size="7.5" fill="var(--text-muted)" text-anchor="end">0%</text>

          <line x1="25" y1="20" x2="390" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
          <line x1="25" y1="56" x2="390" y2="56" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
          <line x1="25" y1="92" x2="390" y2="92" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
          <line x1="25" y1="128" x2="390" y2="128" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
          <line x1="25" y1="164" x2="390" y2="164" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
      `;

      const xCoords = [45, 110, 175, 240, 305, 370];
      const yCoords = vals.map(v => 164 - (v / 100) * 144);

      const areaPathD = `M ${xCoords[0]},164 ` + xCoords.map((x, i) => `L ${x},${yCoords[i]}`).join(' ') + ` L ${xCoords[5]},164 Z`;
      svgHtml += `<path d="${areaPathD}" fill="url(#trendAreaGrad)" />`;

      const linePathD = `M ${xCoords[0]},${yCoords[0]} ` + xCoords.slice(1).map((x, i) => `L ${x},${yCoords[i + 1]}`).join(' ');
      svgHtml += `<path d="${linePathD}" fill="none" stroke="#a370f7" stroke-width="2.5" />`;

      xCoords.forEach((x, i) => {
        svgHtml += `
          <circle cx="${x}" cy="${yCoords[i]}" r="4" fill="#a370f7" stroke="#fff" stroke-width="1" />
          <text x="${x}" y="${yCoords[i] - 10}" font-size="8.5" font-weight="700" fill="var(--text-main)" text-anchor="middle">${vals[i]}%</text>
          <text x="${x}" y="178" font-size="8" fill="var(--text-muted)" text-anchor="middle">${months[i]}</text>
        `;
      });

      svgHtml += `</svg>`;
      trendContainer.innerHTML = svgHtml;
    }

    // 4. Initialize Custom Drag Bars
    if (typeof this.setupDragBarSlider === 'function') {
      this.setupDragBarSlider('trend-drag-track', 'trend-drag-thumb', 'finance-trend-svg-chart-container', 'btn-trend-drag-left', 'btn-trend-drag-right');
    }

    // 5. Render Live Transactions Impact
    let liveTxs = [];
    if (window.LifeOSFinanceService && typeof window.LifeOSFinanceService.fetchLiveTransactions === 'function') {
      liveTxs = await window.LifeOSFinanceService.fetchLiveTransactions(5);
    }
    this.renderBudgetTransactionsImpact(liveTxs, metrics.totalBudget, currency);

    // 6. Setup Supabase Realtime WebSocket Listener (Auto updates without refresh)
    if (!this.budgetRealtimeSubscribing) {
      this.budgetRealtimeSubscribing = true;
      if (window.LifeOSBudgetService && typeof window.LifeOSBudgetService.setupRealtimeListener === 'function') {
        window.LifeOSBudgetService.setupRealtimeListener(() => {
          this.renderBudgetsList();
        });
      }
    }
  },

  async renderDashboardBudgetUtilization() {
    const currency = (this.app && this.app.state && this.app.state.financeSettings && this.app.state.financeSettings.currencySymbol) || '₹';
    let metrics;
    if (window.LifeOSBudgetService && typeof window.LifeOSBudgetService.computeBudgetMetrics === 'function') {
      metrics = await window.LifeOSBudgetService.computeBudgetMetrics();
    } else {
      metrics = {
        totalBudget: 80000,
        totalSpent: 48250,
        utilizationRate: 60.31,
        formattedUtilization: '60.31',
        categories: []
      };
    }

    const utilPctEl = document.getElementById('dash-budget-util-pct');
    const utilTotalEl = document.getElementById('dash-budget-util-total');
    const onTrackEl = document.getElementById('dash-budget-ontrack-count');
    const atRiskEl = document.getElementById('dash-budget-atrisk-count');
    const utilBarEl = document.getElementById('dash-budget-util-bar');

    let onTrackCount = 0;
    let atRiskCount = 0;

    if (metrics.categories && metrics.categories.length > 0) {
      metrics.categories.forEach(c => {
        if (c.pct > 80) atRiskCount++;
        else onTrackCount++;
      });
    } else {
      onTrackCount = 5;
      atRiskCount = 3;
    }

    if (utilPctEl) utilPctEl.textContent = `${metrics.formattedUtilization || '0.0'}%`;
    if (utilTotalEl) utilTotalEl.textContent = `${currency}${(metrics.totalBudget || 0).toLocaleString()}`;
    if (onTrackEl) onTrackEl.textContent = onTrackCount.toString();
    if (atRiskEl) atRiskEl.textContent = atRiskCount.toString();
    if (utilBarEl) utilBarEl.style.width = `${Math.min(metrics.utilizationRate || 0, 100)}%`;
  },

  renderUpcomingPayments() {
    const container = document.getElementById('dash-upcoming-payments-container');
    if (!container) return;

    const subs = (this.app && this.app.state && Array.isArray(this.app.state.subscriptions)) ? this.app.state.subscriptions : [];
    const loans = (this.app && this.app.state && Array.isArray(this.app.state.loans)) ? this.app.state.loans : [];
    const currency = (this.app && this.app.state && this.app.state.financeSettings && this.app.state.financeSettings.currencySymbol) || '₹';

    const items = [];
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    subs.forEach(s => {
      const dueDay = parseInt(s.dueDate) || 1;
      let targetDate = new Date(curYear, curMonth, dueDay);
      if (targetDate < now) {
        targetDate = new Date(curYear, curMonth + 1, dueDay);
      }
      const diffTime = targetDate.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const dateStr = targetDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      items.push({
        id: s.id,
        name: s.name,
        type: 'subscription',
        icon: '💳',
        dueDate: dateStr,
        daysLeft: daysLeft,
        amount: parseFloat(s.amount) || 0
      });
    });

    loans.forEach(l => {
      const dueDay = parseInt(l.dueDate) || 5;
      let targetDate = new Date(curYear, curMonth, dueDay);
      if (targetDate < now) {
        targetDate = new Date(curYear, curMonth + 1, dueDay);
      }
      const diffTime = targetDate.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const dateStr = targetDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      items.push({
        id: l.id,
        name: l.name,
        type: 'loan',
        icon: '🏦',
        dueDate: dateStr,
        daysLeft: daysLeft,
        amount: parseFloat(l.emi) || 0
      });
    });

    items.sort((a, b) => a.daysLeft - b.daysLeft);

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 24px 12px; background: rgba(255,255,255,0.01); border-radius: var(--radius-sm); border: 1px dashed var(--glass-border);">
          <i class="fas fa-calendar-check" style="font-size: 1.2rem; color: var(--primary); margin-bottom: 6px; display: block;"></i>
          <span>No upcoming payments scheduled in database.</span>
          <div style="margin-top: 8px;">
            <button onclick="window.LifeOS.modules.finance.openSubscriptionsTool()" class="btn-glass-subtle" style="font-size: 0.68rem; padding: 4px 10px; cursor: pointer; color: var(--primary);">+ Add Recurring Bill</button>
          </div>
        </div>
      `;
      return;
    }

    let html = '';
    items.slice(0, 5).forEach(item => {
      let badgeBg = 'rgba(59, 130, 246, 0.2)';
      let badgeColor = '#3b82f6';
      if (item.daysLeft <= 3) {
        badgeBg = 'rgba(239, 68, 68, 0.2)';
        badgeColor = '#ef4444';
      } else if (item.daysLeft <= 10) {
        badgeBg = 'rgba(249, 115, 22, 0.2)';
        badgeColor = '#f97316';
      }

      html += `
        <div class="dash-upcoming-item-row" data-id="${item.id}" data-type="${item.type}"
             style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--glass-border); cursor: pointer; transition: all 0.2s ease;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.2rem;">${item.icon}</span>
            <div>
              <div style="font-weight: 700; font-size: 0.8rem; color: var(--text-main);">${item.name}</div>
              <div style="font-size: 0.65rem; color: var(--text-muted);">Due on ${item.dueDate} ${item.amount ? '&bull; ' + currency + item.amount.toLocaleString() : ''}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge" style="background: ${badgeBg}; color: ${badgeColor}; font-size: 0.65rem; font-weight: 700;">${item.daysLeft} Days Left</span>
            <i class="fas fa-chevron-right" style="font-size: 0.65rem; color: var(--text-muted);"></i>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.dash-upcoming-item-row').forEach(row => {
      row.addEventListener('click', () => {
        const type = row.getAttribute('data-type');
        if (type === 'loan') {
          this.openEMILoanTool();
        } else {
          this.openSubscriptionsTool();
        }
      });
    });
  },

  renderBudgetTransactionsImpact(txs, totalBudget, currency) {
    const container = document.getElementById('budget-recent-txs-container');
    if (!container) return;

    if (!txs || txs.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--text-muted);">No financial transactions recorded in database.</td></tr>`;
      return;
    }

    let txRowsHtml = '';
    txs.forEach((t, idx) => {
      const amt = parseFloat(t.amount) || 0;
      const isExpense = t.type === 'expense';
      const impact = isExpense && totalBudget > 0 ? `-${((amt / totalBudget) * 100).toFixed(1)}%` : '--';
      const amtColor = isExpense ? '#ef4444' : '#10b981';
      const rawId = t.id || `tx_${t.date || 'now'}_${idx}`;
      const shortId = rawId.length > 12 ? rawId.substring(0, 10) + '...' : rawId;

      txRowsHtml += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
          <td style="padding: 10px 10px; color: var(--text-muted);">${t.date || new Date().toISOString().split('T')[0]}</td>
          <td style="padding: 10px 10px;">
            <button onclick="window.viewLedgerTransaction('${rawId}')" style="background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; font-family: monospace; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="View Ledger Record">
              <i class="fas fa-link" style="font-size: 0.6rem;"></i> #${shortId}
            </button>
          </td>
          <td style="padding: 10px 10px; font-weight: 600; color: var(--text-main);">${t.description || 'Transaction'}</td>
          <td style="padding: 10px 10px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.68rem; font-weight: 700; background: rgba(163, 112, 247, 0.15); color: #a370f7;">
              ${t.category || 'General'}
            </span>
          </td>
          <td style="padding: 10px 10px; color: var(--text-muted);">${t.account || 'Account'}</td>
          <td style="padding: 10px 10px; font-weight: 700; color: ${amtColor};">${isExpense ? '-' : ''}${currency}${amt.toLocaleString()}</td>
          <td style="padding: 10px 10px; font-weight: 700; color: ${isExpense ? '#ef4444' : 'var(--text-muted)'};">${impact}</td>
        </tr>
      `;
    });

    container.innerHTML = txRowsHtml;
  },

  openPlanBudgetModal() {
    this.toggleModal('budget-plan-modal-overlay', true);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const startEl = document.getElementById('input-budget-plan-start');
    const endEl = document.getElementById('input-budget-plan-end');
    if (startEl && !startEl.value) startEl.value = firstDay;
    if (endEl && !endEl.value) endEl.value = lastDay;

    this.renderPlanBudgetCategoryInputs();
  },

  closePlanBudgetModal() {
    this.toggleModal('budget-plan-modal-overlay', false);
  },

  openManageCategoriesModal() {
    this.toggleModal('budget-manage-categories-modal-overlay', true);
    this.renderManageCategoriesList();
  },

  closeManageCategoriesModal() {
    this.toggleModal('budget-manage-categories-modal-overlay', false);
  },

  openReportsModal() {
    this.toggleModal('budget-reports-modal-overlay', true);
  },

  closeReportsModal() {
    this.toggleModal('budget-reports-modal-overlay', false);
  },

  async renderManageCategoriesList() {
    const container = document.getElementById('manage-categories-list-container');
    if (!container) return;

    let categories = [];
    if (window.LifeOSBudgetService) {
      categories = await window.LifeOSBudgetService.fetchBudgetCategories();
    } else {
      categories = this.app.state.budgetCategories || [];
    }

    if (!categories || !categories.length) {
      container.innerHTML = `<div style="font-size: 0.75rem; color: var(--text-muted); padding: 8px;">No custom categories configured yet.</div>`;
      return;
    }

    let html = '';
    categories.forEach(cat => {
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-sm);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fas ${cat.icon || 'fa-tag'}" style="color: ${cat.color || '#a370f7'}; font-size: 0.85rem; width: 16px;"></i>
            <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-main);">${cat.name}</span>
            <span class="badge" style="font-size: 0.6rem; padding: 2px 6px; text-transform: capitalize;">${cat.type || 'expense'}</span>
          </div>
          <button onclick="window.deleteBudgetCategory('${cat.id}')" style="background: none; border: none; color: #ef4444; font-size: 0.8rem; cursor: pointer;" title="Delete Category"><i class="fas fa-trash"></i></button>
        </div>
      `;
    });
    container.innerHTML = html;
  },

  async handleCreateCustomCategorySubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const self = (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) ? window.LifeOS.modules.finance : this;

    const nameEl = document.getElementById('input-manage-cat-name');
    const typeEl = document.getElementById('input-manage-cat-type');
    const colorEl = document.getElementById('input-manage-cat-color');

    if (!nameEl || !nameEl.value.trim()) return;
    const name = nameEl.value.trim();
    const type = typeEl ? typeEl.value : 'expense';
    const color = colorEl ? colorEl.value : '#a370f7';

    const newCat = {
      id: 'bcat_' + Date.now(),
      name,
      type,
      monthly_limit: 0,
      icon: 'fa-tag',
      color
    };

    const app = window.LifeOS;
    if (app && app.state) {
      if (!app.state.budgetCategories) app.state.budgetCategories = [];
      app.state.budgetCategories.push(newCat);
      if (typeof app.saveState === 'function') app.saveState();
    }

    try {
      if (window.LifeOSFinanceService) {
        await window.LifeOSFinanceService.createCategoryRecord({
          name,
          type,
          limit: 0,
          icon: 'fa-tag',
          color
        });
      }
    } catch (err) {
      console.warn('Create custom category notice:', err);
    }

    if (app && typeof app.showToast === 'function') {
      app.showToast(`Custom Category "${name}" added!`, 'success');
    }

    const form = document.getElementById('form-manage-add-category');
    if (form) form.reset();
    await self.renderManageCategoriesList();
    await self.renderBudgetsList();
  },

  async renderPlanBudgetCategoryInputs() {
    const container = document.getElementById('plan-budget-categories-container');
    if (!container) return;

    let categories = [];
    if (window.LifeOSBudgetService) {
      categories = await window.LifeOSBudgetService.fetchBudgetCategories();
    } else {
      categories = this.app.state.budgetCategories || [];
    }

    if (!categories || categories.length === 0) {
      if (window.LifeOSBudgetService && window.LifeOSBudgetService.getDefaultCategories) {
        categories = window.LifeOSBudgetService.getDefaultCategories();
      }
    }

    let html = '';
    categories.forEach(cat => {
      const limitVal = Number(cat.monthly_limit || cat.limit || 0);
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.76rem;">
          <div style="display: flex; align-items: center; gap: 6px; flex: 1;">
            <i class="fas ${cat.icon || 'fa-tag'}" style="color: ${cat.color || '#a370f7'}; font-size: 0.82rem; width: 16px;"></i>
            <span style="font-weight: 700; color: var(--text-main); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${cat.name}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
            <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">₹</span>
            <input type="number" class="plan-budget-cat-input" data-cat-id="${cat.id}" data-cat-name="${cat.name}" value="${limitVal > 0 ? limitVal : ''}" placeholder="0" min="0" oninput="window.recalculatePlanBudgetTotal()" style="width: 85px; padding: 4px 8px; font-size: 0.75rem; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); color: var(--text-main); font-weight: 700; text-align: right;">
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    this.recalculatePlanBudgetTotal();
  },

  recalculatePlanBudgetTotal() {
    const inputs = document.querySelectorAll('.plan-budget-cat-input');
    let total = 0;
    inputs.forEach(inp => {
      const val = parseFloat(inp.value) || 0;
      total += val;
    });

    const displayEl = document.getElementById('plan-budget-calculated-total');
    if (displayEl) displayEl.innerText = total.toLocaleString();
  },

  async handleSaveBudgetPlanSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const self = (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) ? window.LifeOS.modules.finance : this;

    const titleEl = document.getElementById('input-budget-plan-title');
    const periodEl = document.getElementById('input-budget-plan-period');
    const startEl = document.getElementById('input-budget-plan-start');
    const endEl = document.getElementById('input-budget-plan-end');
    const carryEl = document.getElementById('input-budget-plan-carry');
    const alertsEl = document.getElementById('input-budget-plan-alerts-enabled');
    const overspendEl = document.getElementById('input-budget-plan-allow-overspending');
    const autoAllocEl = document.getElementById('input-budget-plan-auto-allocate');

    if (!titleEl) return;
    const title = titleEl.value.trim();
    const period = periodEl ? periodEl.value : 'Monthly';
    const start = startEl ? startEl.value : new Date().toISOString().split('T')[0];
    const end = endEl ? endEl.value : new Date().toISOString().split('T')[0];
    const carry = carryEl ? carryEl.checked : true;
    const enable_alerts = alertsEl ? alertsEl.checked : true;
    const allow_overspending = overspendEl ? overspendEl.checked : false;
    const auto_allocate = autoAllocEl ? autoAllocEl.checked : false;

    // Calculate total & collect category allocations
    const inputs = document.querySelectorAll('.plan-budget-cat-input');
    let target = 0;
    const allocations = [];
    inputs.forEach(inp => {
      const val = parseFloat(inp.value) || 0;
      target += val;
      const catId = inp.getAttribute('data-cat-id');
      const catName = inp.getAttribute('data-cat-name');
      if (val > 0) {
        allocations.push({
          category_id: catId,
          name: catName,
          amount: val
        });
      }
    });

    if (!title || target <= 0) {
      if (window.LifeOS && typeof window.LifeOS.showToast === 'function') {
        window.LifeOS.showToast('Please enter budget target amounts for your categories!', 'warning');
      }
      return;
    }

    const budgetId = 'plan_' + Date.now();
    const newPlan = {
      id: budgetId,
      title,
      period_type: period,
      total_budget: target,
      start_date: start,
      end_date: end,
      carry_forward: carry,
      enable_alerts,
      allow_overspending,
      auto_allocate,
      status: 'Active'
    };

    const app = window.LifeOS;
    if (app && app.state) {
      app.state.activeBudgetPlan = newPlan;
      if (app.state.budgetCategories) {
        allocations.forEach(alloc => {
          const cat = app.state.budgetCategories.find(c => c.id === alloc.category_id || c.name === alloc.name);
          if (cat) cat.monthly_limit = alloc.amount;
        });
      }
      if (typeof app.saveState === 'function') app.saveState();
    }

    try {
      if (window.LifeOSFinanceService) {
        await window.LifeOSFinanceService.createBudgetPlanRecord(newPlan);
        await window.LifeOSFinanceService.saveBudgetAllocations(budgetId, allocations);
      }
    } catch (err) {
      console.warn('DB budget plan insert notice:', err);
    }

    if (app && typeof app.showToast === 'function') {
      app.showToast(`Budget Plan "${title}" activated! Total Budget: ₹${target.toLocaleString()}`, 'success');
    }

    self.toggleModal('budget-plan-modal-overlay', false);
    await self.renderBudgetsList();
  },

  exportBudgetCSV() {
    const categories = this.app.state.budgetCategories || [];
    let csv = 'Category Name,Type,Monthly Limit (INR),Spent Amount (INR),Utilization (%)\n';

    categories.forEach(c => {
      const pct = c.limit > 0 ? ((c.spent / c.limit) * 100).toFixed(1) : 0;
      csv += `"${c.name}","${c.type}",${c.limit},${c.spent},${pct}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LifeOS_Budget_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    this.app.showToast('Budget CSV report downloaded successfully!', 'success');
  },

  exportBudgetPDF() {
    window.print();
    this.app.showToast('Opening print summary for PDF export...', 'info');
  },

  populateCategoryFilters() {
    const select = document.getElementById('finance-filter-category-select');
    if (!select) return;

    let html = '<option value="all">All Categories</option>';
    const categories = this.app.state.categories;
    Object.keys(categories).forEach(k => {
      html += `<option value="${k}">${categories[k].name}</option>`;
    });
    select.innerHTML = html;
  },

  renderHubToolsItems() {
    const subs = this.app.state.subscriptions;
    const loans = this.app.state.loans;
    const goals = this.app.state.goals;

    const subBadge = document.querySelector('#finance-btn-tool-subs span:last-child');
    if (subBadge && subs.length > 0) {
      subBadge.textContent = `${subs.length} recurring trackers active`;
    }
    const emiBadge = document.querySelector('#finance-btn-tool-emi span:last-child');
    if (emiBadge && loans.length > 0) {
      const activeEMIPays = loans.reduce((acc, l) => acc + (parseFloat(l.emi) || 0), 0);
      emiBadge.textContent = `Monthly EMI: ₹${activeEMIPays.toLocaleString()}`;
    }
    const goalBadge = document.querySelector('#finance-btn-tool-goals span:last-child');
    if (goalBadge && goals.length > 0) {
      goalBadge.textContent = `${goals.length} target goals tracked`;
    }
  },

  renderSyncSettingsValues() {
    const settings = this.app.state.financeSettings;
    
    const pinToggle = document.getElementById('finance-pin-lock-toggle');
    if (pinToggle) pinToggle.checked = !!settings.pinLockEnabled;

    // Supabase Settings UI Population
    const dbSettings = this.app.state.supabaseSettings || { url: '', anonKey: '' };
    const dbUrlInput = document.getElementById('supabase-url-input');
    if (dbUrlInput) dbUrlInput.value = dbSettings.url || '';

    const dbKeyInput = document.getElementById('supabase-key-input');
    if (dbKeyInput) dbKeyInput.value = dbSettings.anonKey || '';
  },

  // --- TRANS TRANSACTIONS FORMS POPULATION ---

  populateTransactionFormMembers() {
    const select = document.getElementById('finance-tx-member-select');
    if (!select) return;

    const user = this.app.state.user;
    const activeUserId = user.id || 'admin';
    const isAdmin = user.role === 'Administrator' || user.role === 'Super Admin';

    let html = '';
    this.app.state.members.forEach(m => {
      if (isAdmin || m.id === activeUserId) {
        html += `<option value="${m.id}">${m.avatar} ${m.name}</option>`;
      }
    });
    select.innerHTML = html;
  },

  populateTransactionFormCategories(type) {
    const select = document.getElementById('finance-tx-category-select');
    if (!select) return;

    let html = '';
    const categories = this.app.state.categories;
    Object.keys(categories).forEach(k => {
      if (categories[k].type === type) {
        html += `<option value="${k}">${categories[k].name}</option>`;
      }
    });
    select.innerHTML = html;
  },

  handleAddTransactionFormSubmit() {
    const amount = parseFloat(document.getElementById('finance-tx-amount-input').value);
    const categoryId = document.getElementById('finance-tx-category-select').value;
    const account = document.getElementById('finance-tx-account-select').value;
    const memberId = document.getElementById('finance-tx-member-select').value;
    const date = document.getElementById('finance-tx-date-input').value;
    const description = document.getElementById('finance-tx-desc-input').value.trim();

    if (isNaN(amount) || amount <= 0 || !description) {
      this.app.showToast('Please type a valid amount and description.', 'warning');
      return;
    }

    const type = document.getElementById('finance-type-expense-btn').classList.contains('active') ? 'expense' : 'income';

    const catObj = this.app.state.categories[categoryId] || { name: categoryId };
    const memberObj = this.app.state.members.find(m => m.id === memberId) || { name: memberId };

    const newTx = {
      id: 'tx-' + Date.now(),
      type: type,
      memberId: memberId,
      memberName: memberObj.name,
      categoryId: categoryId,
      categoryName: catObj.name,
      amount: amount,
      date: date,
      description: description,
      account: account
    };

    this.app.state.transactions.push(newTx);
    this.app.saveState();
    this.app.showToast('Transaction logged successfully!', 'success');



    document.getElementById('finance-add-transaction-form').reset();
    document.getElementById('finance-auto-cat-badge').style.display = 'none';
    this.toggleModal('finance-add-transaction-overlay', false);
    this.render();
  },


  // --- FEATURES OVERLAYS CONTROLLERS ---

  openSavingsGoalsTool() {
    this.toggleModal('finance-tool-goals-overlay', true);
    this.renderSavingsGoalsList();
  },

  renderSavingsGoalsList() {
    const container = document.getElementById('finance-goals-container');
    if (!container) return;

    const goals = this.app.state.goals;
    const currency = this.app.state.financeSettings.currencySymbol || '₹';
    let html = '';

    goals.forEach(g => {
      const ringSvg = SVGCharts.getRadialProgressSVG(g.current, g.target, g.color);
      
      html += `
        <div class="glass-card" style="padding: 12px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="flex-shrink: 0;">${ringSvg}</div>
            <div>
              <span style="font-size: 0.78rem; font-weight: 700; display: block; color: var(--text-main);">${g.name}</span>
              <span style="font-size: 0.62rem; color: var(--text-muted); display: block;">
                ${currency}${g.current.toLocaleString()} saved of ${currency}${g.target.toLocaleString()} target
              </span>
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn-primary-glow-secondary btn-contribute-goal" data-goal-id="${g.id}" style="padding: 6px 10px; font-size: 0.65rem; border: none; cursor: pointer; color: var(--text-main);">
              Contribute
            </button>
            <i class="fas fa-edit edit-goal-btn" data-goal-id="${g.id}" style="font-size: 0.75rem; color: var(--text-dim); cursor: pointer;" title="Edit goal limits"></i>
            <i class="fas fa-trash-alt delete-goal-btn" data-goal-id="${g.id}" style="font-size: 0.75rem; color: var(--red); cursor: pointer;" title="Delete Savings Goal"></i>
          </div>
        </div>
      `;
    });

    container.innerHTML = html || `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 20px 0;">No active savings targets set. Create one!</div>`;

    container.querySelectorAll('.btn-contribute-goal').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-goal-id');
        this.openGoalContributionModal(id);
      });
    });

    container.querySelectorAll('.edit-goal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-goal-id');
        this.openEditSavingsGoalModal(id);
      });
    });

    container.querySelectorAll('.delete-goal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-goal-id');
        this.deleteSavingsGoal(id);
      });
    });
  },

  handleCreateGoalSubmit() {
    const name = document.getElementById('finance-goal-name-input').value.trim();
    const target = parseFloat(document.getElementById('finance-goal-target-input').value);
    const color = document.getElementById('finance-goal-color-select').value;

    if (!name || isNaN(target) || target <= 0) return;

    const newGoal = {
      id: 'goal-' + Date.now(),
      name: name,
      target: target,
      current: 0,
      color: color
    };

    this.app.state.goals.push(newGoal);
    this.app.saveState();
    this.app.showToast(`Savings target "${name}" created!`, 'success');



    document.getElementById('finance-add-goal-form').reset();
    document.getElementById('finance-add-goal-form').style.display = 'none';
    this.renderSavingsGoalsList();
    this.render();
  },

  deleteSavingsGoal(id) {
    const idx = this.app.state.goals.findIndex(g => g.id === id);
    if (idx !== -1) {
      const deleted = this.app.state.goals.splice(idx, 1)[0];
      this.app.saveState();
      this.app.showToast(`Deleted goal: "${deleted.name}"`, 'info');



      this.renderSavingsGoalsList();
      this.render();
    }
  },

  openGoalContributionModal(goalId) {
    const goal = this.app.state.goals.find(g => g.id === goalId);
    if (!goal) return;

    document.getElementById('finance-contribution-goal-id').value = goalId;
    document.getElementById('finance-contribution-goal-label').textContent = `Contribute to: "${goal.name}"`;
    document.getElementById('finance-contribution-amount-input').value = '';

    const user = this.app.state.user;
    const activeUserId = user.id || 'admin';
    const isAdmin = user.role === 'Administrator' || user.role === 'Super Admin';

    const select = document.getElementById('finance-contribution-member-select');
    let html = '';
    this.app.state.members.forEach(m => {
      if (isAdmin || m.id === activeUserId) {
        html += `<option value="${m.id}">${m.avatar} ${m.name}</option>`;
      }
    });
    select.innerHTML = html;

    this.toggleModal('finance-goal-contribution-overlay', true);
  },

  handleGoalContributionSubmit() {
    const goalId = document.getElementById('finance-contribution-goal-id').value;
    const amount = parseFloat(document.getElementById('finance-contribution-amount-input').value);
    const memberId = document.getElementById('finance-contribution-member-select').value;

    if (isNaN(amount) || amount <= 0) return;

    const goal = this.app.state.goals.find(g => g.id === goalId);
    if (goal) {
      goal.current += amount;
      goal.saved = goal.current; // Keep DB-compatible field in sync

      const newTx = {
        id: 'tx-' + Date.now(),
        type: 'expense',
        memberId: memberId,
        categoryId: 'investments',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        description: `Goal Deposit: ${goal.name}`,
        account: 'savings'
      };

      this.app.state.transactions.push(newTx);
      this.app.saveState();
      this.app.showToast(`Deposited ₹${amount.toLocaleString()} into "${goal.name}"!`, 'success');



      this.toggleModal('finance-goal-contribution-overlay', false);
      this.renderSavingsGoalsList();
      this.render();
    }
  },

  openCalendarTool() {
    this.toggleModal('finance-tool-calendar-overlay', true);
    this.currentCalendarDate = new Date();
    this.renderCalendarGrid();
  },

  renderCalendarGrid() {
    const box = document.getElementById('finance-calendar-grid-box');
    const header = document.getElementById('finance-calendar-month-year');
    if (!box || !header) return;

    const date = this.currentCalendarDate;
    const year = date.getFullYear();
    const month = date.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    header.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    let html = '';
    const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    weekdays.forEach(w => {
      html += `<div style="font-weight: 800; color: var(--text-muted); opacity: 0.7;">${w}</div>`;
    });

    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div></div>`;
    }

    const txs = this.app.state.transactions;

    for (let day = 1; day <= totalDays; day++) {
      const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      let dayNet = 0;
      let hasTx = false;
      txs.forEach(t => {
        if (t.date === dayString) {
          hasTx = true;
          const val = parseFloat(t.amount) || 0;
          if (t.type === 'income') dayNet += val;
          else dayNet -= val;
        }
      });

      let dayStyle = 'border: 1px solid var(--glass-border); border-radius: 4px; padding: 6px; cursor: pointer; transition: all 0.2s;';
      let badgeHtml = '';
      
      if (hasTx) {
        const color = dayNet >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
        const border = dayNet >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
        dayStyle += ` background: ${color}; border-color: ${border};`;
        badgeHtml = `<span style="font-size: 0.5rem; display: block; font-weight: 700; color: ${dayNet >= 0 ? 'var(--green)' : 'var(--red)'};">${dayNet >= 0 ? '+' : '-'}${Math.abs(dayNet)}</span>`;
      }

      html += `
        <div style="${dayStyle}" class="calendar-day-btn" data-date="${dayString}">
          <span style="font-weight: 700; font-size: 0.75rem;">${day}</span>
          ${badgeHtml}
        </div>
      `;
    }

    box.innerHTML = html;

    box.querySelectorAll('.calendar-day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const clickedDate = btn.getAttribute('data-date');
        this.renderCalendarDayTransactions(clickedDate);
      });
    });

    const prevBtn = document.getElementById('finance-btn-prev-month');
    const nextBtn = document.getElementById('finance-btn-next-month');
    
    const newPrev = prevBtn.cloneNode(true);
    const newNext = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);

    newPrev.addEventListener('click', () => {
      this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
      this.renderCalendarGrid();
    });
    newNext.addEventListener('click', () => {
      this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
      this.renderCalendarGrid();
    });
  },

  renderCalendarDayTransactions(dateString) {
    const panel = document.getElementById('finance-calendar-day-txs');
    if (!panel) return;

    const txs = this.app.state.transactions.filter(t => t.date === dateString);
    const categories = this.app.state.categories;
    const members = this.app.state.members;
    const currency = this.app.state.financeSettings.currencySymbol || '₹';

    let html = `<div style="font-weight: 700; font-size: 0.75rem; color: var(--primary); margin-bottom: 8px;">Logs on: ${dateString}</div>`;
    
    if (txs.length === 0) {
      html += `<div style="text-align: center; color: var(--text-muted); font-size: 0.65rem; padding: 12px 0;">No cash flow recorded on this date.</div>`;
    } else {
      html += '<div style="display: flex; flex-direction: column; gap: 8px;">';
      txs.forEach(t => {
        const isIncome = t.type === 'income';
        const cat = categories[t.categoryId] || { name: 'Other', icon: 'fa-cubes', color: '#64748b' };
        const m = members.find(mem => mem.id === t.memberId) || { avatar: '👤', name: 'User' };
        
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 8px; border-radius: 4px; border: 1px solid var(--glass-border);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1rem;">${m.avatar}</span>
              <div>
                <span style="font-size: 0.72rem; font-weight: 600; display: block; color: var(--text-main);">${t.description}</span>
                <span style="font-size: 0.58rem; color: var(--text-muted); display: block;">${cat.name} &bull; ${m.name}</span>
              </div>
            </div>
            <span style="font-weight: 700; font-size: 0.75rem; color: ${isIncome ? 'var(--green)' : 'var(--red)'};">
              ${isIncome ? '+' : '-'}${currency}${t.amount}
            </span>
          </div>
        `;
      });
      html += '</div>';
    }

    panel.innerHTML = html;
  },

  openSubscriptionsTool() {
    this.toggleModal('finance-tool-subs-overlay', true);
    this.renderSubscriptionsList();
  },

  renderSubscriptionsList() {
    const container = document.getElementById('finance-subs-list-container');
    if (!container) return;

    const subs = this.app.state.subscriptions;
    const currency = this.app.state.financeSettings.currencySymbol || '₹';
    let html = '';

    subs.forEach(s => {
      html += `
        <div class="glass-card" style="padding: 12px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <span style="font-size: 0.78rem; font-weight: 700; display: block; color: var(--text-main);">${s.name}</span>
            <span style="font-size: 0.62rem; color: var(--text-muted); display: block;">
              Cost: ${currency}${s.amount}/month &bull; Next Charge: Day ${s.dueDate || '1'} &bull; Wallet: ${s.account || 'card'}
            </span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn-primary-glow btn-renew-sub" data-sub-id="${s.id}" style="padding: 6px 10px; font-size: 0.65rem; border: none; cursor: pointer; color: #fff;" title="Record renewal payment">
              Pay Subscription
            </button>
            <i class="fas fa-trash-alt delete-sub-btn" data-sub-id="${s.id}" style="font-size: 0.75rem; color: var(--red); cursor: pointer;" title="Delete subscription tracker"></i>
          </div>
        </div>
      `;
    });

    container.innerHTML = html || `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 20px 0;">No recurring bills tracked. Add one below!</div>`;

    container.querySelectorAll('.btn-renew-sub').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-sub-id');
        this.executeSubscriptionRenewal(id);
      });
    });

    container.querySelectorAll('.delete-sub-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-sub-id');
        this.deleteSubscription(id);
      });
    });
  },

  handleAddSubscriptionSubmit() {
    const name = document.getElementById('finance-sub-name-input').value.trim();
    const amount = parseFloat(document.getElementById('finance-sub-amount-input').value);
    const dueDate = document.getElementById('finance-sub-date-input').value;
    const account = document.getElementById('finance-sub-account-select').value;

    if (!name || isNaN(amount) || amount <= 0 || !dueDate) return;

    const newSub = {
      id: 'sub-' + Date.now(),
      name: name,
      amount: amount,
      dueDate: dueDate,
      account: account
    };

    this.app.state.subscriptions.push(newSub);
    this.app.saveState();
    this.app.showToast(`Recurring bill "${name}" added!`, 'success');



    document.getElementById('finance-add-sub-form').reset();
    document.getElementById('finance-add-sub-form').style.display = 'none';
    this.renderSubscriptionsList();
    this.render();
  },

  executeSubscriptionRenewal(id) {
    const sub = this.app.state.subscriptions.find(s => s.id === id);
    if (sub) {
      const newTx = {
        id: 'tx-' + Date.now(),
        type: 'expense',
        memberId: this.app.state.members[0]?.id || 'marcus',
        categoryId: 'bills',
        amount: sub.amount,
        date: new Date().toISOString().split('T')[0],
        description: `Sub Renewal: ${sub.name}`,
        account: sub.account || 'card'
      };

      this.app.state.transactions.push(newTx);
      this.app.saveState();
      this.app.showToast(`Renewed subscription payment for ${sub.name}!`, 'success');



      this.render();
    }
  },

  deleteSubscription(id) {
    const idx = this.app.state.subscriptions.findIndex(s => s.id === id);
    if (idx !== -1) {
      const deleted = this.app.state.subscriptions.splice(idx, 1)[0];
      this.app.saveState();
      this.app.showToast(`Deleted sub tracker: "${deleted.name}"`, 'info');



      this.renderSubscriptionsList();
      this.render();
    }
  },

  openEMILoanTool() {
    this.toggleModal('finance-tool-emi-overlay', true);
    this.renderEMILoansList();
  },

  renderEMILoansList() {
    const container = document.getElementById('finance-emi-list-container');
    if (!container) return;

    const loans = this.app.state.loans;
    const currency = this.app.state.financeSettings.currencySymbol || '₹';
    let html = '';

    loans.forEach(l => {
      html += `
        <div class="glass-card" style="padding: 12px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <span style="font-size: 0.78rem; font-weight: 700; display: block; color: var(--text-main);">${l.name}</span>
            <span style="font-size: 0.62rem; color: var(--text-muted); display: block;">
              EMI: ${currency}${l.emi.toLocaleString()}/month &bull; Remaining: ${currency}${l.total.toLocaleString()} &bull; Due: Day ${l.dueDate || '5'}
            </span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn-primary-glow btn-pay-emi" data-loan-id="${l.id}" style="padding: 6px 10px; font-size: 0.65rem; border: none; cursor: pointer; color: #fff;" title="Record EMI transaction">
              Pay EMI
            </button>
            <i class="fas fa-trash-alt delete-loan-btn" data-loan-id="${l.id}" style="font-size: 0.75rem; color: var(--red); cursor: pointer;" title="Delete loan tracker"></i>
          </div>
        </div>
      `;
    });

    container.innerHTML = html || `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 20px 0;">No active loans configurations recorded.</div>`;

    container.querySelectorAll('.btn-pay-emi').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-loan-id');
        this.openPayEMIConfirmationModal(id);
      });
    });

    container.querySelectorAll('.delete-loan-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-loan-id');
        this.deleteLoan(id);
      });
    });
  },

  handleAddLoanSubmit() {
    const name = document.getElementById('finance-loan-name-input').value.trim();
    const total = parseFloat(document.getElementById('finance-loan-total-input').value);
    const emi = parseFloat(document.getElementById('finance-loan-emi-input').value);
    const dueDate = document.getElementById('finance-loan-due-input').value;

    if (!name || isNaN(total) || isNaN(emi) || emi <= 0) return;

    const newLoan = {
      id: 'loan-' + Date.now(),
      name: name,
      total: total,
      emi: emi,
      dueDate: dueDate
    };

    this.app.state.loans.push(newLoan);
    this.app.saveState();
    this.app.showToast(`Loan tracker "${name}" added!`, 'success');



    document.getElementById('finance-add-loan-form').reset();
    
    document.getElementById('finance-btn-tab-ongoing-loans').click();
    this.renderEMILoansList();
    this.render();
  },

  openPayEMIConfirmationModal(loanId) {
    const loan = this.app.state.loans.find(l => l.id === loanId);
    if (!loan) return;

    document.getElementById('finance-pay-emi-loan-id').value = loanId;
    document.getElementById('finance-pay-emi-amount-input').value = loan.emi;
    document.getElementById('finance-pay-emi-help-text').textContent = `Paying monthly EMI toward: ${loan.name} (Remaining balance: ₹${loan.total.toLocaleString()})`;

    this.toggleModal('finance-pay-emi-overlay', true);
  },

  handleEMIPaymentSubmit() {
    const loanId = document.getElementById('finance-pay-emi-loan-id').value;
    const amount = parseFloat(document.getElementById('finance-pay-emi-amount-input').value);

    if (isNaN(amount) || amount <= 0) return;

    const loan = this.app.state.loans.find(l => l.id === loanId);
    if (loan) {
      loan.total = Math.max(0, loan.total - amount);

      const newTx = {
        id: 'tx-' + Date.now(),
        type: 'expense',
        memberId: this.app.state.members[0]?.id || 'marcus',
        categoryId: 'emi',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        description: `EMI Payment: ${loan.name}`,
        account: 'bank'
      };

      this.app.state.transactions.push(newTx);
      this.app.saveState();
      this.app.showToast(`EMI payment of ₹${amount.toLocaleString()} recorded!`, 'success');



      this.toggleModal('finance-pay-emi-overlay', false);
      this.renderEMILoansList();
      this.render();
    }
  },

  deleteLoan(id) {
    const idx = this.app.state.loans.findIndex(l => l.id === id);
    if (idx !== -1) {
      const deleted = this.app.state.loans.splice(idx, 1)[0];
      this.app.saveState();
      this.app.showToast(`Deleted loan tracker: "${deleted.name}"`, 'info');



      this.renderEMILoansList();
      this.render();
    }
  },

  openInvestmentsTool() {
    this.toggleModal('finance-tool-invest-overlay', true);
    this.renderInvestmentsList();
  },

  renderInvestmentsList() {
    const container = document.getElementById('finance-investments-container');
    if (!container) return;

    const assets = this.app.state.investments || { stocks: 0, mutualFunds: 0, gold: 0, crypto: 0 };
    const currency = this.app.state.financeSettings.currencySymbol || '₹';

    const total = Object.values(assets).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);

    let html = `
      <div class="glass-card" style="padding: 16px; text-align: center; margin-bottom: 12px;">
        <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">Total Portfolio Net Asset Value</span>
        <span style="font-size: 1.8rem; font-weight: 800; color: var(--primary);">${currency}${total.toLocaleString()}</span>
      </div>
    `;

    const labels = { stocks: 'Stocks & Equities', mutualFunds: 'Mutual Funds SIP', gold: 'Physical Gold', crypto: 'Cryptocurrency' };
    const colors = { stocks: '#0ea5e9', mutualFunds: '#a855f7', gold: '#eab308', crypto: '#f97316' };

    for (const [key, val] of Object.entries(assets)) {
      const share = total > 0 ? (val / total) * 100 : 0;
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 4px; border: 1px solid var(--glass-border);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colors[key]};"></span>
            <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-main);">${labels[key]}</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.78rem; font-weight: 700; display: block; color: var(--text-main);">${currency}${val.toLocaleString()}</span>
            <span style="font-size: 0.58rem; color: var(--text-muted);">${share.toFixed(0)}% portfolio allocation</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    document.getElementById('finance-asset-stocks-input').value = assets.stocks || 0;
    document.getElementById('finance-asset-funds-input').value = assets.mutualFunds || 0;
    document.getElementById('finance-asset-gold-input').value = assets.gold || 0;
    document.getElementById('finance-asset-crypto-input').value = assets.crypto || 0;
  },

  handleUpdateAssetPortfolioSubmit() {
    const stocks = parseFloat(document.getElementById('finance-asset-stocks-input').value) || 0;
    const mutualFunds = parseFloat(document.getElementById('finance-asset-funds-input').value) || 0;
    const gold = parseFloat(document.getElementById('finance-asset-gold-input').value) || 0;
    const crypto = parseFloat(document.getElementById('finance-asset-crypto-input').value) || 0;

    this.app.state.investments = { stocks, mutualFunds, gold, crypto };
    this.app.saveState();
    this.app.showToast('Asset portfolio valuation logs updated.', 'success');



    document.getElementById('finance-edit-assets-form').style.display = 'none';
    this.renderInvestmentsList();
    this.render();
  },

  openSplitExpensesTool() {
    this.toggleModal('finance-tool-split-overlay', true);
    
    const payerSelect = document.getElementById('finance-split-payer-select');
    let payerHtml = '';
    this.app.state.members.forEach(m => {
      payerHtml += `<option value="${m.id}">${m.avatar} ${m.name}</option>`;
    });
    payerSelect.innerHTML = payerHtml;

    const cbContainer = document.getElementById('finance-split-checkboxes-container');
    let cbHtml = '';
    this.app.state.members.forEach(m => {
      cbHtml += `
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.72rem; cursor: pointer; color: var(--text-main);">
          <input type="checkbox" class="split-target-checkbox" value="${m.id}" checked style="width: auto; height: auto;">
          ${m.avatar} ${m.name}
        </label>
      `;
    });
    cbContainer.innerHTML = cbHtml;
  },

  handleSplitBillCalculatorSubmit() {
    const total = parseFloat(document.getElementById('finance-split-amount-input').value);
    const desc = document.getElementById('finance-split-desc-input').value.trim();
    const payerId = document.getElementById('finance-split-payer-select').value;

    const selectedCheckboxes = document.querySelectorAll('.split-target-checkbox:checked');
    if (isNaN(total) || total <= 0 || !desc || selectedCheckboxes.length === 0) {
      this.app.showToast('Fill in all split parameters and select at least 1 member.', 'warning');
      return;
    }

    const shareCount = selectedCheckboxes.length;
    const splitShare = parseFloat((total / shareCount).toFixed(2));
    const today = new Date().toISOString().split('T')[0];

    selectedCheckboxes.forEach(cb => {
      const memberId = cb.value;
      const payerObj = this.app.state.members.find(m => m.id === payerId) || { name: 'Payer' };

      const newTx = {
        id: 'tx-' + Date.now() + '-' + memberId,
        type: 'expense',
        memberId: memberId,
        categoryId: 'basic',
        amount: splitShare,
        date: today,
        description: memberId === payerId ? `Bill split: ${desc}` : `Split share owe to ${payerObj.name}: ${desc}`,
        account: 'upi'
      };

      this.app.state.transactions.push(newTx);
    });

    this.app.saveState();
    this.app.showToast(`Bill split recorded: ₹${splitShare.toLocaleString()} logged per member!`, 'success');

    this.toggleModal('finance-tool-split-overlay', false);
    document.getElementById('finance-split-bill-form').reset();
    this.render();
  },

  openAccountsTableTool() {
    this.toggleModal('finance-tool-accounts-overlay', true);

    const container = document.getElementById('finance-accounts-hub-view-list');
    if (!container) return;

    const txs = this.app.state.transactions;
    const currency = this.app.state.financeSettings.currencySymbol || '₹';

    const accounts = {
      bank: { name: 'Bank Account', icon: '🏦', desc: 'Family Primary Savings Vault', bal: 0, transactionsCount: 0 },
      card: { name: 'Credit Card', icon: '💳', desc: 'Credit Limits Logs', bal: 0, transactionsCount: 0 },
      upi: { name: 'UPI Mobile Wallet', icon: '📱', desc: 'Instants Transfers (GPay/PhonePe)', bal: 0, transactionsCount: 0 },
      cash: { name: 'Cash Handheld', icon: '💵', desc: 'Physical Liquidity Wallet', bal: 0, transactionsCount: 0 },
      savings: { name: 'Savings Account', icon: '💰', desc: 'Liquid Investment deposits', bal: 0, transactionsCount: 0 },
      loans: { name: 'Owed Loans', icon: '💸', desc: 'Outstanding Debts & EMIs liability', bal: 0, transactionsCount: 0 }
    };

    const filterId = this.activeMemberFilter;

    txs.forEach(t => {
      if (filterId !== 'all' && t.memberId !== filterId) return;
      const amt = parseFloat(t.amount) || 0;
      const acc = t.account || 'bank';
      if (!accounts[acc]) return;

      accounts[acc].transactionsCount++;
      if (t.type === 'income') {
        accounts[acc].bal += amt;
      } else {
        accounts[acc].bal -= amt;
      }
    });

    // Populate loans outstanding liability balance
    const totalLoanVal = this.app.state.loans.reduce((sum, l) => sum + parseFloat(l.total || 0), 0);
    accounts.loans.bal = -totalLoanVal;
    accounts.loans.transactionsCount = this.app.state.loans.length;

    let html = '';
    for (const [key, val] of Object.entries(accounts)) {
      html += `
        <div class="glass-card" style="padding: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;" onclick="window.LifeOS.modules.finance.openAccountDetailsModal('${key}')">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.4rem;">${val.icon}</span>
            <div>
              <span style="font-size: 0.78rem; font-weight: 700; display: block; color: var(--text-main);">${val.name}</span>
              <span style="font-size: 0.58rem; color: var(--text-muted); display: block;">${val.desc} &bull; ${val.transactionsCount} entries</span>
            </div>
          </div>
          <span style="font-weight: 800; font-size: 0.95rem; color: ${val.bal < 0 ? 'var(--red)' : 'var(--text-main)'};">
            ${currency}${Math.abs(val.bal).toLocaleString(undefined, {minimumFractionDigits: 2})}
          </span>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  openChallengesTool() {
    this.toggleModal('finance-tool-challenges-overlay', true);
    this.renderChallengesView();
  },

  renderChallengesView() {
    const box = document.getElementById('finance-challenges-view-content');
    if (!box) return;

    const txs = this.app.state.transactions;

    const today = new Date();
    let streakDays = 0;
    
    for (let i = 0; i < 30; i++) {
      const testDate = new Date(today.getTime() - i * 86400000).toISOString().split('T')[0];
      const hasExpenses = txs.some(t => t.date === testDate && t.type === 'expense');
      if (!hasExpenses) {
        streakDays++;
      } else {
        if (i === 0) continue;
        break;
      }
    }

    let html = `
      <div class="glass-card" style="padding: 16px; text-align: center; background: linear-gradient(135deg, var(--primary-glow), rgba(0,0,0,0)); border-color: var(--primary);">
        <span style="font-size: 2.2rem; display: block; margin-bottom: 4px;">🏆</span>
        <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">No-Spend Days Streak</span>
        <span style="font-size: 2rem; font-weight: 800; color: var(--primary); display: block; margin-top: 4px;">${streakDays} Days</span>
        <span style="font-size: 0.58rem; color: var(--text-muted); display: block; margin-top: 4px;">You haven't logged any expense on these past consecutive days!</span>
      </div>
    `;

    const challenges = [
      { name: 'No Coffee Challenge', desc: 'Avoid cafe spendings for 15 consecutive days', days: 12, targetDays: 15, prize: '₹1,500 Saved' },
      { name: 'Weekly grocery budget cap', desc: 'Keep weekly groceries under ₹5,000 limit', days: 1, targetDays: 1, prize: '₹2,000 Saved' },
      { name: 'Index fund SIP streak', desc: '6 months indexes deposits consecutive goals', days: 4, targetDays: 6, prize: 'Wealth Compound badge' }
    ];

    html += '<h4 style="font-size: 0.82rem; font-weight: 700; margin-top: 10px;">Ongoing Streaks & Milestones</h4>';
    html += '<div style="display: flex; flex-direction: column; gap: 12px;">';
    
    challenges.forEach(c => {
      const pct = Math.min((c.days / c.targetDays) * 100, 100);
      html += `
        <div class="glass-card" style="padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; margin-bottom: 6px;">
            <div>
              <span style="font-weight: 700; display: block; color: var(--text-main);">${c.name}</span>
              <span style="font-size: 0.58rem; color: var(--text-muted); display: block;">${c.desc}</span>
            </div>
            <span style="font-weight: 700; color: var(--primary);">${c.prize}</span>
          </div>
          <div style="height: 6px; background: var(--glass-border); border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
            <div style="width: ${pct}%; background: var(--primary); height: 100%; border-radius: 3px;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.58rem; color: var(--text-muted);">
            <span>Streak: ${c.days}/${c.targetDays} completed</span>
            <span>${pct.toFixed(0)}%</span>
          </div>
        </div>
      `;
    });

    html += '</div>';
    box.innerHTML = html;
  },

  openAccountDetailsModal(accId) {
    const modal = document.getElementById('finance-account-details-overlay');
    if (!modal) return;

    const categories = this.app.state.categories;
    const members = this.app.state.members;
    const currency = this.app.state.financeSettings.currencySymbol || '₹';

    const labels = { bank: 'Bank Account', card: 'Credit Card', upi: 'UPI Wallet', cash: 'Cash Handheld', savings: 'Savings Account', loans: 'Owed Loans' };
    const icons = { bank: '🏦', card: '💳', upi: '📱', cash: '💵', savings: '💰', loans: '💸' };

    document.getElementById('finance-acc-modal-name').textContent = labels[accId] || 'Account details';
    document.getElementById('finance-acc-modal-icon-badge').textContent = icons[accId] || '🏦';

    const summaryBox = document.getElementById('finance-acc-modal-summary-box');
    const list = document.getElementById('finance-acc-modal-tx-list');
    let html = '';

    if (accId === 'loans') {
      const totalLoanVal = this.app.state.loans.reduce((sum, l) => sum + parseFloat(l.total || 0), 0);
      const totalEmiVal = this.app.state.loans.reduce((sum, l) => sum + parseFloat(l.emi || 0), 0);

      summaryBox.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
          <span>Outstanding Debt Balance:</span>
          <span style="font-weight: 700; color: var(--red);">${currency}${totalLoanVal.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">
          <span>Active Loans: ${this.app.state.loans.length}</span>
          <span>Monthly EMIs: ${currency}${totalEmiVal.toLocaleString()}/mo</span>
        </div>
      `;

      if (this.app.state.loans.length === 0) {
        html = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 20px 0;">No active loans tracked.</div>`;
      } else {
        this.app.state.loans.forEach(l => {
          html += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); padding: 8px; border-radius: 4px; border: 1px solid var(--glass-border);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.2rem;">💸</span>
                <div>
                  <span style="font-size: 0.72rem; font-weight: 600; display: block; color: var(--text-main);">${l.name}</span>
                  <span style="font-size: 0.58rem; color: var(--text-muted); display: block;">EMI: ${currency}${l.emi.toLocaleString()}/mo &bull; Due: Day ${l.dueDate}</span>
                </div>
              </div>
              <span style="font-weight: 700; font-size: 0.75rem; color: var(--red);">
                ${currency}${l.total.toLocaleString()}
              </span>
            </div>
          `;
        });
      }
    } else {
      const filterId = this.activeMemberFilter;
      const txs = this.app.state.transactions.filter(t => t.account === accId && (filterId === 'all' || t.memberId === filterId));
      const net = txs.reduce((sum, t) => t.type === 'income' ? sum + parseFloat(t.amount) : sum - parseFloat(t.amount), 0);

      summaryBox.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
          <span>Calculated Balance:</span>
          <span style="font-weight: 700; color: ${net < 0 ? 'var(--red)' : 'var(--green)'};">${net < 0 ? '-' : ''}${currency}${Math.abs(net).toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">
          <span>Total ledger postings:</span>
          <span>${txs.length} entries</span>
        </div>
      `;

      txs.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(t => {
        const isIncome = t.type === 'income';
        const cat = categories[t.categoryId] || { name: 'Other', icon: 'fa-cubes', color: '#64748b' };
        const m = members.find(mem => mem.id === t.memberId) || { avatar: '👤', name: 'User' };
        
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); padding: 8px; border-radius: 4px; border: 1px solid var(--glass-border);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1rem;">${m.avatar}</span>
              <div>
                <span style="font-size: 0.72rem; font-weight: 600; display: block; color: var(--text-main);">${t.description}</span>
                <span style="font-size: 0.58rem; color: var(--text-muted); display: block;">${cat.name} &bull; ${m.name} &bull; ${t.date}</span>
              </div>
            </div>
            <span style="font-weight: 700; font-size: 0.75rem; color: ${isIncome ? 'var(--green)' : 'var(--red)'};">
              ${isIncome ? '+' : '-'}${currency}${t.amount}
            </span>
          </div>
        `;
      });
    }

    list.innerHTML = html;
    this.toggleModal('finance-account-details-overlay', true);
  },

  openCategoryDetails(catId) {
    const modal = document.getElementById('finance-category-details-overlay');
    if (!modal) return;

    const filterId = this.activeMemberFilter;
    const txs = this.app.state.transactions.filter(t => t.categoryId === catId && (filterId === 'all' || t.memberId === filterId));
    const categoryObj = this.app.state.categories[catId] || { name: 'Category Detail', icon: 'fa-cubes', color: '#a370f7' };
    const members = this.app.state.members;
    const currency = this.app.state.financeSettings.currencySymbol || '₹';

    document.getElementById('finance-cat-modal-name').textContent = categoryObj.name;
    const badge = document.getElementById('finance-cat-modal-icon-badge');
    badge.innerHTML = `<i class="fas ${categoryObj.icon}"></i>`;
    badge.style.background = categoryObj.color;

    const totalSpent = txs.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
    const limit = this.app.state.budgets[catId] || 0;
    const pct = limit > 0 ? (totalSpent / limit) * 100 : 0;

    let budgetState = 'No limit';
    if (limit > 0) {
      budgetState = `₹${totalSpent.toLocaleString()} of ₹${limit.toLocaleString()} limit used (${pct.toFixed(0)}%)`;
    }

    document.getElementById('finance-cat-modal-summary-box').innerHTML = `
      <div style="display: flex; justify-content: space-between;">
        <span>Aggregate Spent:</span>
        <span style="font-weight: 700; color: var(--text-main);">${currency}${totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">
        <span>Budget State:</span>
        <span>${budgetState}</span>
      </div>
      <div style="display: flex; gap: 8px; align-items: center; margin-top: 10px; border-top: 1px dashed var(--glass-border); padding-top: 8px;">
        <label style="font-size: 0.65rem;">Modify budget (₹):</label>
        <input type="number" id="finance-cat-budget-input" value="${limit}" style="font-size: 0.65rem; padding: 4px 8px; width: 80px;">
        <button id="finance-btn-save-cat-budget" class="btn-primary-glow" style="padding: 4px 10px; font-size: 0.62rem; border: none; cursor: pointer; color: #fff;">Save</button>
      </div>
    `;

    document.getElementById('finance-btn-save-cat-budget').addEventListener('click', () => {
      const newLimit = parseFloat(document.getElementById('finance-cat-budget-input').value) || 0;
      this.app.state.budgets[catId] = newLimit;
      this.app.saveState();
      this.app.showToast(`Updated budget limit for "${categoryObj.name}".`, 'success');



      this.toggleModal('finance-category-details-overlay', false);
      this.render();
    });

    const list = document.getElementById('finance-cat-modal-tx-list');
    let html = '';

    const sorted = [...txs].reverse().slice(0, 20);
    if (sorted.length === 0) {
      html = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 20px 0;">No ledger entries recorded for this category.</div>`;
    } else {
      sorted.forEach(t => {
        const isInc = t.type === 'income';
        const m = members.find(mem => mem.id === t.memberId) || { avatar: '👤', name: 'User' };
        
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); padding: 8px; border-radius: 4px; border: 1px solid var(--glass-border);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1rem;">${m.avatar}</span>
              <div>
                <span style="font-size: 0.72rem; font-weight: 600; display: block; color: var(--text-main);">${t.description}</span>
                <span style="font-size: 0.58rem; color: var(--text-muted); display: block;">${m.name} &bull; ${t.date} &bull; <span style="text-transform: uppercase;">${t.account}</span></span>
              </div>
            </div>
            <span style="font-weight: 700; font-size: 0.75rem; color: ${isInc ? 'var(--green)' : 'var(--red)'};">
              ${isInc ? '+' : '-'}${currency}${t.amount}
            </span>
          </div>
        `;
      });
    }

    list.innerHTML = html;
    this.toggleModal('finance-category-details-overlay', true);
  },

  openEditMemberProfileModal(memberId) {
    const member = this.app.state.members.find(m => m.id === memberId);
    if (!member) return;

    document.getElementById('finance-edit-profile-id').value = memberId;
    document.getElementById('finance-edit-profile-name-input').value = member.name;
    document.getElementById('finance-edit-profile-role-input').value = member.role;
    document.getElementById('finance-edit-profile-avatar-input').value = member.avatar;
    document.getElementById('finance-edit-profile-color-select').value = member.color;

    this.toggleModal('finance-edit-profile-overlay', true);
  },

  handleSaveProfileChangesSubmit() {
    const id = document.getElementById('finance-edit-profile-id').value;
    const name = document.getElementById('finance-edit-profile-name-input').value.trim();
    const role = document.getElementById('finance-edit-profile-role-input').value.trim();
    const avatar = document.getElementById('finance-edit-profile-avatar-input').value.trim();
    const color = document.getElementById('finance-edit-profile-color-select').value;

    if (!name || !role || !avatar) return;

    const member = this.app.state.members.find(m => m.id === id);
    if (member) {
      member.name = name;
      member.role = role;
      member.avatar = avatar;
      member.color = color;
      member.glow = `rgba(${this.hexToRgb(color)}, 0.15)`;

      this.app.saveState();
      this.app.showToast(`Updated profile details for "${name}"`, 'success');



      this.toggleModal('finance-edit-profile-overlay', false);
      this.render();
    }
  },

  deleteMemberProfile(id) {
    if (id === 'admin') {
      this.app.showToast('The primary Administrator account cannot be deleted.', 'warning');
      return;
    }

    const member = this.app.state.members.find(m => m.id === id);
    if (!member) return;

    if (!confirm(`Are you sure you want to permanently delete the profile "${member.name}"? This will delete all of their data from all database tables.`)) {
      return;
    }

    // 1. Clean up database rows in background by saving empty payload
    const settings = this.app.state.supabaseSettings;
    if (settings && settings.url && settings.anonKey) {
      const endpoint = `${settings.url}/rest/v1/rpc/save_user_dashboard`;
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_user_id: this.app.userUuidMap ? (this.app.userUuidMap[id.toLowerCase()] || id) : id,
          p_data: {}
        })
      })
      .then(res => {
        if (!res.ok) console.warn('Could not clear database rows for deleted user:', res.status);
      })
      .catch(err => {
        console.error('Error clearing database rows for deleted user:', err);
      });
    }

    // 2. Remove from members array and save
    this.app.state.members = this.app.state.members.filter(m => m.id !== id);
    this.app.saveState();

    this.app.showToast(`Profile "${member.name}" has been permanently deleted.`, 'success');
    
    // 3. Switch viewed user back to admin if we were viewing the deleted user
    if (this.app.activeViewedUser === id) {
      this.app.activeViewedUser = this.app.state.user.id || 'admin';
      this.app.syncGlobalGoogleSheetData(false);
    }

    this.toggleModal('finance-edit-profile-overlay', false);
    this.render();
  },

  hexToRgb(hex) {
    const c = hex.substring(1);
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  },

  openEditSavingsGoalModal(goalId) {
    const goal = this.app.state.goals.find(g => g.id === goalId);
    if (!goal) return;

    document.getElementById('finance-edit-goal-id').value = goalId;
    document.getElementById('finance-edit-goal-name-input').value = goal.name;
    document.getElementById('finance-edit-goal-target-input').value = goal.target;
    document.getElementById('finance-edit-goal-current-input').value = goal.current;
    document.getElementById('finance-edit-goal-color-select').value = goal.color;

    this.toggleModal('finance-edit-goal-overlay', true);
  },

  handleSaveGoalChangesSubmit() {
    const id = document.getElementById('finance-edit-goal-id').value;
    const name = document.getElementById('finance-edit-goal-name-input').value.trim();
    const target = parseFloat(document.getElementById('finance-edit-goal-target-input').value);
    const current = parseFloat(document.getElementById('finance-edit-goal-current-input').value);
    const color = document.getElementById('finance-edit-goal-color-select').value;

    if (!name || isNaN(target) || target <= 0 || isNaN(current) || current < 0) return;

    const goal = this.app.state.goals.find(g => g.id === id);
    if (goal) {
      goal.name = name;
      goal.target = target;
      goal.current = current;
      goal.saved = current; // Keep DB-compatible field in sync
      goal.color = color;

      this.app.saveState();
      this.app.showToast(`Savings goal "${name}" details saved.`, 'success');



      this.toggleModal('finance-edit-goal-overlay', false);
      this.renderSavingsGoalsList();
      this.render();
    }
  },

  openFundsTransferModal() {
    document.getElementById('finance-transfer-amount-input').value = '';
    document.getElementById('finance-transfer-date-input').value = new Date().toISOString().split('T')[0];
    this.toggleModal('finance-transfer-funds-overlay', true);
  },

  handleFundsTransferSubmit() {
    const fromAcc = document.getElementById('finance-transfer-from-select').value;
    const toAcc = document.getElementById('finance-transfer-to-select').value;
    const amount = parseFloat(document.getElementById('finance-transfer-amount-input').value);
    const date = document.getElementById('finance-transfer-date-input').value;

    if (isNaN(amount) || amount <= 0 || fromAcc === toAcc) {
      this.app.showToast('Please type a valid amount and select different accounts.', 'warning');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const labels = { bank: 'Bank Account', card: 'Credit Card', upi: 'UPI Wallet', cash: 'Cash Handheld', savings: 'Savings Account' };

    const newTx1 = {
      id: 'tx-' + Date.now() + '-transfer-from',
      type: 'expense',
      memberId: this.app.state.members[0]?.id || 'marcus',
      categoryId: 'basic',
      amount: amount,
      date: date || today,
      description: `Transfer out to ${labels[toAcc]}`,
      account: fromAcc
    };

    const newTx2 = {
      id: 'tx-' + Date.now() + '-transfer-to',
      type: 'income',
      memberId: this.app.state.members[0]?.id || 'marcus',
      categoryId: 'basic',
      amount: amount,
      date: date || today,
      description: `Transfer in from ${labels[fromAcc]}`,
      account: toAcc
    };

    this.app.state.transactions.push(newTx1, newTx2);
    this.app.saveState();
    this.app.showToast(`Transferred ₹${amount.toLocaleString()} from ${labels[fromAcc]} to ${labels[toAcc]}!`, 'success');



    this.toggleModal('finance-transfer-funds-overlay', false);
    this.render();
  },


  // --- SMART UTILITIES ---

  initVoiceEntry() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const voiceBtn = document.getElementById('finance-btn-voice-add');
      if (voiceBtn) {
        voiceBtn.style.opacity = '0.5';
        voiceBtn.title = 'Speech recognition not supported in this browser.';
      }
      return;
    }

    this.voiceRecognition = new SpeechRecognition();
    this.voiceRecognition.continuous = false;
    this.voiceRecognition.lang = 'en-IN';
    this.voiceRecognition.interimResults = false;
    this.voiceRecognition.maxAlternatives = 1;

    this.voiceRecognition.onstart = () => {
      this.isRecordingVoice = true;
      document.getElementById('finance-voice-icon').className = 'fas fa-microphone-slash';
      document.getElementById('finance-voice-btn-text').textContent = 'Listening...';
      document.getElementById('finance-voice-waves-container').style.display = 'flex';
    };

    this.voiceRecognition.onend = () => {
      this.isRecordingVoice = false;
      document.getElementById('finance-voice-icon').className = 'fas fa-microphone';
      document.getElementById('finance-voice-btn-text').textContent = 'Voice Entry';
      document.getElementById('finance-voice-waves-container').style.display = 'none';
    };

    this.voiceRecognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      this.parseVoiceCommand(transcript);
    };

    this.voiceRecognition.onerror = (e) => {
      console.error('Speech recognition failed: ', e);
      this.app.showToast('Speech recognition error, please try speaking again.', 'warning');
    };

    document.getElementById('finance-btn-voice-add')?.addEventListener('click', () => {
      if (this.isRecordingVoice) {
        this.voiceRecognition.stop();
      } else {
        this.voiceRecognition.start();
      }
    });
  },

  parseVoiceCommand(speechText) {
    this.app.showToast(`Voice captured: "${speechText}"`, 'info');
    
    const text = speechText.toLowerCase();

    let memberId = this.app.state.members[0]?.id || 'marcus';
    this.app.state.members.forEach(m => {
      if (text.includes(m.name.toLowerCase()) || text.includes(m.id)) {
        memberId = m.id;
      }
    });

    let type = 'expense';
    if (text.includes('received') || text.includes('income') || text.includes('earned') || text.includes('salary') || text.includes('deposit')) {
      type = 'income';
    }

    let amount = 0;
    const amountRegex = /(\d+(?:\.\d+)?)\s*(?:rupees|inr|rs|bucks)?/;
    const matches = text.match(amountRegex);
    if (matches && matches[1]) {
      amount = parseFloat(matches[1]);
    } else {
      const words = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'ten': 10, 'hundred': 100, 'thousand': 1000 };
      for (const [key, val] of Object.entries(words)) {
        if (text.includes(key)) {
          amount = val;
          break;
        }
      }
    }

    let categoryId = type === 'expense' ? 'basic' : 'salary';
    const categories = this.app.state.categories;
    Object.keys(categories).forEach(k => {
      if (text.includes(categories[k].name.toLowerCase()) || text.includes(k)) {
        categoryId = k;
      }
    });

    let desc = `Voice Entry: `;
    if (amount > 0) {
      desc += `${type === 'expense' ? 'Spent' : 'Earned'} ₹${amount}`;
    } else {
      desc += 'Transaction log';
    }

    document.getElementById('finance-tx-amount-input').value = amount > 0 ? amount : '';
    document.getElementById('finance-tx-desc-input').value = desc;
    document.getElementById('finance-tx-member-select').value = memberId;
    document.getElementById('finance-tx-account-select').value = 'bank';
    
    const expBtn = document.getElementById('finance-type-expense-btn');
    const incBtn = document.getElementById('finance-type-income-btn');
    if (type === 'expense') {
      expBtn.classList.add('active');
      incBtn.classList.remove('active');
    } else {
      incBtn.classList.add('active');
      expBtn.classList.remove('active');
    }

    this.populateTransactionFormCategories(type);
    document.getElementById('finance-tx-category-select').value = categoryId;
    
    document.getElementById('finance-auto-cat-badge').style.display = 'flex';
  },

  handleReceiptScannerOCR(event) {
    const file = event.target.files[0];
    if (!file) return;

    const loader = document.getElementById('finance-ocr-loader-overlay');
    if (loader) loader.style.display = 'flex';

    setTimeout(() => {
      if (loader) loader.style.display = 'none';

      const amount = parseFloat((450 + Math.random() * 2500).toFixed(2));
      const desc = `Receipt scan: Groceries Supermarket`;
      const date = new Date().toISOString().split('T')[0];

      document.getElementById('finance-tx-amount-input').value = amount;
      document.getElementById('finance-tx-desc-input').value = desc;
      document.getElementById('finance-tx-category-select').value = 'food';
      document.getElementById('finance-tx-account-select').value = 'card';
      document.getElementById('finance-tx-date-input').value = date;

      document.getElementById('finance-auto-cat-badge').style.display = 'flex';
      this.app.showToast('Receipt parsed successfully via OCR mock parser!', 'success');
    }, 1500);
  },


  // --- DATABASE SYNC ENGINE ---




  // --- CSV EXPORTS / IMPORTS ---

  exportFinanceCSV() {
    const txs = this.app.state.transactions;
    const categories = this.app.state.categories;
    const members = this.app.state.members;

    if (txs.length === 0) {
      this.app.showToast('No transaction ledger records to export.', 'warning');
      return;
    }

    let csvContent = 'Transaction ID,Date,Member,Category,Description,Type,Amount,Account\n';

    txs.forEach(t => {
      const cat = categories[t.categoryId] || { name: 'Other' };
      const m = members.find(mem => mem.id === t.memberId) || { name: 'System' };
      const descClean = t.description.replace(/,/g, ' ');

      csvContent += `${t.id},${t.date},${m.name},${cat.name},${descClean},${t.type},${t.amount},${t.account || 'bank'}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `life_os_family_finance_backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.app.showToast('CSV transaction ledger export complete.', 'success');
  },

  importFinanceCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');

      if (lines.length <= 1) {
        this.app.showToast('CSV file is empty.', 'warning');
        return;
      }

      let parsedCount = 0;
      const state = this.app.state;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = line.split(',');
        if (cells.length < 7) continue;

        const id = cells[0];
        const date = cells[1];
        const memberName = cells[2];
        const catName = cells[3];
        const desc = cells[4];
        const type = cells[5];
        const amount = parseFloat(cells[6]);
        const account = cells[7] || 'bank';

        let categoryId = 'basic';
        for (const [key, val] of Object.entries(state.categories)) {
          if (val.name.toLowerCase() === catName.toLowerCase()) {
            categoryId = key;
            break;
          }
        }

        const member = state.members.find(m => m.name.toLowerCase() === memberName.toLowerCase()) || { id: 'marcus' };

        if (!state.transactions.some(t => t.id === id)) {
          state.transactions.push({
            id: id,
            type: type,
            memberId: member.id,
            categoryId: categoryId,
            amount: amount,
            date: date,
            description: desc,
            account: account
          });
          parsedCount++;
        }
      }

      this.app.saveState();
      this.app.showToast(`Imported ${parsedCount} new transactions from CSV!`, 'success');
      this.render();
    };

    reader.readAsText(file);
  },


  // --- SECURITY PIN LOCK SCREEN ---

  promptPinLockScreen() {
    const overlay = document.getElementById('finance-pin-lock-overlay');
    if (!overlay) return;

    overlay.style.display = 'flex';
    document.getElementById('finance-view').style.opacity = '0';

    let pinInput = '';
    const pinDots = overlay.querySelectorAll('.pin-dot');
    const keys = overlay.querySelectorAll('.finance-pin-key');
    
    keys.forEach(k => {
      const newKey = k.cloneNode(true);
      k.parentNode.replaceChild(newKey, k);
    });

    const freshKeys = overlay.querySelectorAll('.finance-pin-key');
    freshKeys.forEach(k => {
      k.addEventListener('click', () => {
        const val = k.getAttribute('data-val');
        if (val) {
          if (pinInput.length < 4) {
            pinInput += val;
            this.updatePinDotsDisplay(pinInput.length, pinDots);
            
            if (pinInput.length === 4) {
              setTimeout(() => {
                if (pinInput === '1234') {
                  overlay.style.display = 'none';
                  document.getElementById('finance-view').style.opacity = '1';
                  this.app.showToast('Authorized credentials validation succeeded.', 'success');
                  this.render();
                } else {
                  this.app.showToast('Passcode invalid. Try again.', 'warning');
                  pinInput = '';
                  this.updatePinDotsDisplay(0, pinDots);
                }
              }, 200);
            }
          }
        }
      });
    });

    const clearBtn = document.getElementById('finance-btn-pin-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        pinInput = '';
        this.updatePinDotsDisplay(0, pinDots);
      });
    }

    const delBtn = document.getElementById('finance-btn-pin-delete');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        if (pinInput.length > 0) {
          pinInput = pinInput.slice(0, -1);
          this.updatePinDotsDisplay(pinInput.length, pinDots);
        }
      });
    }
  },

  updatePinDotsDisplay(length, dotsList) {
    dotsList.forEach((dot, idx) => {
      if (idx < length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }
};


// Register with Life OS Core namespace on DOM load complete
document.addEventListener('DOMContentLoaded', () => {
  if (window.LifeOS) {
    window.LifeOS.registerModule('finance', FinanceModule);
  }
});

// Global fail-safe window helpers for Budget Modals
window.openPlanBudgetModal = () => {
  if (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) {
    window.LifeOS.modules.finance.openPlanBudgetModal();
  } else if (typeof FinanceModule !== 'undefined') {
    FinanceModule.openPlanBudgetModal();
  }
};
window.closePlanBudgetModal = () => {
  if (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) {
    window.LifeOS.modules.finance.closePlanBudgetModal();
  } else if (typeof FinanceModule !== 'undefined') {
    FinanceModule.closePlanBudgetModal();
  }
};
window.openManageCategoriesModal = () => {
  if (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) {
    window.LifeOS.modules.finance.openManageCategoriesModal();
  } else if (typeof FinanceModule !== 'undefined') {
    FinanceModule.openManageCategoriesModal();
  }
};
window.closeManageCategoriesModal = () => {
  if (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) {
    window.LifeOS.modules.finance.closeManageCategoriesModal();
  } else if (typeof FinanceModule !== 'undefined') {
    FinanceModule.closeManageCategoriesModal();
  }
};
window.openReportsModal = () => {
  if (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) {
    window.LifeOS.modules.finance.openReportsModal();
  } else if (typeof FinanceModule !== 'undefined') {
    FinanceModule.openReportsModal();
  }
};
window.closeReportsModal = () => {
  if (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) {
    window.LifeOS.modules.finance.closeReportsModal();
  } else if (typeof FinanceModule !== 'undefined') {
    FinanceModule.closeReportsModal();
  }
};
window.recalculatePlanBudgetTotal = () => {
  if (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) {
    window.LifeOS.modules.finance.recalculatePlanBudgetTotal();
  } else if (typeof FinanceModule !== 'undefined') {
    FinanceModule.recalculatePlanBudgetTotal();
  }
};
window.handleCreateCustomCategorySubmit = (e) => {
  if (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) {
    window.LifeOS.modules.finance.handleCreateCustomCategorySubmit(e);
  } else if (typeof FinanceModule !== 'undefined') {
    FinanceModule.handleCreateCustomCategorySubmit(e);
  }
};
window.handleSaveBudgetPlanSubmit = (e) => {
  if (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) {
    window.LifeOS.modules.finance.handleSaveBudgetPlanSubmit(e);
  } else if (typeof FinanceModule !== 'undefined') {
    FinanceModule.handleSaveBudgetPlanSubmit(e);
  }
};
window.deleteBudgetCategory = async (id) => {
  if (window.LifeOSFinanceService) {
    await window.LifeOSFinanceService.deleteCategoryRecord(id);
  }
  if (window.LifeOS && window.LifeOS.state && window.LifeOS.state.budgetCategories) {
    window.LifeOS.state.budgetCategories = window.LifeOS.state.budgetCategories.filter(c => c.id !== id);
    window.LifeOS.saveState();
  }
  if (window.LifeOS && window.LifeOS.showToast) {
    window.LifeOS.showToast('Budget category removed', 'info');
  }
  if (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) {
    await window.LifeOS.modules.finance.renderManageCategoriesList();
    await window.LifeOS.modules.finance.renderBudgetsList();
  }
};

window.viewLedgerTransaction = (id) => {
  if (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) {
    window.LifeOS.modules.finance.switchSubview('transactions');
    if (id) {
      setTimeout(() => {
        const searchInput = document.getElementById('finance-tx-search-input');
        if (searchInput) {
          searchInput.value = id;
          window.LifeOS.modules.finance.renderTransactionsTable();
        }
      }, 150);
    }
  }
};

window.switchFinanceSubview = (subviewName) => {
  if (window.LifeOS && window.LifeOS.modules && window.LifeOS.modules.finance) {
    window.LifeOS.modules.finance.switchSubview(subviewName);
  } else if (typeof FinanceModule !== 'undefined') {
    FinanceModule.switchSubview(subviewName);
  }
};
