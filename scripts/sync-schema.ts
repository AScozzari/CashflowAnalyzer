#!/usr/bin/env tsx
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from "ws";
import * as schema from "../shared/schema";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function syncSchema() {
  try {
    console.log('🔄 Syncing database schema...');
    
    // Test connection first
    console.log('🔌 Testing database connection...');
    const testResult = await pool.query('SELECT 1 as test');
    console.log('✅ Database connection successful');
    
    // Create tables if they don't exist using direct SQL
    console.log('📊 Creating fiscal AI tables...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fiscal_ai_conversations (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        user_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fiscal_ai_messages (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id TEXT NOT NULL REFERENCES fiscal_ai_conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Fiscal AI tables created successfully');
    
    // Create calendar tables if they don't exist
    console.log('📅 Creating calendar tables...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        all_day BOOLEAN DEFAULT false,
        event_type TEXT DEFAULT 'general',
        related_movement_id TEXT,
        created_by_user_id TEXT,
        assigned_to_user_id TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_reminders (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id TEXT NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
        reminder_time TIMESTAMP NOT NULL,
        reminder_type TEXT DEFAULT 'email',
        is_sent BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Calendar tables created successfully');
    console.log('🎉 Database schema sync completed!');
    
  } catch (error) {
    console.error('❌ Error syncing schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

syncSchema()
  .then(() => {
    console.log('✅ Schema sync completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Schema sync failed:', error);
    process.exit(1);
  });