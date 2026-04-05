// CapeLoad — Auth Guard
// Protects portal pages. Set window.REQUIRED_ROLE before loading this script.
// Fires 'auth-ready' event when auth is confirmed.

(async function() {
  var requiredRole = window.REQUIRED_ROLE || 'client';

  var user = await getCurrentUser();

  if (!user) {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    window.location.href = 'auth.html?redirect=' + encodeURIComponent(page);
    return;
  }

  var profile = await getUserProfile(user.id);
  var role = profile?.role || 'client';
  var admin = isAdminUser(profile, user.email);

  // Role check
  if (requiredRole === 'admin' && !admin) {
    window.location.href = 'auth.html';
    return;
  }
  if (requiredRole === 'driver' && role !== 'driver' && !admin) {
    window.location.href = 'auth.html';
    return;
  }

  // Expose to page scripts
  window.currentUser = user;
  window.currentUserProfile = profile;
  window.currentUserRole = role;
  window.isAdmin = admin;

  // Fire event so page-specific scripts can start
  document.dispatchEvent(new Event('auth-ready'));

  // Listen for sign-out
  sb.auth.onAuthStateChange(function(event) {
    if (event === 'SIGNED_OUT') {
      window.location.href = 'auth.html';
    }
  });
})();
