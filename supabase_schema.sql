-- Profiles Table (for RBAC)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'Receptionist', -- 'Admin', 'Receptionist'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients Table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  surname TEXT NOT NULL,
  first_names TEXT NOT NULL,
  dob DATE NOT NULL,
  id_number TEXT UNIQUE NOT NULL,
  gender TEXT,
  occupation TEXT,
  cell_number TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  address TEXT,
  marital_status TEXT,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'Complete', -- 'Complete', 'Incomplete', 'High Risk'
  created_by UUID REFERENCES auth.users(id)
);

-- Responsible Persons Table
CREATE TABLE responsible_persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  id_number TEXT,
  address TEXT,
  contact_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical Aid Table
CREATE TABLE medical_aid (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT,
  member_name TEXT,
  member_number TEXT,
  plan_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical History Table
CREATE TABLE medical_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  allergies BOOLEAN DEFAULT FALSE,
  allergies_details TEXT,
  under_treatment BOOLEAN DEFAULT FALSE,
  taking_medication BOOLEAN DEFAULT FALSE,
  medication_details TEXT,
  pregnant BOOLEAN DEFAULT FALSE,
  breastfeeding BOOLEAN DEFAULT FALSE,
  diabetes BOOLEAN DEFAULT FALSE,
  epilepsy BOOLEAN DEFAULT FALSE,
  asthma BOOLEAN DEFAULT FALSE,
  cardiac_condition BOOLEAN DEFAULT FALSE,
  high_blood_pressure BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Contacts Table
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  contact_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsible_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_aid ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (Allow authenticated users to read/write)
-- In a real production app, you'd refine these based on roles.
CREATE POLICY "Allow authenticated access" ON patients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON responsible_persons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON medical_aid FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON medical_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON emergency_contacts FOR ALL USING (auth.role() = 'authenticated');

-- Indexes for search
CREATE INDEX idx_patients_name ON patients (first_names, surname);
CREATE INDEX idx_patients_id_number ON patients (id_number);
CREATE INDEX idx_patients_cell ON patients (cell_number);
