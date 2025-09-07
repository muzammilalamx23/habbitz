// Simple habit tracker with API calls
let habits = [];
let timers = {};
let habitChart = null; // Global chart variable

document.addEventListener("DOMContentLoaded", async function () {
  await initializeApp();
});

async function initializeApp() {
  setGreeting();
  setupEventListeners();
  await loadHabits();
  renderHabits();
  setupMidnightReset();
}

// ========= User Greeting =========
function setGreeting() {
  const greetingEl = document.getElementById("greeting");
  if (!greetingEl) return;

  const user = JSON.parse(localStorage.getItem("user"));
  const name = user?.fullname || "User";
  const hour = new Date().getHours();
  
  let greeting = "Good Evening 🌙";
  if (hour < 12) greeting = "Good Morning 🌅";
  else if (hour < 18) greeting = "Good Afternoon 🌞";
  
  greetingEl.textContent = `Hello ${name}, ${greeting}`;
}

// ========= Load Habits from API =========
async function loadHabits() {
  if (!localStorage.getItem('token')) return;
  
  try {
    const apiHabits = await getHabits();
    habits = apiHabits.map(h => ({
      id: h._id,
      name: h.name,
      emoji: h.emoji || '✅',
      targetMinutes: h.targetMinutesPerDay,
      progressMinutes: h.progressMinutes || 0,
      streak: h.streak || 0,
      done: h.isCompletedToday || false,
      isRunning: false,
      sessionTime: 0
    }));
  } catch (error) {
    console.error('Failed to load habits:', error);
  }
}

// ========= Event Listeners =========
function setupEventListeners() {
  const modal = document.getElementById("habitModal");
  const addBtn = document.getElementById("addHabitBtn2");
  const closeBtn = document.getElementById("closeHabitBtn");
  const saveBtn = document.getElementById("saveHabitBtn");
  const logoutBtn = document.querySelector('.logout');

  if (addBtn) addBtn.onclick = () => modal.style.display = "flex";
  if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
  if (saveBtn) saveBtn.onclick = saveNewHabit;
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      logout();
      window.location.href = 'index.html';
    };
  }

  // Close modal on outside click
  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };

  // Handle custom habit input
  const emojiSelect = document.getElementById("habitEmoji");
  const nameInput = document.getElementById("habitName");
  if (emojiSelect) {
    emojiSelect.onchange = () => {
      nameInput.style.display = emojiSelect.value === "other" ? "block" : "none";
      if (emojiSelect.value !== "other") nameInput.value = "";
    };
  }
}

// ========= Save New Habit =========
async function saveNewHabit() {
  const hoursInput = document.getElementById("habitHours");
  const emojiSelect = document.getElementById("habitEmoji");
  const nameInput = document.getElementById("habitName");

  const hours = parseInt(hoursInput.value);
  let emoji = emojiSelect.value;
  let name = "";

  if (emoji === "other") {
    name = nameInput.value.trim();
    if (!name) return alert("Please enter habit name!");
    emoji = "✏️";
  } else {
    const presetNames = {
      "📖": "Study", "🏃": "Exercise", "🧘": "Meditation", 
      "🍎": "Diet", "💻": "Coding"
    };
    name = presetNames[emoji];
  }

  if (!hours || hours < 1) return alert("Please enter valid hours!");

  try {
    const newHabit = await createHabit(name, emoji, hours * 60);
    habits.push({
      id: newHabit._id,
      name: newHabit.name,
      emoji: newHabit.emoji,
      targetMinutes: newHabit.targetMinutesPerDay,
      progressMinutes: 0,
      streak: 0,
      done: false,
      isRunning: false,
      sessionTime: 0
    });

    renderHabits();
    document.getElementById("habitModal").style.display = "none";
    
    // Reset form
    hoursInput.value = "";
    emojiSelect.value = "📖";
    nameInput.value = "";
    nameInput.style.display = "none";
    
    alert('Habit created! ✅');
  } catch (error) {
    alert('Failed to create habit: ' + error.message);
  }
}

// ========= Habit Actions =========
async function addHour(index) {
  const habit = habits[index];
  try {
    const updated = await updateHabitProgress(habit.id, 60);
    habit.progressMinutes = updated.progressMinutes;
    habit.done = updated.isCompletedToday;
    habit.streak = updated.streak;
    renderHabits();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function removeHour(index) {
  const habit = habits[index];
  if (habit.progressMinutes < 60) return;
  
  try {
    const updated = await updateHabitProgress(habit.id, -60);
    habit.progressMinutes = updated.progressMinutes;
    habit.done = updated.isCompletedToday;
    habit.streak = updated.streak;
    renderHabits();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

function toggleStopwatch(index) {
  const habit = habits[index];
  
  if (!habit.isRunning) {
    habit.isRunning = true;
    habit.startTime = Date.now();
    timers[index] = setInterval(() => {
      habit.sessionTime = Math.floor((Date.now() - habit.startTime) / 60000);
      renderHabits();
    }, 1000);
  } else {
    habit.isRunning = false;
    clearInterval(timers[index]);
    
    if (habit.sessionTime > 0) {
      addSessionTime(index, habit.sessionTime);
    }
  }
  renderHabits();
}

async function addSessionTime(index, minutes) {
  const habit = habits[index];
  try {
    const updated = await updateHabitProgress(habit.id, minutes);
    habit.progressMinutes = updated.progressMinutes;
    habit.done = updated.isCompletedToday;
    habit.streak = updated.streak;
    habit.sessionTime = 0;
    renderHabits();
  } catch (error) {
    console.error('Failed to update:', error);
  }
}

async function resetHabitAction(index) {
  if (!confirm('Reset this habit?')) return;
  
  const habit = habits[index];
  try {
    const updated = await resetHabit(habit.id);
    habit.progressMinutes = updated.progressMinutes;
    habit.done = updated.isCompletedToday;
    renderHabits();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function deleteHabitAction(index) {
  if (!confirm('Delete this habit permanently?')) return;
  
  const habit = habits[index];
  try {
    await deleteHabit(habit.id);
    habits.splice(index, 1);
    renderHabits();
    alert('Habit deleted');
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// ========= Render UI =========
function renderHabits() {
  const habitsList = document.getElementById("habitsList");
  if (!habitsList) return;

  if (habits.length === 0) {
    habitsList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No habits yet. Add your first habit!</p>';
    updateStats(0, 0, 0);
    return;
  }

  let completed = 0, pending = 0, totalStreak = 0;
  
  habitsList.innerHTML = habits.map((habit, index) => {
    if (habit.done) completed++; else pending++;
    totalStreak += habit.streak;

    const totalMins = habit.progressMinutes + habit.sessionTime;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const targetHrs = Math.floor(habit.targetMinutes / 60);
    const targetMins = habit.targetMinutes % 60;

    return `
      <div class="habit-card" style="${habit.done ? 'opacity: 0.7; background: #f0f8ff;' : ''}">
        <h4 class="habit-title">${habit.emoji} ${habit.name}</h4>
        <p class="habit-meta">Target: ${targetHrs}h ${targetMins}m/day</p>
        <p class="habit-meta">Progress: ${hrs}h ${mins}m / ${targetHrs}h ${targetMins}m</p>
        <p class="habit-meta">Streak: ${habit.streak} days</p>
        <div class="habit-actions">
          <button class="done-btn" onclick="addHour(${index})" ${habit.done ? 'disabled' : ''}>+1hr</button>
          <button class="minus-btn" onclick="removeHour(${index})" ${habit.done ? 'disabled' : ''}>-1hr</button>
          <button class="stopwatch-btn" onclick="toggleStopwatch(${index})">
            ${habit.isRunning ? '⏹ Stop' : '▶ Start'}
          </button>
          <button class="reset-btn" onclick="resetHabitAction(${index})">Reset</button>
          <button class="delete-btn" onclick="deleteHabitAction(${index})">🗑️</button>
        </div>
        ${habit.sessionTime > 0 ? `<p class="habit-meta">⏱ Session: ${habit.sessionTime} min</p>` : ''}
      </div>
    `;
  }).join('');

  updateStats(completed, pending, totalStreak);
  updateChart(completed, pending);
}

function updateStats(completed, pending, totalStreak) {
  const completedEl = document.getElementById("completedCount");
  const pendingEl = document.getElementById("pendingCount");
  const streakEl = document.getElementById("totalStreak");
  
  if (completedEl) completedEl.textContent = completed;
  if (pendingEl) pendingEl.textContent = pending;
  if (streakEl) streakEl.textContent = totalStreak;
}

function updateChart(completed, pending) {
  const ctx = document.getElementById("progressChart")?.getContext("2d");
  if (!ctx) return;

  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.error('Chart.js not loaded');
    return;
  }

  // Destroy existing chart if it exists
  if (habitChart) {
    habitChart.destroy();
  }

  const total = completed + pending;
  habitChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: total === 0 ? ["No habits"] : ["Completed", "Pending"],
      datasets: [{
        data: total === 0 ? [1] : [completed, pending],
        backgroundColor: total === 0 ? ["#ddd"] : ["#4caf50", "#ff8c42"],
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// ========= Daily Reset =========
function setupMidnightReset() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  const msUntilMidnight = tomorrow - now;
  
  setTimeout(() => {
    habits.forEach(h => {
      h.done = false;
      h.progressMinutes = 0;
      h.sessionTime = 0;
    });
    renderHabits();
    setupMidnightReset();
  }, msUntilMidnight);
}

// ========= PDF Report =========
function generatePDFReport() {
  // Check if jsPDF is loaded
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF library not loaded. Please refresh the page.');
    return;
  }
  
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const user = JSON.parse(localStorage.getItem("user"));
    const name = user?.fullname || "User";
    const today = new Date().toDateString();

    pdf.setFontSize(20);
    pdf.text(`Daily Report - ${name}`, 20, 30);
    pdf.setFontSize(12);
    pdf.text(`Date: ${today}`, 20, 45);

    const completed = habits.filter(h => h.done).length;
    const pending = habits.filter(h => !h.done).length;
    const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);

    pdf.text(`Completed: ${completed}, Pending: ${pending}, Total Streak: ${totalStreak}`, 20, 65);

    let y = 85;
    habits.forEach(habit => {
      const mins = habit.progressMinutes;
      const hrs = Math.floor(mins / 60);
      const remainMins = mins % 60;
      const status = habit.done ? "✓" : `${hrs}h ${remainMins}m`;
      pdf.text(`${habit.emoji} ${habit.name} - ${status}`, 20, y);
      y += 15;
    });

    pdf.save(`habits-${new Date().toISOString().split('T')[0]}.pdf`);
    alert('PDF report generated! ✅');
  } catch (error) {
    console.error('PDF Error:', error);
    alert('Failed to generate PDF');
  }
}

// Setup PDF button
document.addEventListener('DOMContentLoaded', () => {
  const pdfBtn = document.getElementById("pdfReportBtn");
  if (pdfBtn) pdfBtn.onclick = generatePDFReport;
});

// Make functions global for onclick handlers
window.addHour = addHour;
window.removeHour = removeHour;
window.toggleStopwatch = toggleStopwatch;
window.resetHabitAction = resetHabitAction;
window.deleteHabitAction = deleteHabitAction;
