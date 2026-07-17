/* ==========================================================================
   LIFE OS - DASHBOARD VIEW MODULE (js/dashboard.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const DashboardModule = {
    // Reference list of inspirational quotes
    quotes: [
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
      { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
      { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
      { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
      { text: "Act as if what you do makes a difference. It does.", author: "William James" },
      { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
      { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
    ],

    init() {
      this.setupQuoteCard();
      this.render();
    },

    // Refresh greeting and today's schedule agenda
    render() {
      this.updateGreetingText();
      this.renderAgenda();
    },

    // Executed whenever user navigates to Dashboard panel
    onActive() {
      this.render();
      this.app.updateGlobalSummary();
    },

    // Welcoming header depending on current local time
    updateGreetingText() {
      const greetingEl = document.getElementById('greeting-text');
      const hours = new Date().getHours();
      let greeting = "Good evening";

      if (hours < 12) {
        greeting = "Good morning";
      } else if (hours < 18) {
        greeting = "Good afternoon";
      }

      greetingEl.textContent = `${greeting}, Explorer`;
    },

    // Render schedule timeblocks scheduled for today
    renderAgenda() {
      const agendaList = document.getElementById('dashboard-agenda-list');
      const timeblocks = this.app.state.timeblocks;
      const tasks = this.app.state.tasks;

      // Extract scheduled blocks, filter, and sort chronologically
      const scheduledHours = Object.keys(timeblocks).sort();

      if (scheduledHours.length === 0) {
        agendaList.innerHTML = `
          <div class="empty-state">
            <p>No agenda timeblocks assigned today.</p>
          </div>
        `;
        return;
      }

      let html = '';
      scheduledHours.forEach(hour => {
        const block = timeblocks[hour];
        let title = '';

        if (block.type === 'task') {
          const task = tasks.find(t => t.id === parseInt(block.id));
          title = task ? task.title : 'Deleted Task';
        } else {
          title = block.text || 'Personal Timeblock';
        }

        html += `
          <div class="mini-agenda-item">
            <span class="mini-agenda-time">${hour}</span>
            <span class="mini-agenda-title">${title}</span>
          </div>
        `;
      });

      agendaList.innerHTML = html;
    },

    // Setup Quotes rotation
    setupQuoteCard() {
      const quoteText = document.getElementById('quote-text');
      const quoteAuthor = document.getElementById('quote-author');
      const quoteCard = document.querySelector('.quote-card');

      const rotateQuote = () => {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        const quote = this.quotes[randomIndex];
        
        quoteText.textContent = `"${quote.text}"`;
        quoteAuthor.textContent = `— ${quote.author}`;
      };

      // Set initial random quote
      rotateQuote();

      // Enable quote click-to-change feature
      quoteCard.style.cursor = 'pointer';
      quoteCard.addEventListener('click', () => {
        rotateQuote();
        this.app.showToast('Quote updated', 'info');
      });
    }
  };

  // Register in application namespace
  if (window.LifeOS) {
    window.LifeOS.registerModule('dashboard', DashboardModule);
  }
});
