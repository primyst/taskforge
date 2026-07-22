import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    await transporter.sendMail({
      from: `"TaskForge" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false };
  }
}

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

const wrapper = (bodyHtml: string) => `
  <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <p style="font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; color: #F5A623; margin-bottom: 16px;">
      TaskForge
    </p>
    ${bodyHtml}
    <p style="font-size: 12px; color: #8B93A7; margin-top: 32px;">
      You're receiving this because of activity on your TaskForge account.
    </p>
  </div>
`;

export async function sendTaskAssignedEmail({
  to,
  taskTitle,
  taskId,
  assignedByName,
}: {
  to: string;
  taskTitle: string;
  taskId: string;
  assignedByName: string;
}) {
  return sendEmail({
    to,
    subject: `You were assigned: ${taskTitle}`,
    html: wrapper(`
      <h2 style="font-size: 18px; margin-bottom: 12px;">New task assigned to you</h2>
      <p style="color: #333; line-height: 1.5;">
        ${assignedByName} assigned you a task: <strong>${taskTitle}</strong>
      </p>
      <a href="${APP_URL}/dashboard/tasks/${taskId}"
         style="display: inline-block; margin-top: 16px; background: #4F46E5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px;">
        View task
      </a>
    `),
  });
}

export async function sendCommentEmail({
  to,
  taskTitle,
  taskId,
  commenterName,
}: {
  to: string;
  taskTitle: string;
  taskId: string;
  commenterName: string;
}) {
  return sendEmail({
    to,
    subject: `New comment on: ${taskTitle}`,
    html: wrapper(`
      <h2 style="font-size: 18px; margin-bottom: 12px;">New comment</h2>
      <p style="color: #333; line-height: 1.5;">
        ${commenterName} commented on <strong>${taskTitle}</strong>
      </p>
      <a href="${APP_URL}/dashboard/tasks/${taskId}"
         style="display: inline-block; margin-top: 16px; background: #4F46E5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px;">
        View comment
      </a>
    `),
  });
}

export async function sendTeamInviteEmail({
  to,
  teamName,
  teamId,
  invitedByName,
}: {
  to: string;
  teamName: string;
  teamId: string;
  invitedByName: string;
}) {
  return sendEmail({
    to,
    subject: `You were added to ${teamName} on TaskForge`,
    html: wrapper(`
      <h2 style="font-size: 18px; margin-bottom: 12px;">You've joined a team</h2>
      <p style="color: #333; line-height: 1.5;">
        ${invitedByName} added you to <strong>${teamName}</strong> on TaskForge.
      </p>
      <a href="${APP_URL}/dashboard/teams/${teamId}"
         style="display: inline-block; margin-top: 16px; background: #4F46E5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px;">
        View team
      </a>
    `),
  });
}