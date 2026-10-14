// Passwortschutz (HTTP Basic Auth) für die gesamte Seite – kostenlos, läuft
// serverseitig bei Vercel. Passwort: Umgebungsvariable APP_PASSWORD.
// Benutzername: beliebig.
import { next } from '@vercel/edge';

export const config = { matcher: '/(.*)' };

export default function middleware(request) {
  const pw = process.env.APP_PASSWORD;
  if (!pw) {
    return new Response('APP_PASSWORD ist in Vercel nicht gesetzt.', { status: 503 });
  }
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      const given = decoded.slice(decoded.indexOf(':') + 1);
      if (given === pw) return next();
    } catch (e) { /* fällt auf 401 zurück */ }
  }
  return new Response('Passwort erforderlich', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="QS-Bautenstand", charset="UTF-8"' }
  });
}
