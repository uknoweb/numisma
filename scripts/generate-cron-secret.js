/**
 * Script para generar un CRON_SECRET seguro
 */

const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('hex');

console.log("🔐 Generated CRON_SECRET:");
console.log(secret);
console.log("\n📝 Add this to your .env.local file:");
console.log(`CRON_SECRET=${secret}`);
console.log("\n📝 Also add to Vercel Environment Variables:");
console.log("Settings > Environment Variables > Add New");
console.log(`Key: CRON_SECRET`);
console.log(`Value: ${secret}`);
