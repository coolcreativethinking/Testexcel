-- Greenmind Seed Data

-- Demo user
INSERT INTO users (email, display_name) VALUES
('demo@greenmind.app', 'Demo User');

-- Sample plants
INSERT INTO plants (common_name, botanical_name, category, sun_requirement, water_needs, bloom_season, mature_height, mature_width, soil_type, hardiness_zone, notes) VALUES
('English Lavender', 'Lavandula angustifolia', 'Perennial', 'Full Sun', 'Low', 'Spring-Summer', 60, 60, 'Well-drained', '5-9', 'Drought tolerant once established'),
('Iceberg Rose', 'Rosa Iceberg', 'Shrub', 'Full Sun', 'Moderate', 'Spring-Autumn', 120, 90, 'Rich loam', '4-9', 'Prune in late winter'),
('Mixed Dahlia', 'Dahlia pinnata', 'Bulb', 'Full Sun', 'Moderate', 'Summer-Autumn', 100, 60, 'Rich well-drained', '8-11', 'Lift tubers in cold climates'),
('Roma Tomato', 'Solanum lycopersicum', 'Vegetable', 'Full Sun', 'Regular', 'Summer', 150, 60, 'Rich compost-amended', '9-11', 'Stake or cage for support'),
('Sweet Basil', 'Ocimum basilicum', 'Herb', 'Full Sun', 'Regular', 'Summer', 45, 30, 'Rich moist', '10-11', 'Pinch flowers to extend harvest'),
('Bell Pepper', 'Capsicum annuum', 'Vegetable', 'Full Sun', 'Regular', 'Summer-Autumn', 70, 50, 'Rich well-drained', '9-11', 'Harvest when firm and coloured'),
('Rosemary', 'Rosmarinus officinalis', 'Herb', 'Full Sun', 'Low', 'Spring', 100, 80, 'Well-drained', '7-10', 'Excellent culinary herb'),
('Common Thyme', 'Thymus vulgaris', 'Herb', 'Full Sun', 'Low', 'Spring-Summer', 30, 30, 'Well-drained', '5-9', 'Great ground cover'),
('Spearmint', 'Mentha spicata', 'Herb', 'Part Shade', 'Regular', 'Summer', 60, 60, 'Moist rich', '3-11', 'Plant in containers to control spread'),
('Coast Banksia', 'Banksia integrifolia', 'Native', 'Full Sun', 'Low', 'Autumn-Winter', 800, 400, 'Sandy well-drained', '9-11', 'Attracts native birds'),
('Rosemary Grevillea', 'Grevillea rosmarinifolia', 'Native', 'Full Sun', 'Low', 'Winter-Spring', 180, 150, 'Well-drained', '8-10', 'Attracts honeyeaters'),
('Soft Tree Fern', 'Dicksonia antarctica', 'Fern', 'Shade', 'Regular', 'Non-flowering', 300, 200, 'Moist humus-rich', '8-11', 'Keep trunk moist in summer'),
('Blue Hosta', 'Hosta sieboldiana', 'Perennial', 'Shade', 'Regular', 'Summer', 60, 100, 'Moist rich', '3-9', 'Protect from slugs and snails'),
('Hardy Lawn Mix', 'Festuca/Lolium blend', 'Grass', 'Full Sun', 'Regular', 'Non-flowering', 8, 0, 'Most soil types', '3-10', 'Mow to 3-4cm height');

-- Demo project
INSERT INTO projects (user_id, name, description, yard_area_sqm, climate_zone, soil_type, sun_exposure) VALUES
(1, 'My Dream Garden', 'Complete backyard redesign with native and edible plants', 120.00, '9b', 'Loamy clay', 'Full sun front, part shade rear');

-- Demo design concept
INSERT INTO design_concepts (project_id, name, style, description, estimated_cost, is_selected) VALUES
(1, 'Cottage Charm', 'cottage', 'Lush, informal planting with roses, lavender, and perennials', 4500.00, true);
