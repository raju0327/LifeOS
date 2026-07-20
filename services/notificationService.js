/* ==========================================================================
   LIFE OS - NOTIFICATION SERVICE (services/notificationService.js)
   Toast Alerts & System Notifications Dispatcher
   ========================================================================== */

window.LifeOSNotificationService = {
  init(app) {
    this.app = app;
  },

  show(message, type = 'info') {
    if (this.app && typeof this.app.showToast === 'function') {
      this.app.showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  },

  addNotificationRecord(title, message, type = 'info') {
    if (!this.app || !this.app.state) return;
    if (!this.app.state.notifications) this.app.state.notifications = [];

    const notifObj = {
      id: 'notif_' + Date.now(),
      title,
      message,
      type,
      read: false,
      date: new Date().toLocaleDateString()
    };

    this.app.state.notifications.unshift(notifObj);
    if (this.app.state.notifications.length > 50) {
      this.app.state.notifications = this.app.state.notifications.slice(0, 50);
    }
    this.app.saveState();
  }
};
