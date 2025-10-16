/**
 * Vercel Edge Middleware for Basic Authentication
 * This protects all pages with username/password
 */

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/health (for health checks)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default function middleware(req) {
  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  // Get credentials from environment variables
  const expectedUsername = process.env.AUTH_USERNAME || 'admin';
  const expectedPassword = process.env.AUTH_PASSWORD || 'changeme';

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (user === expectedUsername && pwd === expectedPassword) {
      return Response.next();
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

