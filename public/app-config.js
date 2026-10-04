// Cloudflare uses same-origin API requests. The GitHub Pages build replaces this with its Worker origin.
window.APP_CONFIG = Object.freeze({ apiBaseUrl: '' });
