const crypto = require('crypto');

export default async function handler(req, res) {
  // تفعيل الـ CORS للسماح لملف HTML بالاتصال بالدالة
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ valid: false, error: 'Missing initData' });
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // ترتيب المفاتيح والبيانات أبجدياً
    const params = Array.from(urlParams.entries())
      .map(([key, val]) => `${key}=${val}`)
      .sort()
      .join('\n');

    // جلب توكن البوت المخفي من إعدادات Vercel
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ valid: false, error: 'Server misconfiguration' });
    }

    // حساب الـ HMAC-SHA256
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(params).digest('hex');

    if (calculatedHash === hash) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(403).json({ valid: false, error: 'Invalid hash verification' });
    }
  } catch (error) {
    return res.status(500).json({ valid: false, error: error.message });
  }
}
