import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface CommentNotificationData {
  postTitle: string;
  postId: string;
  postCategory: string;
  commenterName: string;
  commentContent: string;
  commentDate: string;
}

export async function sendCommentNotification(data: CommentNotificationData) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'Yooni Blog <onboarding@resend.dev>',
      to: [process.env.ADMIN_EMAIL!],
      subject: `새 댓글이 작성되었습니다: ${data.postTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">
            새 댓글 알림
          </h2>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #555;">
              포스트: ${data.postTitle}
            </h3>
            <p style="margin: 0; color: #666;">
              <strong>작성자:</strong> ${data.commenterName}
            </p>
            <p style="margin: 5px 0 0 0; color: #666;">
              <strong>작성일:</strong> ${data.commentDate}
            </p>
          </div>
          
          <div style="background: white; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #333;">댓글 내용:</h4>
            <p style="margin: 0; line-height: 1.6; color: #333;">
              ${data.commentContent}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${data.postCategory}/${data.postId}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              포스트 보기
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>이 이메일은 자동으로 발송되었습니다.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('이메일 발송 실패:', error);
      return { success: false, error };
    }

    console.log('댓글 알림 이메일 발송 성공:', emailData);
    return { success: true, data: emailData };
  } catch (error) {
    console.error('이메일 발송 중 오류:', error);
    return { success: false, error };
  }
} 