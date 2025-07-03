-- Fix tenant isolation issues
-- First, get or create a default tenant

DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Get the default tenant ID
    SELECT id INTO default_tenant_id FROM tenant WHERE schema = 'public' OR name = 'default' LIMIT 1;
    
    -- If no default tenant exists, create one
    IF default_tenant_id IS NULL THEN
        INSERT INTO tenant (id, name, schema, "displayName", status, "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), 'default', 'public', 'Default Restaurant', 'trial', NOW(), NOW()) 
        RETURNING id INTO default_tenant_id;
    END IF;
    
    -- Update subscription records with null tenantId
    UPDATE subscription SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
    
    -- Update payment records with null tenantId
    UPDATE payment SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
    
    RAISE NOTICE 'Fixed tenant isolation with default tenant ID: %', default_tenant_id;
END $$;
