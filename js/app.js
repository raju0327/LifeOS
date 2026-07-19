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
      
      // Lifestyle & Travel Tracker
      travelTrips: [],
      travelItinerary: [],
      travelExpenses: [],
      travelGallery: [],
      travelDocuments: [],
      packingChecklist: [],
      bucketList: [],
      travelNotes: [],
      visitedPlaces: [],
      travelStatistics: {
        countriesCount: 0,
        citiesCount: 0,
        tripsCount: 0,
        daysTravelled: 0,
        totalSpent: 0,
        photosCaptured: 0
      },

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
      this.initMobileNavigation();
      this.initPullToRefresh();
      
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
      this.loadUserUuidMap();
    },

    loadUserUuidMap() {
      const settings = this.state.supabaseSettings;
      if (!settings || !settings.url || !settings.anonKey) return Promise.resolve();

      const mapUrl = `${settings.url}/rest/v1/rpc/get_user_uuid_mappings`;
      return fetch(mapUrl, {
        method: 'POST',
        headers: {
          'apikey': settings.anonKey,
          'Authorization': `Bearer ${settings.anonKey}`,
          'Content-Type': 'application/json'
        }
      })
      .then(r => r.ok ? r.json() : [])
      .then(mappings => {
        this.userUuidMap = {};
        mappings.forEach(m => {
          if (m.username && m.uuid) {
            this.userUuidMap[m.username.toLowerCase()] = m.uuid;
          }
        });
        console.log('UUID mappings loaded:', this.userUuidMap);
      })
      .catch(err => {
        console.error('Error fetching UUID mappings:', err);
      });
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
      const defaultAdminUuid = '85a62604-52ce-4f55-b5be-23aa8915497b';
      const resolvedUuid = this.userUuidMap ? (this.userUuidMap[username.toLowerCase()] || defaultAdminUuid) : defaultAdminUuid;

      const dashboardPayload = {};
      const keys = [
        'tasks', 'projects', 'events', 'timeblocks', 'notes', 'bookmarks', 
        'journalEntries', 'visionBoard', 'documents', 'waterIntake', 'sleepLogs', 
        'moodLogs', 'medicineReminders', 'nutritionLogs', 'workoutLogs', 'contacts', 
        'trips', 'vehicleLogs', 'mediaItems', 'shoppingList', 'skills', 
        'jobApplications', 'notifications',
        
        // Include all finance data keys
        'categories', 'subscriptions', 'loans', 'transactions', 'habits', 'vaultItems',
        
        // Travel Tracker keys
        'travelTrips', 'travelItinerary', 'travelExpenses', 'travelGallery', 'travelDocuments', 
        'packingChecklist', 'bucketList', 'travelNotes', 'visitedPlaces', 'travelStatistics'
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
          p_user_id: resolvedUuid,
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
      if (!settings || !settings.url || !settings.anonKey) return Promise.reject('No Supabase settings configured');

      const runSync = () => {
        if (!isFirstLoad) this.showToast('Pulling dashboard records from Database...', 'info');

        const username = this.state.user.id || 'admin';
        const defaultAdminUuid = '85a62604-52ce-4f55-b5be-23aa8915497b';
        const resolvedUuid = this.userUuidMap ? (this.userUuidMap[username.toLowerCase()] || defaultAdminUuid) : defaultAdminUuid;

        const secUrl = `${settings.url}/rest/v1/workspace_security?key=eq.security_registry&select=data`;
        const rpcUrl = `${settings.url}/rest/v1/rpc/get_user_dashboard`;

        let mergedAny = false;

        return Promise.all([
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
              p_user_id: resolvedUuid
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
              'categories', 'subscriptions', 'loans', 'transactions', 'habits', 'vaultItems',
              
              // Travel Tracker keys
              'travelTrips', 'travelItinerary', 'travelExpenses', 'travelGallery', 'travelDocuments', 
              'packingChecklist', 'bucketList', 'travelNotes', 'visitedPlaces', 'travelStatistics'
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
            if (!isFirstLoad) this.showToast('Global database sync completed.', 'success');
            
            Object.keys(this.modules).forEach(key => {
              if (typeof this.modules[key].render === 'function') {
                try {
                  this.modules[key].render();
                } catch (e) {
                  console.warn(`Failed rendering module ${key}:`, e);
                }
              }
            });
          }
          return dashboardObj;
        })
        .catch(err => {
          console.error('Supabase fetch error:', err);
          if (!isFirstLoad) this.showToast('Database fetch request failed.', 'error');
          throw err;
        });
      };

      if (!this.userUuidMap) {
        return this.loadUserUuidMap().then(runSync);
      } else {
        return runSync();
      }
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
      this.state.travelTrips = [];
      this.state.travelItinerary = [];
      this.state.travelExpenses = [];
      this.state.travelGallery = [];
      this.state.travelDocuments = [];
      this.state.packingChecklist = [];
      this.state.bucketList = [];
      this.state.travelNotes = [];
      this.state.visitedPlaces = [];
      this.state.travelStatistics = {
        countriesCount: 0,
        citiesCount: 0,
        tripsCount: 0,
        daysTravelled: 0,
        totalSpent: 0,
        photosCaptured: 0
      };

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

          if (targetView !== 'user') {
            localStorage.setItem('life_os_active_view', targetView);
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



      // Restore active view tab on page load/refresh or fallback to lock screen if logged out
      if (this.state.user.isLoggedIn) {
        const savedView = localStorage.getItem('life_os_active_view');
        if (savedView) {
          setTimeout(() => {
            const savedNav = document.querySelector(`.nav-item[data-view="${savedView}"]`);
            if (savedNav) {
              savedNav.click();
            }
          }, 150);
        }
      } else {
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

    // Mobile Navigation & Portals
    initMobileNavigation() {
      // 1. Hamburger menu toggle to slide in desktop sidebar on mobile
      const menuToggle = document.getElementById('mobile-menu-toggle');
      const sidebar = document.querySelector('.sidebar');
      const overlay = document.getElementById('sidebar-overlay');

      if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          sidebar.classList.toggle('open');
          overlay?.classList.toggle('open');
        });
      }

      // Close sidebar if clicking overlay
      if (overlay) {
        overlay.addEventListener('click', () => {
          sidebar?.classList.remove('open');
          overlay.classList.remove('open');
        });
      }

      // Close sidebar if clicking any link inside it on mobile
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          if (sidebar?.classList.contains('open')) {
            sidebar.classList.remove('open');
            overlay?.classList.remove('open');
          }
        });
      });

      // 2. Mobile bottom nav tab buttons
      const mobileNavButtons = document.querySelectorAll('.mobile-nav-btn');
      mobileNavButtons.forEach(btn => {
        if (btn.id === 'mobile-quick-add-btn') return; // skip center add button
        
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetView = btn.getAttribute('data-view');
          
          // Click corresponding desktop sidebar item to trigger SPA navigation
          const desktopNavBtn = document.querySelector(`.nav-item[data-view="${targetView}"]`);
          if (desktopNavBtn) {
            desktopNavBtn.click();
          }

          // Update active style on mobile nav buttons
          mobileNavButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      // Synchronize mobile bottom nav active class when desktop sidebar changes active view
      const observer = new MutationObserver(() => {
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) {
          const currentView = activeNav.getAttribute('data-view');
          mobileNavButtons.forEach(btn => {
            if (btn.getAttribute('data-view') === currentView) {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          });
        }
      });

      const sidebarNav = document.querySelector('.sidebar-nav');
      if (sidebarNav) {
        observer.observe(sidebarNav, { subtree: true, attributes: true, attributeFilter: ['class'] });
      }

      // 3. Center Quick Add Button sheet modal toggles
      const quickAddBtn = document.getElementById('mobile-quick-add-btn');
      const actionDrawerOverlay = document.getElementById('mobile-action-drawer-overlay');
      const actionDrawer = actionDrawerOverlay?.querySelector('.mobile-action-drawer');
      const closeDrawerBtn = document.getElementById('close-mobile-drawer-btn');

      if (quickAddBtn && actionDrawerOverlay && actionDrawer) {
        quickAddBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          actionDrawerOverlay.style.display = 'flex';
          setTimeout(() => {
            actionDrawer.style.transform = 'translateY(0)';
          }, 10);
        });
      }

      const closeDrawer = () => {
        if (actionDrawer && actionDrawerOverlay) {
          actionDrawer.style.transform = 'translateY(100%)';
          setTimeout(() => {
            actionDrawerOverlay.style.display = 'none';
          }, 300);
        }
      };

      if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', closeDrawer);
      }

      if (actionDrawerOverlay) {
        actionDrawerOverlay.addEventListener('click', (e) => {
          if (e.target === actionDrawerOverlay) {
            closeDrawer();
          }
        });
      }

      // 4. Quick Actions in Drawer trigger corresponding actions
      const drawerActions = document.querySelectorAll('.mobile-drawer-action');
      drawerActions.forEach(btn => {
        btn.addEventListener('click', (e) => {
          closeDrawer();
          const action = btn.getAttribute('data-action');
          
          if (action === 'task') {
            document.querySelector('.nav-item[data-view="tasks"]')?.click();
            this.showToast('Write a task title to insert.', 'info');
          } else if (action === 'note') {
            document.querySelector('.nav-item[data-view="notes"]')?.click();
            this.showToast('Write note content to log.', 'info');
          } else if (action === 'finance') {
            document.querySelector('.nav-item[data-view="finance"]')?.click();
            this.showToast('Log a new transaction cost.', 'info');
          } else if (action === 'water') {
            this.state.waterIntake = Math.min(this.state.waterIntake + 1, 12);
            this.saveState();
            this.showToast('Cup of water added!', 'success');
          }
        });
      });

      // 5. Global Link data-view router binding
      document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-view]');
        if (!link || link.classList.contains('nav-item') || link.classList.contains('dropdown-item') || link.classList.contains('user-subnav-btn') || link.classList.contains('mobile-nav-btn')) return;
        
        const targetView = link.getAttribute('data-view');
        const navBtn = document.querySelector(`.nav-item[data-view="${targetView}"]`);
        if (navBtn) {
          navBtn.click();
        }
      });
    },

    // Clock
    initClock() {
      const liveClockEl = document.getElementById('live-clock');
      const liveDateEl = document.getElementById('live-date');

      const tick = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (liveDateEl) liveDateEl.textContent = dateStr;
        const mobileLiveDateEl = document.getElementById('mobile-live-date');
        if (mobileLiveDateEl) mobileLiveDateEl.textContent = dateStr;
        
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

      const mobileInput = document.getElementById('mobile-search-input');

      const handleSearch = (el) => {
        const query = el.value.toLowerCase().trim();
        if (!query) return;

        // Search tasks, projects, notes, and transactions
        let taskMatches = this.state.tasks.filter(t => t.title.toLowerCase().includes(query)).length;
        let notesMatches = this.state.notes.filter(n => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)).length;
        let finMatches = this.state.transactions.filter(t => t.description.toLowerCase().includes(query)).length;

        const totalMatches = taskMatches + notesMatches + finMatches;
        
        this.showToast(`Found ${totalMatches} matches globally (${taskMatches} tasks, ${notesMatches} notes, ${finMatches} finances).`, 'info');
        el.value = '';
      };

      if (input) {
        input.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') {
            handleSearch(input);
          }
        });
      }

      if (mobileInput) {
        mobileInput.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') {
            handleSearch(mobileInput);
          }
        });
      }
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

      // Dynamic Greeting based on time of day and username
      const greetingEl = document.getElementById('greeting-text');
      const mobileGreetingEl = document.getElementById('mobile-greeting-text');
      const username = this.state.user.username || 'Explorer';
      
      const hrs = new Date().getHours();
      let prefix = 'Good morning';
      if (hrs >= 12 && hrs < 17) prefix = 'Good afternoon';
      if (hrs >= 17) prefix = 'Good evening';
      
      const greetingStr = `${prefix}, ${username}`;
      if (greetingEl) greetingEl.textContent = greetingStr;
      if (mobileGreetingEl) mobileGreetingEl.innerHTML = `${greetingStr} <span class="wave-emoji">👋</span>`;

      // 1. Task progress
      const ring = document.getElementById('tasks-progress-ring');
      const text = document.getElementById('tasks-progress-text');
      const desc = document.getElementById('tasks-summary-desc');
      
      const activeTasks = this.state.tasks.filter(t => !t.completed);
      const compTasks = this.state.tasks.filter(t => t.completed);
      const total = this.state.tasks.length;

      const isMobile = window.innerWidth <= 768;
      const baseCircum = isMobile ? 150.8 : 251.32;

      if (total > 0) {
        const percent = Math.round((compTasks.length / total) * 100);
        const offset = baseCircum - (percent / 100) * baseCircum;
        if (ring) ring.style.strokeDashoffset = offset;
        if (text) text.textContent = `${percent}%`;
        if (desc) desc.textContent = `${compTasks.length} of ${total} tasks complete`;
      } else {
        if (ring) ring.style.strokeDashoffset = baseCircum;
        if (text) text.textContent = '0%';
        if (desc) desc.textContent = 'No tasks logged';
      }

      // 2. Habits (Calculates actual completion from current state habits list)
      const habitsRing = document.getElementById('habits-progress-ring');
      const habitsText = document.getElementById('habits-progress-text');
      const habitsDesc = document.getElementById('habits-summary-desc');

      const habitsList = this.state.habits || [];
      const today = new Date();
      const todayDayIdx = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
      const todayStr = today.toLocaleDateString('sv').substring(0, 10);

      // Filter habits scheduled for today
      const todayHabits = habitsList.filter(h => h.weeklySchedule[todayDayIdx]);
      const compHabits = todayHabits.filter(h => h.history[todayStr] === 'done');

      if (todayHabits.length > 0) {
        const percent = Math.round((compHabits.length / todayHabits.length) * 100);
        const offset = baseCircum - (percent / 100) * baseCircum;
        if (habitsRing) habitsRing.style.strokeDashoffset = offset;
        if (habitsText) habitsText.textContent = `${percent}%`;
        if (habitsDesc) habitsDesc.textContent = `${compHabits.length} of ${todayHabits.length} habits complete`;
      } else {
        if (habitsRing) habitsRing.style.strokeDashoffset = baseCircum;
        if (habitsText) habitsText.textContent = '0%';
        if (habitsDesc) habitsDesc.textContent = 'No habits scheduled today';
      }

      // Render Dashboard Habits List
      const dashboardHabitsList = document.getElementById('dashboard-habits-list');
      if (dashboardHabitsList) {
        if (habitsList.length === 0) {
          dashboardHabitsList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 15px;">No habits created yet. Go to <a href="#habits" data-view="habits" style="color: var(--primary);">Habit Tracker</a> to add some!</div>`;
        } else {
          // Find start of week (Sunday)
          const startOfWeek = new Date();
          const dayOffset = startOfWeek.getDay();
          startOfWeek.setDate(startOfWeek.getDate() - dayOffset);
          
          const daysAbbr = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
          let headersHtml = '';
          daysAbbr.forEach((abbr, idx) => {
            headersHtml += `<span style="font-size: 0.6rem; width: 18px; text-align: center; display: inline-block; color: var(--text-muted); font-weight: bold;">${abbr}</span>`;
          });
          
          let habitsHtml = `
            <div style="display: flex; justify-content: flex-end; padding-right: 12px; margin-bottom: 6px;">
              <div style="display: flex; gap: 4px;">
                ${headersHtml}
              </div>
            </div>
          `;
          
          // Display up to 5 habits on the dashboard for cleanliness
          const displayHabits = habitsList.slice(0, 5);
          
          displayHabits.forEach(h => {
            let dotsHtml = '';
            for (let idx = 0; idx < 7; idx++) {
              const weekDate = new Date(startOfWeek);
              weekDate.setDate(startOfWeek.getDate() + idx);
              const weekDateStr = weekDate.toLocaleDateString('sv').substring(0, 10);
              const isSched = h.weeklySchedule[idx];
              const status = h.history[weekDateStr];
              
              let dotStyle = 'background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.15);';
              let dotContent = '';
              
              if (isSched) {
                if (status === 'done') {
                  dotStyle = 'background: var(--green); border: none; color: #fff; box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);';
                  dotContent = '<i class="fas fa-check" style="font-size: 0.5rem;"></i>';
                } else if (status === 'partial') {
                  dotStyle = 'background: var(--yellow); border: none; color: #fff;';
                  dotContent = '<i class="fas fa-adjust" style="font-size: 0.5rem;"></i>';
                } else if (status === 'missed') {
                  dotStyle = 'background: rgba(239, 68, 68, 0.2); border: 1px solid var(--red); color: var(--red);';
                  dotContent = '<i class="fas fa-times" style="font-size: 0.5rem;"></i>';
                } else {
                  dotStyle = 'background: rgba(255,255,255,0.02); border: 1.2px solid rgba(255,255,255,0.2);';
                }
              } else {
                dotStyle = 'opacity: 0.15; pointer-events: none; border: 1px dashed rgba(255,255,255,0.1);';
              }
              
              dotsHtml += `
                <div style="width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; ${dotStyle}">
                  ${dotContent}
                </div>
              `;
            }
            
            habitsHtml += `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--glass-highlight); border: 1px solid var(--glass-border); border-radius: var(--radius-md); margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 26px; height: 26px; border-radius: 50%; background: ${h.color}15; border: 1.5px solid ${h.color}; display: flex; align-items: center; justify-content: center; font-size: 0.95rem;">
                    ${h.icon}
                  </div>
                  <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">${h.name}</span>
                </div>
                <div style="display: flex; gap: 4px;">
                  ${dotsHtml}
                </div>
              </div>
            `;
          });
          
          dashboardHabitsList.innerHTML = habitsHtml;
        }
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

    // Pull down to refresh gesture implementation for mobile & desktop
    initPullToRefresh() {
      const mainContent = document.querySelector('.main-content');
      if (!mainContent) return;

      mainContent.style.position = 'relative';

      const ptrElement = document.createElement('div');
      ptrElement.id = 'pull-to-refresh-indicator';
      ptrElement.className = 'pull-to-refresh-indicator';
      ptrElement.innerHTML = `
        <div class="ptr-content">
          <div class="ptr-icon-spinner">
            <i class="fas fa-arrow-down ptr-icon" id="ptr-arrow-icon"></i>
            <div class="ptr-spinner-element hidden" id="ptr-spinner-icon"></div>
          </div>
          <span class="ptr-label" id="ptr-label-text">Pull to refresh</span>
        </div>
      `;
      mainContent.insertBefore(ptrElement, mainContent.firstChild);

      let startY = 0;
      let currentY = 0;
      let isPulling = false;
      let activePull = false;
      const pullThreshold = 75; 
      const maxPull = 120; 

      const getEventY = (e) => {
        if (e.touches && e.touches.length) {
          return e.touches[0].pageY;
        }
        return e.pageY;
      };

      const startPull = (e) => {
        if (!this.state.user.isLoggedIn) return;
        if (mainContent.scrollTop !== 0) return;
        if (ptrElement.classList.contains('refreshing')) return;

        startY = getEventY(e);
        activePull = true;
        isPulling = false;
      };

      const movePull = (e) => {
        if (!activePull) return;
        currentY = getEventY(e);
        const diff = currentY - startY;

        if (diff > 0) {
          if (!isPulling) {
            isPulling = true;
            ptrElement.classList.add('visible');
            ptrElement.classList.remove('hidden');
          }

          if (e.cancelable) {
            e.preventDefault();
          }

          const pullDist = Math.min(diff * 0.45, maxPull);
          ptrElement.style.top = `${10 + pullDist}px`;

          const arrowIcon = document.getElementById('ptr-arrow-icon');
          const labelText = document.getElementById('ptr-label-text');

          if (pullDist >= pullThreshold) {
            if (arrowIcon) arrowIcon.style.transform = 'rotate(180deg)';
            if (labelText) labelText.textContent = 'Release to refresh';
          } else {
            if (arrowIcon) arrowIcon.style.transform = 'rotate(0deg)';
            if (labelText) labelText.textContent = 'Pull to refresh';
          }
        }
      };

      const endPull = () => {
        if (!activePull) return;
        activePull = false;

        if (isPulling) {
          isPulling = false;
          const diff = currentY - startY;
          const pullDist = diff * 0.45;

          const arrowIcon = document.getElementById('ptr-arrow-icon');
          const spinnerIcon = document.getElementById('ptr-spinner-icon');
          const labelText = document.getElementById('ptr-label-text');

          if (pullDist >= pullThreshold) {
            ptrElement.classList.add('refreshing');
            ptrElement.style.top = `${10 + pullThreshold}px`;
            
            if (arrowIcon) arrowIcon.classList.add('hidden');
            if (spinnerIcon) spinnerIcon.classList.remove('hidden');
            if (labelText) labelText.textContent = 'Refreshing...';

            const prevScrollTop = mainContent.scrollTop;

            this.syncGlobalStateWithSupabase(false)
              .then(() => {
                if (labelText) labelText.textContent = 'Updated!';
                ptrElement.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.4), 0 0 10px rgba(16, 185, 129, 0.3)';
                
                setTimeout(() => {
                  ptrElement.classList.remove('refreshing', 'visible');
                  ptrElement.classList.add('hidden');
                  ptrElement.style.top = '10px';
                  ptrElement.style.boxShadow = '';
                  
                  if (arrowIcon) {
                    arrowIcon.classList.remove('hidden');
                    arrowIcon.style.transform = 'rotate(0deg)';
                  }
                  if (spinnerIcon) spinnerIcon.classList.add('hidden');
                  mainContent.scrollTop = prevScrollTop;
                }, 1000);
              })
              .catch((err) => {
                console.error('Pull to refresh failed:', err);
                if (labelText) labelText.textContent = 'Sync Failed';
                ptrElement.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.4), 0 0 10px rgba(239, 68, 68, 0.3)';
                this.showToast('Database refresh failed. Touch to retry.', 'error');
                
                setTimeout(() => {
                  ptrElement.classList.remove('refreshing', 'visible');
                  ptrElement.classList.add('hidden');
                  ptrElement.style.top = '10px';
                  ptrElement.style.boxShadow = '';
                  
                  if (arrowIcon) {
                    arrowIcon.classList.remove('hidden');
                    arrowIcon.style.transform = 'rotate(0deg)';
                  }
                  if (spinnerIcon) spinnerIcon.classList.add('hidden');
                }, 2000);
              });
          } else {
            ptrElement.classList.remove('visible');
            ptrElement.classList.add('hidden');
            ptrElement.style.top = '10px';
            if (arrowIcon) arrowIcon.style.transform = 'rotate(0deg)';
          }
        }
      };

      mainContent.addEventListener('touchstart', startPull, { passive: true });
      mainContent.addEventListener('touchmove', movePull, { passive: false });
      mainContent.addEventListener('touchend', endPull, { passive: true });
      mainContent.addEventListener('touchcancel', endPull, { passive: true });

      let isMouseDown = false;
      mainContent.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isMouseDown = true;
        startPull(e);
      });
      mainContent.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        movePull(e);
      });
      const handleMouseUp = () => {
        if (isMouseDown) {
          isMouseDown = false;
          endPull();
        }
      };
      mainContent.addEventListener('mouseup', handleMouseUp);
      mainContent.addEventListener('mouseleave', handleMouseUp);
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
