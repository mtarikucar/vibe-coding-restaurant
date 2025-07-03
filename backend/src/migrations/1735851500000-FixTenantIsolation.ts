import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTenantIsolation1735851500000 implements MigrationInterface {
    name = 'FixTenantIsolation1735851500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Get the default tenant ID
        const defaultTenantResult = await queryRunner.query(`
            SELECT id FROM tenant WHERE schema = 'public' OR name = 'default' LIMIT 1
        `);
        
        let defaultTenantId: string;
        
        if (defaultTenantResult.length === 0) {
            // Create default tenant if it doesn't exist
            const createTenantResult = await queryRunner.query(`
                INSERT INTO tenant (id, name, schema, "displayName", status, "createdAt", "updatedAt") 
                VALUES (gen_random_uuid(), 'default', 'public', 'Default Restaurant', 'trial', NOW(), NOW()) 
                RETURNING id
            `);
            defaultTenantId = createTenantResult[0].id;
        } else {
            defaultTenantId = defaultTenantResult[0].id;
        }

        // Helper function to add tenantId column if it doesn't exist
        const addTenantIdColumn = async (tableName: string, constraintName: string) => {
            const columns = await queryRunner.query(`
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = '${tableName}' AND column_name = 'tenantId'
            `);
            
            if (columns.length === 0) {
                await queryRunner.query(`ALTER TABLE "${tableName}" ADD "tenantId" uuid`);
                await queryRunner.query(`UPDATE "${tableName}" SET "tenantId" = $1 WHERE "tenantId" IS NULL`, [defaultTenantId]);
                await queryRunner.query(`ALTER TABLE "${tableName}" ALTER COLUMN "tenantId" SET NOT NULL`);
                await queryRunner.query(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraintName}" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
            } else {
                // Column exists, just update null values
                await queryRunner.query(`UPDATE "${tableName}" SET "tenantId" = $1 WHERE "tenantId" IS NULL`, [defaultTenantId]);
            }
        };

        // Add tenantId to all entities that need it
        await addTenantIdColumn('menu_item_modifier', 'FK_menu_item_modifier_tenant');
        await addTenantIdColumn('menu_item_ingredient', 'FK_menu_item_ingredient_tenant');
        await addTenantIdColumn('order_item', 'FK_order_item_tenant');
        await addTenantIdColumn('order_item_modifier', 'FK_order_item_modifier_tenant');
        await addTenantIdColumn('table_qr', 'FK_table_qr_tenant');
        await addTenantIdColumn('purchase_order_item', 'FK_purchase_order_item_tenant');

        // Fix existing records with null tenantId
        await queryRunner.query(`UPDATE "subscription" SET "tenantId" = $1 WHERE "tenantId" IS NULL`, [defaultTenantId]);
        await queryRunner.query(`UPDATE "payment" SET "tenantId" = $1 WHERE "tenantId" IS NULL`, [defaultTenantId]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraints and columns
        const dropTenantIdColumn = async (tableName: string, constraintName: string) => {
            try {
                await queryRunner.query(`ALTER TABLE "${tableName}" DROP CONSTRAINT "${constraintName}"`);
            } catch (error) {
                // Constraint might not exist, continue
            }
            try {
                await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN "tenantId"`);
            } catch (error) {
                // Column might not exist, continue
            }
        };

        await dropTenantIdColumn('purchase_order_item', 'FK_purchase_order_item_tenant');
        await dropTenantIdColumn('table_qr', 'FK_table_qr_tenant');
        await dropTenantIdColumn('order_item_modifier', 'FK_order_item_modifier_tenant');
        await dropTenantIdColumn('order_item', 'FK_order_item_tenant');
        await dropTenantIdColumn('menu_item_ingredient', 'FK_menu_item_ingredient_tenant');
        await dropTenantIdColumn('menu_item_modifier', 'FK_menu_item_modifier_tenant');
    }
}
