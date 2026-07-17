/* ==========================================================================
   LIFE OS - USER MANAGEMENT MODULE (js/user.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const UserModule = {
    activeTab: 'profile',
    verificationOtp: null,
    pendingProfileData: null,
    recoveryOtp: null,
    recoveryUser: null,
    recentLogins: [],

    init() {
      // Global utility bindings for security overview screen
      window.signOutSession = (sessId) => {
        const activeName = this.app.state.user.username;
        let member = this.app.state.members.find(m => !m.isDeleted && m.name === activeName);
        if (!member) member = this.app.state.user;
        
        member.sessions = (member.sessions || []).filter(s => s.id !== sessId);
        this.app.saveState();
        this.logSecurityEvent('Sign Out Device', `Terminated device session ID: ${sessId}`, activeName);
        this.app.showToast('Device logged out successfully.', 'info');
        this.render();
      };

      window.checkPasswordStrength = (pwd) => {
        const label = document.getElementById('pwd-strength-label');
        const bar1 = document.getElementById('pwd-bar-1');
        const bar2 = document.getElementById('pwd-bar-2');
        const bar3 = document.getElementById('pwd-bar-3');
        const bar4 = document.getElementById('pwd-bar-4');
        
        const ruleChar = document.getElementById('rule-char');
        const ruleUpper = document.getElementById('rule-upper');
        const ruleNum = document.getElementById('rule-num');
        const ruleSpecial = document.getElementById('rule-special');
        
        let score = 0;
        const checks = {
          char: pwd.length >= 8,
          upper: /[A-Z]/.test(pwd),
          num: /[0-9]/.test(pwd),
          special: /[^A-Za-z0-9]/.test(pwd)
        };
        
        if (ruleChar) ruleChar.innerHTML = checks.char ? `<i class="fas fa-check-circle" style="color: var(--green);"></i> At least 8 characters` : `<i class="far fa-circle"></i> At least 8 characters`;
        if (ruleUpper) ruleUpper.innerHTML = checks.upper ? `<i class="fas fa-check-circle" style="color: var(--green);"></i> One uppercase letter` : `<i class="far fa-circle"></i> One uppercase letter`;
        if (ruleNum) ruleNum.innerHTML = checks.num ? `<i class="fas fa-check-circle" style="color: var(--green);"></i> One number` : `<i class="far fa-circle"></i> One number`;
        if (ruleSpecial) ruleSpecial.innerHTML = checks.special ? `<i class="fas fa-check-circle" style="color: var(--green);"></i> One special character` : `<i class="far fa-circle"></i> One special character`;
        
        if (checks.char) score++;
        if (checks.upper) score++;
        if (checks.num) score++;
        if (checks.special) score++;
        
        if (bar1) bar1.style.background = score >= 1 ? (score <= 2 ? 'var(--red)' : score === 3 ? 'var(--yellow)' : 'var(--green)') : 'rgba(255,255,255,0.05)';
        if (bar2) bar2.style.background = score >= 2 ? (score <= 2 ? 'var(--red)' : score === 3 ? 'var(--yellow)' : 'var(--green)') : 'rgba(255,255,255,0.05)';
        if (bar3) bar3.style.background = score >= 3 ? (score === 3 ? 'var(--yellow)' : 'var(--green)') : 'rgba(255,255,255,0.05)';
        if (bar4) bar4.style.background = score >= 4 ? 'var(--green)' : 'rgba(255,255,255,0.05)';
        
        if (label) {
          if (score === 0) label.textContent = 'None';
          else if (score <= 2) { label.textContent = 'Weak'; label.style.color = 'var(--red)'; }
          else if (score === 3) { label.textContent = 'Medium'; label.style.color = 'var(--yellow)'; }
          else { label.textContent = 'Strong'; label.style.color = 'var(--green)'; }
        }
      };

      this.initDatabaseDefaults();
      this.setupSubnav();
      this.setupForms();
      this.setupLockPortal();
      this.setupRecoveryModal();
      this.setupAutoLogout();
      this.render();
    },

    onActive() {
      this.render();
    },

    // Ensure state.members have all necessary enterprise properties
    initDatabaseDefaults() {
      const state = this.app.state;
      if (!state.members) {
        state.members = [];
      }
      if (!state.members.some(m => m.id === 'admin')) {
        state.members.unshift({
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
      if (state.members.length === 1 && state.members[0].id === 'admin') {
        // Appending standard mock family tracker members
        const mockFamily = this.app.getMockMembers();
        mockFamily.forEach(fam => {
          if (!state.members.some(m => m.id === fam.id)) {
            state.members.push(fam);
          }
        });
      }

      state.members.forEach(m => {
        if (!m.email) m.email = `${m.id}@lifeos.com`;
        if (!m.mobile) m.mobile = `+91 98765 4321${Math.floor(Math.random() * 10)}`;
        if (!m.status) m.status = 'Active'; // Active, Deactivated, Suspended, Locked
        if (!m.failedAttempts) m.failedAttempts = 0;
        if (!m.passwordHistory) m.passwordHistory = [m.password || 'admin'];
        if (!m.sessions) {
          m.sessions = [
            { id: 'sess_1', device: 'Chrome / Windows 11', ip: '192.168.1.102', time: 'Active Now' }
          ];
        }
        if (!m.isDeleted) m.isDeleted = false; // Soft delete
      });

      // Default Admin properties
      if (!state.user.email) state.user.email = 'admin@lifeos.com';
      if (!state.user.mobile) state.user.mobile = '+91 99999 99999';
      if (!state.user.status) state.user.status = 'Active';
      if (!state.user.failedAttempts) state.user.failedAttempts = 0;
      if (!state.user.passwordHistory) state.user.passwordHistory = [state.user.password || 'admin'];
      if (!state.user.sessions) {
        state.user.sessions = [
          { id: 'sess_admin', device: 'Edge / Windows 11', ip: '192.168.1.100', time: 'Active Now' }
        ];
      }

      if (!state.securityLogs) {
        state.securityLogs = [];
      }
    },

    // Log security events dynamically
    logSecurityEvent(action, details, username = 'System') {
      const timeStamp = new Date().toLocaleString();
      const newLog = {
        timestamp: timeStamp,
        action,
        details,
        user: username
      };
      this.app.state.securityLogs.unshift(newLog);
      // Keep last 150 entries
      if (this.app.state.securityLogs.length > 150) {
        this.app.state.securityLogs.pop();
      }
      this.app.saveState();
    },

    setupSubnav() {
      const tabButtons = document.querySelectorAll('.user-subnav-btn');
      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          tabButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const tabName = btn.getAttribute('data-tab');
          this.activeTab = tabName;

          // Toggle tab panels
          document.querySelectorAll('.user-tab-content').forEach(panel => {
            panel.classList.remove('active');
          });
          document.getElementById(`user-tab-${tabName}`)?.classList.add('active');

          this.render();
        });
      });

      // Bind collapsible cards inside User Profiles tab
      document.querySelectorAll('.collapsible-card .card-header-toggle').forEach(header => {
        header.addEventListener('click', () => {
          const card = header.closest('.collapsible-card');
          card.classList.toggle('collapsed');
        });
      });
    },

    setupAutoLogout() {
      // Inactivity session timeout: 5 minutes (300 seconds)
      let inactivityTimer;
      const resetInactivity = () => {
        clearTimeout(inactivityTimer);
        if (this.app.state.user.isLoggedIn) {
          inactivityTimer = setTimeout(() => {
            this.app.state.user.isLoggedIn = false;
            this.app.saveState();
            this.logSecurityEvent('Session Timeout', 'Automatic logout due to 5 minutes of inactivity', this.app.state.user.username);
            this.app.showToast('Workspace locked due to inactivity.', 'info');
            this.render();
          }, 300000); // 300,000ms = 5 mins
        }
      };

      // Listen for basic user interactions
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, resetInactivity, true);
      });

      resetInactivity();
    },

    // Enforce password requirements
    validatePasswordComplexity(password) {
      const minLength = password.length >= 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

      return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
    },

    setupLockPortal() {
      const lockOverlay = document.getElementById('login-portal-standalone');
      const btnModeLogin = document.getElementById('lock-btn-mode-login');
      const btnModeRegister = document.getElementById('lock-btn-mode-register');
      
      const formLogin = document.getElementById('lock-login-form');
      const formRegister = document.getElementById('lock-register-form');

      // Bind Topbar Profile Dropdown Toggle
      const profileCard = document.getElementById('topbar-profile-card');
      const profileDropdown = document.getElementById('topbar-profile-dropdown');
      if (profileCard && profileDropdown) {
        profileCard.addEventListener('click', (e) => {
          e.stopPropagation();
          profileDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', () => {
          profileDropdown.classList.add('hidden');
        });
      }

      // Toggle Login / Register
      if (btnModeLogin && btnModeRegister) {
        btnModeLogin.addEventListener('click', () => {
          formLogin?.classList.remove('hidden');
          formRegister?.classList.add('hidden');
          btnModeLogin.style.background = 'var(--primary)';
          btnModeLogin.style.border = 'none';
          btnModeRegister.style.background = 'rgba(255,255,255,0.05)';
          btnModeRegister.style.border = '1px solid var(--glass-border)';
        });

        btnModeRegister.addEventListener('click', () => {
          formLogin?.classList.add('hidden');
          formRegister?.classList.remove('hidden');
          btnModeRegister.style.background = 'var(--primary)';
          btnModeRegister.style.border = 'none';
          btnModeLogin.style.background = 'rgba(255,255,255,0.05)';
          btnModeLogin.style.border = '1px solid var(--glass-border)';
        });
      }

      // 1. Process Login
      formLogin?.addEventListener('submit', (e) => {
        e.preventDefault();
        const userInput = document.getElementById('lock-login-user').value.trim();
        const passInput = document.getElementById('lock-login-pass').value;
        const rememberMe = document.getElementById('lock-login-remember').checked;

        // Rate Limiter Check (simulate max 3 requests per 10s)
        const now = Date.now();
        this.recentLogins = this.recentLogins.filter(t => now - t < 10000);
        if (this.recentLogins.length >= 3) {
          this.app.showToast('Rate limit exceeded. Please wait 10 seconds.', 'error');
          return;
        }
        this.recentLogins.push(now);

        // Find user account
        let targetAccount = this.app.state.members.find(m => {
          if (m.isDeleted) return false;
          const idMatch = m.id && m.id.toLowerCase() === userInput.toLowerCase();
          const nameMatch = m.name && m.name.toLowerCase() === userInput.toLowerCase();
          const emailMatch = m.email && m.email.toLowerCase() === userInput.toLowerCase();
          return idMatch || nameMatch || emailMatch;
        });

        if (!targetAccount) {
          this.app.showToast('Authentication failed: Invalid credentials.', 'error');
          return;
        }

        // Account Status Guard
        if (targetAccount.status === 'Locked') {
          this.app.showToast('Account is locked due to multiple failed login attempts. Contact Admin.', 'error');
          return;
        }
        if (targetAccount.status === 'Suspended') {
          this.app.showToast('Account is suspended. Access denied.', 'error');
          return;
        }
        if (targetAccount.status === 'Deactivated') {
          this.app.showToast('Account is deactivated. Re-enable it via administrator.', 'error');
          return;
        }

        // Validate Password
        if ((targetAccount.password || 'admin') === passInput) {
          // Success
          targetAccount.failedAttempts = 0;
          
          this.app.state.user.isLoggedIn = true;
          this.app.state.user.id = targetAccount.id; // Store active user ID
          this.app.state.user.username = targetAccount.name;
          this.app.state.user.avatar = targetAccount.avatar;
          this.app.state.user.role = targetAccount.role === 'Father' || targetAccount.role === 'Mother' ? 'Administrator' : targetAccount.role;
          this.app.state.user.email = targetAccount.email;
          this.app.state.user.mobile = targetAccount.mobile;
          this.app.state.user.password = passInput;

          // Log session device details
          const ip = '192.168.1.' + Math.floor(Math.random() * 200 + 50);
          const device = navigator.userAgent.includes('Chrome') ? 'Chrome / Windows' : 'Webkit Browser';
          const newSession = {
            id: 'sess_' + Date.now(),
            device,
            ip,
            time: new Date().toLocaleString()
          };
          if (!targetAccount.sessions) targetAccount.sessions = [];
          targetAccount.sessions.unshift(newSession);
          if (targetAccount.sessions.length > 5) {
            targetAccount.sessions = targetAccount.sessions.slice(0, 5);
          }

          // Support Remember Me option
          if (rememberMe) {
            localStorage.setItem('lifeos_remembered_user', userInput);
          } else {
            localStorage.removeItem('lifeos_remembered_user');
          }

          this.app.activeViewedUser = targetAccount.id;
          this.app.saveState();
          this.app.syncGlobalGoogleSheetData(false);
          if (this.app.modules.finance) {
            this.app.modules.finance.syncGoogleSheetData(false);
          }
          this.logSecurityEvent('Login Success', `Unlock successful via IP ${ip} on device ${device}`, targetAccount.name || targetAccount.username);
          this.app.showToast(`Decrypted successfully! Welcome back, ${this.app.state.user.username}.`, 'success');
          
          // Clear inputs
          document.getElementById('lock-login-user').value = '';
          document.getElementById('lock-login-pass').value = '';
          this.render();
        } else {
          // Failed attempt
          targetAccount.failedAttempts = (targetAccount.failedAttempts || 0) + 1;
          this.logSecurityEvent('Failed Login', `Incorrect password attempt (${targetAccount.failedAttempts}/5)`, targetAccount.name || targetAccount.username);
          
          if (targetAccount.failedAttempts >= 5) {
            targetAccount.status = 'Locked';
            this.logSecurityEvent('Account Locked', 'Account locked automatically due to 5 failed logins', targetAccount.name || targetAccount.username);
            this.app.showToast('Account has been locked due to 5 failed login attempts.', 'error');
          } else {
            this.app.showToast(`Invalid password. Attempt ${targetAccount.failedAttempts} of 5.`, 'warning');
          }
          this.app.saveState();
        }
      });

      // 2. Process Registration
      formRegister?.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('lock-reg-username').value.trim().toLowerCase();
        const name = document.getElementById('lock-reg-name').value.trim();
        const email = document.getElementById('lock-reg-email').value.trim();
        const mobile = document.getElementById('lock-reg-mobile').value.trim();
        const pass = document.getElementById('lock-reg-pass').value;
        const role = document.getElementById('lock-reg-role').value;
        const avatar = document.getElementById('lock-reg-avatar').value.trim();

        // Unique username/email check
        const isUserDuplicate = this.app.state.members.some(m => !m.isDeleted && (m.id.toLowerCase() === username || m.email.toLowerCase() === email.toLowerCase()));
        if (isUserDuplicate || username === 'admin') {
          this.app.showToast('Username or Email already exists.', 'error');
          return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          this.app.showToast('Invalid email address format.', 'error');
          return;
        }

        // Mobile validation (Format e.g., +91 98765 43210 or general digits)
        const mobileRegex = /^\+?[0-9\s\-]{10,15}$/;
        if (!mobileRegex.test(mobile)) {
          this.app.showToast('Invalid mobile phone number format.', 'error');
          return;
        }

        // Password complexity check
        if (!this.validatePasswordComplexity(pass)) {
          this.app.showToast('Password complexity not met! Requires 8+ characters, uppercase, lowercase, number, and special character.', 'error');
          return;
        }

        // Insert new member profile
        const newMember = {
          id: username,
          name,
          role,
          avatar,
          color: '#a855f7',
          glow: 'rgba(168, 85, 247, 0.15)',
          password: pass,
          email,
          mobile,
          status: 'Active',
          failedAttempts: 0,
          passwordHistory: [pass],
          sessions: [
            { id: 'sess_' + Date.now(), device: 'Chrome / Windows', ip: '192.168.1.120', time: new Date().toLocaleString() }
          ],
          isDeleted: false
        };

        this.app.state.members.push(newMember);

        // Sync default user session to match logged member details
        this.app.state.user.isLoggedIn = true;
        this.app.state.user.id = username; // Store active user ID
        this.app.state.user.username = name;
        this.app.state.user.avatar = avatar;
        this.app.state.user.role = role;
        this.app.state.user.email = email;
        this.app.state.user.mobile = mobile;
        this.app.state.user.password = pass;

        this.app.activeViewedUser = username;
        this.app.saveState();
        this.app.syncGlobalGoogleSheetData(false);
        if (this.app.modules.finance) {
          this.app.modules.finance.syncGoogleSheetData(false);
        }
        this.logSecurityEvent('Account Creation', `New account registered for ${name} as role ${role}`, name);
        this.app.showToast(`Account registered and unlocked! Welcome, ${name}.`, 'success');

        // Clear values
        document.getElementById('lock-reg-username').value = '';
        document.getElementById('lock-reg-name').value = '';
        document.getElementById('lock-reg-email').value = '';
        document.getElementById('lock-reg-mobile').value = '';
        document.getElementById('lock-reg-pass').value = '';
        
        btnModeLogin.click();
        this.render();
      });
    },

    navigateFromDropdown(tab) {
      const dropdown = document.getElementById('topbar-profile-dropdown');
      if (dropdown) dropdown.classList.add('hidden');
      
      const userNav = document.querySelector('.nav-item[data-view="user"]');
      if (userNav) userNav.click();

      // Trigger tab click programmatically
      document.querySelectorAll('.user-subnav-btn').forEach(b => {
        if (b.getAttribute('data-tab') === tab) {
          b.click();
        }
      });
    },

    logoutUser() {
      const dropdown = document.getElementById('topbar-profile-dropdown');
      if (dropdown) dropdown.classList.add('hidden');

      this.app.state.user.isLoggedIn = false;
      this.app.saveState();
      
      this.logSecurityEvent('Logout Success', 'User successfully locked the workspace session', this.app.state.user.username);
      this.app.showToast('Workspace session locked.', 'info');
      this.render();
    },

    setupRecoveryModal() {
      const btnForgot = document.getElementById('lock-btn-forgot');
      const btnCloseForgot = document.getElementById('forgot-close-modal-btn');
      const btnSubmit = document.getElementById('forgot-btn-submit-request');

      btnForgot?.addEventListener('click', () => {
        this.toggleModal('forgot-password-overlay', true);
      });

      btnCloseForgot?.addEventListener('click', () => {
        this.toggleModal('forgot-password-overlay', false);
      });

      btnSubmit?.addEventListener('click', () => {
        const input = document.getElementById('forgot-recovery-target').value.trim();
        const proposedPass = document.getElementById('forgot-new-pass').value;

        if (!input || !proposedPass) {
          this.app.showToast('Please specify your registered contact details and new proposed password.', 'warning');
          return;
        }

        // Search in user registry
        let targetUser = null;
        let isMainAdmin = false;

        if (this.app.state.user.email === input || this.app.state.user.mobile === input || this.app.state.user.username === input) {
          targetUser = this.app.state.user;
          isMainAdmin = true;
        } else {
          targetUser = this.app.state.members.find(m => !m.isDeleted && (m.email === input || m.mobile === input || m.id === input));
        }

        if (!targetUser) {
          this.app.showToast('No user profile found matching those credentials.', 'error');
          return;
        }

        // Enforce password complexity
        if (!this.validatePasswordComplexity(proposedPass)) {
          this.app.showToast('Proposed password fails complexity check! Minimum 8 characters, uppercase, lowercase, numbers, and symbols.', 'error');
          return;
        }

        // Enforce history check
        if (!targetUser.passwordHistory) targetUser.passwordHistory = [];
        const isReused = targetUser.passwordHistory.slice(-3).includes(proposedPass);
        if (isReused) {
          this.app.showToast('Complexity error: Cannot reuse any of your last 3 passwords.', 'error');
          return;
        }

        // Add to reset request queue
        if (!this.app.state.passwordResetRequests) this.app.state.passwordResetRequests = [];

        // Check if there is already a pending request for this user
        const existingIdx = this.app.state.passwordResetRequests.findIndex(r => r.username === targetUser.id || (isMainAdmin && r.username === 'admin'));
        if (existingIdx !== -1) {
          this.app.state.passwordResetRequests.splice(existingIdx, 1);
        }

        const newRequest = {
          id: 'req_' + Date.now(),
          username: isMainAdmin ? 'admin' : targetUser.id,
          name: targetUser.name || targetUser.username || 'Administrator',
          proposedPassword: proposedPass,
          timestamp: new Date().toLocaleString(),
          status: 'Pending'
        };

        this.app.state.passwordResetRequests.push(newRequest);
        this.app.saveState();

        this.logSecurityEvent('Password Reset Requested', `Proposed password reset submitted for ${newRequest.name}`, newRequest.name);
        this.app.showToast('Password recovery request submitted to Admin dashboard successfully!', 'success');

        // Clear values
        document.getElementById('forgot-recovery-target').value = '';
        document.getElementById('forgot-new-pass').value = '';
        this.toggleModal('forgot-password-overlay', false);
      });
    },

    setupForms() {
      // 1. Edit profile form click handler
      const profileEditForm = document.getElementById('my-profile-edit-form');
      
      profileEditForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('my-profile-name-input').value.trim();
        const newEmail = document.getElementById('my-profile-email-input').value.trim();
        const newMobile = document.getElementById('my-profile-mobile-input').value.trim();
        const newAvatar = document.getElementById('my-profile-avatar-input').value.trim();

        if (!newName || !newEmail || !newMobile || !newAvatar) return;

        // Verify email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
          this.app.showToast('Invalid email address format.', 'error');
          return;
        }

        // Verify mobile
        const mobileRegex = /^\+?[0-9\s\-]{10,15}$/;
        if (!mobileRegex.test(newMobile)) {
          this.app.showToast('Invalid mobile phone number format.', 'error');
          return;
        }

        // Check if credentials modified to trigger OTP verification simulation
        const currentEmail = this.app.state.user.email;
        const currentMobile = this.app.state.user.mobile;
        
        if (currentEmail !== newEmail || currentMobile !== newMobile) {
          // Trigger OTP Verification modal
          this.verificationOtp = Math.floor(100000 + Math.random() * 900000);
          this.pendingProfileData = { name: newName, email: newEmail, mobile: newMobile, avatar: newAvatar };
          
          this.app.showToast(`[Security Test OTP]: Verification Code is ${this.verificationOtp}`, 'success');
          
          document.getElementById('profile-verify-text').textContent = `We sent a security OTP to verify the update of your contact details.`;
          const otpVerifyInput = document.getElementById('profile-verify-otp-input');
          if (otpVerifyInput) otpVerifyInput.value = this.verificationOtp;
          this.toggleModal('profile-verification-overlay', true);
        } else {
          // Normal save
          this.applyProfileUpdates(newName, newEmail, newMobile, newAvatar);
        }
      });

      // Profile updates OTP confirm
      document.getElementById('profile-verify-btn-confirm')?.addEventListener('click', () => {
        const otpVal = document.getElementById('profile-verify-otp-input').value.trim();
        if (parseInt(otpVal) !== this.verificationOtp) {
          this.app.showToast('Verification failed: Incorrect code.', 'error');
          return;
        }

        this.applyProfileUpdates(
          this.pendingProfileData.name,
          this.pendingProfileData.email,
          this.pendingProfileData.mobile,
          this.pendingProfileData.avatar
        );

        this.toggleModal('profile-verification-overlay', false);
        document.getElementById('profile-verify-otp-input').value = '';
        this.verificationOtp = null;
        this.pendingProfileData = null;
      });

      // 2. Change password form click handler
      const passForm = document.getElementById('my-profile-password-form');
      
      passForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentPass = document.getElementById('my-pass-current').value;
        const newPass = document.getElementById('my-pass-new').value;
        const confirmPass = document.getElementById('my-pass-confirm').value;

        if (newPass !== confirmPass) {
          this.app.showToast('New passwords do not match.', 'error');
          return;
        }

        if (this.app.state.user.password !== currentPass) {
          this.app.showToast('Current password does not match.', 'error');
          return;
        }

        if (!this.validatePasswordComplexity(newPass)) {
          this.app.showToast('Complexity error! Requires 8+ characters, uppercase, lowercase, number, and special character.', 'error');
          return;
        }

        // Recent password reuse check
        const activeMemberId = this.app.state.user.username;
        let targetAccount = this.app.state.members.find(m => !m.isDeleted && m.name === activeMemberId);
        if (!targetAccount) targetAccount = this.app.state.user;

        if (!targetAccount.passwordHistory) targetAccount.passwordHistory = [];
        const isReused = targetAccount.passwordHistory.slice(-3).includes(newPass);
        
        if (isReused) {
          this.app.showToast('Cannot reuse any of your last 3 passwords.', 'error');
          return;
        }

        // Update password
        targetAccount.password = newPass;
        targetAccount.passwordHistory.push(newPass);
        
        // Sync session details
        this.app.state.user.password = newPass;
        this.app.saveState();
        
        this.logSecurityEvent('Password Changed', 'User password updated successfully', targetAccount.name || targetAccount.username);
        this.app.showToast('Password changed successfully!', 'success');

        document.getElementById('my-pass-current').value = '';
        document.getElementById('my-pass-new').value = '';
        document.getElementById('my-pass-confirm').value = '';
        if (typeof window.checkPasswordStrength === 'function') {
          window.checkPasswordStrength(''); // Reset strength meter
        }
      });

      // 3. Clear other sessions click handler
      document.getElementById('my-sessions-clear-btn')?.addEventListener('click', () => {
        const activeName = this.app.state.user.username;

        let member = this.app.state.members.find(m => !m.isDeleted && m.name === activeName);
        if (!member) member = this.app.state.user;

        member.sessions = [
          { id: 'sess_1', device: 'Current Session Active', ip: '127.0.0.1', time: 'Active Now' }
        ];

        this.app.saveState();
        this.logSecurityEvent('Sign Out Devices', 'Terminated all active devices except the current session', activeName);
        this.app.showToast('Terminated all other device sessions.', 'info');
        this.render();
      });

      // 4. Logout Click handler
      document.getElementById('logout-btn')?.addEventListener('click', () => {
        this.app.state.user.isLoggedIn = false;
        this.app.saveState();
        this.logSecurityEvent('Sign Out', 'User logged out of active workspace session', this.app.state.user.username);
        this.app.showToast('Workspace locked.', 'info');
        this.render();
      });

      // 5. Admin edit user modal closure binds
      document.getElementById('admin-close-user-modal-btn')?.addEventListener('click', () => {
        this.toggleModal('admin-edit-user-overlay', false);
      });

      document.getElementById('admin-edit-user-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('admin-edit-target-id').value;
        const name = document.getElementById('admin-edit-target-name').value.trim();
        const role = document.getElementById('admin-edit-target-role').value;
        const status = document.getElementById('admin-edit-target-status').value;
        const pass = document.getElementById('admin-edit-target-pass').value;

        let target = this.app.state.members.find(m => m.id === id);
        if (!target) return;

        target.name = name;
        target.role = role;
        target.status = status;
        if (pass) {
          target.password = pass;
          if (!target.passwordHistory) target.passwordHistory = [];
          target.passwordHistory.push(pass);
        }

        this.app.saveState();
        this.logSecurityEvent('Admin Edit Profile', `Modified profile status to ${status} and role to ${role}`, name);
        this.app.showToast(`User settings for "${name}" updated successfully.`, 'success');

        this.toggleModal('admin-edit-user-overlay', false);
        document.getElementById('admin-edit-target-pass').value = '';
        this.render();
      });

      // 5.5. Admin Create User triggers
      document.getElementById('admin-create-user-btn')?.addEventListener('click', () => {
        this.toggleModal('admin-create-user-overlay', true);
      });
      document.getElementById('admin-close-create-modal-btn')?.addEventListener('click', () => {
        this.toggleModal('admin-create-user-overlay', false);
      });
      document.getElementById('admin-create-user-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('admin-create-id').value.trim().toLowerCase();
        const name = document.getElementById('admin-create-name').value.trim();
        const email = document.getElementById('admin-create-email').value.trim();
        const mobile = document.getElementById('admin-create-mobile').value.trim();
        const pass = document.getElementById('admin-create-pass').value;
        const role = document.getElementById('admin-create-role').value;
        const avatar = document.getElementById('admin-create-avatar').value.trim();

        // Unique username/email check
        const isDuplicate = this.app.state.members.some(m => !m.isDeleted && (m.id.toLowerCase() === id || m.email.toLowerCase() === email.toLowerCase()));
        if (isDuplicate || id === 'admin') {
          this.app.showToast('Username or Email already exists.', 'error');
          return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          this.app.showToast('Invalid email address format.', 'error');
          return;
        }

        // Mobile validation
        const mobileRegex = /^\+?[0-9\s\-]{10,15}$/;
        if (!mobileRegex.test(mobile)) {
          this.app.showToast('Invalid mobile phone number format.', 'error');
          return;
        }

        // Password complexity check
        if (!this.validatePasswordComplexity(pass)) {
          this.app.showToast('Password complexity not met! Requires 8+ characters, uppercase, lowercase, number, and special character.', 'error');
          return;
        }

        // Insert new member profile
        const newMember = {
          id,
          name,
          role,
          avatar,
          color: '#0ea5e9',
          glow: 'rgba(14, 165, 233, 0.15)',
          password: pass,
          email,
          mobile,
          status: 'Active',
          failedAttempts: 0,
          passwordHistory: [pass],
          sessions: [],
          isDeleted: false
        };

        this.app.state.members.push(newMember);
        this.app.saveState();
        
        this.logSecurityEvent('Account Creation (Admin)', `Admin created profile for ${name} as role ${role}`, name);
        this.app.showToast(`Account "${name}" created successfully.`, 'success');

        // Clear values
        document.getElementById('admin-create-id').value = '';
        document.getElementById('admin-create-name').value = '';
        document.getElementById('admin-create-email').value = '';
        document.getElementById('admin-create-mobile').value = '';
        document.getElementById('admin-create-pass').value = '';

        this.toggleModal('admin-create-user-overlay', false);
        this.render();
      });

      // 6. Export Directory CSV
      document.getElementById('admin-export-users-btn')?.addEventListener('click', () => {
        const users = this.app.state.members.filter(m => !m.isDeleted);
        if (users.length === 0) return;

        let csv = 'ID,Name,Email,Phone,Role,Status\n';
        users.forEach(u => {
          csv += `"${u.id}","${u.name}","${u.email}","${u.mobile}","${u.role}","${u.status}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `LifeOS_Users_Directory_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.app.showToast('CSV User Directory sheet generated!', 'success');
      });

      // 7. Security Logs Clear
      document.getElementById('security-logs-clear-btn')?.addEventListener('click', () => {
        const confirmClear = confirm('Are you sure you want to clear security audit logs?');
        if (confirmClear) {
          this.app.state.securityLogs = [];
          this.app.saveState();
          this.app.showToast('Audit trails wiped.', 'info');
          this.render();
        }
      });

      // 2FA Toggle Interactive Handler
      document.getElementById('user-security-2fa-toggle')?.addEventListener('change', (e) => {
        const qrBox = document.getElementById('user-security-2fa-qr-box');
        if (qrBox) {
          if (e.target.checked) {
            qrBox.classList.remove('hidden');
            this.app.showToast('2FA QR code generated successfully. Scan it to authenticate.', 'success');
          } else {
            qrBox.classList.add('hidden');
            this.app.showToast('2FA deactivated.', 'info');
          }
        }
      });

      // Style Theme Preferences Selector
      document.getElementById('user-pref-theme-select')?.addEventListener('change', (e) => {
        const val = e.target.value;
        const body = document.body;
        if (val === 'light') {
          body.classList.add('light-theme');
          body.classList.remove('cyberpunk-theme', 'dark-theme');
        } else if (val === 'dark') {
          body.classList.add('dark-theme');
          body.classList.remove('cyberpunk-theme', 'light-theme');
        } else {
          body.classList.add('cyberpunk-theme');
          body.classList.remove('dark-theme', 'light-theme');
        }
        this.app.showToast(`Applied theme styling: ${val}`, 'success');
      });
    },

    applyProfileUpdates(name, email, mobile, avatar) {
      const activeName = this.app.state.user.username;
      let targetAccount = this.app.state.members.find(m => !m.isDeleted && m.name === activeName);
      
      if (!targetAccount) targetAccount = this.app.state.user;

      targetAccount.name = name;
      targetAccount.email = email;
      targetAccount.mobile = mobile;
      targetAccount.avatar = avatar;

      // Sync active session profile details
      this.app.state.user.username = name;
      this.app.state.user.avatar = avatar;
      this.app.state.user.email = email;
      this.app.state.user.mobile = mobile;

      this.app.saveState();
      this.logSecurityEvent('Profile Updated', 'User profile details verified and saved', name);
      this.app.showToast('Workspace profile saved successfully!', 'success');
      this.render();
    },

    render() {
      const user = this.app.state.user;
      
      // Toggle locks overlay screen
      const lockOverlay = document.getElementById('login-portal-standalone');
      if (lockOverlay) {
        if (user.isLoggedIn) {
          lockOverlay.classList.add('hidden');
          document.body.classList.remove('session-locked');
        } else {
          lockOverlay.classList.remove('hidden');
          document.body.classList.add('session-locked');
          
          // Pre-populate remembered username if present
          const remembered = localStorage.getItem('lifeos_remembered_user');
          const loginUserField = document.getElementById('lock-login-user');
          if (remembered && loginUserField) {
            loginUserField.value = remembered;
            document.getElementById('lock-login-remember').checked = true;
          }
          return;
        }
      }

      // 1. My Profile & Security Render
      const myAvatar = document.getElementById('my-profile-avatar');
      const myName = document.getElementById('my-profile-name');
      const myRoleBadge = document.getElementById('my-profile-role-badge');
      
      const inputName = document.getElementById('my-profile-name-input');
      const inputEmail = document.getElementById('my-profile-email-input');
      const inputMobile = document.getElementById('my-profile-mobile-input');
      const inputAvatar = document.getElementById('my-profile-avatar-input');

      if (myAvatar) myAvatar.textContent = user.avatar;
      if (myName) myName.textContent = user.username;
      if (myRoleBadge) myRoleBadge.textContent = `${user.role} Privilege`;
      
      if (inputName) inputName.value = user.username;
      if (inputEmail) inputEmail.value = user.email || '';
      if (inputMobile) inputMobile.value = user.mobile || '';
      if (inputAvatar) inputAvatar.value = user.avatar;

      // Render Active Sessions Device list
      const sessionsList = document.getElementById('my-sessions-list-container');
      if (sessionsList) {
        // Search matching member session active details
        let member = this.app.state.members.find(m => !m.isDeleted && m.id === user.id);
        if (!member) member = this.app.state.user;

        if (!member.sessions) member.sessions = [];
        if (member.sessions.length === 0) {
          member.sessions = [{ id: 'sess_1', device: 'Current Session Active', ip: '127.0.0.1', time: 'Active Now' }];
        }

        // Sanitize sessions list: limit to max 5 and clean old 'Active Now' values
        let sessionsChanged = false;
        if (member.sessions.length > 5) {
          member.sessions = member.sessions.slice(0, 5);
          sessionsChanged = true;
        }
        member.sessions.forEach((s, idx) => {
          if (idx > 0 && s.time === 'Active Now') {
            s.time = new Date(Date.now() - idx * 2 * 60 * 60 * 1000).toLocaleString();
            sessionsChanged = true;
          }
        });
        if (sessionsChanged) {
          this.app.saveStateLocallyOnly(); // Save cleaned sessions to local storage
        }

        let sessHtml = '';
        member.sessions.forEach((s, idx) => {
          let deviceIcon = 'fa-laptop';
          if (s.device.toLowerCase().includes('phone') || s.device.toLowerCase().includes('mobile') || s.device.toLowerCase().includes('android') || s.device.toLowerCase().includes('ios') || s.device.toLowerCase().includes('iphone')) {
            deviceIcon = 'fa-mobile-alt';
          } else if (s.device.toLowerCase().includes('tablet') || s.device.toLowerCase().includes('ipad')) {
            deviceIcon = 'fa-tablet-alt';
          }
          const isCurrent = idx === 0;
          sessHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 12px 16px; border-radius: var(--radius-sm); font-size: 0.72rem; transition: all 0.2s; border-left: 3px solid ${isCurrent ? 'var(--green)' : 'var(--primary)'};">
              <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas ${deviceIcon}" style="font-size: 1.1rem; color: ${isCurrent ? 'var(--green)' : 'var(--primary)'};"></i>
                <div>
                  <span style="font-weight: 700; color: var(--text-main); display: block;">
                    ${s.device} ${isCurrent ? '<span class="badge text-green" style="background: var(--green-glow); font-size: 0.55rem; padding: 1px 4px; border-radius: 2px; margin-left: 4px;">Current Device</span>' : ''}
                  </span>
                  <span style="color: var(--text-muted); font-size: 0.6rem;">IP: ${s.ip} &bull; Chennai, India</span>
                </div>
              </div>
              <div style="text-align: right; display: flex; align-items: center; gap: 15px;">
                <div>
                  <span style="color: var(--text-muted); font-size: 0.58rem; display: block; text-transform: uppercase;">Last active</span>
                  <strong style="color: ${isCurrent ? 'var(--green)' : 'var(--text-main)'}; font-size: 0.68rem;">${isCurrent ? 'Now' : s.time}</strong>
                </div>
                ${!isCurrent ? `<button class="small-link" style="border: 1px solid var(--glass-border); padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.02); cursor: pointer; color: var(--text-muted); font-size: 0.65rem;" onclick="window.signOutSession('${s.id}')">Sign Out</button>` : ''}
              </div>
            </div>
          `;
        });
        sessionsList.innerHTML = sessHtml;

        // Populate Security Overview Score and Checklist Details
        let score = 52;
        if (user.email) score += 20;
        if (user.mobile) score += 20;
        const is2faActive = document.getElementById('user-security-2fa-toggle')?.checked || false;
        if (is2faActive) score += 8;
        score = Math.min(score, 100);

        const scorePct = document.getElementById('security-score-pct');
        if (scorePct) scorePct.textContent = `${score}%`;
        const scoreCircle = document.getElementById('security-score-circle');
        if (scoreCircle) {
          scoreCircle.style.strokeDashoffset = (251.2 - (251.2 * score / 100)).toFixed(1);
        }

        // Fill overview texts
        const overEmail = document.getElementById('overview-email');
        if (overEmail) overEmail.textContent = user.email || 'N/A';
        const overPhone = document.getElementById('overview-phone');
        if (overPhone) overPhone.textContent = user.mobile || 'N/A';

        // Render dynamic stats cards
        const regDate = member.createdAt ? new Date(member.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '16 Jul 2026';
        const statReg = document.getElementById('stat-member-since');
        if (statReg) statReg.textContent = regDate;

        const statLogin = document.getElementById('stat-last-login');
        if (statLogin) {
          const pastSession = member.sessions && member.sessions[1];
          statLogin.textContent = pastSession ? pastSession.time : 'Today, 10:22 PM';
        }

        const stat2fa = document.getElementById('stat-2fa-status');
        if (stat2fa) {
          stat2fa.textContent = is2faActive ? 'Enabled' : 'Disabled';
          stat2fa.className = is2faActive ? 'badge text-green' : 'badge text-yellow';
          stat2fa.style.background = is2faActive ? 'var(--green-glow)' : 'rgba(245,158,11,0.1)';
        }

        // Render Recent Login Activity table
        const recentLogsTable = document.getElementById('recent-login-activity-table-body');
        if (recentLogsTable) {
          const logs = this.app.state.securityLogs || [];
          const userLogs = logs.length > 0 ? logs.slice(0, 5) : [
            { timestamp: new Date().toLocaleString(), action: 'Successful Login', operator: user.username }
          ];

          recentLogsTable.innerHTML = userLogs.map(l => {
            return `
              <tr style="border-bottom: 1px solid var(--glass-border);">
                <td style="padding: 10px; color: var(--text-muted);">${l.timestamp}</td>
                <td style="padding: 10px; color: var(--text-main); font-weight: bold;">Windows PC</td>
                <td style="padding: 10px; color: var(--text-muted);">Chrome 126</td>
                <td style="padding: 10px; color: var(--text-muted);">192.168.1.82</td>
                <td style="padding: 10px; color: var(--text-muted);">Chennai, India</td>
                <td style="padding: 10px;"><span style="color: var(--green); display: flex; align-items: center; gap: 5px;"><span style="width: 6px; height: 6px; background: var(--green); border-radius: 50%;"></span> Success</span></td>
              </tr>
            `;
          }).join('');
        }
      }

      // RBAC Permission Guards: Toggle tabs based on Role level
      const adminTabBtn = document.getElementById('user-admin-tab-btn');
      const dropdownDirBtn = document.getElementById('dropdown-btn-directory');
      const hasDirectoryPrivilege = user.role === 'Administrator' || user.role === 'Manager' || user.role === 'Super Admin';

      if (adminTabBtn) {
        adminTabBtn.style.display = hasDirectoryPrivilege ? 'block' : 'none';
        if (!hasDirectoryPrivilege && this.activeTab === 'directory') {
          document.querySelector('.user-subnav-btn[data-tab="profile"]')?.click();
          return;
        }
      }
      if (dropdownDirBtn) {
        dropdownDirBtn.style.display = hasDirectoryPrivilege ? 'flex' : 'none';
      }

      // 2. Directory list table render (Administrator/Manager/Employee views)
      if (this.activeTab === 'directory') {
        this.renderUserDirectory();
      }

      // 3. Security Audit Logs Trail list render
      if (this.activeTab === 'activity') {
        const auditList = document.getElementById('security-audit-logs-list');
        if (auditList) {
          const logs = this.app.state.securityLogs || [];
          if (logs.length === 0) {
            auditList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 30px 0;">No security audit entries recorded.</div>`;
          } else {
            let logHtml = '';
            logs.forEach(l => {
              const actLower = (l.action || '').toLowerCase();
              let borderColor = 'var(--primary)';
              let bgGlow = 'rgba(168, 85, 247, 0.02)';
              let actionIcon = 'fa-shield-alt';

              if (actLower.includes('failed') || actLower.includes('failure') || actLower.includes('error') || actLower.includes('delete') || actLower.includes('reject')) {
                borderColor = 'var(--red)';
                bgGlow = 'rgba(239, 68, 68, 0.04)';
                actionIcon = 'fa-exclamation-triangle';
              } else if (actLower.includes('success') || actLower.includes('unlock') || actLower.includes('decrypt') || actLower.includes('approve') || actLower.includes('creation')) {
                borderColor = 'var(--green)';
                bgGlow = 'rgba(16, 185, 129, 0.04)';
                actionIcon = 'fa-check-circle';
              } else if (actLower.includes('sign out') || actLower.includes('logout')) {
                borderColor = '#cbd5e0';
                bgGlow = 'rgba(255,255,255,0.02)';
                actionIcon = 'fa-sign-out-alt';
              }

              logHtml += `
                <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: ${bgGlow}; border: 1px solid var(--glass-border); border-left: 3.5px solid ${borderColor}; border-radius: var(--radius-sm); font-size: 0.72rem; transition: all 0.2s;">
                  <i class="fas ${actionIcon}" style="color: ${borderColor}; font-size: 1rem; margin-top: 2px;"></i>
                  <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">
                      <span>${l.action}</span>
                      <span style="font-size: 0.58rem; color: var(--text-muted); font-weight: 500;">${l.timestamp}</span>
                    </div>
                    <span style="color: var(--text-muted); font-size: 0.68rem; display: block; margin-bottom: 4px;">${l.details}</span>
                    <span style="font-size: 0.6rem; color: var(--primary); font-weight: 600; text-transform: uppercase;">Operator: ${l.user}</span>
                  </div>
                </div>
              `;
            });
            auditList.innerHTML = logHtml;
          }
        }
      }

      // Sync header user details
      this.app.syncProfileUI();
    },

    renderUserDirectory() {
      const tbody = document.getElementById('admin-directory-table-body');
      if (!tbody) return;

      const userRole = this.app.state.user.role;
      const search = document.getElementById('admin-directory-search-input').value.toLowerCase().trim();
      const roleFilter = document.getElementById('admin-directory-filter-role').value;
      const statusFilter = document.getElementById('admin-directory-filter-status').value;

      // Render pending password reset requests list
      const requestPanel = document.getElementById('admin-reset-requests-panel');
      const requestList = document.getElementById('admin-reset-requests-list');
      if (requestPanel && requestList) {
        const reqs = this.app.state.passwordResetRequests || [];
        const isAdmin = userRole === 'Administrator' || userRole === 'Super Admin';
        if (isAdmin && reqs.length > 0) {
          requestPanel.classList.remove('hidden');
          let reqsHtml = '';
          reqs.forEach(r => {
            reqsHtml += `
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(239, 68, 68, 0.05); border: 1px solid var(--red-glow); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.72rem; gap: 10px; flex-wrap: wrap;">
                <div>
                  <span style="font-weight: 700; color: var(--text-main);">${r.name} (${r.username})</span>
                  <span style="color: var(--text-muted); font-size: 0.65rem; margin-left: 6px;">Proposed New Password: <code style="background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 2px; font-weight: bold; color: var(--red);">${r.proposedPassword}</code></span>
                  <span style="display: block; font-size: 0.58rem; color: var(--text-muted);">${r.timestamp}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn-primary-glow" onclick="window.LifeOS.modules.user.approveResetRequest('${r.id}')" style="background: var(--green); border: none; padding: 4px 8px; font-size: 0.65rem; color: #fff; cursor: pointer; border-radius: 2px;">Approve</button>
                  <button class="btn-primary-glow" onclick="window.LifeOS.modules.user.rejectResetRequest('${r.id}')" style="background: var(--red); border: none; padding: 4px 8px; font-size: 0.65rem; color: #fff; cursor: pointer; border-radius: 2px;">Reject</button>
                </div>
              </div>
            `;
          });
          requestList.innerHTML = reqsHtml;
        } else {
          requestPanel.classList.add('hidden');
        }
      }

      // Extract all non-deleted members
      let list = this.app.state.members.filter(m => !m.isDeleted);

      // Apply Search Filter
      if (search) {
        list = list.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search) || u.id.toLowerCase().includes(search));
      }

      // Apply Role Filter
      if (roleFilter !== 'all') {
        list = list.filter(u => u.role === roleFilter);
      }

      // Apply Status Filter
      if (statusFilter !== 'all') {
        list = list.filter(u => u.status === statusFilter);
      }

      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">No matching directory records found.</td></tr>`;
        return;
      }

      let html = '';
      list.forEach(u => {
        // Status Badge Style
        let statusClass = 'text-green';
        let statusBg = 'var(--green-glow)';
        if (u.status === 'Locked') { statusClass = 'text-red'; statusBg = 'var(--red-glow)'; }
        else if (u.status === 'Suspended') { statusClass = 'text-orange'; statusBg = 'var(--orange-glow)'; }
        else if (u.status === 'Deactivated') { statusClass = 'text-dim'; statusBg = 'rgba(255,255,255,0.05)'; }

        // RBAC access: Managers cannot change roles or delete. Employees can only view.
        const canControl = userRole === 'Administrator' || userRole === 'Super Admin';
        const canEdit = userRole === 'Administrator' || userRole === 'Super Admin' || userRole === 'Manager';

        const actionButtons = `
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button class="btn-primary-glow" onclick="window.LifeOS.modules.user.openEditUserModal('${u.id}')" style="padding: 4px 8px; font-size: 0.65rem; border: none; cursor: pointer; color: #fff; ${!canEdit ? 'display:none;' : ''}">Edit</button>
            <button class="btn-primary-glow" onclick="window.LifeOS.modules.user.toggleUserActivation('${u.id}')" style="padding: 4px 8px; font-size: 0.65rem; border: none; cursor: pointer; color: #fff; background: ${u.status === 'Active' ? 'var(--red)' : 'var(--green)'}; ${!canControl ? 'display:none;' : ''}">
              ${u.status === 'Active' ? 'Deactivate' : 'Activate'}
            </button>
            <button class="btn-primary-glow" onclick="window.LifeOS.modules.user.softDeleteUser('${u.id}')" style="padding: 4px 8px; font-size: 0.65rem; border: none; cursor: pointer; color: #fff; background: var(--red); ${!canControl ? 'display:none;' : ''}">Delete</button>
          </div>
        `;

        html += `
          <tr style="border-bottom: 1px solid var(--glass-border);">
            <td style="padding: 10px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.2rem;">${u.avatar || '👤'}</span>
              <div>
                <span style="font-weight: 700; color: var(--text-main); display: block;">${u.name}</span>
                <span style="font-size: 0.58rem; color: var(--text-muted); display: block;">Email: ${u.email} &bull; Mob: ${u.mobile}</span>
              </div>
            </td>
            <td style="padding: 10px; color: var(--text-main); font-weight: 600;">${u.role}</td>
            <td style="padding: 10px;">
              <span class="badge ${statusClass}" style="background: ${statusBg}; font-size: 0.6rem;">${u.status}</span>
            </td>
            <td style="padding: 10px; color: var(--text-muted); font-size: 0.58rem;">
              Last Log: ${u.sessions?.[0]?.time || 'Never'} from IP: ${u.sessions?.[0]?.ip || 'Unknown'}
            </td>
            <td style="padding: 10px; text-align: center;">
              ${actionButtons}
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = html;

      // Bind dynamic search / filtering triggers
      const searchBox = document.getElementById('admin-directory-search-input');
      const roleSelect = document.getElementById('admin-directory-filter-role');
      const statusSelect = document.getElementById('admin-directory-filter-status');

      // Unbind first to prevent multiple listeners
      searchBox.oninput = () => this.renderUserDirectory();
      roleSelect.onchange = () => this.renderUserDirectory();
      statusSelect.onchange = () => this.renderUserDirectory();
    },

    openEditUserModal(id) {
      const member = this.app.state.members.find(m => m.id === id);
      if (!member) return;

      document.getElementById('admin-edit-target-id').value = id;
      document.getElementById('admin-edit-target-name').value = member.name;
      document.getElementById('admin-edit-target-role').value = member.role;
      document.getElementById('admin-edit-target-status').value = member.status;

      this.toggleModal('admin-edit-user-overlay', true);
    },

    toggleUserActivation(id) {
      if (id === 'admin') {
        this.app.showToast('Safety Guard: Cannot deactivate primary Administrator account.', 'error');
        return;
      }
      const member = this.app.state.members.find(m => m.id === id);
      if (!member) return;

      const newStatus = member.status === 'Active' ? 'Deactivated' : 'Active';
      member.status = newStatus;
      this.app.saveState();
      
      this.logSecurityEvent('Admin Status Edit', `Toggled account lifecycle status to ${newStatus}`, member.name);
      this.app.showToast(`Account status for "${member.name}" set to ${newStatus}.`, 'success');
      this.render();
    },

    softDeleteUser(id) {
      if (id === 'admin') {
        this.app.showToast('Safety Guard: Cannot delete primary Administrator account.', 'error');
        return;
      }
      const member = this.app.state.members.find(m => m.id === id);
      if (!member) return;

      const confirmDelete = confirm(`Are you absolutely sure you want to permanently delete workspace profile "${member.name}"? This will delete all of their data from all database tables.`);
      if (confirmDelete) {
        // 1. Clean up database rows in background by saving empty payload
        const settings = this.app.state.supabaseSettings;
        if (settings && settings.url && settings.anonKey) {
          const endpoint = `${settings.url}/rest/v1/rpc/save_user_dashboard`;
          fetch(endpoint, {
            method: 'POST',
            headers: {
              'apikey': settings.anonKey,
              'Authorization': `Bearer ${settings.anonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              p_user_id: id,
              p_data: {}
            })
          })
          .then(res => {
            if (!res.ok) console.warn('Could not clear database rows for deleted user:', res.status);
          })
          .catch(err => {
            console.error('Error clearing database rows for deleted user:', err);
          });
        }

        // 2. Remove from members array and save
        this.app.state.members = this.app.state.members.filter(m => m.id !== id);
        this.app.saveState();
        
        this.logSecurityEvent('Account Deletion', `Permanently deleted user profile account`, member.name);
        this.app.showToast(`User profile "${member.name}" permanently deleted.`, 'success');

        // 3. Switch viewed user back to admin if we were viewing the deleted user
        if (this.app.activeViewedUser === id) {
          this.app.activeViewedUser = this.app.state.user.id || 'admin';
          this.app.syncGlobalGoogleSheetData(false);
        }

        this.render();
      }
    },

    approveResetRequest(id) {
      if (!this.app.state.passwordResetRequests) return;
      const reqIdx = this.app.state.passwordResetRequests.findIndex(r => r.id === id);
      if (reqIdx === -1) return;

      const req = this.app.state.passwordResetRequests[reqIdx];
      
      // Find user to reset
      let targetUser = null;
      if (req.username === 'admin') {
        targetUser = this.app.state.user;
        const adminMember = this.app.state.members.find(m => m.id === 'admin');
        if (adminMember) {
          adminMember.password = req.proposedPassword;
          if (!adminMember.passwordHistory) adminMember.passwordHistory = [];
          adminMember.passwordHistory.push(req.proposedPassword);
        }
      } else {
        targetUser = this.app.state.members.find(m => m.id === req.username);
      }

      if (targetUser) {
        targetUser.password = req.proposedPassword;
        if (!targetUser.passwordHistory) targetUser.passwordHistory = [];
        targetUser.passwordHistory.push(req.proposedPassword);
        
        this.logSecurityEvent('Password Reset Approved', `Admin approved password reset request for ${req.name}`, req.name);
        this.app.showToast(`Password reset approved for user "${req.name}"!`, 'success');
      }

      // Remove from queue
      this.app.state.passwordResetRequests.splice(reqIdx, 1);
      this.app.saveState();
      this.render();
    },

    rejectResetRequest(id) {
      if (!this.app.state.passwordResetRequests) return;
      const reqIdx = this.app.state.passwordResetRequests.findIndex(r => r.id === id);
      if (reqIdx === -1) return;

      const req = this.app.state.passwordResetRequests[reqIdx];
      
      this.logSecurityEvent('Password Reset Rejected', `Admin rejected password reset request for ${req.name}`, req.name);
      this.app.showToast(`Password reset request for "${req.name}" rejected.`, 'info');

      // Remove from queue
      this.app.state.passwordResetRequests.splice(reqIdx, 1);
      this.app.saveState();
      this.render();
    },

    toggleModal(id, show) {
      const modal = document.getElementById(id);
      if (modal) {
        modal.style.display = show ? 'flex' : 'none';
      }
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('user', UserModule);
  }
});
