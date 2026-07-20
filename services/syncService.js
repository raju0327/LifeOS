/* ==========================================================================
   LIFE OS - SYNCHRONIZATION SERVICE (services/syncService.js)
   Background Offline-to-Online Synchronization Manager
   ========================================================================== */

window.LifeOSSyncService = {
  isOnline: navigator.onLine,

  init(app) {
    this.app = app;
    this.bindNetworkListeners();
  },

  bindNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.app && this.app.showToast) {
        this.app.showToast('Network connection restored. Syncing database...', 'success');
      }
      this.triggerBackgroundSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      if (this.app && this.app.showToast) {
        this.app.showToast('Network connection lost. Running in Offline Mode.', 'warning');
      }
    });
  },

  async triggerBackgroundSync() {
    if (!this.isOnline || !this.app) return;
    try {
      await this.app.syncGlobalStateWithSupabase(false);
    } catch (e) {
      console.warn('Background auto-sync failed:', e);
    }
  }
};
