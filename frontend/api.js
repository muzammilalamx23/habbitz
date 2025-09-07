// Pure API service - just HTTP requests to backend
const API_BASE = 'http://localhost:5000';

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const token = localStorage.getItem('token');
  if (token && !options.noAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  
  return data;
}

// Auth API calls
async function signup(fullname, email, password) {
  const data = await apiRequest('/auth/signup', {
    method: 'POST',
    body: { fullname, email, password },
    noAuth: true
  });
  localStorage.setItem('token', data.token);
  return data;
}

async function login(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
    noAuth: true
  });
  localStorage.setItem('token', data.token);
  return data;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Habit API calls
async function getHabits() {
  return await apiRequest('/habits');
}

async function createHabit(name, emoji, targetMinutesPerDay) {
  return await apiRequest('/habits', {
    method: 'POST',
    body: { name, emoji, targetMinutesPerDay }
  });
}

async function updateHabitProgress(habitId, minutes) {
  return await apiRequest(`/habits/${habitId}/progress`, {
    method: 'POST',
    body: { minutes }
  });
}

async function resetHabit(habitId) {
  return await apiRequest(`/habits/${habitId}/reset`, {
    method: 'POST'
  });
}

async function deleteHabit(habitId) {
  return await apiRequest(`/habits/${habitId}`, {
    method: 'DELETE'
  });
}
