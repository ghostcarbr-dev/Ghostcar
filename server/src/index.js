const cors = require('cors');
const crypto = require('crypto');
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = Number(process.env.PORT) || 3000;
const apiPublicUrl = process.env.API_PUBLIC_URL || 'https://ghostcar-api.onrender.com';
const databaseUrl = process.env.DATABASE_URL;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const sessionSecret = process.env.SESSION_SECRET;
const webOrigin = process.env.WEB_ORIGIN || 'https://ghostcar.com.br';
const pendingWebSessions = new Map();

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

app.use(cors({
  credentials: true,
  origin: [webOrigin, 'https://www.ghostcar.com.br', 'http://localhost:8081', 'http://localhost:19006'],
}));
app.use(express.json({ limit: '1mb' }));
app.use((_request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  response.setHeader('X-Frame-Options', 'DENY');
  next();
});

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatCar(car) {
  return {
    id: car.id,
    ownerName: car.owner_name,
    title: car.title,
    category: car.category,
    dailyPrice: Number(car.daily_price),
    currency: car.currency,
    latitude: car.latitude,
    longitude: car.longitude,
    city: car.city,
    imageUrl: car.image_url,
    distanceKm: car.distance_km == null ? null : Number(car.distance_km),
    createdAt: car.created_at,
  };
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signPayload(payload) {
  return crypto
    .createHmac('sha256', sessionSecret || 'development-session-secret')
    .update(payload)
    .digest('base64url');
}

function createSignedToken(value) {
  const payload = base64UrlEncode(value);
  return `${payload}.${signPayload(payload)}`;
}

function verifySignedToken(token) {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [payload, signature] = token.split('.');
  const expectedSignature = signPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length
    || !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (value.exp && Date.now() > value.exp) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(valueParts.join('='));
    }

    return cookies;
  }, {});
}

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    pictureUrl: user.picture_url,
    provider: user.provider,
  };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto.scryptSync(password, salt, 64).toString('base64url');
  return `scrypt:${salt}:${hash}`;
}

function createSessionToken(user) {
  return createSignedToken({
    email: user.email,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    userId: user.id,
  });
}

function setSessionCookie(response, sessionToken) {
  response.cookie('ghostcar_session', sessionToken, {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
  });
}

function createPendingWebSession(sessionToken, user) {
  const code = crypto.randomBytes(32).toString('base64url');
  pendingWebSessions.set(code, {
    expiresAt: Date.now() + 2 * 60 * 1000,
    sessionToken,
    user: formatUser(user),
  });

  return code;
}

function consumePendingWebSession(code) {
  const session = pendingWebSessions.get(code);
  pendingWebSessions.delete(code);

  if (!session || Date.now() > session.expiresAt) {
    return null;
  }

  return session;
}

setInterval(() => {
  const now = Date.now();
  for (const [code, session] of pendingWebSessions.entries()) {
    if (now > session.expiresAt) {
      pendingWebSessions.delete(code);
    }
  }
}, 5 * 60 * 1000).unref?.();

function getSafeReturnTo(returnTo) {
  try {
    const url = new URL(returnTo || webOrigin);
    if (url.origin === webOrigin || url.origin === 'https://www.ghostcar.com.br') {
      return url.origin;
    }
  } catch {
    return webOrigin;
  }

  return webOrigin;
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cars (
      id SERIAL PRIMARY KEY,
      owner_name TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      daily_price NUMERIC(10, 2) NOT NULL CHECK (daily_price > 0),
      currency TEXT NOT NULL DEFAULT 'BRL',
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      city TEXT,
      image_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      picture_url TEXT,
      password_hash TEXT,
      country TEXT,
      cpf TEXT,
      birth_date TEXT,
      phone TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (provider, provider_id),
      UNIQUE (email)
    )
  `);

  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT');
}

app.get('/', (_request, response) => {
  response.json({ name: 'ghostcar-api', status: 'online' });
});

app.get('/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});

app.get('/auth/google', (request, response) => {
  if (!googleClientId || !googleClientSecret || !sessionSecret) {
    return response.status(500).json({ error: 'Google OAuth is not configured' });
  }

  const state = createSignedToken({
    exp: Date.now() + 10 * 60 * 1000,
    mode: request.query.mode === 'signup' ? 'signup' : 'login',
    nonce: crypto.randomBytes(16).toString('hex'),
    returnTo: getSafeReturnTo(request.query.returnTo),
  });
  const params = new URLSearchParams({
    access_type: 'offline',
    client_id: googleClientId,
    include_granted_scopes: 'true',
    prompt: 'select_account',
    redirect_uri: `${apiPublicUrl}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  });

  return response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

app.get('/auth/google/callback', async (request, response, next) => {
  const { code, state } = request.query;
  const stateValue = verifySignedToken(state);

  if (!code || !stateValue) {
    return response.redirect(`${webOrigin}?auth=google-error`);
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${apiPublicUrl}/auth/google/callback`,
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
    });

    if (!tokenResponse.ok) {
      throw new Error('Google token exchange failed');
    }

    const tokens = await tokenResponse.json();
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      throw new Error('Google profile request failed');
    }

    const profile = await profileResponse.json();

    if (!profile.email || !profile.sub) {
      throw new Error('Google profile is missing required account data');
    }

    const existingUserResult = await pool.query(
      'SELECT * FROM users WHERE (provider = $1 AND provider_id = $2) OR email = $3 LIMIT 1',
      ['google', profile.sub, profile.email],
    );

    let user;

    if (existingUserResult.rowCount > 0) {
      const updateResult = await pool.query(
        `
          UPDATE users
          SET
            provider = $1,
            provider_id = $2,
            email = $3,
            name = $4,
            picture_url = $5,
            updated_at = NOW()
          WHERE id = $6
          RETURNING *
        `,
        ['google', profile.sub, profile.email, profile.name || null, profile.picture || null, existingUserResult.rows[0].id],
      );
      user = updateResult.rows[0];
    } else {
      if (stateValue.mode !== 'signup') {
        return response.redirect(`${stateValue.returnTo || webOrigin}?auth=google-not-registered`);
      }

      const insertResult = await pool.query(
        `
          INSERT INTO users (provider, provider_id, email, name, picture_url)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
        ['google', profile.sub, profile.email, profile.name || null, profile.picture || null],
      );
      user = insertResult.rows[0];
    }

    const sessionToken = createSessionToken(user);
    setSessionCookie(response, sessionToken);

    const redirectUrl = new URL(stateValue.returnTo || webOrigin);
    redirectUrl.searchParams.set('auth', 'google-ok');
    redirectUrl.searchParams.set('sessionCode', createPendingWebSession(sessionToken, user));

    return response.redirect(redirectUrl.toString());
  } catch (error) {
    return next(error);
  }
});

app.post('/auth/session/exchange', (request, response) => {
  const { code } = request.body || {};
  const pendingSession = consumePendingWebSession(code);

  if (!pendingSession) {
    return response.status(400).json({ error: 'Invalid or expired session code' });
  }

  setSessionCookie(response, pendingSession.sessionToken);

  return response.json({
    sessionToken: pendingSession.sessionToken,
    user: pendingSession.user,
  });
});

app.post('/auth/register', async (request, response, next) => {
  const {
    birthDate,
    country,
    cpf,
    email,
    firstName,
    lastName,
    password,
    passwordConfirmation,
    phone,
  } = request.body || {};
  const normalizedEmail = normalizeEmail(email);
  const fullName = [firstName, lastName].map((value) => String(value || '').trim()).filter(Boolean).join(' ');

  if (!firstName || !lastName || !normalizedEmail || !password || !passwordConfirmation) {
    return response.status(400).json({ error: 'Required fields are missing' });
  }

  if (password !== passwordConfirmation) {
    return response.status(400).json({ error: 'Passwords do not match' });
  }

  if (String(password).length < 8) {
    return response.status(400).json({ error: 'Password must contain at least 8 characters' });
  }

  try {
    const existingUserResult = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [normalizedEmail]);
    if (existingUserResult.rowCount > 0) {
      return response.status(409).json({ error: 'Email is already registered' });
    }

    const result = await pool.query(
      `
        INSERT INTO users (
          provider,
          provider_id,
          email,
          name,
          password_hash,
          country,
          cpf,
          birth_date,
          phone
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [
        'email',
        normalizedEmail,
        normalizedEmail,
        fullName,
        hashPassword(String(password)),
        country || null,
        cpf || null,
        birthDate || null,
        phone || null,
      ],
    );
    const user = result.rows[0];
    const sessionToken = createSessionToken(user);

    setSessionCookie(response, sessionToken);
    return response.status(201).json({ sessionToken, user: formatUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.get('/auth/me', async (request, response, next) => {
  const cookies = parseCookies(request.headers.cookie);
  const bearerToken = request.headers.authorization?.startsWith('Bearer ')
    ? request.headers.authorization.slice('Bearer '.length)
    : null;
  const session = verifySignedToken(cookies.ghostcar_session || bearerToken);

  if (!session) {
    return response.status(401).json({ user: null });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [session.userId]);
    if (result.rowCount === 0) {
      return response.status(401).json({ user: null });
    }

    return response.json({ user: formatUser(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

app.post('/auth/logout', (_request, response) => {
  response.clearCookie('ghostcar_session', {
    path: '/',
    sameSite: 'none',
    secure: true,
  });
  response.status(204).send();
});

app.get('/cars', async (request, response, next) => {
  const latitude = parseNumber(request.query.lat);
  const longitude = parseNumber(request.query.lon);
  const radiusKm = parseNumber(request.query.radiusKm) ?? 50;

  if (latitude === null || longitude === null) {
    return response.status(400).json({ error: 'lat and lon query parameters are required' });
  }

  if (radiusKm <= 0 || radiusKm > 500) {
    return response.status(400).json({ error: 'radiusKm must be between 0 and 500' });
  }

  try {
    const result = await pool.query(
      `
        SELECT
          cars.*,
          (
            6371 * acos(
              LEAST(
                1,
                GREATEST(
                  -1,
                  cos(radians($1)) * cos(radians(latitude))
                  * cos(radians(longitude) - radians($2))
                  + sin(radians($1)) * sin(radians(latitude))
                )
              )
            )
          ) AS distance_km
        FROM cars
        WHERE (
          6371 * acos(
            LEAST(
              1,
              GREATEST(
                -1,
                cos(radians($1)) * cos(radians(latitude))
                * cos(radians(longitude) - radians($2))
                + sin(radians($1)) * sin(radians(latitude))
              )
            )
          )
        ) <= $3
        ORDER BY distance_km ASC, created_at DESC
        LIMIT 100
      `,
      [latitude, longitude, radiusKm],
    );

    return response.json({ cars: result.rows.map(formatCar) });
  } catch (error) {
    return next(error);
  }
});

app.post('/cars', async (request, response, next) => {
  const {
    ownerName,
    title,
    category,
    dailyPrice,
    currency = 'BRL',
    latitude,
    longitude,
    city = null,
    imageUrl = null,
  } = request.body;
  const parsedDailyPrice = parseNumber(dailyPrice);
  const parsedLatitude = parseNumber(latitude);
  const parsedLongitude = parseNumber(longitude);

  if (!ownerName || !title || !category) {
    return response.status(400).json({ error: 'ownerName, title and category are required' });
  }

  if (parsedDailyPrice === null || parsedDailyPrice <= 0) {
    return response.status(400).json({ error: 'dailyPrice must be greater than zero' });
  }

  if (
    parsedLatitude === null
    || parsedLatitude < -90
    || parsedLatitude > 90
    || parsedLongitude === null
    || parsedLongitude < -180
    || parsedLongitude > 180
  ) {
    return response.status(400).json({ error: 'valid latitude and longitude are required' });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO cars (
          owner_name,
          title,
          category,
          daily_price,
          currency,
          latitude,
          longitude,
          city,
          image_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [
        String(ownerName).trim(),
        String(title).trim(),
        String(category).trim(),
        parsedDailyPrice,
        String(currency).trim().toUpperCase(),
        parsedLatitude,
        parsedLongitude,
        city ? String(city).trim() : null,
        imageUrl ? String(imageUrl).trim() : null,
      ],
    );

    return response.status(201).json({ car: formatCar(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'internal server error' });
});

initializeDatabase()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Ghostcar API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Unable to initialize database', error);
    process.exitCode = 1;
  });
