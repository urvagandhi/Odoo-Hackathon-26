-- Fix: Set immutable search_path on fn_set_updated_at()
-- Prevents search_path hijacking (mutable search_path security issue).
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';
