import { DataSource } from "typeorm";
import { config } from "dotenv";

// Load environment variables
config();

const dataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "restaurant",
  synchronize: false,
  logging: true,
});

async function fixTenantData() {
  try {
    await dataSource.initialize();
    console.log("Connected to database");

    // Check existing tables and columns
    const tables = await dataSource.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `);
    console.log(
      "Existing tables:",
      tables.map((t) => t.table_name)
    );

    // Check subscription table columns
    const subscriptionColumns = await dataSource.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'subscription' AND table_schema = 'public'
    `);
    console.log(
      "Subscription columns:",
      subscriptionColumns.map((c) => c.column_name)
    );

    // Check payment table columns
    const paymentColumns = await dataSource.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'payment' AND table_schema = 'public'
    `);
    console.log(
      "Payment columns:",
      paymentColumns.map((c) => c.column_name)
    );

    // Get or create default tenant
    let defaultTenantResult = await dataSource.query(`
      SELECT id FROM tenant WHERE schema = 'public' OR name = 'default' LIMIT 1
    `);

    let defaultTenantId: string;

    if (defaultTenantResult.length === 0) {
      // Create default tenant
      const createResult = await dataSource.query(`
        INSERT INTO tenant (id, name, schema, "displayName", status, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'default', 'public', 'Default Restaurant', 'trial', NOW(), NOW())
        RETURNING id
      `);
      defaultTenantId = createResult[0].id;
      console.log("Created default tenant:", defaultTenantId);
    } else {
      defaultTenantId = defaultTenantResult[0].id;
      console.log("Using existing default tenant:", defaultTenantId);
    }

    console.log("Tenant data check completed!");
  } catch (error) {
    console.error("Error fixing tenant data:", error);
  } finally {
    await dataSource.destroy();
  }
}

fixTenantData();
