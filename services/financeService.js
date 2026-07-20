/* ==========================================================================
   LIFE OS - FINANCE SERVICE (services/financeService.js)
   Database Transactions & Category Allocation Management
   ========================================================================== */

window.LifeOSFinanceService = {
  init(app) {
    this.app = app;
  },

  getSettings() {
    return this.app && this.app.state ? this.app.state.supabaseSettings : null;
  },

  getResolvedUserId() {
    const username = (this.app && this.app.state && this.app.state.user && this.app.state.user.id) || 'admin';
    const defaultAdminUuid = '85a62604-52ce-4f55-b5be-23aa8915497b';
    return (this.app && this.app.userUuidMap) ? (this.app.userUuidMap[username.toLowerCase()] || defaultAdminUuid) : defaultAdminUuid;
  },

  // Fetch live transactions from Supabase (merged with local state fallback)
  async fetchLiveTransactions(limit = 10) {
    const app = this.app || window.LifeOS;
    const localTxs = (app && app.state && app.state.transactions) ? app.state.transactions : [];

    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return localTxs.slice(0, limit);

    const userId = this.getResolvedUserId();
    const url = `${settings.url}/rest/v1/finance_transactions?user_id=eq.${userId}&order=date.desc&select=*&limit=${limit}`;

    try {
      const res = await fetch(url, {
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`
        }
      });
      if (!res.ok) return localTxs.slice(0, limit);
      const remoteData = await res.json();
      
      const combinedMap = {};
      localTxs.forEach(t => {
        if (t.id) combinedMap[t.id] = t;
      });
      remoteData.forEach(t => {
        if (t.id) combinedMap[t.id] = t;
      });

      const list = Object.values(combinedMap).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      return list.length > 0 ? list.slice(0, limit) : localTxs.slice(0, limit);
    } catch (e) {
      console.warn('Failed fetching live transactions from Supabase:', e);
      return localTxs.slice(0, limit);
    }
  },

  // Insert a new budget category into Supabase
  async createCategoryRecord(categoryData) {
    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return null;

    const userId = this.getResolvedUserId();
    const payload = {
      id: 'bcat_' + Date.now(),
      user_id: userId,
      name: categoryData.name,
      type: categoryData.type || 'expense',
      monthly_limit: categoryData.limit || 0,
      icon: categoryData.icon || 'fa-tag',
      color: categoryData.color || '#a370f7'
    };

    try {
      const res = await fetch(`${settings.url}/rest/v1/budget_categories`, {
        method: 'POST',
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Insert category failed');
      const data = await res.json();
      return data && data.length > 0 ? data[0] : payload;
    } catch (e) {
      console.warn('Failed creating budget category on Supabase:', e);
      return payload;
    }
  },

  // Insert a new budget plan into Supabase
  async createBudgetPlanRecord(planData) {
    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return null;

    const userId = this.getResolvedUserId();
    const payload = {
      id: planData.id || ('plan_' + Date.now()),
      user_id: userId,
      title: planData.title,
      period_type: planData.period || 'Monthly',
      start_date: planData.start,
      end_date: planData.end,
      total_budget: planData.target || 0,
      status: 'Active',
      carry_forward: !!planData.carry,
      enable_alerts: planData.enable_alerts !== undefined ? !!planData.enable_alerts : true,
      allow_overspending: !!planData.allow_overspending,
      auto_allocate: !!planData.auto_allocate
    };

    try {
      const res = await fetch(`${settings.url}/rest/v1/budgets`, {
        method: 'POST',
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Insert budget plan failed');
      const data = await res.json();
      return data && data.length > 0 ? data[0] : payload;
    } catch (e) {
      console.warn('Failed creating budget plan on Supabase:', e);
      return payload;
    }
  },

  // Save category allocations for a budget plan
  async saveBudgetAllocations(budgetId, allocations = []) {
    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey || !allocations.length) return [];

    const userId = this.getResolvedUserId();
    const rows = allocations.map((alloc, idx) => ({
      id: `alloc_${Date.now()}_${idx}`,
      budget_id: budgetId,
      category_id: alloc.category_id || alloc.id,
      allocated_amount: Number(alloc.amount || alloc.limit || 0),
      user_id: userId
    }));

    try {
      const res = await fetch(`${settings.url}/rest/v1/budget_allocations`, {
        method: 'POST',
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(rows)
      });
      if (!res.ok) throw new Error('Insert allocations failed');
      return rows;
    } catch (e) {
      console.warn('Failed saving budget allocations on Supabase:', e);
      return rows;
    }
  },

  // Delete budget plan from Supabase
  async deleteBudgetRecord(budgetId) {
    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return false;

    const userId = this.getResolvedUserId();
    try {
      await fetch(`${settings.url}/rest/v1/budgets?id=eq.${budgetId}&user_id=eq.${userId}`, {
        method: 'DELETE',
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`
        }
      });
      return true;
    } catch (e) {
      console.warn('Failed deleting budget on Supabase:', e);
      return false;
    }
  },

  // Archive budget plan on Supabase
  async archiveBudgetRecord(budgetId) {
    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return false;

    const userId = this.getResolvedUserId();
    try {
      await fetch(`${settings.url}/rest/v1/budgets?id=eq.${budgetId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Archived' })
      });
      return true;
    } catch (e) {
      console.warn('Failed archiving budget on Supabase:', e);
      return false;
    }
  },

  // Delete category from Supabase
  async deleteCategoryRecord(categoryId) {
    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return false;

    const userId = this.getResolvedUserId();
    try {
      await fetch(`${settings.url}/rest/v1/budget_categories?id=eq.${categoryId}&user_id=eq.${userId}`, {
        method: 'DELETE',
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`
        }
      });
      return true;
    } catch (e) {
      console.warn('Failed deleting category on Supabase:', e);
      return false;
    }
  }
};
