/**
 * Database setup and initialization for Tarefitas
 * Using SQLite for local storage with future sync capabilities
 */

import Database from 'better-sqlite3';
import path from 'path';

// Database file path - using better-sqlite3 for local storage
const DB_PATH = path.join(process.cwd(), 'sqlite.db');

let db: Database.Database;

export function initDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Create tables if they don't exist
    createTables();
  }
  
  return db;
}

function createTables() {
  // Users table (if not using Better Auth)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      preferences TEXT, -- JSON string for user preferences
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tasks table - core todo/task management
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      completed BOOLEAN DEFAULT FALSE,
      priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high
      due_date DATETIME,
      estimated_duration INTEGER, -- in minutes
      category TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Routines table - morning/evening routines
  db.exec(`
    CREATE TABLE IF NOT EXISTS routines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('morning', 'evening', 'custom')) DEFAULT 'custom',
      description TEXT,
      active BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Routine steps - individual steps within a routine
  db.exec(`
    CREATE TABLE IF NOT EXISTS routine_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      estimated_duration INTEGER, -- in minutes
      sort_order INTEGER DEFAULT 0,
      optional BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE
    )
  `);

  // Routine completions - track when routines are completed
  db.exec(`
    CREATE TABLE IF NOT EXISTS routine_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      total_duration INTEGER, -- actual time taken in minutes
      FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Step completions - track individual step completions within routines
  db.exec(`
    CREATE TABLE IF NOT EXISTS step_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_completion_id INTEGER NOT NULL,
      step_id INTEGER NOT NULL,
      completed BOOLEAN DEFAULT TRUE,
      duration INTEGER, -- actual time taken in minutes
      notes TEXT,
      FOREIGN KEY (routine_completion_id) REFERENCES routine_completions (id) ON DELETE CASCADE,
      FOREIGN KEY (step_id) REFERENCES routine_steps (id) ON DELETE CASCADE
    )
  `);

  // Pomodoro sessions - track focus sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER,
      duration INTEGER NOT NULL, -- in minutes (typically 25)
      break_duration INTEGER, -- in minutes (typically 5 or 15)
      completed BOOLEAN DEFAULT FALSE,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL
    )
  `);

  // Habits table - for habit tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      frequency TEXT DEFAULT 'daily', -- daily, weekly, custom
      target_count INTEGER DEFAULT 1,
      color TEXT DEFAULT '#5F6D73', -- for visual organization
      active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Habit completions - track habit completions
  db.exec(`
    CREATE TABLE IF NOT EXISTS habit_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      count INTEGER DEFAULT 1,
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
    )
  `);

  // User preferences for personalization
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      theme TEXT DEFAULT 'light',
      pomodoro_work_duration INTEGER DEFAULT 25,
      pomodoro_short_break INTEGER DEFAULT 5,
      pomodoro_long_break INTEGER DEFAULT 15,
      notification_sounds BOOLEAN DEFAULT TRUE,
      notification_vibration BOOLEAN DEFAULT TRUE,
      language TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
    CREATE INDEX IF NOT EXISTS idx_routine_completions_user_id ON routine_completions(user_id);
    CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
  `);
}

export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

// Seed some default data for testing
export function seedDefaultData(userId: number) {
  const db = getDatabase();

  // Create default morning routine
  const morningRoutine = db.prepare(`
    INSERT OR IGNORE INTO routines (user_id, name, type, description)
    VALUES (?, ?, ?, ?)
  `);
  
  const morningId = morningRoutine.run(
    userId,
    'Morning Routine',
    'morning',
    'Start your day with intention and energy'
  ).lastInsertRowid;

  // Add morning routine steps
  if (morningId) {
    const addStep = db.prepare(`
      INSERT INTO routine_steps (routine_id, title, estimated_duration, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    addStep.run(morningId, 'Drink a glass of water', 2, 1);
    addStep.run(morningId, 'Take deep breaths (5 minutes)', 5, 2);
    addStep.run(morningId, 'Review daily goals', 10, 3);
    addStep.run(morningId, 'Light stretching or movement', 15, 4);
  }

  // Create default evening routine
  const eveningRoutine = db.prepare(`
    INSERT OR IGNORE INTO routines (user_id, name, type, description)
    VALUES (?, ?, ?, ?)
  `);
  
  const eveningId = eveningRoutine.run(
    userId,
    'Evening Wind Down',
    'evening',
    'Reflect and prepare for restful sleep'
  ).lastInsertRowid;

  // Add evening routine steps
  if (eveningId) {
    const addStep = db.prepare(`
      INSERT INTO routine_steps (routine_id, title, estimated_duration, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    addStep.run(eveningId, 'Reflect on the day', 10, 1);
    addStep.run(eveningId, 'Prepare tomorrow\'s priorities', 10, 2);
    addStep.run(eveningId, 'Reading or calming activity', 30, 3);
    addStep.run(eveningId, 'Gratitude practice', 5, 4);
  }

  // Create default user preferences
  db.prepare(`
    INSERT OR IGNORE INTO user_preferences (user_id)
    VALUES (?)
  `).run(userId);
}