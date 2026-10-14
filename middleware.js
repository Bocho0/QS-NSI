// Passwortschutz mit eigener Anmeldeseite (läuft serverseitig bei Vercel, kostenlos).
// Umgebungsvariablen in Vercel:
//   APP_PASSWORD  (Pflicht)  Passwort
//   APP_USER      (optional) Benutzername; ohne Angabe wird jeder Name akzeptiert
// Die Anmeldung gilt, bis der Browser geschlossen wird (Sitzungs-Cookie).
import { next } from '@vercel/edge';

export const config = { matcher: '/(.*)' };

const COOKIE = 'qs_auth';
const LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEUAAABFCAMAAAArU9sbAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAGnUExURf////7+/tvb25mZmZGRkY+Pj5ycnOjo6KysrJCQkMvLy/39/ZeXl0REREVFRTk5OcXFxcDAwFFRUUFBQWFhYczMzI6OjkZGRjs7O7u7u8HBwVJSUkJCQmBgYEdHR0lJSUhISF9fX4mJiYyMjIqKiouLi1xcXI2NjXV1dYODgz8/P/n5+cLCwjw8PPj4+IGBgT4+Pjo6OvX19b+/v/v7+4WFhUpKSr29va+vr9XV1e/v79zc3N7e3vPz80NDQ9bW1qmpqZ6enjMzMzIyMra2tqKiorq6uqGhoaioqFNTU05OTvz8/Kenp62trWdnZ66uroKCgoSEhIeHh/f39/b29vDw8H5+fmhoaJ+fnz09Pbm5ucrKypaWljQ0NMfHx0tLS/T09Ly8vDc3N2NjY9PT09HR0eTk5Onp6dnZ2YiIiLCwsPHx8e7u7uzs7MjIyICAgN/f339/f3t7e6SkpJKSksPDw8/Pz7e3t0BAQGpqaqqqqqWlpfLy8ri4uPr6+mVlZZubm5iYmJWVlX19fU1NTV5eXllZWdjY2Orq6uHh4ZqampOTk76+vrsXhk4AAAAJcEhZcwAAFxEAABcRAcom8z8AAANnSURBVFhH3ZjpV1JBFMDvCzD1BWoYICIPASMhFU1xKyst06i0tAVbUCvN1GxfbLOibPujOzODvJnLvIX0Q6efXzhzr78zc99s7wGAYgZQcKsAzdjncBriqtpPJdU4oFPjrFUA1ANujzF19cTScNAkx9t4CED1efzGBJpIh4PNJjmhltq9tYS1csLIguOapkUES7jVFY3Fi39tlFj8sFuweOIJTM2REG/R2tgT5VHak4IllMIZAEc7rCydXWm/v5uz9OAMgGOiJYrjAL19oUwm2b9by0BfPN4+SH7atGRiOC5g0yLrC4ddi6S6HHYtdvoiedJB0RLfaVeGho9zDJ+gycQycpIPME6l5dVNnR5Nc4yd0VdAkg8wvGH5iFJnO/ilFhivYDXq1d2VRe/LuW53EfKfvGWnnYM0y6qbmtCaKZPNGY9oYe08k+fJs5NUNzt4oZpyceJSSLC4iwGOqahXPiKOPrIz6JaQihMA6gPyEemkppHlr+auejldqeXKTA9i9uq1SvsSuX6jCuNoFKtrbfGP5MpIu8X5YsNihG1LzNQyRywNppbWmwDqrQAei07H7SCx3MkHcrm6eewAWBjL5Rbv3gOA+z6XAT5fLLZEkpcdvoQrKtmlHqzEfPGHq7hZQAF9uqqQFWJFlCzp6//J6pqEIcraPBt2Dw5zrNOqP5rekNBF2dh4TFKWfE9wXOfps3UA9XkO7+wco/S0f5E3yalreQmgJkzn7ivysOncNYLNXbvryAh+TaeTZdA1vUDqwiyvcUISnWqRN1ObiGq2e9PVyHbvtzhlc2BF2L0zbUoWoXZOkx1Tt4Te4ZQs9FvePLJ0331PqsssszgDoMHyLvWBngEV3Q4lJwmz6NW1YZGcJOw8mtNHZGmRjai3HVXX0iIbUbEvlVgkfWHndBP5xSySXU08p8MftxyYT40jQnXdn3GGY+uL8Dbh1wrlkNcWbr74cbxQKOTRWxZ+j/N4aDNXF1mKeJcyhLcYYNEXwuJ4qS5GKd6vpf0lks/ICH/b1i04yNDCNe92nnTXdynL670ly8gPHGUsk+u54azjYPNlBjdzGK4jDsO5W8JwHXHYtOxNX/4pi2Tf5bBr2XVfyPeXyApuFgiS7y9eM4uy/dP1y/kbNwsoU06XKyG513HoH5cMsUr5Ax5gj6pG+yeiAAAAAElFTkSuQmCC';

const enc = new TextEncoder();
async function token(user, pw) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('qs-auth|' + user));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
function readCookie(request, name) {
  const m = (request.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return m ? m[1] : '';
}

function page(error) {
  const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QS-Bautenstand – Anmeldung</title>
<link rel="icon" type="image/png" href="${LOGO}">
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#E8E7E3;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#1C1F22}
  .card{width:100%;max-width:380px;margin:16px;background:#fff;border-radius:14px;
    padding:36px 32px 32px;box-shadow:0 12px 40px rgba(28,31,34,.14);border-top:4px solid #A9925A;text-align:center}
  .card img{width:64px;height:64px;display:block;margin:0 auto 14px}
  h1{font-size:20px;margin:0 0 4px;letter-spacing:.02em}
  p{margin:0 0 24px;color:#6B6F73;font-size:14px}
  label{display:block;text-align:left;font-size:12px;font-weight:600;color:#6B6F73;
    text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px}
  input{width:100%;padding:12px 14px;margin:0 0 16px;font-size:15px;border:1px solid #CFCDC6;
    border-radius:8px;background:#fafaf8;outline:none}
  input:focus{border-color:#A9925A;box-shadow:0 0 0 3px rgba(169,146,90,.25);background:#fff}
  button{width:100%;padding:13px;font-size:15px;font-weight:600;color:#fff;background:#1C1F22;
    border:0;border-radius:8px;cursor:pointer;margin-top:4px}
  button:hover{background:#2c3135}
  .err{background:#f8e6e5;color:#B0413E;border-radius:8px;padding:10px 12px;font-size:13px;margin:0 0 16px}
</style></head><body>
<form class="card" method="post" action="/__login" autocomplete="on">
  <img src="${LOGO}" alt="">
  <h1>QS-Bautenstand</h1>
  <p>Bitte melde dich an</p>
  ${error ? '<div class="err">Benutzername oder Passwort ist falsch.</div>' : ''}
  <label for="u">Benutzername</label>
  <input id="u" name="user" type="text" autocomplete="username" required autofocus>
  <label for="p">Passwort</label>
  <input id="p" name="password" type="password" autocomplete="current-password" required>
  <button type="submit">Anmelden</button>
</form></body></html>`;
  return new Response(html, {
    status: error ? 401 : 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
  });
}

export default async function middleware(request) {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return new Response('APP_PASSWORD ist in Vercel nicht gesetzt.', { status: 503 });
  const wantUser = process.env.APP_USER || '';
  const url = new URL(request.url);

  // Anmeldung absenden
  if (url.pathname === '/__login' && request.method === 'POST') {
    let user = '', given = '';
    try {
      const f = await request.formData();
      user = String(f.get('user') || '').trim();
      given = String(f.get('password') || '');
    } catch (e) { /* leer */ }
    const userOk = !wantUser || user.toLowerCase() === wantUser.toLowerCase();
    if (userOk && same(given, pw)) {
      const t = await token(wantUser.toLowerCase(), pw);
      return new Response(null, {
        status: 303,
        headers: {
          location: '/',
          'set-cookie': `${COOKIE}=${t}; Path=/; HttpOnly; Secure; SameSite=Lax`,
          'cache-control': 'no-store'
        }
      });
    }
    return page(true);
  }

  // Bereits angemeldet?
  const c = readCookie(request, COOKIE);
  if (c && same(c, await token(wantUser.toLowerCase(), pw))) return next();

  return page(false);
}
