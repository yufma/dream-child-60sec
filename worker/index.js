export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const assetPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const assetResponse = await env.ASSETS.fetch(new Request(new URL(assetPath, request.url), request));

    if (assetResponse.status !== 404 || assetPath.includes('.')) return assetResponse;

    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  },
};
