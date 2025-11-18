const express = require('express');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;

const getPrimaryIp = () => {
  const interfaces = os.networkInterfaces();
  for (const infos of Object.values(interfaces)) {
    if (!infos) continue;
    for (const info of infos) {
      if (info.family === 'IPv4' && !info.internal) {
        return info.address;
      }
    }
  }
  return 'unknown';
};

app.get('/', (req, res) => {
  res.json({
    hostname: os.hostname(),
    ipAddress: getPrimaryIp(),
    platform: os.platform(),
    release: os.release(),
    uptimeSeconds: Math.round(os.uptime()),
    totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
    freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
  });
});

app.listen(port, () => {
  console.log(`Machine info service running on port ${port}`);
});
