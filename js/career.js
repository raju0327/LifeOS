/* ==========================================================================
   LIFE OS - CAREER PORTFOLIO & SKILL MATRIX MODULE (js/career.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const CareerModule = {
    init() {
      this.setupSkillControls();
      this.setupJobControls();
      this.render();
    },

    onActive() {
      this.render();
    },

    render() {
      this.renderSkills();
      this.renderJobs();
    },

    // --- Skill Competency Stars ---
    setupSkillControls() {
      const form = document.getElementById('skill-form');
      if (!form) return;
      const nameInput = document.getElementById('skill-name');
      const lvlSelect = document.getElementById('skill-level');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) return;

        this.app.state.skills.push({
          id: Date.now(),
          name: name,
          level: lvlSelect ? lvlSelect.value : '3'
        });

        this.app.saveState();
        this.app.showToast(`Skill competency "${name}" saved!`, 'success');
        
        if (nameInput) nameInput.value = '';
        this.renderSkills();
      });
    },

    renderSkills() {
      const container = document.getElementById('skills-list-container');
      if (!container) return;
      const skills = this.app.state.skills || [];

      if (skills.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column:1/-1; font-size:0.75rem;">No skills indexed. Track your competency!</div>`;
        return;
      }

      let html = '';
      skills.forEach(skill => {
        const starCount = parseInt(skill.level) || 3;
        const starsHtml = '⭐'.repeat(starCount);

        html += `
          <div class="skill-card-item">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong>${skill.name}</strong>
              <button class="icon-btn btn-delete-skill" data-skill-id="${skill.id}">
                <i data-lucide="x" style="width:10px;height:10px;"></i>
              </button>
            </div>
            <div class="skill-stars">${starsHtml}</div>
          </div>
        `;
      });

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('.btn-delete-skill').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-skill-id'));
          const idx = this.app.state.skills.findIndex(s => s.id === id);
          if (idx !== -1) {
            this.app.state.skills.splice(idx, 1);
            this.app.saveState();
            this.renderSkills();
          }
        });
      });
    },

    // --- Job Submissions Tracker ---
    setupJobControls() {
      const form = document.getElementById('job-form');
      if (!form) return;
      const titleInput = document.getElementById('job-title-input');
      const statusSelect = document.getElementById('job-status');
      const notesInput = document.getElementById('job-notes');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = titleInput ? titleInput.value.trim() : '';
        if (!title) return;

        this.app.state.jobApplications.push({
          id: Date.now(),
          title: title,
          status: statusSelect ? statusSelect.value : 'Applied',
          notes: notesInput ? (notesInput.value.trim() || 'No follow-up logged.') : 'No follow-up logged.'
        });

        this.app.saveState();
        this.app.showToast(`Logged application to ${title}`, 'success');

        form.reset();
        this.renderJobs();
      });
    },

    renderJobs() {
      const container = document.getElementById('jobs-list-container');
      const jobs = this.app.state.jobApplications;

      if (jobs.length === 0) {
        container.innerHTML = `<div class="empty-state" style="font-size:0.75rem;">No job applications tracked.</div>`;
        return;
      }

      let html = '';
      jobs.forEach(job => {
        let badgeStyle = 'background:var(--glass-border); color:var(--text-muted);';
        if (job.status === 'Interviewing') badgeStyle = 'background:var(--orange-glow); color:var(--orange);';
        else if (job.status === 'Offered') badgeStyle = 'background:var(--green-glow); color:var(--green);';
        else if (job.status === 'Rejected') badgeStyle = 'background:var(--red-glow); color:var(--red);';

        html += `
          <div class="project-item" style="margin-top: 8px;">
            <div class="project-header-row">
              <span>💼 <strong>${job.title}</strong></span>
              <span class="badge" style="${badgeStyle}">${job.status}</span>
            </div>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${job.notes}</p>
            <div style="text-align:right; margin-top:6px;">
              <button class="icon-btn btn-delete-job" data-job-id="${job.id}" style="width:20px;height:20px;display:inline-flex;">
                <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
              </button>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('.btn-delete-job').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-job-id'));
          const idx = this.app.state.jobApplications.findIndex(j => j.id === id);
          if (idx !== -1) {
            this.app.state.jobApplications.splice(idx, 1);
            this.app.saveState();
            this.renderJobs();
          }
        });
      });
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('career', CareerModule);
  }
});
