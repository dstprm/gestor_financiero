export function inviteEmail(inviterName: string, orgName: string, inviteUrl: string) {
  return `<h2>You've been invited to join ${orgName} on SimplyOrg</h2>
<p>${inviterName} has invited you to collaborate on their org chart.</p>
<a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Accept Invitation</a>
<p>This link expires in 7 days.</p>`
}

export function inviteAcceptedEmail(newMemberName: string, memberEmail: string, orgName: string) {
  return `<p>👋 <strong>${newMemberName}</strong> (${memberEmail}) just joined <strong>${orgName}</strong> on simplyorg.</p>`
}

export async function sendInviteAcceptedEmail(
  ownerEmail: string,
  memberName: string,
  memberEmail: string,
  orgName: string
) {
  return sendEmail({
    to: ownerEmail,
    subject: `${memberName} has joined your org chart`,
    html: inviteAcceptedEmail(memberName, memberEmail, orgName),
  })
}

export function trialExpiringEmail(userName: string, daysLeft: number) {
  return `<p>Your simplyorg trial ends in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>. Upgrade to keep access.</p>
<p><a href="https://simplyorg.app/settings/billing" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Upgrade now</a></p>`
}

export async function sendTrialExpiringEmail(
  userEmail: string,
  userName: string,
  daysLeft: number
) {
  return sendEmail({
    to: userEmail,
    subject: `Your simplyorg trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — upgrade to keep access`,
    html: trialExpiringEmail(userName, daysLeft),
  })
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  // If Resend is configured, use it
  if (process.env.RESEND_API_KEY) {
    const from = process.env.EMAIL_FROM ?? 'SimplyOrg <noreply@simplyorg.app>'
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Resend error: ${res.status} ${body}`)
    }
    return
  }

  // Development fallback: warn to console
  console.warn(`[EMAIL] No RESEND_API_KEY — email not sent. To: ${to}\nSubject: ${subject}\n---\n${html}\n---`)
}
