const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to load environment variables from .env.local or standard env
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
          process.env[key] = val;
        }
      }
    });
    console.log('Loaded credentials from .env.local');
  }
}

async function runBackup() {
  console.log('--- starting automated database backup script ---');
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL: Supabase credentials are missing! Please define them in .env.local or environment variables.');
    process.exit(1);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch data from users_profile
    console.log('Fetching "users_profile" records...');
    const { data: users, error: uErr } = await supabase.from('users_profile').select('*');
    if (uErr) throw uErr;
    console.log(`Fetched ${users.length} user profiles.`);

    // 2. Fetch data from insect_inspections
    console.log('Fetching "insect_inspections" records...');
    const { data: inspections, error: iErr } = await supabase.from('insect_inspections').select('*');
    if (iErr) throw iErr;
    console.log(`Fetched ${inspections.length} inspection records.`);

    // 3. Compile backup payload
    const backupPayload = {
      backup_timestamp: new Date().toISOString(),
      version: '1.0.0',
      users_profile: users,
      insect_inspections: inspections
    };

    // 4. Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`Created backup directory at: ${backupDir}`);
    }

    // 5. Save backup file
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
    const filename = `insect_db_backup_${dateStr}_${timeStr}.json`;
    const destPath = path.join(backupDir, filename);

    fs.writeFileSync(destPath, JSON.stringify(backupPayload, null, 2), 'utf8');
    console.log(`Backup file successfully saved to: ${destPath}`);
    console.log('--- backup script finished successfully ---');

  } catch (err) {
    console.error('CRITICAL: Database backup failed:', err);
    process.exit(1);
  }
}

runBackup();
