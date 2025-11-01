require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());

const port = process.env.PORT;
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB;
const mongoCollectionName = process.env.MONGODB_COLLECTION;
const mongoUsername = process.env.MONGODB_USERNAME;
const mongoPassword = process.env.MONGODB_PASSWORD;

let cachedClient;
let cachedCollection;

const ensureMongoConnection = async () => {
  if (cachedCollection) {
    return cachedCollection;
  }

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  if ((mongoUsername && !mongoPassword) || (!mongoUsername && mongoPassword)) {
    throw new Error(
      'Both MONGODB_USERNAME and MONGODB_PASSWORD must be provided together'
    );
  }

  const clientOptions = {
    ignoreUndefined: true,
  };

  if (mongoUsername && mongoPassword) {
    clientOptions.auth = {
      username: mongoUsername,
      password: mongoPassword,
    };
  }

  cachedClient = new MongoClient(mongoUri, clientOptions);

  await cachedClient.connect();
  const db = cachedClient.db(mongoDbName);
  cachedCollection = db.collection(mongoCollectionName);
  return cachedCollection;
};

app.get('/items', async (_req, res) => {
  try {
    const collection = await ensureMongoConnection();
    const items = await collection
      .find({}, { projection: { _id: 0, code: 1, description: 1 } })
      .toArray();
    res.json(items);
  } catch (error) {
    console.error('Failed to fetch items:', error);
    res.status(500).json({ error: 'Unable to fetch items right now' });
  }
});

app.post('/items', async (req, res) => {
  const { code, description } = req.body || {};

  if (!code || !description) {
    return res
      .status(400)
      .json({ error: 'Both code and description must be provided' });
  }

  try {
    const payload = {
      code: String(code).trim(),
      description: String(description).trim(),
    };

    const collection = await ensureMongoConnection();
    await collection.insertOne(payload);

    res.status(201).json(payload);
  } catch (error) {
    console.error('Failed to insert item:', error);
    res.status(500).json({ error: 'Unable to insert item right now' });
  }
});

const startServer = async () => {
  try {
    await ensureMongoConnection();
    app.listen(port, () => {
      console.log(`Catalog service ready on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', async () => {
  if (cachedClient) {
    await cachedClient.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (cachedClient) {
    await cachedClient.close();
  }
  process.exit(0);
});
