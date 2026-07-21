/* ==========================================================================
   LIFE OS - AUTHENTICATION SERVICE (services/authService.js)
   Handles Supabase Authentication, Sign In, Sign Up, Password Recovery, & Sessions
   ========================================================================== */

window.LifeOSAuthService = {
  client: null,

  init(app) {
    this.app = app;
    this.getSupabaseClient();
    this.listenToAuthChanges();
  },

  getSupabaseClient() {
    if (this.client) return this.client;
    const settings = (this.app && this.app.state && this.app.state.supabaseSettings) 
      ? this.app.state.supabaseSettings 
      : {
          url: 'https://ytenffmtbmlhsfurjgrv.supabase.co',
          anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0ZW5mZm10Ym1saHNmdXJqZ3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMDQzNTYsImV4cCI6MjA5OTc4MDM1Nn0.sd597y6U3lpFgNLEiEpI1w_dMxEdG1acen5KwWMuMIY'
        };

    if (settings && settings.url && settings.anonKey && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        this.client = window.supabase.createClient(settings.url, settings.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        return this.client;
      } catch (e) {
        console.warn('[LifeOSAuthService] Supabase createClient init notice:', e);
        return null;
      }
    }
    return null;
  },

  // Check Session on Startup: Returns true if valid session exists
  async checkSession() {
    const client = this.getSupabaseClient();
    if (!client) {
      const stateUser = (this.app && this.app.state) ? this.app.state.user : null;
      return !!(stateUser && stateUser.isLoggedIn);
    }

    try {
      const { data: { session }, error } = await client.auth.getSession();
      if (error) {
        console.warn('[LifeOSAuthService] getSession warning:', error);
      }

      if (session && session.user) {
        this.restoreUserSession(session);
        return true;
      } else {
        const stateUser = (this.app && this.app.state) ? this.app.state.user : null;
        return !!(stateUser && stateUser.isLoggedIn);
      }
    } catch (err) {
      console.error('[LifeOSAuthService] Error checking session:', err);
      const stateUser = (this.app && this.app.state) ? this.app.state.user : null;
      return !!(stateUser && stateUser.isLoggedIn);
    }
  },

  restoreUserSession(session) {
    if (!this.app || !this.app.state) return;
    const user = session.user;
    
    this.app.state.user.isLoggedIn = true;
    this.app.state.user.id = user.id;
    this.app.state.user.email = user.email || this.app.state.user.email;
    
    if (user.user_metadata) {
      if (user.user_metadata.full_name) this.app.state.user.username = user.user_metadata.full_name;
      if (user.user_metadata.role) this.app.state.user.role = user.user_metadata.role;
      if (user.user_metadata.avatar) this.app.state.user.avatar = user.user_metadata.avatar;
    }

    if (typeof this.app.saveStateLocallyOnly === 'function') {
      this.app.saveStateLocallyOnly();
    } else if (typeof this.app.saveState === 'function') {
      this.app.saveState();
    }
  },

  // Listen for Supabase Auth State Changes (SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT)
  listenToAuthChanges() {
    const client = this.getSupabaseClient();
    if (!client) return;

    try {
      client.auth.onAuthStateChange((event, session) => {
        console.log(`[LifeOSAuthService] Auth State Changed: ${event}`);
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            if (session && session.user) {
              this.restoreUserSession(session);
            }
            break;

          case 'SIGNED_OUT':
            if (this.app && this.app.state && this.app.state.user) {
              this.app.state.user.isLoggedIn = false;
              if (typeof this.app.saveStateLocallyOnly === 'function') {
                this.app.saveStateLocallyOnly();
              }
            }
            if (window.LifeOSRouter) {
              window.LifeOSRouter.navigateTo('user');
            }
            break;
        }
      });
    } catch (e) {
      console.warn('[LifeOSAuthService] Could not subscribe to onAuthStateChange:', e);
    }
  },

  async signUp(email, password, metadata = {}) {
    const client = this.getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      if (error) throw new Error(error.message || 'Registration failed');
      return data;
    } else {
      const settings = this.app.state.supabaseSettings;
      if (!settings || !settings.url || !settings.anonKey) {
        throw new Error('Supabase configuration missing');
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
    }
  },

  async signIn(email, password) {
    const client = this.getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw new Error(error.message || 'Authentication failed');
      if (data && data.session) {
        this.restoreUserSession(data.session);
      }
      return data;
    } else {
      const settings = this.app.state.supabaseSettings;
      if (!settings || !settings.url || !settings.anonKey) {
        throw new Error('Supabase configuration missing');
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
    }
  },

  async resetPassword(email) {
    const client = this.getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.resetPasswordForEmail(email);
      if (error) throw new Error(error.message || 'Password recovery failed');
      return data;
    } else {
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
    }
  },

  async signOut() {
    const client = this.getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.warn('[LifeOSAuthService] SignOut warning:', e);
      }
    }

    if (this.app && this.app.state && this.app.state.user) {
      this.app.state.user.isLoggedIn = false;
      if (typeof this.app.saveStateLocallyOnly === 'function') {
        this.app.saveStateLocallyOnly();
      }
    }
    if (window.LifeOSRouter) {
      window.LifeOSRouter.navigateTo('user');
    }
  }
};
