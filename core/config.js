/* ==========================================================================
   LIFE OS - CORE SYSTEM CONFIGURATION (core/config.js)
   ========================================================================== */

window.LifeOSConfig = {
  appName: 'Life OS',
  version: '2.5.0',
  storageKeys: {
    activeView: 'life_os_active_view',
    rememberedUser: 'lifeos_remembered_user',
    offlineState: 'lifeos_offline_state_v1'
  },
  supabase: {
    url: 'https://raju0327.supabase.co', // Default runtime URL fallback
    anonKey: 'ey...anon',                 // Default runtime Key fallback
    tables: {
      profiles: 'user_profiles',
      settings: 'user_settings',
      tasks: 'tasks',
      projects: 'projects',
      goals: 'goals',
      events: 'events',
      notes: 'notes',
      financeTransactions: 'finance_transactions',
      financeAccounts: 'finance_accounts',
      habits: 'habits',
      vault: 'vault_items',
      travelTrips: 'travel_trips'
    }
  }
};
