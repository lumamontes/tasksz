/**
 * Database initialization script for Tarefitas
 * Run this to set up the SQLite database
 */

import { initDatabase } from './database';

export function initializeApp() {
  try {
    console.log('🗄️ Initializing Tarefitas database...');
    const db = initDatabase();
    console.log('✅ Database initialized successfully!');
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

// For direct script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeApp();
}