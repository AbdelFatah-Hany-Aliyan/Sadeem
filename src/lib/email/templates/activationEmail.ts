/**
 * SADEEM — ACCOUNT ACTIVATION EMAIL TEMPLATE
 * 
 * Sent to an approved company member to initialize their dashboard login password.
 */

export interface ActivationEmailProps {
  memberName: string;
  activationUrl: string;
  expiresInHours?: number;
}

export function renderActivationEmailHtml(props: ActivationEmailProps): string {
  const { memberName, activationUrl, expiresInHours = 24 } = props;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تفعيل حسابك الإداري — سديم</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0B1220;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #F6F3EB;
      direction: rtl;
    }
    .wrapper {
      width: 100%;
      background-color: #0B1220;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .card {
      max-width: 580px;
      margin: 0 auto;
      background-color: #111A2E;
      border: 1px solid rgba(82, 124, 145, 0.3);
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .brand {
      text-align: center;
      margin-bottom: 28px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #C28E62;
      margin: 0;
    }
    .brand-sub {
      font-size: 13px;
      color: #527C91;
      margin-top: 4px;
      font-weight: 600;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #F6F3EB;
      margin-bottom: 16px;
    }
    .message {
      font-size: 15px;
      line-height: 1.7;
      color: #A0ABC0;
      margin-bottom: 24px;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 24px 0;
    }
    .cta-btn {
      display: inline-block;
      background-color: #527C91;
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 36px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(82, 124, 145, 0.35);
    }
    .notice {
      font-size: 12px;
      color: #718096;
      text-align: center;
      line-height: 1.6;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 20px;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="brand">
        <h1 class="brand-title">سـديـم</h1>
        <div class="brand-sub">Sadeem — Technology & Innovation</div>
      </div>

      <div class="greeting">مرحباً ${memberName}،</div>

      <div class="message">
        تمت الموافقة على انضمامك واعتماد حسابك الداخلي في منصة سديم.
        <br><br>
        لإكمال إعداد حسابك وتعيين كلمة المرور الخاصة بك، يرجى الضغط على الزر التالي. هذا الرابط مخصص للاستخدام لمرة واحدة فقط وصالح لمدة <strong>${expiresInHours} ساعة</strong>.
      </div>

      <div class="cta-container">
        <a href="${activationUrl}" class="cta-btn" target="_blank" rel="noopener noreferrer">
          تعيين كلمة المرور وتفعيل الحساب
        </a>
      </div>

      <div class="notice">
        إذا لم تطلب هذا الحساب أو لديك أي استفسار، يرجى التواصل مع إدارة سديم.
        <br><br>
        مع تحيات،<br>
        <strong>فريق سديم للتقنية والابتكار</strong>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function renderActivationEmailText(props: ActivationEmailProps): string {
  return `مرحباً ${props.memberName}،

تمت الموافقة على انضمامك واعتماد حسابك الداخلي في منصة سديم.

لتعيين كلمة المرور وتفعيل حسابك، يرجى فتح الرابط التالي:
${props.activationUrl}

ملاحظة: هذا الرابط مخصص للاستخدام لمرة واحدة وصالح لمدة ${props.expiresInHours ?? 24} ساعة.

مع تحيات،
فريق سديم للتقنية والابتكار
`;
}
