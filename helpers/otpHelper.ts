import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

export async function waitForOTP(timeoutMs = 60000): Promise<string> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be set');
  }

  const config = {
    imap: {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASS,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 10000,
    },
  };

  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const connection = await imaps.connect(config);
    try {
      await connection.openBox('INBOX');

      const messages = await connection.search(['UNSEEN'], {
        bodies: [''],
        markSeen: true,
      });

      for (const msg of messages.reverse()) {
        const part = msg.parts.find((p) => p.which === '');
        if (!part) continue;
        const parsed = await simpleParser(part.body);
        const text = parsed.text || '';

        if (!/verification|otp/i.test(parsed.subject || '')) continue;

        const match = text.match(/\b\d{4,6}\b/);
        if (match) return match[0];
      }
    } finally {
      connection.end();
    }

    await new Promise((r) => setTimeout(r, 5000));
  }

  throw new Error('OTP email not received');
}
