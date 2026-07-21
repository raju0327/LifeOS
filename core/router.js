/* ==========================================================================
   LIFE OS - CORE ROUTER (core/router.js)
   SPA Routing Manager, Route Preservation & Auth Protection
   ========================================================================== */

window.LifeOSRouter = {
  currentView: 'dashboard',
  
  init(app) {
    this.app = app;
    this.bindNavEvents();
  },

  bindNavEvents() {
    const navItems = document.querySelectorAll('.nav-item');
    const viewPanels = document.querySelectorAll('.view-panel');

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-view');
        this.navigateTo(targetView);
      });
    });
  },

  navigateTo(targetView) {
    if (!targetView) return;

    // Auth guard check
    if (this.app && this.app.state && this.app.state.user && !this.app.state.user.isLoggedIn && targetView !== 'user') {
      if (this.app.showToast) {
        this.app.showToast('Workspace is locked. Please unlock first.', 'warning');
      }
      return;
    }

    const navItems = document.querySelectorAll('.nav-item');
    const viewPanels = document.querySelectorAll('.view-panel');

    navItems.forEach(n => n.classList.remove('active'));
    viewPanels.forEach(p => p.classList.remove('active'));

    const activeNav = document.querySelector(`.nav-item[data-view="${targetView}"]`);
    if (activeNav) activeNav.classList.add('active');

    const targetPanel = document.getElementById(`${targetView}-view`);
    if (targetPanel) targetPanel.classList.add('active');

    this.currentView = targetView;

    if (targetView !== 'user') {
      localStorage.setItem('life_os_active_view', targetView);
    }

    // Invoke module onActive lifecycle hook
    if (this.app && this.app.modules && this.app.modules[targetView] && typeof this.app.modules[targetView].onActive === 'function') {
      this.app.modules[targetView].onActive();
    }

    window.dispatchEvent(new Event('resize'));
  },

  async restoreSavedRoute() {
    let hasSession = false;
    if (window.LifeOSAuthService && typeof window.LifeOSAuthService.checkSession === 'function') {
      try {
        hasSession = await window.LifeOSAuthService.checkSession();
      } catch (e) {
        console.warn('[LifeOSRouter] checkSession warning:', e);
      }
    }

    if (!hasSession && this.app && this.app.state && this.app.state.user) {
      hasSession = !!this.app.state.user.isLoggedIn;
    }

    if (hasSession) {
      const saved = localStorage.getItem('life_os_active_view') || 'dashboard';
      const target = (saved === 'user' || !saved) ? 'dashboard' : saved;
      this.navigateTo(target);
    } else {
      this.navigateTo('user');
    }
  }
};
