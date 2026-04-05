// CapeLoad — Supabase Client Configuration
// Loaded on every page that uses Supabase

const SUPABASE_URL = 'https://mwkqsygjuvsdsxdqenar.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13a3FzeWdqdXZzZHN4ZHFlbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjgzMzYsImV4cCI6MjA5MDgwNDMzNn0.8EFjvjQ1uI3mfq-zBySqHz26yPVlOlntlF2Njqx629A';
const ADMIN_EMAIL = 'capeload.za@gmail.com';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get current authenticated user (or null)
async function getCurrentUser() {
  const { data: { session } } = await sb.auth.getSession();
  return session?.user || null;
}

// Get user profile from public.users table
async function getUserProfile(userId) {
  const { data } = await sb
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

// Get user role
async function getUserRole(userId) {
  const profile = await getUserProfile(userId);
  return profile?.role || 'client';
}

// Check if user is admin (by role or email)
function isAdminUser(profile, email) {
  if (!profile && !email) return false;
  if (profile && ['admin', 'super_admin'].includes(profile.role)) return true;
  if (email === ADMIN_EMAIL) return true;
  return false;
}

// Logout and redirect
async function logout() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

// Generate booking reference (CL-XXXXXX)
function generateRef() {
  return 'CL-' + Math.floor(100000 + Math.random() * 900000);
}

// Format currency
function formatRand(amount) {
  return 'R' + (amount || 0).toLocaleString();
}

// Show a toast notification
function showToast(message, type) {
  type = type || 'info';
  var existing = document.getElementById('cl-toast');
  if (existing) existing.remove();

  var colors = {
    info: '#2b3990',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f15f22'
  };

  var toast = document.createElement('div');
  toast.id = 'cl-toast';
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:14px 24px;border-radius:12px;color:#fff;font-size:14px;font-weight:600;font-family:Inter,sans-serif;z-index:9999;opacity:0;transition:opacity 0.3s;background:' + (colors[type] || colors.info);
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(function() { toast.style.opacity = '1'; });
  setTimeout(function() {
    toast.style.opacity = '0';
    setTimeout(function() { toast.remove(); }, 300);
  }, 4000);
}
