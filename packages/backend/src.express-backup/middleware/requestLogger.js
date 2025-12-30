import useragent from 'useragent';

// Real-time request logging middleware with detailed info
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Extract request info
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
             req.headers['x-real-ip'] || 
             req.socket.remoteAddress || 
             req.connection.remoteAddress;
  
  const userAgentString = req.headers['user-agent'] || 'Unknown';
  const agent = useragent.parse(userAgentString);
  
  // Extract device and browser info
  const browserInfo = {
    browser: agent.toAgent(),
    os: agent.os.toString(),
    device: agent.device.toString(),
    family: agent.family,
    major: agent.major,
    minor: agent.minor,
  };
  
  // Log request start
  const timestamp = new Date().toISOString();
  console.log('\n┌─────────────────────────────────────────────────────────');
  console.log(`│ 📥 ${req.method} ${req.originalUrl || req.url}`);
  console.log(`│ 🕐 ${timestamp}`);
  console.log(`│ 🌐 IP: ${ip}`);
  console.log(`│ 🖥️  Browser: ${browserInfo.browser}`);
  console.log(`│ 💻 OS: ${browserInfo.os}`);
  console.log(`│ 📱 Device: ${browserInfo.device}`);
  
  // Log headers if not production
  if (process.env.NODE_ENV !== 'production') {
    console.log(`│ 🔑 Host: ${req.headers.host || 'N/A'}`);
    console.log(`│ 🔗 Origin: ${req.headers.origin || 'N/A'}`);
    console.log(`│ 📨 Referer: ${req.headers.referer || 'N/A'}`);
  }
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 500 ? '🔴' : 
                       res.statusCode >= 400 ? '🟡' : 
                       res.statusCode >= 300 ? '🔵' : '🟢';
    
    console.log(`│ ${statusColor} Status: ${res.statusCode}`);
    console.log(`│ ⏱️  Duration: ${duration}ms`);
    console.log('└─────────────────────────────────────────────────────────\n');
    
    return originalSend.call(this, data);
  };
  
  next();
}
