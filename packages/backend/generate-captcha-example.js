#!/usr/bin/env node
/**
 * Generate a standalone HTML file with a CAPTCHA example
 * Run: node generate-captcha-example.js
 */

import { writeFileSync } from 'fs';

// Import dynamically to avoid ESM issues
async function generateExample() {
  const { default: CaptchaService } = await import('./app/services/captcha_service.js');
  
  const service = new CaptchaService();
  const captcha = await service.generate({ width: 600, height: 200, length: 6 });
  
  const base64 = captcha.image.replace('data:image/svg+xml;base64,', '');
  const svg = Buffer.from(base64, 'base64').toString('utf8');
  
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>نمونه کپچای اینفرنال - CAPTCHA Example</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Vazirmatn', 'Segoe UI', Tahoma, sans-serif;
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #ffffff;
    }
    .container {
      max-width: 800px;
      width: 100%;
      text-align: center;
    }
    h1 {
      font-size: 48px;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #00f5ff 0%, #ff006e 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0 0 20px rgba(0, 245, 255, 0.3));
    }
    .subtitle {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 40px;
    }
    .captcha-wrapper {
      background: rgba(255, 255, 255, 0.03);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px;
      margin-bottom: 30px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }
    .captcha-image {
      width: 100%;
      max-width: 600px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 245, 255, 0.2);
      margin-bottom: 20px;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      color: #00f5ff;
      letter-spacing: 8px;
      padding: 20px;
      background: rgba(0, 245, 255, 0.1);
      border-radius: 12px;
      border: 2px solid rgba(0, 245, 255, 0.3);
      font-family: 'Courier New', monospace;
    }
    .info {
      background: rgba(255, 190, 11, 0.1);
      border: 2px solid rgba(255, 190, 11, 0.3);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      text-align: right;
    }
    .info-title {
      font-size: 18px;
      font-weight: bold;
      color: #ffbe0b;
      margin-bottom: 12px;
    }
    .info-list {
      list-style: none;
      padding-right: 20px;
    }
    .info-list li {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.8;
      margin-bottom: 8px;
    }
    .info-list li:before {
      content: "✓ ";
      color: #00f5ff;
      font-weight: bold;
      margin-left: 8px;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 40px;
    }
    .feature {
      background: rgba(255, 255, 255, 0.05);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }
    .feature:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(0, 245, 255, 0.2);
      border-color: rgba(0, 245, 255, 0.3);
    }
    .feature-icon {
      font-size: 36px;
      margin-bottom: 10px;
    }
    .feature-title {
      font-size: 16px;
      font-weight: bold;
      color: #ffbe0b;
      margin-bottom: 8px;
    }
    .feature-desc {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.5;
    }
    @media (max-width: 768px) {
      h1 { font-size: 32px; }
      .captcha-wrapper { padding: 20px; }
      .code { font-size: 24px; letter-spacing: 4px; }
      .features { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 کپچای اینفرنال</h1>
    <p class="subtitle">Infernal CAPTCHA - Smart & Beautiful Verification System</p>
    
    <div class="captcha-wrapper">
      <div class="captcha-image">
        ${svg}
      </div>
      <div class="code">کد / Code: ${captcha.code}</div>
    </div>
    
    <div class="info">
      <div class="info-title">💡 نکات مهم برای وارد کردن کد</div>
      <ul class="info-list">
        <li>حروف کوچک و بزرگ فرقی ندارند (Case-insensitive)</li>
        <li>برخی حروف مشابه با هم یکسان هستند: 0=o, 1=i=l, 7=1, 2=z, 5=s, 8=b, 9=g</li>
        <li>مثال: اگر کد "O1BC" باشد، می‌توانید "0ibc" یا "olBC" بنویسید</li>
      </ul>
    </div>
    
    <div class="features">
      <div class="feature">
        <div class="feature-icon">🎨</div>
        <div class="feature-title">طراحی زیبا</div>
        <div class="feature-desc">رنگ‌های زنده و افکت‌های نورانی در حالت تاریک</div>
      </div>
      <div class="feature">
        <div class="feature-icon">📴</div>
        <div class="feature-title">کاملاً آفلاین</div>
        <div class="feature-desc">تولید شده در سمت سرور، بدون نیاز به سرویس خارجی</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🔤</div>
        <div class="feature-title">حساس نیست</div>
        <div class="feature-desc">بزرگی و کوچکی حروف مهم نیست</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🎯</div>
        <div class="feature-title">کیفیت HD</div>
        <div class="feature-desc">SVG با کیفیت بالا و قابل مقیاس</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🔀</div>
        <div class="feature-title">حروف مشابه</div>
        <div class="feature-desc">حروف و اعداد مشابه یکسان محسوب می‌شوند</div>
      </div>
      <div class="feature">
        <div class="feature-icon">⚡</div>
        <div class="feature-title">سریع</div>
        <div class="feature-desc">تولید در کمتر از 10 میلی‌ثانیه</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const outputPath = '/tmp/captcha-example.html';
  writeFileSync(outputPath, html, 'utf8');
  console.log(`✅ CAPTCHA example generated successfully!`);
  console.log(`📁 Saved to: ${outputPath}`);
  console.log(`🔐 Code: ${captcha.code}`);
  console.log(`\nOpen the file in your browser to see the beautiful CAPTCHA!`);
}

generateExample().catch(console.error);
