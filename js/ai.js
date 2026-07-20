/* ==========================================================================
   LIFE OS - STATE-AWARE AI ASSISTANT CHATBOT (js/ai.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const AIModule = {
    init() {
      this.setupChatControls();
    },

    onActive() {
      // Clear input and focus
      document.getElementById('ai-user-query').value = '';
    },

    setupChatControls() {
      const sendBtn = document.getElementById('ai-send-btn');
      const queryInput = document.getElementById('ai-user-query');

      sendBtn?.addEventListener('click', () => this.handleUserQuery());
      queryInput?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          this.handleUserQuery();
        }
      });
    },

    handleUserQuery() {
      const queryInput = document.getElementById('ai-user-query');
      const chatLog = document.getElementById('ai-chat-log');
      const queryText = queryInput.value.trim();

      if (!queryText) return;

      // 1. Append User Message
      this.appendMessage(queryText, 'user');
      queryInput.value = '';

      // 2. Process and Append Bot response with a slight mock latency
      setTimeout(() => {
        const response = this.generateBotResponse(queryText.toLowerCase());
        this.appendMessage(response, 'bot');
        
        // Auto Scroll Chat Log to bottom
        chatLog.scrollTop = chatLog.scrollHeight;
      }, 500);
    },

    appendMessage(text, sender) {
      const chatLog = document.getElementById('ai-chat-log');
      const msgDiv = document.createElement('div');
      msgDiv.className = `ai-msg ${sender}`;
      msgDiv.innerHTML = `<p>${text}</p>`;
      chatLog.appendChild(msgDiv);
    },

    generateBotResponse(query) {
      const state = this.app.state;

      // Keyword: BUDGET / FINANCE
      if (query.includes('budget') || query.includes('spend') || query.includes('expense') || query.includes('money') || query.includes('finance')) {
        let expenses = 0;
        state.transactions.filter(t => t.type === 'expense').forEach(t => expenses += parseFloat(t.amount));
        const net = state.transactions.reduce((acc, t) => {
          const val = parseFloat(t.amount);
          return t.type === 'income' ? acc + val : acc - val;
        }, 0);

        return `💰 <strong>Finance Insight Summary:</strong>
          <br>• Total expenses logged: <strong>$${expenses.toFixed(2)}</strong>.
          <br>• Current net wallet balance: <strong>$${net.toFixed(2)}</strong>.
          <br>• Remaining student loan balance: <strong>$${state.loans.reduce((acc, l) => acc + l.balance, 0).toFixed(2)}</strong>.
          <br>• Active recurring subscriptions cost: <strong>$${state.subscriptions.reduce((acc, s) => acc + s.cost, 0).toFixed(2)}/mo</strong>.
          <br>${expenses > 1000 ? "⚠️ Warning: Your expenses are approaching your threshold limits. Consider freezing non-essential shopping." : "✅ Status stable. Budget allocations are within standard safety zones."}`;
      }

      // Keyword: FOCUS / GOALS
      if (query.includes('focus') || query.includes('goal') || query.includes('milestone') || query.includes('priority')) {
        const activeProj = state.projects.filter(p => p.status === 'Active');
        const focusText = state.focus ? `"${state.focus}"` : "None set yet today";

        return `🎯 <strong>Goal & Priorities Scan:</strong>
          <br>• Today's primary focus: <strong>${focusText}</strong>.
          <br>• Active projects progress:
          ${activeProj.length > 0 ? activeProj.map(p => `<br>  - <em>${p.title}</em> (${p.progress}% complete)`).join('') : "<br>  - No active projects logged."}
          <br>• Vision board goals: <strong>${state.visionBoard.length} visual items</strong> catalogued.`;
      }

      // Keyword: SCHEDULE / AGENDA
      if (query.includes('schedule') || query.includes('agenda') || query.includes('planner') || query.includes('event')) {
        const slots = Object.keys(state.timeblocks);
        const activeEvs = state.events;

        return `📅 <strong>Daily Agenda Scrape:</strong>
          <br>• Hourly timeblocks scheduled: <strong>${slots.length} slots</strong>.
          ${slots.length > 0 ? slots.map(s => `<br>  - ${s}: ${state.timeblocks[s].text || 'Task assigned'}`).join('') : "<br>  - No time slots blocked."}
          <br>• Upcoming Calendar appointments: <strong>${activeEvs.length} events</strong>.
          ${activeEvs.length > 0 ? activeEvs.map(e => `<br>  - ${e.title} (${e.time} on ${e.date})`).join('') : ""}`;
      }

      // Keyword: TASKS / TODO
      if (query.includes('task') || query.includes('todo') || query.includes('completed') || query.includes('checklist')) {
        const total = state.tasks.length;
        const comp = state.tasks.filter(t => t.completed).length;
        const active = total - comp;

        return `📝 <strong>Tasks Analysis:</strong>
          <br>• Total catalogued checklist items: <strong>${total}</strong>.
          <br>• Active tasks pending: <strong>${active}</strong>.
          <br>• Completed objectives: <strong>${comp}</strong>.
          <br>${active > 0 ? "💡 Suggestion: Allocate a 25-minute Pomodoro focus block to execute your high priority tasks." : "🎉 Excellent! All scheduled tasks completed."}`;
      }

      // Keyword: HEALTH / WATER / SLEEP / PILLS
      if (query.includes('health') || query.includes('water') || query.includes('sleep') || query.includes('pill') || query.includes('med')) {
        const pills = state.medicineReminders.length;
        
        return `🏥 <strong>Health & Wellness Scan:</strong>
          <br>• Hydration: <strong>${state.waterIntake} of 8 cups</strong> drank today.
          <br>• Rest: <strong>${state.sleepLogs.length > 0 ? state.sleepLogs[0].hours : 0} hours slept</strong> logged for today.
          <br>• Outstanding pill intakes: <strong>${pills} reminders active</strong>.
          <br>${state.waterIntake < 5 ? "💧 Reminders: Keep sipping! Drink a cup of water now." : "👍 Hydration looking great!"}`;
      }

      // DEFAULT
      return `🤖 <strong>Assistant Intelligence Bot:</strong>
        <br>I'm connected to your secure workspace state repository. Ask me specific scans such as:
        <br>• <em>"Scan my budget status"</em>
        <br>• <em>"Review my daily schedule details"</em>
        <br>• <em>"Are any health logs or pills pending?"</em>
        <br>• <em>"What are my task ratios?"</em>`;
    }
  };

  // Register
  if (window.LifeOS) {
    window.LifeOS.registerModule('ai', AIModule);
  }
});
