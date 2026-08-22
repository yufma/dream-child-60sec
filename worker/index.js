export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const assetPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const assetResponse = await env.ASSETS.fetch(new Request(new URL(assetPath, request.url), request));

    if (assetPath === '/index.html' && assetResponse.ok) {
      const headers = new Headers(assetResponse.headers);
      headers.set('content-type', 'text/html; charset=utf-8');
      return new Response((await assetResponse.text()).replaceAll('__SITE_ORIGIN__', url.origin), {
        status: assetResponse.status,
        headers,
      });
    }

    if (assetResponse.status !== 404 || assetPath.includes('.')) return assetResponse;

    const fallback = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    const headers = new Headers(fallback.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    return new Response((await fallback.text()).replaceAll('__SITE_ORIGIN__', url.origin), {
      status: fallback.status,
      headers,
    });
  },
};
