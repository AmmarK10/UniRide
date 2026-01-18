-- Migration: Update University Options to Pakistani Universities
-- Run this in Supabase SQL Editor

-- Note: PostgreSQL TEXT columns don't have CHECK constraints in the original schema
-- The universities are just stored as text values
-- This migration provides reference for allowed values and updates existing data

-- =====================================================
-- OPTIONAL: Add CHECK constraint for destination_university in rides table
-- (Only if you want strict validation at database level)
-- =====================================================

-- First, update any existing data to match new university names if needed
-- UPDATE rides SET destination_university = 'FAST' WHERE destination_university = 'MIT';
-- UPDATE rides SET destination_university = 'NUST' WHERE destination_university = 'Stanford University';
-- UPDATE profiles SET university_name = 'FAST' WHERE university_name = 'MIT';
-- UPDATE profiles SET university_name = 'NUST' WHERE university_name = 'Stanford University';

-- If you want to add constraints (optional, frontend will handle validation):
-- Note: Run these only if you want database-level validation

-- For rides table:
-- ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_destination_university_check;
-- ALTER TABLE rides ADD CONSTRAINT rides_destination_university_check 
--   CHECK (destination_university IN ('FAST', 'NUST', 'IBA', 'SZABIST', 'AKU', 'MAJU', 'SSUET', 'NED', 'JMDC', 'DOW', 'LUMS', 'UET'));

-- For profiles table:
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_university_name_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_university_name_check 
--   CHECK (university_name IN ('FAST', 'NUST', 'IBA', 'SZABIST', 'AKU', 'MAJU', 'SSUET', 'NED', 'JMDC', 'DOW', 'LUMS', 'UET'));

-- =====================================================
-- REFERENCE: Allowed University Values
-- =====================================================
-- Short Name  | Full Name
-- ------------|------------------------------------------
-- FAST        | FAST NUCES
-- NUST        | National University of Sciences and Technology
-- IBA         | IBA Karachi
-- SZABIST     | SZABIST
-- AKU         | Aga Khan University
-- MAJU        | Mohammad Ali Jinnah University
-- SSUET       | Sir Syed University of Engineering & Technology
-- NED         | NED University of Engineering & Technology
-- JMDC        | Jinnah Medical & Dental College
-- DOW         | Dow University of Health Sciences
-- LUMS        | Lahore University of Management Sciences
-- UET         | University of Engineering & Technology
-- =====================================================
