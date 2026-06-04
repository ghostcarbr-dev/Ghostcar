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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (provider, provider_id),
      UNIQUE (email)
    )
  `);
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
    const result = await pool.query(
      `
        INSERT INTO users (provider, provider_id, email, name, picture_url)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (provider, provider_id)
        DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          picture_url = EXCLUDED.picture_url,
          updated_at = NOW()
        RETURNING *
      `,
      ['google', profile.sub, profile.email, profile.name || null, profile.picture || null],
    );
    const user = result.rows[0];
    const sessionToken = createSignedToken({
      email: user.email,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
      userId: user.id,
    });

    response.cookie('ghostcar_session', sessionToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
      sameSite: 'none',
      secure: true,
    });

    return response.redirect(`${stateValue.returnTo || webOrigin}?auth=google-ok`);
  } catch (error) {
    return next(error);
  }
});

app.get('/auth/me', async (request, response, next) => {
  const cookies = parseCookies(request.headers.cookie);
  const session = verifySignedToken(cookies.ghostcar_session);

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
