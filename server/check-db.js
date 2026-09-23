import "dotenv/config";
import pg from "pg";

const { Client } = pg;
function showHost(name, connectionString) {
    try {
        const url = new URL(connectionString);

        console.log(
            `${name} host: ${url.hostname || "(missing)"}`
        );

        console.log(
            `${name} port: ${url.port || "(default)"}`
        );
    } catch (error) {
        console.log(
            `${name}: URL COULD NOT BE PARSED`
        );
    }
}

showHost(
    "SOURCE_DATABASE_URL",
    process.env.SOURCE_DATABASE_URL
);

showHost(
    "DATABASE_URL",
    process.env.DATABASE_URL
);

showHost(
    "SHADOW_DATABASE_URL",
    process.env.SHADOW_DATABASE_URL
);

async function checkDatabase(name, connectionString) {
    const client = new Client({
        connectionString,
    });

    try {
        await client.connect();

        const result = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

        console.log(
            `${name}: ${result.rows[0].count} public tables`
        );
    } catch (error) {
        console.log(`${name}: CONNECTION FAILED`);
        console.log("Name:", error?.name);
        console.log("Code:", error?.code);
        console.log("Message:", error?.message);

        if (Array.isArray(error?.errors)) {
            for (const item of error.errors) {
                console.log(
                    "Inner error:",
                    item.code,
                    item.message
                );
            }
        }
    } finally {
        await client.end().catch(() => { });
    }
}

await checkDatabase(
    "SOURCE_DATABASE_URL",
    process.env.SOURCE_DATABASE_URL
);

await checkDatabase(
    "DATABASE_URL",
    process.env.DATABASE_URL
);

await checkDatabase(
    "SHADOW_DATABASE_URL",
    process.env.SHADOW_DATABASE_URL
);