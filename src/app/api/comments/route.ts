import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAppSession, isAdminEmail } from '@/lib/auth';
import { sendCommentNotification } from '@/lib/email';

const COMMENT_POST_LIMIT = 10;
const COMMENT_WINDOW_MS = 10 * 60 * 1000;

function getRateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds)
      }
    }
  );
}

async function checkCommentPostRateLimit(userId: string) {
  const now = Date.now();
  const windowStart = new Date(now - COMMENT_WINDOW_MS);
  const recentComments = await prisma.comment.findMany({
    where: {
      userId,
      createdAt: {
        gte: windowStart
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      createdAt: true
    },
    take: COMMENT_POST_LIMIT
  });

  if (recentComments.length < COMMENT_POST_LIMIT) {
    return {
      ok: true,
      retryAfterSeconds: 0
    };
  }

  const oldestLimitedComment = recentComments[recentComments.length - 1];
  const retryAt = oldestLimitedComment.createdAt.getTime() + COMMENT_WINDOW_MS;

  return {
    ok: false,
    retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1000))
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAppSession();
    const isAdmin = isAdminEmail(session?.user?.email);
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: '댓글 정보를 불러올 수 없습니다.' },
          { status: 400 }
        );
      }

      const data = await prisma.comment.findMany({
        orderBy: {
          createdAt: 'asc'
        }
      });

      return NextResponse.json({ data }, { status: 200 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        isPublished: true
      }
    });

    if (!post || (!post.isPublished && !isAdmin)) {
      return NextResponse.json(
        { error: '댓글을 불러오는데 실패했습니다.' },
        { status: 404 }
      );
    }

    const data = await prisma.comment.findMany({
      where: { postId },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAppSession();
    const userId = session?.user?.id;
    const sessionUser = session?.user;

    if (!session || !userId || !sessionUser) {
      return NextResponse.json(
        { error: '❌ 인증된 사용자가 아닙니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const postId = typeof body.postId === 'string' ? body.postId : '';

    if (!postId || !content) {
      return NextResponse.json(
        { error: '댓글 내용과 게시글 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        title: true,
        category: true,
        isPublished: true
      }
    });

    if (!post || !post.isPublished) {
      return NextResponse.json(
        { error: '댓글을 작성할 수 없는 게시글입니다.' },
        { status: 404 }
      );
    }

    const rateLimit = await checkCommentPostRateLimit(userId);

    if (!rateLimit.ok) {
      return getRateLimitResponse(rateLimit.retryAfterSeconds);
    }

    const data = await prisma.comment.create({
      data: {
        postId,
        userId,
        content,
        userName: sessionUser.name || '익명',
        userImage: sessionUser.image || null
      }
    });

    sendCommentNotification({
      postTitle: post.title,
      postId,
      postCategory: post.category,
      commenterName: sessionUser.name || sessionUser.email || '익명',
      commentContent: content,
      commentDate: new Date().toLocaleString('ko-KR')
    }).catch(error => {
      console.error('이메일 알림 발송 실패:', error);
    });

    return NextResponse.json(
      { message: '✅ Comment created successfully', data },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAppSession();
    const userId = session?.user?.id;

    if (!session || !userId) {
      return NextResponse.json(
        { error: '❌ 인증된 사용자가 아닙니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!id) {
      return NextResponse.json(
        { error: '댓글 id가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: {
        userId: true
      }
    });

    if (!comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: '❌ 본인 댓글만 수정할 수 있습니다.' },
        { status: 403 }
      );
    }

    const data = await prisma.comment.update({
      where: { id },
      data: {
        content
      }
    });

    return NextResponse.json(
      { message: '✅ Comment updated successfully', data },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAppSession();
    const userId = session?.user?.id;

    if (!session || !userId) {
      return NextResponse.json(
        { error: '❌ 인증된 사용자가 아닙니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { error: '댓글 id가 필요합니다.' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        userId: true
      }
    });

    if (!comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const isAdmin = isAdminEmail(session.user?.email);
    if (comment.userId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: '❌ 본인 댓글만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    const data = await prisma.comment.delete({
      where: { id: commentId }
    });

    return NextResponse.json(
      { message: '✅ Comment deleted successfully', data },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
