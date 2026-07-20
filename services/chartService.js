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
  renderUtilizationTrendChart(containerId, currentUtilization = 0) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const util = Number(currentUtilization) || 0;
    const formattedUtil = util.toFixed(1);

    // Dynamic month names for last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'short' }));
    }

    const xCoords = [10, 45, 80, 115, 150, 185];

    // Clean baseline at Y=62 when utilization is 0%
    let yCoords = [62, 62, 62, 62, 62, 62];
    let strokeColor = '#94a3b8';
    let badgeColor = '#94a3b8';

    if (util > 0) {
      const targetY = Math.max(18, 62 - Math.min((util / 100) * 44, 44));
      yCoords = [
        62,
        62 - (62 - targetY) * 0.2,
        62 - (62 - targetY) * 0.4,
        62 - (62 - targetY) * 0.6,
        62 - (62 - targetY) * 0.8,
        targetY
      ];
      strokeColor = util >= 100 ? '#ef4444' : (util >= 80 ? '#f97316' : '#a370f7');
      badgeColor = util >= 100 ? '#ef4444' : (util >= 80 ? '#f97316' : '#10b981');
    }

    const pathD = `M ${xCoords[0]},${yCoords[0].toFixed(1)} ` +
      xCoords.slice(1).map((x, idx) => `L ${x},${yCoords[idx + 1].toFixed(1)}`).join(' ');

    const areaD = `${pathD} L ${xCoords[5]},65 L ${xCoords[0]},65 Z`;

    let dotsHtml = '';
    xCoords.forEach((x, idx) => {
      const y = yCoords[idx];
      const isLast = idx === 5;
      dotsHtml += `<circle cx="${x}" cy="${y.toFixed(1)}" r="${isLast ? 4 : 3}" fill="${isLast ? badgeColor : strokeColor}" />`;
    });

    let monthLabelsHtml = '';
    xCoords.forEach((x, idx) => {
      monthLabelsHtml += `<text x="${x}" y="76" font-size="7" fill="#94a3b8" text-anchor="middle">${months[idx]}</text>`;
    });

    container.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 200 80" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${areaD}" fill="url(#trendGrad)" />
        <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="2.5" />
        ${dotsHtml}
        <text x="${xCoords[5]}" y="${Math.max(12, yCoords[5] - 8).toFixed(1)}" font-size="7" font-weight="700" fill="${badgeColor}" text-anchor="middle">${formattedUtil}%</text>
        ${monthLabelsHtml}
      </svg>
    `;
  }
};
