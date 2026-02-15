-- Greenmind Database Schema
-- PostgreSQL

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    display_name    VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    yard_area_sqm   DECIMAL(8,2),
    climate_zone    VARCHAR(20),
    soil_type       VARCHAR(50),
    sun_exposure    VARCHAR(50),
    photo_url       TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS design_concepts (
    id              SERIAL PRIMARY KEY,
    project_id      INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    style           VARCHAR(50) NOT NULL,
    description     TEXT,
    layout_json     JSONB,
    estimated_cost  DECIMAL(10,2),
    is_selected     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plants (
    id              SERIAL PRIMARY KEY,
    common_name     VARCHAR(100) NOT NULL,
    botanical_name  VARCHAR(150),
    category        VARCHAR(50),
    sun_requirement VARCHAR(30),
    water_needs     VARCHAR(30),
    bloom_season    VARCHAR(50),
    mature_height   INTEGER,
    mature_width    INTEGER,
    soil_type       VARCHAR(100),
    hardiness_zone  VARCHAR(20),
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS project_plants (
    id              SERIAL PRIMARY KEY,
    project_id      INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    plant_id        INTEGER REFERENCES plants(id) ON DELETE CASCADE,
    zone_name       VARCHAR(100),
    quantity        INTEGER DEFAULT 1,
    spacing_cm      INTEGER
);

CREATE TABLE IF NOT EXISTS bom_items (
    id              SERIAL PRIMARY KEY,
    project_id      INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    category        VARCHAR(50),
    item_name       VARCHAR(200) NOT NULL,
    description     TEXT,
    quantity         DECIMAL(8,2),
    unit            VARCHAR(20),
    unit_price      DECIMAL(10,2),
    total_price     DECIMAL(10,2),
    supplier        VARCHAR(200)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_design_concepts_project_id ON design_concepts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_plants_project_id ON project_plants(project_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_project_id ON bom_items(project_id);
CREATE INDEX IF NOT EXISTS idx_plants_category ON plants(category);
