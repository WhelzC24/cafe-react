import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load env
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(l => l.split('=', 2).map(s => s.trim()))
)

const supabaseUrl = env.VITE_SUPABASE_URL
const serviceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY

const [,, fullname, username, email, password] = process.argv

if (!fullname || !username || !email || !password) {
  console.error('Usage: node scripts/create-staff.mjs "Full Name" username email@example.com password123')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// 1. Create auth user
const { data: userData, error: userError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { fullname, username, role: 'staff' },
})

if (userError) {
  console.error('Failed to create auth user:', userError.message)
  process.exit(1)
}

const userId = userData.user.id
console.log(`✓ Auth user created: ${userId}`)

// 2. Create profile
const { error: profileError } = await supabase.from('profiles').insert({
  id: userId,
  fullname,
  username,
  role: 'staff',
  must_change_password: true,
})

if (profileError) {
  console.error('Failed to create profile:', profileError.message)
  // Cleanup: delete the auth user
  await supabase.auth.admin.deleteUser(userId)
  process.exit(1)
}

console.log(`✓ Profile created for ${fullname} (@${username})`)
console.log(`✓ Staff can sign in with: ${email} / ${password}`)
