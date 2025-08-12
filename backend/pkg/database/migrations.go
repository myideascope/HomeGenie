package database

import (
	"database/sql"
	"fmt"
	"log"
)

// Migration represents a database migration
type Migration struct {
	Version string
	Up      string
	Down    string
}

// migrations contains all database migrations in order
var migrations = []Migration{
	{
		Version: "001_create_users_table",
		Up: `
			CREATE TABLE IF NOT EXISTS users (
				id SERIAL PRIMARY KEY,
				email VARCHAR(255) NOT NULL UNIQUE,
				password_hash VARCHAR(255) NOT NULL,
				first_name VARCHAR(100) NOT NULL,
				last_name VARCHAR(100) NOT NULL,
				phone VARCHAR(20),
				avatar VARCHAR(500),
				timezone VARCHAR(50) DEFAULT 'UTC',
				email_notifications BOOLEAN DEFAULT true,
				push_notifications BOOLEAN DEFAULT true,
				sms_notifications BOOLEAN DEFAULT false,
				theme VARCHAR(20) DEFAULT 'system',
				date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
				time_format VARCHAR(5) DEFAULT '12h',
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				last_login_at TIMESTAMP WITH TIME ZONE
			);

			CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
			CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
		`,
		Down: `DROP TABLE IF EXISTS users CASCADE;`,
	},
	{
		Version: "002_create_properties_table",
		Up: `
			CREATE TABLE IF NOT EXISTS properties (
				id SERIAL PRIMARY KEY,
				user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				name VARCHAR(255) NOT NULL,
				address TEXT NOT NULL,
				type VARCHAR(50) NOT NULL CHECK (type IN ('house', 'apartment', 'condo', 'townhouse', 'other')),
				year_built INTEGER,
				square_footage INTEGER,
				notes TEXT,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
			);

			CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
			CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
		`,
		Down: `DROP TABLE IF EXISTS properties CASCADE;`,
	},
	{
		Version: "003_create_rooms_table",
		Up: `
			CREATE TABLE IF NOT EXISTS rooms (
				id SERIAL PRIMARY KEY,
				property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
				name VARCHAR(255) NOT NULL,
				type VARCHAR(50) NOT NULL CHECK (type IN ('bedroom', 'bathroom', 'kitchen', 'living', 'garage', 'basement', 'attic', 'office', 'other')),
				floor_area INTEGER,
				description TEXT,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
			);

			CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON rooms(property_id);
			CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);
		`,
		Down: `DROP TABLE IF EXISTS rooms CASCADE;`,
	},
	{
		Version: "004_create_tasks_table",
		Up: `
			CREATE TABLE IF NOT EXISTS tasks (
				id SERIAL PRIMARY KEY,
				user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
				title VARCHAR(255) NOT NULL,
				description TEXT,
				priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
				status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
				category VARCHAR(100) NOT NULL,
				due_date TIMESTAMP WITH TIME ZONE,
				estimated_time INTEGER, -- in minutes
				assignee VARCHAR(255),
				notes TEXT,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				completed_at TIMESTAMP WITH TIME ZONE
			);

			CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
			CREATE INDEX IF NOT EXISTS idx_tasks_property_id ON tasks(property_id);
			CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
			CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
			CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
			CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
			CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
		`,
		Down: `DROP TABLE IF EXISTS tasks CASCADE;`,
	},
	{
		Version: "005_create_maintenance_records_table",
		Up: `
			CREATE TABLE IF NOT EXISTS maintenance_records (
				id SERIAL PRIMARY KEY,
				property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
				task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
				title VARCHAR(255) NOT NULL,
				description TEXT NOT NULL,
				completed_date TIMESTAMP WITH TIME ZONE NOT NULL,
				cost DECIMAL(10,2),
				contractor VARCHAR(255),
				notes TEXT,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
			);

			CREATE INDEX IF NOT EXISTS idx_maintenance_records_property_id ON maintenance_records(property_id);
			CREATE INDEX IF NOT EXISTS idx_maintenance_records_task_id ON maintenance_records(task_id);
			CREATE INDEX IF NOT EXISTS idx_maintenance_records_completed_date ON maintenance_records(completed_date);
		`,
		Down: `DROP TABLE IF EXISTS maintenance_records CASCADE;`,
	},
	{
		Version: "006_create_notifications_table",
		Up: `
			CREATE TABLE IF NOT EXISTS notifications (
				id SERIAL PRIMARY KEY,
				user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				title VARCHAR(255) NOT NULL,
				message TEXT NOT NULL,
				type VARCHAR(50) NOT NULL CHECK (type IN ('task_reminder', 'maintenance_due', 'system', 'alert')),
				priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
				read BOOLEAN DEFAULT false,
				task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
				property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
				action_url VARCHAR(500),
				scheduled_for TIMESTAMP WITH TIME ZONE,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
			);

			CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
			CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
			CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
			CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
			CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON notifications(task_id);
			CREATE INDEX IF NOT EXISTS idx_notifications_property_id ON notifications(property_id);
			CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
		`,
		Down: `DROP TABLE IF EXISTS notifications CASCADE;`,
	},
	{
		Version: "007_create_notification_settings_table",
		Up: `
			CREATE TABLE IF NOT EXISTS notification_settings (
				id SERIAL PRIMARY KEY,
				user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				email_notifications BOOLEAN DEFAULT true,
				push_notifications BOOLEAN DEFAULT true,
				sms_notifications BOOLEAN DEFAULT false,
				reminder_advance INTEGER DEFAULT 24, -- hours
				quiet_hours_enabled BOOLEAN DEFAULT false,
				quiet_hours_start TIME DEFAULT '22:00',
				quiet_hours_end TIME DEFAULT '08:00',
				task_reminders BOOLEAN DEFAULT true,
				maintenance_alerts BOOLEAN DEFAULT true,
				system_notifications BOOLEAN DEFAULT true,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				UNIQUE(user_id)
			);

			CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
		`,
		Down: `DROP TABLE IF EXISTS notification_settings CASCADE;`,
	},
	{
		Version: "008_create_refresh_tokens_table",
		Up: `
			CREATE TABLE IF NOT EXISTS refresh_tokens (
				id SERIAL PRIMARY KEY,
				user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				token VARCHAR(255) NOT NULL UNIQUE,
				expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				revoked_at TIMESTAMP WITH TIME ZONE
			);

			CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
			CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
			CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
		`,
		Down: `DROP TABLE IF EXISTS refresh_tokens CASCADE;`,
	},
	{
		Version: "009_create_files_table",
		Up: `
			CREATE TABLE IF NOT EXISTS files (
				id SERIAL PRIMARY KEY,
				user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				filename VARCHAR(255) NOT NULL,
				original_filename VARCHAR(255) NOT NULL,
				mime_type VARCHAR(100) NOT NULL,
				size_bytes BIGINT NOT NULL,
				category VARCHAR(50) NOT NULL CHECK (category IN ('avatar', 'property', 'task', 'maintenance')),
				file_path VARCHAR(500) NOT NULL,
				url VARCHAR(500) NOT NULL,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
			);

			CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
			CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
			CREATE INDEX IF NOT EXISTS idx_files_filename ON files(filename);
		`,
		Down: `DROP TABLE IF EXISTS files CASCADE;`,
	},
	{
		Version: "010_create_migrations_table",
		Up: `
			CREATE TABLE IF NOT EXISTS schema_migrations (
				version VARCHAR(255) PRIMARY KEY,
				applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
			);
		`,
		Down: `DROP TABLE IF EXISTS schema_migrations CASCADE;`,
	},
}

// RunMigrations applies all pending migrations to the database
func RunMigrations(db *sql.DB) error {
	log.Println("Running database migrations...")

	// Ensure migrations table exists first
	if err := createMigrationsTable(db); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get already applied migrations
	appliedMigrations, err := getAppliedMigrations(db)
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	// Apply pending migrations
	for _, migration := range migrations {
		if _, applied := appliedMigrations[migration.Version]; applied {
			log.Printf("Migration %s already applied, skipping", migration.Version)
			continue
		}

		log.Printf("Applying migration %s...", migration.Version)
		if err := applyMigration(db, migration); err != nil {
			return fmt.Errorf("failed to apply migration %s: %w", migration.Version, err)
		}
		log.Printf("Migration %s applied successfully", migration.Version)
	}

	log.Println("All migrations completed successfully")
	return nil
}

// createMigrationsTable creates the schema_migrations table if it doesn't exist
func createMigrationsTable(db *sql.DB) error {
	query := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);
	`
	_, err := db.Exec(query)
	return err
}

// getAppliedMigrations returns a set of already applied migration versions
func getAppliedMigrations(db *sql.DB) (map[string]bool, error) {
	rows, err := db.Query("SELECT version FROM schema_migrations")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		applied[version] = true
	}

	return applied, rows.Err()
}

// applyMigration applies a single migration within a transaction
func applyMigration(db *sql.DB, migration Migration) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Execute the migration
	if _, err := tx.Exec(migration.Up); err != nil {
		return err
	}

	// Record the migration as applied
	if _, err := tx.Exec("INSERT INTO schema_migrations (version) VALUES ($1)", migration.Version); err != nil {
		return err
	}

	return tx.Commit()
}

// RollbackMigration rolls back a specific migration (for development/testing)
func RollbackMigration(db *sql.DB, version string) error {
	// Find the migration
	var targetMigration *Migration
	for _, migration := range migrations {
		if migration.Version == version {
			targetMigration = &migration
			break
		}
	}

	if targetMigration == nil {
		return fmt.Errorf("migration %s not found", version)
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Execute the rollback
	if _, err := tx.Exec(targetMigration.Down); err != nil {
		return err
	}

	// Remove from applied migrations
	if _, err := tx.Exec("DELETE FROM schema_migrations WHERE version = $1", version); err != nil {
		return err
	}

	return tx.Commit()
}