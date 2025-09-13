const https = require('https');

class KeepAliveService {
  constructor(url, interval = 14 * 60 * 1000) { // 14 minutes
    this.url = url;
    this.interval = interval;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;

    console.log(`🚀 Keep-alive service started for ${this.url}`);
    this.isRunning = true;

    // Ping immediately
    this.ping();

    // Set recurring ping
    this.timer = setInterval(() => {
      this.ping();
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('⏹️ Keep-alive service stopped');
  }

  ping() {
    const startTime = Date.now();

    https.get(this.url, (res) => {
      const duration = Date.now() - startTime;
      console.log(`✅ Keep-alive ping successful - ${duration}ms - Status: ${res.statusCode}`);
    }).on('error', (err) => {
      const duration = Date.now() - startTime;
      console.error(`❌ Keep-alive ping failed - ${duration}ms - Error:`, err.message);
    });
  }
}

// Auto-start if URL provided
if (process.env.KEEP_ALIVE_URL) {
  const keepAlive = new KeepAliveService(process.env.KEEP_ALIVE_URL);

  // Only run in production
  if (process.env.NODE_ENV === 'production') {
    keepAlive.start();

    // Graceful shutdown
    process.on('SIGINT', () => keepAlive.stop());
    process.on('SIGTERM', () => keepAlive.stop());
  }
}

module.exports = KeepAliveService;