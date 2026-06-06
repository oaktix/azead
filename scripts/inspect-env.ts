// scripts/inspect-env.ts
console.log('Keys in process.env:');
for (const key of Object.keys(process.env)) {
  if (key.includes('DB') || key.includes('SUPABASE') || key.includes('POSTGRES') || key.includes('PASSWORD') || key.includes('KEY') || key.includes('URL')) {
    console.log(`${key}=${process.env[key]}`);
  }
}
