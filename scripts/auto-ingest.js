const dotenv = require("dotenv");
const path = require("path");

// Load local env if exists
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runAutoIngest() {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error("❌ Error: CRON_SECRET is not defined in environment variables.");
        process.exit(1);
    }

    console.log(`🤖 Starting AI library Auto-Ingestion Pipeline...`);
    console.log(`🔗 Target URL: ${appUrl}/api/admin/aggregate`);

    try {
        const response = await fetch(`${appUrl}/api/admin/aggregate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cronSecret}`
            },
            body: JSON.stringify({
                action: "rss",
                autoPublish: false // Keep in moderation queue by default for admin approval
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error(`❌ Ingestion failed with status ${response.status}:`, result);
            process.exit(1);
        }

        console.log(`\n🎉 Ingestion successful!`);
        console.log(`📝 Message: ${result.message}`);
        
        if (result.results && result.results.length > 0) {
            console.log("\n📊 Execution Summary:");
            console.table(result.results);
        } else {
            console.log("No new feeds processed.");
        }
    } catch (error) {
        console.error("❌ Critical error during Auto-Ingestion run:", error);
        process.exit(1);
    }
}

runAutoIngest();
