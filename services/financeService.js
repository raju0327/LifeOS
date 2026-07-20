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

  // Fetch live transactions from Supabase
  async fetchLiveTransactions(limit = 10) {
    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return [];

    const userId = this.getResolvedUserId();
    const url = `${settings.url}/rest/v1/finance_transactions?user_id=eq.${userId}&order=date.desc&select=*&limit=${limit}`;

    try {
      const res = await fetch(url, {
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`
        }
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn('Failed fetching live transactions from Supabase:', e);
      return [];
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
      id: 'plan_' + Date.now(),
      user_id: userId,
      title: planData.title,
      period_type: planData.period || 'Monthly',
      start_date: planData.start,
      end_date: planData.end,
      total_budget: planData.target || 0,
      status: 'Active',
      carry_forward: !!planData.carry
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
  }
};
