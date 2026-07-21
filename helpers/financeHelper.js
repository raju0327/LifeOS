/* ==========================================================================
   LIFE OS - FINANCE HELPER UTILITIES (helpers/financeHelper.js)
   Export formatting, CSV/Excel/PDF generation, Currency & Debouncing
   ========================================================================== */

window.LifeOSFinanceHelper = {
  formatCurrency(amount, symbol = '₹') {
    const val = parseFloat(amount) || 0;
    return `${val < 0 ? '-' : ''}${symbol}${Math.abs(val).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  },

  formatCompactCurrency(amount, symbol = '₹') {
    const val = parseFloat(amount) || 0;
    return `${val < 0 ? '-' : ''}${symbol}${Math.abs(val).toLocaleString(undefined, {
      maximumFractionDigits: 0
    })}`;
  },

  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  exportToCSV(filename, rows, headers) {
    if (!rows || rows.length === 0) {
      if (window.LifeOS && window.LifeOS.showToast) {
        window.LifeOS.showToast('No data available to export.', 'warning');
      }
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += headers.join(',') + '\n';

    rows.forEach(row => {
      const formattedRow = row.map(val => {
        const str = String(val !== undefined && val !== null ? val : '');
        return `"${str.replace(/"/g, '""')}"`;
      });
      csvContent += formattedRow.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.LifeOS && window.LifeOS.showToast) {
      window.LifeOS.showToast(`Exported ${rows.length} records to CSV.`, 'success');
    }
  },

  exportToExcel(filename, rows, headers) {
    // Excel-compatible CSV with UTF-8 BOM
    if (!rows || rows.length === 0) {
      if (window.LifeOS && window.LifeOS.showToast) {
        window.LifeOS.showToast('No data available to export.', 'warning');
      }
      return;
    }

    let csv = '\uFEFF';
    csv += headers.join('\t') + '\n';

    rows.forEach(row => {
      const line = row.map(val => String(val !== undefined && val !== null ? val : '').replace(/\t/g, ' ')).join('\t');
      csv += line + '\n';
    });

    const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${filename}_${Date.now()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.LifeOS && window.LifeOS.showToast) {
      window.LifeOS.showToast(`Exported ${rows.length} records to Excel workbook.`, 'success');
    }
  },

  exportToPDF(title, containerId) {
    if (window.LifeOS && window.LifeOS.showToast) {
      window.LifeOS.showToast(`Preparing printable document: ${title}...`, 'info');
    }
    setTimeout(() => {
      window.print();
    }, 600);
  },

  calculateUtilization(spent, limit) {
    const s = parseFloat(spent) || 0;
    const l = parseFloat(limit) || 0;
    if (l <= 0) return 0;
    return Math.min(Math.round((s / l) * 1000) / 10, 100);
  }
};
