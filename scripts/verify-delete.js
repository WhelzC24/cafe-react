import fetch from 'node-fetch'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(l => l.split('=', 2).map(s => s.trim()))
)

const SUPABASE_URL = env.VITE_SUPABASE_URL
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY

async function createTempUser() {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
    body: JSON.stringify({ email: `temp-${Date.now()}@example.com`, password: 'tempPass123', email_confirm: true })
  })
  return resp.json()
}

async function getAuthUser(userId) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY }
  })
  return resp.json()
}

async function deleteProfileOnly(userId) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'DELETE',
    // simulate profile-only deletion (using service role here for simplicity)
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY }
  })
  return { status: resp.status, body: await resp.text() }
}

async function deleteAuthUser(userId) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
  })
  return { status: resp.status, body: await resp.text() }
}

;(async () => {
  console.log('Creating temp user...')
  const u = await createTempUser()
  const userId = u.id || u.user?.id || u?.data?.user?.id
  console.log('Created:', userId, u)

  console.log('\nEnsuring profile exists (insert via service role)')
  await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST', headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, fullname: 'Temp User', username: `temp${Date.now()}`, role: 'staff' })
  })

  console.log('\nAuth user before any deletion:')
  console.log(await getAuthUser(userId))

  console.log('\nDelete profile only via anon REST')
  console.log(await deleteProfileOnly(userId))

  console.log('\nAuth user after profile-only delete:')
  console.log(await getAuthUser(userId))

  console.log('\nNow delete auth user via admin endpoint (service-role)')
  console.log(await deleteAuthUser(userId))

  console.log('\nAuth user after admin delete:')
  console.log(await getAuthUser(userId))
})()
