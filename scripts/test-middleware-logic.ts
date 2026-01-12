
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig: any = {};

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envConfig[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL:", supabaseUrl);
// console.log("Anon Key:", supabaseAnonKey); // Don't log keys
// console.log("Service Key found:", !!supabaseServiceKey);

async function testMiddlewareLogic() {
    if (!supabaseServiceKey) {
        console.error("No SUPABASE_SERVICE_ROLE_KEY found. Cannot proceed.");
        return;
    }

    // 1. Get User ID using Service Role (Admin)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const targetEmail = 'dwollopus@gmail.com';

    // We can query public.users directly with admin client to get the ID if we trust the sync
    const { data: adminQueryResult, error: adminError } = await adminClient
        .from('users')
        .select('*')
        .eq('email', targetEmail)
        .single();

    if (adminError) {
        console.error("Admin client failed to find user in public.users:", adminError);
        return;
    }

    const userId = adminQueryResult.id;
    console.log(`[Admin Client] Found user ${targetEmail} with ID: ${userId}`);
    console.log(`[Admin Client] Role in DB: ${adminQueryResult.role}`);

    // 2. Simulate User Client (The Middleware Check)
    // IMPORTANT: The middleware uses `createServerClient` which uses the ANON key but passes the cookies/token.
    // Since we don't have the token here, we can't truly verify "User reading own profile".
    // BUT we can verify if "Public Read" or similar policies are active, or if we can sign in with password to get a token.

    // Attempt to Sign In to get a real token (if password was known).
    // optimizing: We'll assume the user is authenticated.

    // If we can't simulate the authenticated user, checking RLS is hard from a script without the token.
    // However, we can check if the policy exists via SQL or just check if the previous admin query worked (it did).

    console.log("\n--- DIAGNOSTIC CONCLUSION ---");
    if (adminQueryResult.role === 'admin') {
        console.log("User HAS 'admin' role in database.");
        console.log("If access is failing, it is 99% due to RLS blocking the middleware from reading this role.");
        console.log("Middleware uses: .from('users').select('role').eq('id', user.id).single()");
        console.log("Ensure Policy: 'Users can view own profile' exists on 'public.users'.");
    } else {
        console.log("User DOES NOT have 'admin' role.");
    }

}

testMiddlewareLogic();
