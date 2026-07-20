/* ==========================================================================
   LIFE OS - AUTHENTICATION SERVICE (services/authService.js)
   Handles Supabase Authentication, Sign In, Sign Up, Password Recovery, & Sessions
   ========================================================================== */

window.LifeOSAuthService = {
  init(app) {
    this.app = app;
  },

  async signUp(email, password, metadata = {}) {
    const settings = this.app.state.supabaseSettings;
    if (!settings || !settings.url || !settings.anonKey) {
      throw new Error('Supabase URL/Key configuration missing');
    }

    const res = await fetch(`${settings.url}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': settings.anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        data: metadata
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.msg || data.error_description || 'Registration failed');
    }

    return data;
  },

  async signIn(email, password) {
    const settings = this.app.state.supabaseSettings;
    if (!settings || !settings.url || !settings.anonKey) {
      throw new Error('Supabase URL/Key configuration missing');
    }

    const res = await fetch(`${settings.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': settings.anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || data.msg || 'Authentication failed');
    }

    return data;
  },

  async resetPassword(email) {
    const settings = this.app.state.supabaseSettings;
    if (!settings || !settings.url || !settings.anonKey) {
      throw new Error('Supabase configuration missing');
    }

    const res = await fetch(`${settings.url}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'apikey': settings.anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.msg || 'Password recovery request failed');
    }

    return data;
  },

  signOut() {
    if (this.app && this.app.state && this.app.state.user) {
      this.app.state.user.isLoggedIn = false;
      this.app.saveStateLocallyOnly();
    }
    if (window.LifeOSRouter) {
      window.LifeOSRouter.navigateTo('user');
    }
  }
};
