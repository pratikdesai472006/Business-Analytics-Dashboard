const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows DNS resolving _mongodb._tcp SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  // Ignore in environments where DNS modification is restricted
}

const DEFAULT_URI = "mongodb+srv://pratik:Pratik_123@cluster.p70tzy7.mongodb.net/business-analytics?retryWrites=true&w=majority";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDatabase() {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not configured.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log('MongoDB connected successfully (serverless instance cached)');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = connectDatabase;
