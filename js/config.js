/* Single config spot before publish. Also run: scripts/set-site.sh "Name" "https://USER.github.io/REPO/" */
window.SITE_CONFIG = {
  siteName: "Car Compass",
  tagline: "Locate cars for sale worldwide",
  // Trailing slash required. Placeholder until GitHub Pages URL is known.
  baseUrl: "https://haplessjack.github.io/car-compass/",
  year: 2026,
  // Marketplace backend (Supabase). Both values are PUBLIC by design: the publishable key only allows what the
  // database's Row Level Security rules allow. Never put a service_role / secret key in site code.
  supabase: {
    url: "https://pdhxxbfjrglzzasogrrk.supabase.co",
    publishableKey: "sb_publishable_TJlM_EpTRgk7ycy32HK-5A_3CCecG0e",
    photoBucket: "listing-photos"
  }
};
