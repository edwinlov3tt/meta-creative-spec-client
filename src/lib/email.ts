// Resend Email Service Integration
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendApprovalEmailParams {
  to: string;
  participantName: string;
  adName: string;
  advertiserName: string;
  approvalUrl: string;
  tier: number;
  expiresAt?: string;
  approvalRequestId?: number;
  participantId?: number;
  baseUrl?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send approval request email to participant
 */
export async function sendApprovalRequestEmail(
  params: SendApprovalEmailParams
): Promise<EmailResult> {
  try {
    const {
      to,
      participantName,
      adName,
      advertiserName,
      approvalUrl,
      tier,
      expiresAt,
      approvalRequestId,
      participantId,
      baseUrl,
    } = params;

    const tierName = tier === 1 ? 'Client' : tier === 2 ? 'Account Executive' : 'Digital Campaign Manager';

    const expirationText = expiresAt
      ? `This approval link expires on ${new Date(expiresAt).toLocaleDateString()}.`
      : '';

    // Generate tracking ID for this email
    const trackingId = approvalRequestId && participantId
      ? `${approvalRequestId}_${participantId}_${Date.now()}`
      : null;

    // Wrap approval URL with click tracking
    const trackedApprovalUrl = trackingId && baseUrl
      ? `${baseUrl}/api/approval/track/click/${trackingId}?url=${encodeURIComponent(approvalUrl)}`
      : approvalUrl;

    // Tracking pixel URL
    const trackingPixelUrl = trackingId && baseUrl
      ? `${baseUrl}/api/approval/track/open/${trackingId}`
      : null;

    const { data, error } = await resend.emails.send({
      from: 'Creative Approvals <creative@approval.edwinlovett.com>',
      to: [to],
      subject: `[Tier ${tier}] Approval Request: ${adName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Approval Request</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                    <!-- Header -->
                    <tr>
                      <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">
                          Creative Approval Request
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 32px;">
                        <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                          Hi ${participantName || 'there'},
                        </p>

                        <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;">
                          You've been invited to review and approve a creative for <strong>${advertiserName}</strong>.
                        </p>

                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #f9fafb; border-radius: 6px; padding: 16px;">
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Ad Name</strong>
                              <p style="margin: 4px 0 0; font-size: 15px; color: #111827;">${adName}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Your Role</strong>
                              <p style="margin: 4px 0 0; font-size: 15px; color: #111827;">
                                <span style="display: inline-block; padding: 4px 12px; background-color: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 13px; font-weight: 500;">
                                  Tier ${tier}: ${tierName}
                                </span>
                              </p>
                            </td>
                          </tr>
                        </table>

                        ${expirationText ? `<p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">${expirationText}</p>` : ''}

                        <!-- CTA Button -->
                        <table role="presentation" style="width: 100%; margin-bottom: 24px;">
                          <tr>
                            <td style="text-align: center;">
                              <a href="${trackedApprovalUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                Review Creative
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 0; font-size: 14px; line-height: 20px; color: #6b7280; text-align: center;">
                          Or copy this link:<br>
                          <a href="${trackedApprovalUrl}" style="color: #2563eb; word-break: break-all;">${approvalUrl}</a>
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; font-size: 12px; line-height: 18px; color: #6b7280; text-align: center;">
                          This is an automated email from Meta Creative Builder.<br>
                          Please do not reply to this email.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
            ${trackingPixelUrl ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:block;" alt="">` : ''}
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error: any) {
    console.error('Failed to send approval email:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Send approval status update email
 */
export async function sendApprovalStatusEmail(params: {
  to: string;
  adName: string;
  status: 'approved' | 'rejected' | 'tier_advanced';
  participantName?: string;
  newTier?: number;
}): Promise<EmailResult> {
  try {
    const { to, adName, status, newTier } = params;

    let subject = '';
    let statusText = '';
    let statusColor = '';

    switch (status) {
      case 'approved':
        subject = `Approved: ${adName}`;
        statusText = 'The creative has been fully approved and is ready to proceed.';
        statusColor = '#10b981';
        break;
      case 'rejected':
        subject = `Rejected: ${adName}`;
        statusText = 'The creative has been rejected and requires revision.';
        statusColor = '#ef4444';
        break;
      case 'tier_advanced':
        subject = `Tier ${newTier} Review: ${adName}`;
        statusText = `Tier ${(newTier || 1) - 1} approved. Now proceeding to Tier ${newTier} review.`;
        statusColor = '#3b82f6';
        break;
    }

    const { data, error } = await resend.emails.send({
      from: 'Creative Approvals <creative@approval.edwinlovett.com>',
      to: [to],
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Approval Status Update</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 32px; text-align: center;">
                        <div style="width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 50%; background-color: ${statusColor}; display: flex; align-items: center; justify-content: center;">
                          <span style="color: white; font-size: 32px;">✓</span>
                        </div>
                        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #111827;">
                          ${subject}
                        </h1>
                        <p style="margin: 0; font-size: 16px; line-height: 24px; color: #6b7280;">
                          ${statusText}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
                          Meta Creative Builder - Automated Notification
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error: any) {
    console.error('Failed to send status email:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}
