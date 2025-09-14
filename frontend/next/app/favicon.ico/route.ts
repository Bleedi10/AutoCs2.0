// Serves a tiny PNG as favicon to avoid 404/500 on /favicon.ico
// This keeps things self-contained without adding binary files.

export const runtime = 'nodejs';

// 1x1 transparent PNG
const FAVICON_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/Pq9vWQAAAABJRU5ErkJggg==';

export async function GET() {
  const binary = Buffer.from(FAVICON_BASE64, 'base64');
  return new Response(binary, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

