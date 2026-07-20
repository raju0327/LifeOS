/* ==========================================================================
   LIFE OS - BUDGET SERVICE (services/budgetService.js)
   Database-Driven Calculations, Dynamic Aggregations & Realtime Listeners
   ========================================================================== */

window.LifeOSBudgetService = {
  realtimeSubscription: null,

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

  getDefaultCategories() {
    return [
      { id: 'bcat_food', name: 'Food & Grocery', icon: 'fa-shopping-basket', color: '#10b981', monthly_limit: 15000, type: 'expense' },
      { id: 'bcat_rent', name: 'House Rent', icon: 'fa-home', color: '#3b82f6', monthly_limit: 25000, type: 'expense' },
      { id: 'bcat_util', name: 'Utilities', icon: 'fa-bolt', color: '#f59e0b', monthly_limit: 6000, type: 'expense' },
      { id: 'bcat_trans', name: 'Transportation', icon: 'fa-car', color: '#a370f7', monthly_limit: 5000, type: 'expense' },
      { id: 'bcat_fuel', name: 'Fuel', icon: 'fa-gas-pump', color: '#ef4444', monthly_limit: 4000, type: 'expense' },
      { id: 'bcat_shop', name: 'Shopping', icon: 'fa-shopping-bag', color: '#ec4899', monthly_limit: 8000, type: 'expense' },
      { id: 'bcat_health', name: 'Healthcare', icon: 'fa-heartbeat', color: '#14b8a6', monthly_limit: 5000, type: 'expense' },
      { id: 'bcat_edu', name: 'Education', icon: 'fa-graduation-cap', color: '#6366f1', monthly_limit: 7000, type: 'expense' },
      { id: 'bcat_ent', name: 'Entertainment', icon: 'fa-gamepad', color: '#8b5cf6', monthly_limit: 4000, type: 'expense' },
      { id: 'bcat_invest', name: 'Investments', icon: 'fa-chart-line', color: '#10b981', monthly_limit: 10000, type: 'savings' },
      { id: 'bcat_sav', name: 'Savings', icon: 'fa-piggy-bank', color: '#f59e0b', monthly_limit: 10000, type: 'savings' },
      { id: 'bcat_ins', name: 'Insurance', icon: 'fa-shield-alt', color: '#06b6d4', monthly_limit: 3000, type: 'expense' },
      { id: 'bcat_emi', name: 'EMI', icon: 'fa-university', color: '#64748b', monthly_limit: 12000, type: 'expense' },
      { id: 'bcat_misc', name: 'Miscellaneous', icon: 'fa-tag', color: '#94a3b8', monthly_limit: 3000, type: 'expense' }
    ];
  },

  // Fetch active budget categories & allocations from Supabase (merged with local state)
  async fetchBudgetCategories() {
    const app = this.app || window.LifeOS;
    let localCategories = (app && app.state && app.state.budgetCategories) ? app.state.budgetCategories : [];
    if (!localCategories || !localCategories.length) {
      localCategories = this.getDefaultCategories();
    }

    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return localCategories;

    const userId = this.getResolvedUserId();
    const url = `${settings.url}/rest/v1/budget_categories?user_id=eq.${userId}&select=*`;

    try {
      const res = await fetch(url, {
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`
        }
      });
      let remoteData = [];
      if (res.ok) {
        remoteData = await res.json();
      }

      const combinedMap = {};
      localCategories.forEach(c => {
        if (c.name) {
          combinedMap[c.name.toLowerCase()] = {
            id: c.id || 'cat_' + Date.now(),
            name: c.name,
            type: c.type || 'expense',
            monthly_limit: Number(c.limit || c.monthly_limit || 0),
            icon: c.icon || 'fa-tag',
            color: c.color || '#a370f7'
          };
        }
      });

      remoteData.forEach(c => {
        if (c.name) {
          combinedMap[c.name.toLowerCase()] = {
            id: c.id,
            name: c.name,
            type: c.type || 'expense',
            monthly_limit: Number(c.monthly_limit || c.limit || 0),
            icon: c.icon || 'fa-tag',
            color: c.color || '#a370f7'
          };
        }
      });

      const list = Object.values(combinedMap);
      return list.length > 0 ? list : localCategories;
    } catch (e) {
      console.warn('Failed fetching budget categories from Supabase:', e);
      return localCategories;
    }
  },

  // Fetch active budget plan from Supabase (merged with local state)
  async fetchActiveBudgetPlan() {
    const app = this.app || window.LifeOS;
    const localPlan = (app && app.state && app.state.activeBudgetPlan) ? app.state.activeBudgetPlan : null;

    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return localPlan;

    const userId = this.getResolvedUserId();
    const url = `${settings.url}/rest/v1/budgets?user_id=eq.${userId}&status=eq.Active&select=*&limit=1`;

    try {
      const res = await fetch(url, {
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`
        }
      });
      if (!res.ok) return localPlan;
      const data = await res.json();
      return data && data.length > 0 ? data[0] : localPlan;
    } catch (e) {
      console.warn('Failed fetching active budget plan from Supabase:', e);
      return localPlan;
    }
  },

  // Calculate Category Spending dynamically from finance_transactions: SUM(amount)
  async calculateCategorySpending() {
    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return {};

    const userId = this.getResolvedUserId();
    const url = `${settings.url}/rest/v1/finance_transactions?user_id=eq.${userId}&type=eq.expense&select=category,amount`;

    try {
      const res = await fetch(url, {
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`
        }
      });
      if (!res.ok) return {};
      const txs = await res.json();

      const spendingMap = {};
      txs.forEach(t => {
        const cat = (t.category || 'General').toLowerCase();
        spendingMap[cat] = (spendingMap[cat] || 0) + (parseFloat(t.amount) || 0);
      });

      return spendingMap;
    } catch (e) {
      console.warn('Failed calculating category spending from Supabase:', e);
      return {};
    }
  },

  // Compute live budget metrics, utilization %, remaining budget, and 80%/90%/100% threshold alerts
  async computeBudgetMetrics() {
    const [categories, activePlan, spendingMap] = await Promise.all([
      this.fetchBudgetCategories(),
      this.fetchActiveBudgetPlan(),
      this.calculateCategorySpending()
    ]);

    let totalBudget = 0;
    let totalSpent = 0;
    const categoryMetrics = [];
    const alerts = [];

    categories.forEach(c => {
      const limit = Number(c.monthly_limit || c.limit || 0);
      const catKey = (c.name || '').toLowerCase();
      
      // Calculate spending dynamically from finance_transactions
      let spent = 0;
      Object.keys(spendingMap).forEach(key => {
        if (key.includes(catKey) || catKey.includes(key)) {
          spent += spendingMap[key];
        }
      });

      totalBudget += limit;
      totalSpent += spent;

      const pct = limit > 0 ? (spent / limit) * 100 : 0;

      // Dynamic threshold alert generation
      if (pct >= 100) {
        alerts.push({
          type: 'exceeded',
          category: c.name,
          color: '#ef4444',
          pct: pct.toFixed(1),
          message: `Budget Limit Exceeded! ${c.name} has reached ${pct.toFixed(1)}% of its allocated limit.`
        });
      } else if (pct >= 90) {
        alerts.push({
          type: 'high_warning',
          category: c.name,
          color: '#f97316',
          pct: pct.toFixed(1),
          message: `Critical Warning: ${c.name} has consumed ${pct.toFixed(1)}% of its limit.`
        });
      } else if (pct >= 80) {
        alerts.push({
          type: 'warning',
          category: c.name,
          color: '#eab308',
          pct: pct.toFixed(1),
          message: `Threshold Notice: ${c.name} spending has reached ${pct.toFixed(1)}%.`
        });
      }

      categoryMetrics.push({
        ...c,
        limit,
        spent,
        pct,
        formattedPct: pct.toFixed(pct % 1 === 0 ? 0 : 1),
        remaining: Math.max(limit - spent, 0)
      });
    });

    if (activePlan && Number(activePlan.total_budget || 0) > 0) {
      totalBudget = Number(activePlan.total_budget);
    }

    const remainingBudget = totalBudget - totalSpent;
    const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalSpent,
      remainingBudget,
      utilizationRate,
      formattedUtilization: utilizationRate.toFixed(2),
      categories: categoryMetrics,
      alerts,
      activePlan
    };
  },

  // Enable Realtime WebSocket listener on finance_transactions, budgets, and budget_categories
  setupRealtimeListener(onUpdateCallback) {
    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return;

    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        const client = window.supabase.createClient(settings.url, settings.anonKey);
        
        this.realtimeSubscription = client
          .channel('budget_realtime_channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions' }, () => {
            if (typeof onUpdateCallback === 'function') onUpdateCallback();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, () => {
            if (typeof onUpdateCallback === 'function') onUpdateCallback();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_categories' }, () => {
            if (typeof onUpdateCallback === 'function') onUpdateCallback();
          })
          .subscribe();

        console.log('Supabase Realtime budget listener active.');
      } catch (e) {
        console.warn('Could not initialize Supabase Realtime client:', e);
      }
    }
  }
};
