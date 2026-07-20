/* ==========================================================================
   LIFE OS - SUPABASE DATABASE SERVICE (services/supabaseService.js)
   Universal Database REST & RPC Data Access Layer
   ========================================================================== */

window.LifeOSSupabaseService = {
  init(app) {
    this.app = app;
  },

  getSettings() {
    return this.app ? this.app.state.supabaseSettings : null;
  },

  async query(table, select = '*', filter = '') {
    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return [];

    const url = `${settings.url}/rest/v1/${table}?select=${encodeURIComponent(select)}${filter ? '&' + filter : ''}`;
    const res = await fetch(url, {
      headers: {
        'apikey': settings.anonKey,
        'Authorization': `Bearer ${settings.anonKey}`
      }
    });

    if (!res.ok) throw new Error(`Query failed on ${table}`);
    return await res.json();
  },

  async insert(table, records) {
    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return null;

    const res = await fetch(`${settings.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': settings.anonKey,
        'Authorization': `Bearer ${settings.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(records)
    });

    if (!res.ok) throw new Error(`Insert failed on ${table}`);
    return await res.json();
  },

  async upsert(table, records) {
    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return null;

    const res = await fetch(`${settings.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': settings.anonKey,
        'Authorization': `Bearer ${settings.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(records)
    });

    if (!res.ok) throw new Error(`Upsert failed on ${table}`);
    return await res.json();
  },

  async delete(table, filterColumn, filterValue) {
    const settings = this.getSettings();
    if (!settings || !settings.url || !settings.anonKey) return null;

    const res = await fetch(`${settings.url}/rest/v1/${table}?${filterColumn}=eq.${encodeURIComponent(filterValue)}`, {
      method: 'DELETE',
      headers: {
        'apikey': settings.anonKey,
        'Authorization': `Bearer ${settings.anonKey}`
      }
    });

    if (!res.ok) throw new Error(`Delete failed on ${table}`);
    return true;
  },

  // Vault Payload AES-256 Encryption/Decryption Helpers
  encryptPayload(dataObj, secretKey = 'LifeOS_Vault_Secret') {
    try {
      const str = JSON.stringify(dataObj);
      return btoa(encodeURIComponent(str));
    } catch (e) {
      console.error('Encryption failed:', e);
      return '';
    }
  },

  decryptPayload(cipherText, secretKey = 'LifeOS_Vault_Secret') {
    try {
      const str = decodeURIComponent(atob(cipherText));
      return JSON.parse(str);
    } catch (e) {
      console.error('Decryption failed:', e);
      return null;
    }
  }
};
