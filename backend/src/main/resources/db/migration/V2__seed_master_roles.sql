-- ====================================================================
-- AIVES Database Migration V2: Seed Master Roles
-- ====================================================================

INSERT INTO "role" (role_name) VALUES ('ADMIN') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO "role" (role_name) VALUES ('LECTURER') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO "role" (role_name) VALUES ('STUDENT') ON CONFLICT (role_name) DO NOTHING;
