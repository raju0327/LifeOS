/* ==========================================================================
   LIFE OS - FINANCE VALIDATION LAYER (validation/financeValidation.js)
   Sanitization, business bounds validation, required field checks
   ========================================================================== */

window.LifeOSFinanceValidation = {
  sanitizeText(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/[<>]/g, '').trim();
  },

  validateTransaction(data) {
    const errors = [];
    
    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
      errors.push('Transaction description is required.');
    }

    const amt = parseFloat(data.amount);
    if (isNaN(amt) || amt <= 0) {
      errors.push('Amount must be a positive number greater than zero.');
    }

    const validTypes = ['income', 'expense', 'transfer'];
    if (!data.type || !validTypes.includes(data.type)) {
      errors.push('Transaction type must be Income, Expense, or Transfer.');
    }

    const validAccounts = ['bank', 'cash', 'card', 'upi', 'savings'];
    if (data.account && !validAccounts.includes(data.account)) {
      errors.push('Invalid account or wallet selected.');
    }

    if (data.date) {
      const d = new Date(data.date);
      if (isNaN(d.getTime())) {
        errors.push('Invalid transaction date selected.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  validateBudgetPlan(allocations) {
    const errors = [];
    if (!allocations || typeof allocations !== 'object') {
      errors.push('Budget allocation data missing.');
      return { isValid: false, errors };
    }

    let totalLimit = 0;
    Object.keys(allocations).forEach(catId => {
      const val = parseFloat(allocations[catId]);
      if (isNaN(val) || val < 0) {
        errors.push(`Invalid budget limit for category: ${catId}`);
      } else {
        totalLimit += val;
      }
    });

    if (totalLimit <= 0) {
      errors.push('Total planned budget must be greater than zero.');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      totalLimit
    };
  },

  validateCategory(cat) {
    const errors = [];
    if (!cat.id || cat.id.trim().length === 0) {
      errors.push('Category ID is required.');
    }
    if (!cat.name || cat.name.trim().length === 0) {
      errors.push('Category Name is required.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
