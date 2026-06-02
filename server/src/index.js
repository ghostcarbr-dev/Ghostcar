const cors = require('cors');
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = Number(process.env.PORT) || 3000;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

app.use(cors());
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
