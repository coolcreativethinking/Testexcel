-- Greenmind Database Initialization
-- Run this file to set up the database from scratch

\echo 'Creating Greenmind database schema...'
\i schema.sql

\echo 'Seeding initial data...'
\i seed.sql

\echo 'Greenmind database ready!'
