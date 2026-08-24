-- =================================================================
-- METROLOGYSHIELD — Supabase PostgreSQL Schema & RLS Migrations
-- Legal Metrology Packaged Commodities Compliance Platform
-- =================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    organization TEXT,
    role TEXT DEFAULT 'analyst' CHECK (role IN ('analyst', 'auditor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Core Analyses Table
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_name TEXT NOT NULL DEFAULT 'Untitled Package Label',
    status TEXT NOT NULL DEFAULT 'UPLOADING' CHECK (
        status IN ('UPLOADING', 'OCR_PROCESSING', 'EXTRACTING', 'REVIEW_READY', 'ANALYZING', 'COMPLETED', 'FAILED')
    ),
    compliance_status TEXT CHECK (
        compliance_status IN ('COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT', 'REQUIRES_REVIEW')
    ),
    compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Uploaded Labels / Images Table
CREATE TABLE IF NOT EXISTS public.uploaded_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    image_width INTEGER,
    image_height INTEGER,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. OCR Results Table
CREATE TABLE IF NOT EXISTS public.ocr_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL DEFAULT 'TESSERACT',
    raw_text TEXT NOT NULL,
    confidence NUMERIC(5, 2) NOT NULL,
    word_count INTEGER NOT NULL DEFAULT 0,
    language_detected TEXT DEFAULT 'eng',
    processing_time_ms INTEGER NOT NULL DEFAULT 0,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Extracted Declarations & Fields Table
CREATE TABLE IF NOT EXISTS public.extracted_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
    field_name TEXT NOT NULL,
    field_value TEXT,
    status TEXT NOT NULL DEFAULT 'MISSING' CHECK (
        status IN ('DETECTED', 'MISSING', 'UNCERTAIN', 'NOT_APPLICABLE')
    ),
    confidence NUMERIC(4, 3) DEFAULT 1.0,
    is_user_corrected BOOLEAN DEFAULT FALSE,
    original_value TEXT,
    source_text_snippet TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Compliance Results Table
CREATE TABLE IF NOT EXISTS public.compliance_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
    overall_status TEXT NOT NULL CHECK (
        overall_status IN ('COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT', 'REQUIRES_REVIEW')
    ),
    compliance_score INTEGER NOT NULL CHECK (compliance_score >= 0 AND compliance_score <= 100),
    total_rules INTEGER NOT NULL DEFAULT 0,
    passed_rules INTEGER NOT NULL DEFAULT 0,
    failed_rules INTEGER NOT NULL DEFAULT 0,
    warning_rules INTEGER NOT NULL DEFAULT 0,
    summary_note TEXT,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Rule Violations Table
CREATE TABLE IF NOT EXISTS public.violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
    rule_id TEXT NOT NULL,
    rule_code TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('VIOLATION', 'WARNING', 'PASS', 'NOT_APPLICABLE')),
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
    detected_value TEXT,
    expected_requirement TEXT NOT NULL,
    legal_explanation TEXT NOT NULL,
    recommended_correction TEXT NOT NULL,
    statutory_reference TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Indexes for High-Performance Querying
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON public.analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_compliance_status ON public.analyses(compliance_status);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_labels_analysis_id ON public.uploaded_labels(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_analysis_id ON public.ocr_results(analysis_id);
CREATE INDEX IF NOT EXISTS idx_extracted_fields_analysis_id ON public.extracted_fields(analysis_id);
CREATE INDEX IF NOT EXISTS idx_compliance_results_analysis_id ON public.compliance_results(analysis_id);
CREATE INDEX IF NOT EXISTS idx_violations_analysis_id ON public.violations(analysis_id);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Analyses: Users can only select, insert, update, delete their own analyses
CREATE POLICY "Users can select own analyses" ON public.analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON public.analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON public.analyses
    FOR DELETE USING (auth.uid() = user_id);

-- Child tables policies based on parent analysis ownership
CREATE POLICY "Users can access own uploaded_labels" ON public.uploaded_labels
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.analyses WHERE id = uploaded_labels.analysis_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can access own ocr_results" ON public.ocr_results
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.analyses WHERE id = ocr_results.analysis_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can access own extracted_fields" ON public.extracted_fields
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.analyses WHERE id = extracted_fields.analysis_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can access own compliance_results" ON public.compliance_results
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.analyses WHERE id = compliance_results.analysis_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can access own violations" ON public.violations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.analyses WHERE id = violations.analysis_id AND user_id = auth.uid())
    );
