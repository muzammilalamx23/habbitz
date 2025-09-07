# Habit Tracker App

A clean habit tracking application with separate frontend and backend.

## Setup Instructions

### Backend Setup
1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   Server will run on http://localhost:5000

### Frontend Setup
1. Navigate to frontend folder
2. Open `index.html` in a browser or use Live Server extension in VS Code
3. Or serve with Python:
   ```bash
   python -m http.server 5500
   ```

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - Login user

### Habits (Protected - requires JWT token)
- `GET /habits` - Get user's habits
- `POST /habits` - Create new habit
- `POST /habits/:id/progress` - Update habit progress (add/remove minutes)
- `POST /habits/:id/reset` - Reset habit progress
- `DELETE /habits/:id` - Delete habit

## Features
- ✅ User signup/login with JWT authentication
- ✅ Create, update, delete habits
- ✅ Track daily progress with timer
- ✅ Streak tracking
- ✅ Progress charts
- ✅ PDF daily reports
- ✅ Responsive design
- ✅ Clean API separation

## File Structure
```
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   └── middleware/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── api.js (API service)
    ├── proj.js (UI logic)
    ├── success.html (main dashboard)
    ├── login.html
    ├── signup_main.html
    └── assets/
```

## Testing
Use `frontend/test.html` to test API endpoints directly.
