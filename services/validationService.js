/* ==========================================================================
   LIFE OS - VALIDATION SERVICE (services/validationService.js)
   Input Validation, Formatting & XSS Sanitization Helpers
   ========================================================================== */

window.LifeOSValidationService = {
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  },

  validatePasswordComplexity(password) {
    if (!password) return false;
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  },

  sanitizeInput(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, function (m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[m];
    });
  }
};
