-- ===========================================
-- NutriVision AI - PostgreSQL Initialization
-- ===========================================

-- Create database if not exists (handled by Docker env)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Nutrition Data Table
-- ===========================================
CREATE TABLE IF NOT EXISTS nutrition_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fdc_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    category VARCHAR(100),
    serving_size DECIMAL(10, 2) DEFAULT 100,
    serving_unit VARCHAR(50) DEFAULT 'g',
    
    -- Macronutrients (per 100g)
    calories DECIMAL(10, 2),
    protein DECIMAL(10, 2),
    carbohydrates DECIMAL(10, 2),
    fiber DECIMAL(10, 2),
    sugars DECIMAL(10, 2),
    fat DECIMAL(10, 2),
    saturated_fat DECIMAL(10, 2),
    monounsaturated_fat DECIMAL(10, 2),
    polyunsaturated_fat DECIMAL(10, 2),
    trans_fat DECIMAL(10, 2),
    cholesterol DECIMAL(10, 2),
    
    -- Micronutrients
    sodium DECIMAL(10, 2),
    potassium DECIMAL(10, 2),
    calcium DECIMAL(10, 2),
    iron DECIMAL(10, 2),
    magnesium DECIMAL(10, 2),
    phosphorus DECIMAL(10, 2),
    zinc DECIMAL(10, 2),
    
    -- Vitamins
    vitamin_a DECIMAL(10, 2),
    vitamin_c DECIMAL(10, 2),
    vitamin_d DECIMAL(10, 2),
    vitamin_e DECIMAL(10, 2),
    vitamin_k DECIMAL(10, 2),
    vitamin_b1 DECIMAL(10, 2),
    vitamin_b2 DECIMAL(10, 2),
    vitamin_b3 DECIMAL(10, 2),
    vitamin_b6 DECIMAL(10, 2),
    vitamin_b12 DECIMAL(10, 2),
    folate DECIMAL(10, 2),
    
    -- Dietary flags
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    is_dairy_free BOOLEAN DEFAULT FALSE,
    is_nut_free BOOLEAN DEFAULT FALSE,
    
    -- Allergen info
    contains_nuts BOOLEAN DEFAULT FALSE,
    contains_dairy BOOLEAN DEFAULT FALSE,
    contains_eggs BOOLEAN DEFAULT FALSE,
    contains_soy BOOLEAN DEFAULT FALSE,
    contains_wheat BOOLEAN DEFAULT FALSE,
    contains_fish BOOLEAN DEFAULT FALSE,
    contains_shellfish BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    data_source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- Glycemic Index Table
-- ===========================================
CREATE TABLE IF NOT EXISTS glycemic_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_name VARCHAR(255) NOT NULL,
    food_name_normalized VARCHAR(255),
    category VARCHAR(100),
    
    glycemic_index INTEGER NOT NULL CHECK (glycemic_index >= 0 AND glycemic_index <= 100),
    gi_category VARCHAR(20) CHECK (gi_category IN ('low', 'medium', 'high')),
    
    standard_serving_grams DECIMAL(10, 2) DEFAULT 100,
    carbs_per_serving DECIMAL(10, 2),
    glycemic_load DECIMAL(10, 2),
    gl_category VARCHAR(20) CHECK (gl_category IN ('low', 'medium', 'high')),
    
    data_source VARCHAR(100),
    reference VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- Workout Templates Table
-- ===========================================
CREATE TABLE IF NOT EXISTS workout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    
    duration_minutes INTEGER,
    estimated_calories_burn INTEGER,
    
    target_muscle_groups TEXT[],
    required_equipment TEXT[],
    
    exercises JSONB NOT NULL,
    
    goal_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- Indexes
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_nutrition_name ON nutrition_data(name);
CREATE INDEX IF NOT EXISTS idx_nutrition_category ON nutrition_data(category);
CREATE INDEX IF NOT EXISTS idx_nutrition_fdc_id ON nutrition_data(fdc_id);

CREATE INDEX IF NOT EXISTS idx_gi_food_name ON glycemic_index(food_name_normalized);
CREATE INDEX IF NOT EXISTS idx_gi_category ON glycemic_index(category);
CREATE INDEX IF NOT EXISTS idx_gi_value ON glycemic_index(glycemic_index);

CREATE INDEX IF NOT EXISTS idx_workout_category ON workout_templates(category);
CREATE INDEX IF NOT EXISTS idx_workout_difficulty ON workout_templates(difficulty);
CREATE INDEX IF NOT EXISTS idx_workout_goal ON workout_templates(goal_type);

-- ===========================================
-- Sample Data - Glycemic Index
-- ===========================================
INSERT INTO glycemic_index (food_name, food_name_normalized, category, glycemic_index, gi_category, standard_serving_grams, carbs_per_serving, glycemic_load, gl_category, data_source) VALUES
('White Rice', 'white rice', 'Grains', 73, 'high', 150, 43.5, 32, 'high', 'Harvard Health'),
('Brown Rice', 'brown rice', 'Grains', 50, 'low', 150, 38.4, 19, 'medium', 'Harvard Health'),
('White Bread', 'white bread', 'Bread', 75, 'high', 30, 14, 10, 'medium', 'Harvard Health'),
('Whole Wheat Bread', 'whole wheat bread', 'Bread', 51, 'low', 30, 12, 6, 'low', 'Harvard Health'),
('Apple', 'apple', 'Fruits', 36, 'low', 120, 15.6, 6, 'low', 'Harvard Health'),
('Banana', 'banana', 'Fruits', 51, 'low', 120, 25.2, 13, 'medium', 'Harvard Health'),
('Orange', 'orange', 'Fruits', 43, 'low', 120, 11.4, 5, 'low', 'Harvard Health'),
('Watermelon', 'watermelon', 'Fruits', 76, 'high', 120, 9.6, 7, 'low', 'Harvard Health'),
('Potato (baked)', 'potato baked', 'Vegetables', 85, 'high', 150, 28.5, 24, 'high', 'Harvard Health'),
('Sweet Potato', 'sweet potato', 'Vegetables', 63, 'medium', 150, 30, 19, 'medium', 'Harvard Health'),
('Carrots', 'carrots', 'Vegetables', 39, 'low', 80, 7.2, 3, 'low', 'Harvard Health'),
('Oatmeal', 'oatmeal', 'Cereals', 55, 'low', 250, 27, 15, 'medium', 'Harvard Health'),
('Cornflakes', 'cornflakes', 'Cereals', 81, 'high', 30, 26, 21, 'high', 'Harvard Health'),
('Pasta (white)', 'pasta white', 'Grains', 49, 'low', 180, 45, 22, 'high', 'Harvard Health'),
('Pasta (whole wheat)', 'pasta whole wheat', 'Grains', 42, 'low', 180, 42, 18, 'medium', 'Harvard Health'),
('Chickpeas', 'chickpeas', 'Legumes', 28, 'low', 150, 27, 8, 'low', 'Harvard Health'),
('Lentils', 'lentils', 'Legumes', 32, 'low', 150, 30, 10, 'low', 'Harvard Health'),
('Kidney Beans', 'kidney beans', 'Legumes', 24, 'low', 150, 30, 7, 'low', 'Harvard Health'),
('Milk (whole)', 'milk whole', 'Dairy', 27, 'low', 250, 12, 3, 'low', 'Harvard Health'),
('Yogurt (plain)', 'yogurt plain', 'Dairy', 14, 'low', 200, 9, 1, 'low', 'Harvard Health'),
('Honey', 'honey', 'Sweeteners', 61, 'medium', 25, 21, 13, 'medium', 'Harvard Health'),
('Sugar (table)', 'sugar table', 'Sweeteners', 65, 'medium', 10, 10, 7, 'low', 'Harvard Health')
ON CONFLICT DO NOTHING;

-- ===========================================
-- Sample Data - Workout Templates
-- ===========================================
INSERT INTO workout_templates (name, description, category, difficulty, duration_minutes, estimated_calories_burn, target_muscle_groups, required_equipment, exercises, goal_type) VALUES
(
    'Full Body Strength',
    'Complete full body workout targeting all major muscle groups',
    'strength',
    'intermediate',
    45,
    350,
    ARRAY['chest', 'back', 'shoulders', 'legs', 'core'],
    ARRAY['dumbbells', 'bench'],
    '[
        {"name": "Dumbbell Bench Press", "sets": 3, "reps": "10-12", "rest": "60s"},
        {"name": "Bent Over Rows", "sets": 3, "reps": "10-12", "rest": "60s"},
        {"name": "Shoulder Press", "sets": 3, "reps": "10-12", "rest": "60s"},
        {"name": "Squats", "sets": 3, "reps": "12-15", "rest": "60s"},
        {"name": "Lunges", "sets": 3, "reps": "10 each", "rest": "60s"},
        {"name": "Plank", "sets": 3, "reps": "30-60s", "rest": "30s"}
    ]'::jsonb,
    'muscle_gain'
),
(
    'HIIT Fat Burner',
    'High intensity interval training for maximum calorie burn',
    'cardio',
    'intermediate',
    30,
    400,
    ARRAY['full_body'],
    ARRAY['bodyweight'],
    '[
        {"name": "Jumping Jacks", "duration": "45s", "rest": "15s"},
        {"name": "Burpees", "duration": "45s", "rest": "15s"},
        {"name": "Mountain Climbers", "duration": "45s", "rest": "15s"},
        {"name": "High Knees", "duration": "45s", "rest": "15s"},
        {"name": "Squat Jumps", "duration": "45s", "rest": "15s"},
        {"name": "Push-ups", "duration": "45s", "rest": "15s"}
    ]'::jsonb,
    'fat_loss'
),
(
    'Beginner Bodyweight',
    'Perfect for beginners - no equipment needed',
    'strength',
    'beginner',
    30,
    200,
    ARRAY['chest', 'back', 'legs', 'core'],
    ARRAY['bodyweight'],
    '[
        {"name": "Wall Push-ups", "sets": 3, "reps": "10-15", "rest": "60s"},
        {"name": "Bodyweight Squats", "sets": 3, "reps": "15-20", "rest": "60s"},
        {"name": "Glute Bridges", "sets": 3, "reps": "15", "rest": "45s"},
        {"name": "Bird Dogs", "sets": 3, "reps": "10 each", "rest": "30s"},
        {"name": "Dead Bug", "sets": 3, "reps": "10 each", "rest": "30s"}
    ]'::jsonb,
    'general_fitness'
)
ON CONFLICT DO NOTHING;

-- ===========================================
-- Update trigger for updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nutrition_data_updated_at
    BEFORE UPDATE ON nutrition_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_glycemic_index_updated_at
    BEFORE UPDATE ON glycemic_index
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_templates_updated_at
    BEFORE UPDATE ON workout_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
