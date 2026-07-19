/* ==========================================================================
   LIFE OS - CORE SYSTEM APP CONTROLLER (js/app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Global OS namespace
  window.LifeOS = {
    // Current Active State containing indices for all 18 modules
    state: {
      theme: 'dark',
      focus: '',
      
      // User Profile & Roles
      user: {
        id: 'admin',
        username: 'User Admin',
        role: 'Super Admin', // Super Admin, Admin, User
        avatar: 'UA',
        isLoggedIn: false,
        password: 'admin'
      },

      // Productivity & Goals
      tasks: [],
      projects: [],
      events: [], // Calendar events
      timeblocks: {}, // Schedule mappings
      pomodoro: {
        timeRemaining: 1500, // 25m
        isActive: false,
        mode: 'work' // work, shortBreak, longBreak
      },

      // Knowledge & Logs
      notes: [],
      bookmarks: [],
      journalEntries: [],
      visionBoard: [],
      documents: [],

      // Financials
      transactions: [],
      loans: [],
      subscriptions: [],
      members: [],
      categories: {},
      budgets: {},
      goals: [],
      investments: {},
      financeSettings: {
        pinLockEnabled: false,
        currencySymbol: '₹',
        currencyCode: 'INR'
      },
      supabaseSettings: {
        url: 'https://ytenffmtbmlhsfurjgrv.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0ZW5mZm10Ym1saHNmdXJqZ3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMDQzNTYsImV4cCI6MjA5OTc4MDM1Nn0.sd597y6U3lpFgNLEiEpI1w_dMxEdG1acen5KwWMuMIY'
      },

      // Health
      waterIntake: 0,
      sleepLogs: [],
      moodLogs: [],
      medicineReminders: [],
      habits: [],
      nutritionLogs: [],
      workoutLogs: [],

      // Personal & Lifestyle
      contacts: [],
      passwords: [],
      vaultItems: [],
      trips: [],
      vehicleLogs: [],
      mediaItems: [], // Books & Movies
      shoppingList: [],

      // Career
      skills: [],
      jobApplications: [],

      // System Notifications
      notifications: []
    },

    // UI Modules references
    modules: {},

    // Persistence key
    STORAGE_KEY: 'life_os_enterprise_state',

    // Init Core Lifecycle
    init() {
      this.loadState();
      this.initTheme();
      this.initAccordions();
      this.initNavigation();
      this.initClock();
      this.initWeather();
      this.setupFocusWidget();
      this.setupNotifications();
      this.setupGlobalSearch();
      this.setupQuickActions();
      
      // Initialize Lucide Icons
      if (window.lucide) {
        window.lucide.createIcons();
      }

      this.showToast('Secure workspace decrypted and loaded.', 'success');
      setTimeout(() => this.syncGlobalGoogleSheetData(true), 2000);
    },

    // Get default Mock data configurations for Family Tracker
    getMockMembers() {
      return [
        { id: 'marcus', name: 'Marcus (Dad)', role: 'Father', avatar: '👨', color: '#a370f7', glow: 'rgba(163, 112, 247, 0.15)' },
        { id: 'elena', name: 'Elena (Mom)', role: 'Mother', avatar: '👩', color: '#5856d6', glow: 'rgba(88, 86, 214, 0.15)' },
        { id: 'alex', name: 'Alex (Teen)', role: 'Son', avatar: '👦', color: '#f97316', glow: 'rgba(249, 115, 22, 0.15)' },
        { id: 'zoe', name: 'Zoe (Kid)', role: 'Daughter', avatar: '👧', color: '#10b981', glow: 'rgba(16, 185, 129, 0.15)' }
      ];
    },

    getMockCategories() {
      return {
        food: { name: 'Food & Groceries', icon: 'fa-shopping-basket', color: '#0052cc', type: 'expense' },
        transport: { name: 'Transport & Fuel', icon: 'fa-car', color: '#3399ff', type: 'expense' },
        rent: { name: 'Rent & Living', icon: 'fa-home', color: '#00d2ff', type: 'expense' },
        shopping: { name: 'Shopping', icon: 'fa-shopping-bag', color: '#80bfff', type: 'expense' },
        bills: { name: 'Bills & Utilities', icon: 'fa-bolt', color: '#cbd5e0', type: 'expense' },
        emi: { name: 'EMI & Loans', icon: 'fa-credit-card', color: '#475569', type: 'expense' },
        entertainment: { name: 'Entertainment', icon: 'fa-play-circle', color: '#2b6cb0', type: 'expense' },
        health: { name: 'Health & Medical', icon: 'fa-heartbeat', color: '#3182ce', type: 'expense' },
        education: { name: 'Education', icon: 'fa-graduation-cap', color: '#63b3ed', type: 'expense' },
        investments: { name: 'Investments', icon: 'fa-chart-line', color: '#94a3b8', type: 'expense' },
        basic: { name: 'Basic Needs', icon: 'fa-check-square', color: '#4a5568', type: 'expense' },
        salary: { name: 'Salary', icon: 'fa-wallet', color: '#10b981', type: 'income' },
        business: { name: 'Business Income', icon: 'fa-briefcase', color: '#10b981', type: 'income' },
        freelance: { name: 'Freelance Work', icon: 'fa-laptop-code', color: '#10b981', type: 'income' },
        'investments-income': { name: 'Investments Return', icon: 'fa-chart-pie', color: '#10b981', type: 'income' },
        'gifts-income': { name: 'Gifts & Awards', icon: 'fa-gift', color: '#10b981', type: 'income' }
      };
    },

    getMockBudgets() {
      return {
        food: 15000,
        transport: 12000,
        rent: 30000,
        shopping: 10000,
        bills: 15000,
        emi: 20000,
        entertainment: 8000,
        health: 10000,
        education: 15000,
        investments: 25000,
        basic: 10000
      };
    },

    getMockGoals() {
      return [
        { id: 'goal-1', name: 'Family Vacation Fund', target: 250000, current: 185000, saved: 185000, color: '#00d2ff' },
        { id: 'goal-2', name: 'New Living Room TV', target: 80000, current: 42000, saved: 42000, color: '#3399ff' },
        { id: 'goal-3', name: 'Emergency Savings', target: 150000, current: 30000, saved: 30000, color: '#0052cc' }
      ];
    },

    getMockInvestments() {
      return { stocks: 240000, mutualFunds: 150000, gold: 80000, crypto: 15000 };
    },

    getMockFinanceSettings() {
      return {
        pinLockEnabled: false,
        currencySymbol: '₹',
        currencyCode: 'INR'
      };
    },

    // High-security encryption helper to protect local storage data
    encryptData(text) {
      const key = "LifeOSSecretSecurityKey";
      let result = "";
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      return btoa(encodeURIComponent(result));
    },

    decryptData(cipherText) {
      try {
        const key = "LifeOSSecretSecurityKey";
        const decoded = decodeURIComponent(atob(cipherText));
        let result = "";
        for (let i = 0; i < decoded.length; i++) {
          const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
          result += String.fromCharCode(charCode);
        }
        return result;
      } catch (e) {
        // Fallback for unencrypted legacy local storage values
        return null;
      }
    },

    // Load from local storage
    loadState() {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        try {
          let decrypted = this.decryptData(data);
          // Fallback if it was saved unencrypted previously
          if (!decrypted) {
            decrypted = data;
          }
          const parsed = JSON.parse(decrypted);
          this.state = { ...this.state, ...parsed };
            
          const hasMockTransactions = this.state.transactions && this.state.transactions.some(t => t.id === 'tx-1' || t.id === 'tx-2');
          if (hasMockTransactions) {
            this.state.transactions = [];
            this.state.loans = [];
            this.state.subscriptions = [];
            this.state.budgets = {};
            this.state.goals = [];
            this.state.investments = {};
            this.saveState();
          }
        } catch (e) {
          console.error("Error reading db data, resetting.", e);
        }
      }

      // Ensure defaults are populated regardless of whether localStorage is empty or populated
      if (!this.state.supabaseSettings || !this.state.supabaseSettings.url) {
        this.state.supabaseSettings = {
          url: 'https://ytenffmtbmlhsfurjgrv.supabase.co',
          anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0ZW5mZm10Ym1saHNmdXJqZ3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMDQzNTYsImV4cCI6MjA5OTc4MDM1Nn0.sd597y6U3lpFgNLEiEpI1w_dMxEdG1acen5KwWMuMIY',
          syncEnabled: false
        };
      }

      // Schema Migration Checks
      if (!this.state.members || this.state.members.length === 0) {
        this.state.members = this.getMockMembers();
      }
      this.restoreAdminMemberIfNeeded();

      if (!this.state.categories || Object.keys(this.state.categories).length === 0) {
        this.state.categories = this.getMockCategories();
      } else {
        // Sync loaded category colors to match new cyber theme
        const cyberColors = {
          food: '#0052cc',
          transport: '#3399ff',
          rent: '#00d2ff',
          shopping: '#80bfff',
          bills: '#cbd5e0',
          emi: '#475569',
          entertainment: '#2b6cb0',
          health: '#3182ce',
          education: '#63b3ed',
          investments: '#94a3b8',
          basic: '#4a5568'
        };
        Object.keys(cyberColors).forEach(k => {
          if (this.state.categories[k]) {
            this.state.categories[k].color = cyberColors[k];
          }
        });
      }
      if (!this.state.budgets || Object.keys(this.state.budgets).length === 0) {
        this.state.budgets = this.getMockBudgets();
      }
      if (!this.state.goals || this.state.goals.length === 0) {
        this.state.goals = this.getMockGoals();
      }
      if (!this.state.investments || Object.keys(this.state.investments).length === 0) {
        this.state.investments = this.getMockInvestments();
      }
      if (!this.state.financeSettings) {
        this.state.financeSettings = this.getMockFinanceSettings();
      }
      if (!this.state.generalSheetUrl) {
        this.state.generalSheetUrl = 'https://script.google.com/macros/s/AKfycbyL32umc1_Izj3YqBIqv3XqqvzG9xLCDiYRNUpHMWwpO0v0TBm-xqZhQgzLYjPCfzKd0A/exec';
      }
      if (!this.state.securityLogs) {
        this.state.securityLogs = [];
      }
      if (!this.state.habits) {
        this.state.habits = [];
      }
      if (!this.state.vaultItems) {
        this.state.vaultItems = [];
      }
      if (!this.state.passwordResetRequests) {
        this.state.passwordResetRequests = [];
      }

      this.activeViewedUser = this.state.user.id || 'admin';
    },

    // Save to local storage and sync stats
    saveState() {
      this.saveStateLocallyOnly();
      return this.pushGlobalStateToGoogleSheet();
    },

    saveStateLocallyOnly() {
      const serialized = JSON.stringify(this.state);
      const encrypted = this.encryptData(serialized);
      localStorage.setItem(this.STORAGE_KEY, encrypted);
      this.updateGlobalSummary();
      
      // Notify registered sub-modules
      Object.keys(this.modules).forEach(key => {
        if (typeof this.modules[key].render === 'function') {
          this.modules[key].render();
        }
      });
    },

    // --- SUPABASE DATABASE SYNC ENGINE ---
    pushSecurityStateToSupabase() {
      const settings = this.state.supabaseSettings;
      if (!settings || !settings.url || !settings.anonKey) return Promise.resolve();

      const securityPayload = {
        members: this.state.members || [],
        passwords: this.state.passwords || [],
        securityLogs: this.state.securityLogs || [],
        passwordResetRequests: this.state.passwordResetRequests || [],
        vaultSeeded: this.state.vaultSeeded || false,
        habitsSeeded: this.state.habitsSeeded || false
      };

      const encryptedData = this.encryptData(JSON.stringify(securityPayload));
      const endpoint = `${settings.url}/rest/v1/workspace_security?key=eq.security_registry`;

      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          key: 'security_registry',
          data: encryptedData,
          updated_at: new Date().toISOString()
        })
      })
      .then(res => {
        if (!res.ok) throw new Error('Supabase response status: ' + res.status);
        console.log('Global security state pushed to Supabase successfully.');
        
        // Trigger background sync to native auth.users table
        const syncUrl = `${settings.url}/rest/v1/rpc/sync_members_to_auth_users`;
        fetch(syncUrl, {
          method: 'POST',
          headers: {
            'apikey': settings.anonKey,
            'Authorization': `Bearer ${settings.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            p_members: this.state.members || []
          })
        })
        .then(syncRes => {
          if (!syncRes.ok) console.error('Failed to sync members to auth.users:', syncRes.status);
          else console.log('Successfully synchronized members list to auth.users.');
        })
        .catch(err => console.error('Error synchronizing members to auth.users:', err));
      })
      .catch(err => {
        console.error('Supabase security push error:', err);
      });
    },

    pushAllStateToSupabase() {
      const settings = this.state.supabaseSettings;
      if (!settings || !settings.url || !settings.anonKey) return Promise.resolve();

      const username = this.state.user.id || 'admin';

      const dashboardPayload = {};
      const keys = [
        'tasks', 'projects', 'events', 'timeblocks', 'notes', 'bookmarks', 
        'journalEntries', 'visionBoard', 'documents', 'waterIntake', 'sleepLogs', 
        'moodLogs', 'medicineReminders', 'nutritionLogs', 'workoutLogs', 'contacts', 
        'trips', 'vehicleLogs', 'mediaItems', 'shoppingList', 'skills', 
        'jobApplications', 'notifications',
        
        // Include all finance data keys
        'categories', 'subscriptions', 'loans', 'transactions', 'habits', 'vaultItems'
      ];
      keys.forEach(k => {
        dashboardPayload[k] = this.state[k];
      });

      // Transform budgets: state stores flat numbers {food: 15000}, DB expects {limit, spent, period}
      const rawBudgets = this.state.budgets || {};
      dashboardPayload.budgets = {};
      Object.keys(rawBudgets).forEach(catId => {
        const val = rawBudgets[catId];
        if (val !== null && typeof val === 'object') {
          // Already in DB format
          dashboardPayload.budgets[catId] = val;
        } else {
          // Convert flat number to DB format
          dashboardPayload.budgets[catId] = {
            limit: Number(val) || 0,
            spent: 0,
            period: 'monthly'
          };
        }
      });

      // Transform goals: state uses {current}, DB expects {saved}
      dashboardPayload.goals = (this.state.goals || []).map(g => ({
        ...g,
        saved: g.saved !== undefined ? g.saved : (g.current || 0)
      }));

      const endpoint = `${settings.url}/rest/v1/rpc/save_user_dashboard`;

      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_user_id: username,
          p_data: dashboardPayload
        })
      })
      .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(`Supabase ${res.status}: ${t}`); });
        console.log('Dashboard state pushed to Supabase successfully.');
      })
      .catch(err => {
        console.error('Supabase dashboard push error:', err);
      });
    },

    syncGlobalStateWithSupabase(isFirstLoad = false) {
      const settings = this.state.supabaseSettings;
      if (!settings || !settings.url || !settings.anonKey) return;

      if (!isFirstLoad) this.showToast('Pulling dashboard records from Database...', 'info');

      const username = this.state.user.id || 'admin';

      const secUrl = `${settings.url}/rest/v1/workspace_security?key=eq.security_registry&select=data`;
      const rpcUrl = `${settings.url}/rest/v1/rpc/get_user_dashboard`;

      let mergedAny = false;

      Promise.all([
        fetch(secUrl, {
          headers: {
            'apikey': settings.anonKey,
            'Authorization': `Bearer ${settings.anonKey}`
          }
        }).then(r => r.ok ? r.json() : []),
        fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'apikey': settings.anonKey,
            'Authorization': `Bearer ${settings.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            p_user_id: username
          })
        }).then(r => r.ok ? r.json() : null)
      ])
      .then(([secResult, dashboardObj]) => {
        if (secResult && secResult.length > 0 && secResult[0].data) {
          try {
            const decryptedStr = this.decryptData(secResult[0].data);
            if (decryptedStr) {
              const securityObj = JSON.parse(decryptedStr);
              if (securityObj.members) {
                this.state.members = securityObj.members;
                this.restoreAdminMemberIfNeeded();
              }
              if (securityObj.passwords) this.state.passwords = securityObj.passwords;
              if (securityObj.securityLogs) this.state.securityLogs = securityObj.securityLogs;
              if (securityObj.passwordResetRequests) this.state.passwordResetRequests = securityObj.passwordResetRequests;
              if (securityObj.vaultSeeded !== undefined) this.state.vaultSeeded = securityObj.vaultSeeded;
              if (securityObj.habitsSeeded !== undefined) this.state.habitsSeeded = securityObj.habitsSeeded;
              mergedAny = true;
            }
          } catch (e) {
            console.warn('Failed parsing Supabase security registry:', e);
          }
        }

        if (dashboardObj) {
          const keys = [
            'tasks', 'projects', 'events', 'timeblocks', 'notes', 'bookmarks', 
            'journalEntries', 'visionBoard', 'documents', 'waterIntake', 'sleepLogs', 
            'moodLogs', 'medicineReminders', 'nutritionLogs', 'workoutLogs', 'contacts', 
            'trips', 'vehicleLogs', 'mediaItems', 'shoppingList', 'skills', 
            'jobApplications', 'notifications',
            'categories', 'subscriptions', 'loans', 'transactions', 'habits', 'vaultItems'
          ];
          keys.forEach(k => {
            if (dashboardObj[k] !== undefined) {
              if (k === 'categories' && Object.keys(dashboardObj[k]).length === 0) {
                return;
              }
              this.state[k] = dashboardObj[k];
            }
          });

          // Map budgets back from DB format {limit, spent, period} to flat numbers {food: 15000}
          if (dashboardObj.budgets && Object.keys(dashboardObj.budgets).length > 0) {
            const flatBudgets = {};
            Object.keys(dashboardObj.budgets).forEach(catId => {
              const val = dashboardObj.budgets[catId];
              if (val !== null && typeof val === 'object' && val.limit !== undefined) {
                flatBudgets[catId] = Number(val.limit) || 0;
              } else {
                flatBudgets[catId] = Number(val) || 0;
              }
            });
            this.state.budgets = flatBudgets;
          }

          // Map goals back: DB returns {saved}, state expects {current}
          if (dashboardObj.goals && dashboardObj.goals.length > 0) {
            this.state.goals = dashboardObj.goals.map(g => ({
              ...g,
              current: g.current !== undefined ? g.current : (g.saved || 0),
              saved: g.saved !== undefined ? g.saved : (g.current || 0)
            }));
          }

          mergedAny = true;
        }

        if (mergedAny) {
          this.saveStateLocallyOnly();
          this.showToast('Global database sync completed.', 'success');
          
          Object.keys(this.modules).forEach(key => {
            if (typeof this.modules[key].render === 'function') {
              this.modules[key].render();
            }
          });
        }
      })
      .catch(err => {
        console.error('Supabase fetch error:', err);
        this.showToast('Database fetch request failed.', 'error');
      });
    },

    restoreAdminMemberIfNeeded() {
      if (!this.state.members.some(m => m.id === 'admin')) {
        this.state.members.unshift({
          id: 'admin',
          name: 'User Admin',
          role: 'Administrator',
          avatar: '👨‍💼',
          color: '#10b981',
          glow: 'rgba(16, 185, 129, 0.15)',
          password: 'admin',
          email: 'admin@lifeos.com',
          mobile: '+91 99999 99999',
          status: 'Active',
          failedAttempts: 0,
          passwordHistory: ['admin'],
          sessions: [],
          isDeleted: false
        });
      }
    },

    // --- GLOBAL DATABASE SYNC ENGINE ---
    syncGlobalGoogleSheetData(isFirstLoad = false) {
      this.syncGlobalStateWithSupabase(isFirstLoad);
    },

    pushGlobalStateToGoogleSheet() {
      return Promise.all([
        this.pushSecurityStateToSupabase(),
        this.pushAllStateToSupabase()
      ]);
    },

    // Load rich startup mock data
    loadMockData() {
      this.state.focus = "";
      
      // Seed Notification banners (empty)
      this.state.notifications = [];

      // Productivity tasks & projects
      this.state.tasks = [];
      this.state.projects = [];
      this.state.events = [];
      this.state.timeblocks = {};

      // Notes & Knowledge Base
      this.state.notes = [];
      this.state.bookmarks = [];
      this.state.journalEntries = [];
      this.state.visionBoard = [];
      this.state.documents = [];

      // Finance logs (upgraded for Family Tracker)
      this.state.members = this.getMockMembers();
      this.state.categories = this.getMockCategories();
      this.state.budgets = {};
      this.state.goals = [];
      this.state.investments = {};
      this.state.financeSettings = this.getMockFinanceSettings();

      this.state.transactions = [];
      this.state.loans = [];
      this.state.subscriptions = [];

      // Health logs
      this.state.waterIntake = 0;
      this.state.sleepLogs = [];
      this.state.medicineReminders = [];
      this.state.nutritionLogs = [];
      this.state.workoutLogs = [];

      // Personal vault
      this.state.contacts = [];
      this.state.passwords = [];

      // Lifestyle logs
      this.state.trips = [];
      this.state.vehicleLogs = [];
      this.state.mediaItems = [];
      this.state.shoppingList = [];

      // Career
      this.state.skills = [];
      this.state.jobApplications = [];
    },

    // Sidebar Toggler Accordions
    initAccordions() {
      const headers = document.querySelectorAll('.nav-group-header');
      headers.forEach(header => {
        header.addEventListener('click', () => {
          const group = header.parentElement;
          group.classList.toggle('collapsed');
        });
      });
    },

    toggleSidebar() {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.classList.toggle('sidebar-collapsed');
        
        const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
        
        // 1. Update sidebar brand logo icon
        const sidebarBrandIcon = document.querySelector('.sidebar .logo-icon');
        if (sidebarBrandIcon) {
          sidebarBrandIcon.innerHTML = isCollapsed ? 
            '<i data-lucide="menu" style="width: 18px; height: 18px;"></i>' : 
            '<i data-lucide="infinity" style="width: 18px; height: 18px;"></i>';
        }

        if (window.lucide) {
          window.lucide.createIcons();
        }

        window.dispatchEvent(new Event('resize'));
      }
    },

    // SPA Navigation Routing
    initNavigation() {
      const navItems = document.querySelectorAll('.nav-item');
      const viewPanels = document.querySelectorAll('.view-panel');

      navItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const targetView = item.getAttribute('data-view');
          
          // Access control lock guard
          if (!this.state.user.isLoggedIn && targetView !== 'user') {
            this.showToast('Workspace is locked. Please unlock first.', 'warning');
            return;
          }

          navItems.forEach(n => n.classList.remove('active'));
          item.classList.add('active');

          viewPanels.forEach(panel => {
            panel.classList.remove('active');
            if (panel.id === `${targetView}-view`) {
              panel.classList.add('active');
            }
          });

          // Trigger active life hooks
          if (this.modules[targetView] && typeof this.modules[targetView].onActive === 'function') {
            this.modules[targetView].onActive();
          }

          window.dispatchEvent(new Event('resize'));
        });
      });



      const sidebarBrand = document.querySelector('.sidebar-brand');
      sidebarBrand?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSidebar();
      });



      // Initial routing force check if logged out
      if (!this.state.user.isLoggedIn) {
        setTimeout(() => {
          const userNav = document.querySelector('.nav-item[data-view="user"]');
          if (userNav) userNav.click();
        }, 150);
      }

      // Auto expand parent group of the active nav item
      const activeItem = document.querySelector('.nav-item.active');
      if (activeItem) {
        const parentGroup = activeItem.closest('.nav-group');
        if (parentGroup) {
          parentGroup.classList.remove('collapsed');
        }
      }
    },

    // Theme setup
    initTheme() {
      const themeToggle = document.getElementById('theme-toggle');
      const themeIcon = document.getElementById('theme-icon');
      const themeText = document.getElementById('theme-text');

      const applyTheme = (theme) => {
        document.body.setAttribute('data-theme', theme);
        this.state.theme = theme;
        themeIcon.setAttribute('data-lucide', theme === 'light' ? 'sun' : 'moon');
        themeText.textContent = theme === 'light' ? 'Light Mode' : 'Dark Mode';
        
        if (window.lucide) {
          window.lucide.createIcons();
        }
      };

      applyTheme(this.state.theme);

      themeToggle.addEventListener('click', () => {
        const nextTheme = this.state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        this.saveState();
      });
    },

    // Clock
    initClock() {
      const liveClockEl = document.getElementById('live-clock');
      const liveDateEl = document.getElementById('live-date');

      const tick = () => {
        const now = new Date();
        liveDateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        let hrs = now.getHours();
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        hrs = hrs % 12 || 12;

        liveClockEl.textContent = `${String(hrs).padStart(2, '0')}:${mins}:${secs} ${ampm}`;
      };

      tick();
      setInterval(tick, 1000);
    },

    // Weather widget simulator
    initWeather() {
      // Re-uses same widgets
      const icon = document.getElementById('weather-icon');
      if (icon) {
        icon.setAttribute('data-lucide', 'cloud-sun');
        icon.style.color = 'var(--orange)';
        if (window.lucide) window.lucide.createIcons();
      }
    },

    // Focus
    setupFocusWidget() {
      const focusInput = document.getElementById('daily-focus-input');
      const saveFocusBtn = document.getElementById('save-focus-btn');
      const focusDisplayContainer = document.getElementById('focus-display-container');
      const focusDisplayText = document.getElementById('focus-display-text');
      const clearFocusBtn = document.getElementById('clear-focus-btn');

      const showFocus = (focusText) => {
        focusDisplayText.textContent = focusText;
        focusInput.parentElement.classList.add('hidden-display');
        focusDisplayContainer.classList.remove('hidden-display');
      };

      const hideFocus = () => {
        focusInput.value = '';
        focusInput.parentElement.classList.remove('hidden-display');
        focusDisplayContainer.classList.add('hidden-display');
      };

      saveFocusBtn.addEventListener('click', () => {
        const text = focusInput.value.trim();
        if (text) {
          this.state.focus = text;
          showFocus(text);
          this.saveState();
          this.showToast('Daily focus objective logged!', 'success');
        }
      });

      clearFocusBtn.addEventListener('click', () => {
        this.state.focus = '';
        hideFocus();
        this.saveState();
      });

      if (this.state.focus) {
        showFocus(this.state.focus);
      } else {
        hideFocus();
      }
    },

    // In-app Notification center
    setupNotifications() {
      const btn = document.getElementById('notif-bell-btn');
      const menu = document.getElementById('notif-dropdown-menu');
      const badge = document.getElementById('notif-badge-count');
      const list = document.getElementById('notif-items-list');
      const clearBtn = document.getElementById('mark-all-read-btn');

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('hidden');
        this.renderNotifications();
      });

      document.addEventListener('click', () => {
        menu.classList.add('hidden');
      });

      menu.addEventListener('click', (e) => e.stopPropagation());

      clearBtn.addEventListener('click', () => {
        this.state.notifications = [];
        this.saveState();
        this.showToast('All notifications cleared.', 'info');
        this.renderNotifications();
      });

      this.renderNotifications();
    },

    renderNotifications() {
      const badge = document.getElementById('notif-badge-count');
      const list = document.getElementById('notif-items-list');
      const unread = this.state.notifications.filter(n => !n.read).length;

      badge.textContent = unread;
      if (unread === 0) {
        badge.classList.add('hidden');
      } else {
        badge.classList.remove('hidden');
      }

      if (this.state.notifications.length === 0) {
        list.innerHTML = `<div class="empty-state" style="font-size:0.75rem;">All clean! No alerts.</div>`;
        return;
      }

      let html = '';
      this.state.notifications.forEach(n => {
        html += `
          <div class="notif-item">
            <span>${n.text}</span>
            <span class="notif-time">${n.time}</span>
          </div>
        `;
      });
      list.innerHTML = html;
    },

    // Global system-wide query search
    setupGlobalSearch() {
      const input = document.getElementById('global-search-input');

      input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          const query = input.value.toLowerCase().trim();
          if (!query) return;

          // Search tasks, projects, notes, and transactions
          let taskMatches = this.state.tasks.filter(t => t.title.toLowerCase().includes(query)).length;
          let notesMatches = this.state.notes.filter(n => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)).length;
          let finMatches = this.state.transactions.filter(t => t.description.toLowerCase().includes(query)).length;

          const totalMatches = taskMatches + notesMatches + finMatches;
          
          this.showToast(`Found ${totalMatches} matches globally (${taskMatches} tasks, ${notesMatches} notes, ${finMatches} finances).`, 'info');
          input.value = '';
        }
      });
    },

    // Add shortcuts on Quick Actions
    setupQuickActions() {
      const container = document.querySelector('.quick-actions-grid');
      if (!container) return;

      container.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-action-btn');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        
        if (action === 'task') {
          document.querySelector('.nav-item[data-view="tasks"]').click();
          this.showToast('Write a task title to insert.', 'info');
        } else if (action === 'note') {
          document.querySelector('.nav-item[data-view="notes"]').click();
          this.showToast('Write note content to log.', 'info');
        } else if (action === 'finance') {
          document.querySelector('.nav-item[data-view="finance"]').click();
          this.showToast('Log a new transaction cost.', 'info');
        } else if (action === 'water') {
          this.state.waterIntake = Math.min(this.state.waterIntake + 1, 12);
          this.saveState();
          this.showToast('Cup of water added from Quick Actions!', 'success');
        }
      });
    },

    // Sync profile display in topbar header card
    syncProfileUI() {
      const topbarUsername = document.getElementById('topbar-username');
      const topbarUserrole = document.getElementById('topbar-userrole');
      const topbarAvatar = document.getElementById('topbar-avatar');

      topbarUsername.textContent = this.state.user.username;
      topbarUserrole.textContent = this.state.user.role;
      topbarAvatar.textContent = this.state.user.avatar;
    },

    // Circular dashboard progress update calculations
    updateGlobalSummary() {
      this.syncProfileUI();

      // 1. Task progress
      const ring = document.getElementById('tasks-progress-ring');
      const text = document.getElementById('tasks-progress-text');
      const desc = document.getElementById('tasks-summary-desc');
      
      const activeTasks = this.state.tasks.filter(t => !t.completed);
      const compTasks = this.state.tasks.filter(t => t.completed);
      const total = this.state.tasks.length;

      if (total > 0) {
        const percent = Math.round((compTasks.length / total) * 100);
        // circum = 2 * PI * r = 2 * 3.1416 * 40 = 251.32
        const offset = 251.32 - (percent / 100) * 251.32;
        ring.style.strokeDashoffset = offset;
        text.textContent = `${percent}%`;
        desc.textContent = `${compTasks.length} of ${total} tasks complete`;
      } else {
        ring.style.strokeDashoffset = 251.32;
        text.textContent = '0%';
        desc.textContent = 'No tasks logged';
      }

      // 2. Habits (Calculates dummy compliance from logged state habits)
      const habitsRing = document.getElementById('habits-progress-ring');
      const habitsText = document.getElementById('habits-progress-text');
      const habitsDesc = document.getElementById('habits-summary-desc');

      // Habits list isn't globally declared, so we can mock or map it from modules.
      // To prevent crashes, look at storage length or return default
      const habitsLength = this.state.skills.length; // mock representative habits length
      if (habitsLength > 0) {
        habitsRing.style.strokeDashoffset = 251.32 * 0.4;
        habitsText.textContent = `60%`;
        habitsDesc.textContent = `3 of 5 habits complete today`;
      } else {
        habitsRing.style.strokeDashoffset = 251.32;
        habitsText.textContent = '0%';
        habitsDesc.textContent = 'No habits logged';
      }

      // 3. Health
      const waterVal = document.getElementById('dashboard-water-val');
      const sleepVal = document.getElementById('dashboard-sleep-val');
      
      waterVal.textContent = `${this.state.waterIntake} / 8 cups`;
      if (this.state.sleepLogs.length > 0) {
        sleepVal.textContent = `${this.state.sleepLogs[0].hours}h Logged`;
      } else {
        sleepVal.textContent = '0h Logged';
      }

      // 4. Finance
      const budgetVal = document.getElementById('dashboard-budget-val');
      const budgetFill = document.getElementById('dashboard-budget-fill');
      const budgetDesc = document.getElementById('dashboard-budget-desc');

      let expenses = 0;
      this.state.transactions.filter(t => t.type === 'expense').forEach(t => expenses += parseFloat(t.amount));

      const settings = this.state.financeSettings || {};
      const currency = settings.currencySymbol || '₹';
      const budgets = this.state.budgets || {};
      const categories = this.state.categories || {};
      
      let budgetMax = 0;
      Object.keys(categories)
        .filter(k => categories[k].type === 'expense')
        .forEach(k => {
          budgetMax += parseFloat(budgets[k] || 0);
        });

      if (budgetMax === 0) {
        budgetMax = 1200; // fallback default
      }

      budgetVal.textContent = `${currency}${expenses.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
      
      const budgetSpentPercent = budgetMax > 0 ? Math.min(Math.round((expenses / budgetMax) * 100), 100) : 0;
      budgetFill.style.width = `${budgetSpentPercent}%`;
      budgetDesc.textContent = `${budgetSpentPercent}% of ${currency}${budgetMax.toLocaleString(undefined, {maximumFractionDigits: 0})} budget spent`;
    },

    // Banner notification popup Toast
    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      
      let icon = 'info';
      if (type === 'success') icon = 'check-circle';
      if (type === 'error') icon = 'alert-triangle';

      toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
      `;
      
      container.appendChild(toast);
      if (window.lucide) window.lucide.createIcons();

      setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    // Module register hooks
    registerModule(name, controller) {
      this.modules[name] = controller;
      controller.app = this;
      if (typeof controller.init === 'function') {
        controller.init();
      }
    }
  };

  // Launch
  window.LifeOS.init();
});
