/* ==========================================================================
   LIFE OS - CHART SERVICE (services/chartService.js)
   Dynamic SVG Analytics Chart Generator for Budget & Finance Modules
   ========================================================================== */

window.LifeOSChartService = {
  // Render dynamic Budget (Purple) vs Actual (Green) SVG Bar Chart
  renderBudgetVsActualBarChart(containerId, categories) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!categories || categories.length === 0) {
      container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.75rem; padding:40px 0;">No category limit records logged.</div>`;
      return;
    }

    const topCategories = categories.slice(0, 6);
    const maxVal = Math.max(...topCategories.map(c => Math.max(Number(c.limit || 1), Number(c.spent || 0))), 1000);
    const groupWidth = 400 / topCategories.length;
    const barWidth = 14;

    let svgHtml = `<svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">`;

    topCategories.forEach((cat, idx) => {
      const limit = Number(cat.limit || 0);
      const spent = Number(cat.spent || 0);

      const budgetHeight = Math.min(Math.round((limit / maxVal) * 90), 90);
      const actualHeight = Math.min(Math.round((spent / maxVal) * 90), 90);

      const xBase = idx * groupWidth + (groupWidth - 34) / 2;

      svgHtml += `
        <!-- Budget Bar -->
        <rect x="${xBase}" y="${110 - budgetHeight}" width="${barWidth}" height="${budgetHeight}" fill="#a370f7" rx="3" />
        <!-- Actual Bar -->
        <rect x="${xBase + 16}" y="${110 - actualHeight}" width="${barWidth}" height="${actualHeight}" fill="#10b981" rx="3" />
        <!-- Label -->
        <text x="${xBase + 15}" y="130" font-size="9" fill="#94a3b8" text-anchor="middle">${cat.name.split(' ')[0]}</text>
      `;
    });

    svgHtml += `</svg>`;
    container.innerHTML = svgHtml;
  },

  // Render dynamic Donut Chart & Legend matching live spending proportions
  renderCategoryDonutChart(containerId, legendId, categories, totalSpent, currency = '₹') {
    const donutContainer = document.getElementById(containerId);
    const legendContainer = document.getElementById(legendId);
    if (!donutContainer || !legendContainer) return;

    if (!categories || categories.length === 0 || totalSpent <= 0) {
      donutContainer.innerHTML = `
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="40" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="14" />
          <text x="55" y="58" font-size="9" fill="#94a3b8" text-anchor="middle">₹0 Spent</text>
        </svg>
      `;
      legendContainer.innerHTML = `<span style="color:var(--text-muted); font-size:0.7rem;">No spending logged.</span>`;
      return;
    }

    let donutSvgHtml = `
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="14" />
    `;

    let strokeDashOffset = 0;
    const circumference = 2 * Math.PI * 40;
    let legendHtml = '';

    categories.forEach((cat) => {
      const spent = Number(cat.spent || 0);
      const pct = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
      const dashArray = (pct / 100) * circumference;

      if (pct > 0) {
        donutSvgHtml += `
          <circle cx="55" cy="55" r="40" fill="none" stroke="${cat.color || '#a370f7'}" stroke-width="14"
            stroke-dasharray="${dashArray} ${circumference - dashArray}"
            stroke-dashoffset="-${strokeDashOffset}"
            transform="rotate(-90 55 55)" />
        `;
        strokeDashOffset += dashArray;
      }

      legendHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
          <span style="display: flex; align-items: center; gap: 4px; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${cat.color || '#a370f7'}; flex-shrink: 0;"></span> ${cat.name}
          </span>
          <span style="font-weight: 700; color: var(--text-main);">${pct.toFixed(0)}%</span>
        </div>
      `;
    });

    const displayAmount = totalSpent >= 1000 ? `${Math.round(totalSpent / 1000)}k` : totalSpent.toString();

    donutSvgHtml += `
      <text x="55" y="52" font-size="10" font-weight="800" fill="#fff" text-anchor="middle">${currency}${displayAmount}</text>
      <text x="55" y="64" font-size="7" fill="#94a3b8" text-anchor="middle">Total Spent</text>
      </svg>
    `;

    donutContainer.innerHTML = donutSvgHtml;
    legendContainer.innerHTML = legendHtml;
  },

  // Render Budget Utilization Trend Area Chart (SVG)
  renderUtilizationTrendChart(containerId, currentUtilization = 60.31) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 200 80" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#a370f7" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#a370f7" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="M 10,50 L 45,45 L 80,40 L 115,32 L 150,28 L 185,22 L 185,75 L 10,75 Z" fill="url(#trendGrad)" />
        <path d="M 10,50 L 45,45 L 80,40 L 115,32 L 150,28 L 185,22" fill="none" stroke="#a370f7" stroke-width="2.5" />
        <circle cx="10" cy="50" r="3" fill="#a370f7" />
        <circle cx="45" cy="45" r="3" fill="#a370f7" />
        <circle cx="80" cy="40" r="3" fill="#a370f7" />
        <circle cx="115" cy="32" r="3" fill="#a370f7" />
        <circle cx="150" cy="28" r="3" fill="#a370f7" />
        <circle cx="185" cy="22" r="4" fill="#10b981" />
        <text x="185" y="14" font-size="7" font-weight="700" fill="#10b981" text-anchor="middle">${Number(currentUtilization).toFixed(1)}%</text>
        <text x="10" y="76" font-size="7" fill="#94a3b8" text-anchor="middle">Dec</text>
        <text x="45" y="76" font-size="7" fill="#94a3b8" text-anchor="middle">Jan</text>
        <text x="80" y="76" font-size="7" fill="#94a3b8" text-anchor="middle">Feb</text>
        <text x="115" y="76" font-size="7" fill="#94a3b8" text-anchor="middle">Mar</text>
        <text x="150" y="76" font-size="7" fill="#94a3b8" text-anchor="middle">Apr</text>
        <text x="185" y="76" font-size="7" fill="#94a3b8" text-anchor="middle">May</text>
      </svg>
    `;
  }
};
