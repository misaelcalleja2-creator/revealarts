const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://therealsumshady.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, firstName } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const name = firstName || 'there';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f7f6f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f6f2;">
  <tr>
    <td align="center" style="padding:40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;margin:0 auto;">

        <tr>
          <td align="center" style="padding-bottom:24px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="width:56px;height:56px;background:#0a0a0f;border-radius:28px;padding:0;" width="56" height="56">
                  <span style="color:#b8e030;font-size:7px;font-weight:800;line-height:1.4;display:block;text-align:center;padding:10px 6px 0 6px;">THE<br>REAL<br>SUM<br>SHADY</span>
                </td>
              </tr>
            </table>
            <br>
            <span style="font-size:18px;font-weight:800;color:#0a0a0f;letter-spacing:-0.3px;display:block;">Reveal Arts</span>
            <span style="font-size:12px;color:#888888;display:block;margin-top:2px;">by The Real Sum Shady</span>
          </td>
        </tr>

        <tr>
          <td>
            <div style="background:#ffffff;border-radius:16px;padding:32px;border:1px solid rgba(0,0,0,0.08);">
              <h2 style="font-size:22px;font-weight:800;color:#0a0a0f;margin:0 0 16px 0;">Hey ${name},</h2>
              <p style="font-size:15px;color:#555555;line-height:1.7;margin:0 0 16px 0;">Welcome to Reveal Arts. You just joined a growing group of teachers who decided math practice didn't have to feel like a punishment.</p>
              <p style="font-size:15px;color:#555555;line-height:1.7;margin:0 0 28px 0;">Head to your dashboard and create your first activity — it takes about 3 minutes. Pick an image your students will love, add your problems, and share the link. That's it.</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="https://therealsumshady.com/dashboard.html" style="display:inline-block;background:#0a0a0f;color:#b8e030;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:800;font-size:15px;letter-spacing:0.2px;">Go to your dashboard</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:14px;color:#888888;margin:0;line-height:1.6;">If you ever get stuck or have feedback, reply to this email. We read every one.</p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding-top:24px;" align="center">
            <p style="font-size:13px;color:#aaaaaa;margin:0;line-height:1.6;">— Misael &amp; Brittany<br>The Real Sum Shady</p>
            <p style="font-size:11px;color:#cccccc;margin-top:12px;">© The Real Sum Shady LLC · therealsumshady.com</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  try {
    const transporter = nodemailer.createTransport({
      host: 'mail.privateemail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'team@therealsumshady.com',
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: '"The Real Sum Shady" <team@therealsumshady.com>',
      to: email,
      subject: "You're in. Let's build something your students will actually want to do.",
      html
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Welcome email failed:', e.message);
    return res.status(500).json({ error: 'Email failed' });
  }
};
