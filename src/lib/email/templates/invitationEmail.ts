/**
 * SADEEM — INVITATION EMAIL TEMPLATE
 * 
 * Premium branded, responsive HTML & plain-text email in Arabic with English fallback metadata.
 */

export interface InvitationEmailProps {
  memberName: string;
  jobTitle: string;
  teamNameAr: string;
  teamNameEn: string;
  invitationUrl: string;
  expiresInDays?: number;
}

export function renderInvitationEmailHtml(props: InvitationEmailProps): string {
  const { memberName, jobTitle, teamNameAr, invitationUrl, expiresInDays = 7 } = props;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>دعوة انضمام — سديم للتقنية والابتكار</title>
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
      border: 1px solid rgba(194, 142, 98, 0.25);
      border-radius: 16px;
      overflow: hidden;
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
      letter-spacing: 0.5px;
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
      line-height: 1.5;
    }
    .message {
      font-size: 15px;
      line-height: 1.7;
      color: #A0ABC0;
      margin-bottom: 24px;
    }
    .details-box {
      background-color: #0B1220;
      border: 1px solid rgba(82, 124, 145, 0.3);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 28px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }
    .detail-label {
      color: #527C91;
      font-weight: 600;
    }
    .detail-val {
      color: #F6F3EB;
      font-weight: 700;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 24px 0;
    }
    .cta-btn {
      display: inline-block;
      background-color: #C28E62;
      color: #0B1220 !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 36px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(194, 142, 98, 0.35);
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
        يسعدنا في شركة سديم للتقنية والابتكار أن نخبرك بأنه تمت دعوتك للانضمام إلى <strong>${teamNameAr}</strong>.
        <br><br>
        نتطلع إلى أن تكون جزءاً من فريق يعمل على تحويل الأفكار الواعدة إلى منتجات وأنظمة رقمية حقيقية.
      </div>

      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">المسمى الوظيفي:</span>
          <span class="detail-val">${jobTitle}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">الفريق المستهدف:</span>
          <span class="detail-val">${teamNameAr}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">صلاحية الدعوة:</span>
          <span class="detail-val">${expiresInDays} أيام</span>
        </div>
      </div>

      <div class="cta-container">
        <a href="${invitationUrl}" class="cta-btn" target="_blank" rel="noopener noreferrer">
          تأكيد رغبتي بالانضمام
        </a>
      </div>

      <div class="notice">
        إذا لم تكن هذه الدعوة موجهة إليك، يمكنك تجاهل هذه الرسالة بأمان دون اتخاذ أي إجراء.
        <br>
        مع تحيات،<br>
        <strong>فريق سديم للتقنية والابتكار</strong>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function renderInvitationEmailText(props: InvitationEmailProps): string {
  return `مرحباً ${props.memberName}،

يسعدنا في شركة سديم للتقنية والابتكار أن نخبرك بأنه تمت دعوتك للانضمام إلى ${props.teamNameAr}.

المسمى الوظيفي: ${props.jobTitle}
الفريق: ${props.teamNameAr}

للموافقة على الدعوة وتأكيد رغبتك بالانضمام، يرجى فتح الرابط التالي:
${props.invitationUrl}

ملاحظة: تنتهي صلاحية هذه الدعوة بعد ${props.expiresInDays ?? 7} أيام.
إذا لم تكن هذه الدعوة موجهة إليك، يمكنك تجاهل هذه الرسالة.

مع تحيات،
فريق سديم للتقنية والابتكار
`;
}
