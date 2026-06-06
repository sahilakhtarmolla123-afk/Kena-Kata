// Safe api helper supporting Android APK WebView and standalone client-side API routing.
const originalFetch = window.fetch;

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = '';
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input && typeof input === 'object' && 'url' in input) {
    url = (input as any).url;
  }

  // Cache current live environment domain if running on real web server
  if (typeof window !== 'undefined' && window.location.origin && window.location.origin.includes('run.app')) {
    try {
      localStorage.setItem('last_web_origin', window.location.origin);
    } catch (e) {
      // localStorage might be unavailable in some sandboxed webviews
    }
  }

  if (url.startsWith('/api/')) {
    const isLocalWebDev = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '3000';
    const isLocalhostIP = typeof window !== 'undefined' && window.location.hostname === '127.0.0.1' && window.location.port === '3000';
    
    // If we are NOT in local dev environment (e.g. running inside an Android WebView or capacitor or offline file scheme)
    if (!isLocalWebDev && !isLocalhostIP) {
      // Resolve host: fallback to custom or known active preview URL
      let backendDomain = 'https://ais-dev-gcapm3shyaooil6h2wbd3l-103906586141.asia-southeast1.run.app';
      try {
        const customUrl = localStorage.getItem('custom_backend_url');
        if (customUrl && customUrl.startsWith('http')) {
          backendDomain = customUrl;
        } else {
          const cached = localStorage.getItem('last_web_origin');
          if (cached && cached.includes('run.app')) {
            backendDomain = cached;
          }
        }
      } catch (e) {}

      // Clean trailing slash
      if (backendDomain.endsWith('/')) {
        backendDomain = backendDomain.slice(0, -1);
      }

      const absoluteUrl = `${backendDomain}${url}`;
      
      if (typeof input === 'string') {
        input = absoluteUrl;
      } else if (input instanceof URL) {
        input = new URL(absoluteUrl);
      } else if (input && typeof input === 'object') {
        const newRequest = new Request(absoluteUrl, input as RequestInit);
        return originalFetch(newRequest, init);
      }
    }
  }
  return originalFetch(input, init);
}
