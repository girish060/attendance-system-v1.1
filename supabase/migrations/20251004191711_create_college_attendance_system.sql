/*
  # College Attendance System Schema

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `code` (text, course code like "CS101")
      - `name` (text, course name)
      - `instructor` (text, instructor name)
      - `created_at` (timestamptz, creation timestamp)
    
    - `students`
      - `id` (uuid, primary key)
      - `roll_number` (text, unique student roll number)
      - `name` (text, student name)
      - `email` (text, optional email)
      - `course_id` (uuid, foreign key to courses)
      - `created_at` (timestamptz, creation timestamp)
    
    - `attendance_records`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `course_id` (uuid, foreign key to courses)
      - `date` (date, attendance date)
      - `status` (text, present/absent/late)
      - `notes` (text, optional notes)
      - `created_at` (timestamptz, creation timestamp)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for public access (simple college system)
    - Policies allow viewing, adding, and managing records
  
  3. Indexes
    - Add index on student_id for faster lookups
    - Add index on course_id for course-based queries
    - Add index on date for efficient date-based queries
    - Add composite index on student_id and date
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  instructor text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number text NOT NULL UNIQUE,
  name text NOT NULL,
  email text DEFAULT '',
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Policies for courses table
CREATE POLICY "Allow public to view courses"
  ON courses FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert courses"
  ON courses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update courses"
  ON courses FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete courses"
  ON courses FOR DELETE
  USING (true);

-- Policies for students table
CREATE POLICY "Allow public to view students"
  ON students FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert students"
  ON students FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update students"
  ON students FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete students"
  ON students FOR DELETE
  USING (true);

-- Policies for attendance_records table
CREATE POLICY "Allow public to view attendance"
  ON attendance_records FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert attendance"
  ON attendance_records FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update attendance"
  ON attendance_records FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete attendance"
  ON attendance_records FOR DELETE
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course_id ON attendance_records(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, date);