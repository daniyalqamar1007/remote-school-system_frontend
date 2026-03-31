// This script clears the profile cache and forces a fresh fetch
// Run this in browser console or create a button component

export const clearProfileCache = () => {
  // Clear localStorage
  localStorage.removeItem('userProfile');
  localStorage.removeItem('user');
  
  // Clear sessionStorage
  sessionStorage.removeItem('userProfile');
  sessionStorage.removeItem('user');
  
  console.log('Profile cache cleared. Please refresh the page.');
  
  // Optionally reload the page
  window.location.reload();
};

// For immediate use in browser console:
// clearProfileCache();
