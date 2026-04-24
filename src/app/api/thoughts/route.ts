import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAppSession, isAdminEmail } from '@/lib/auth';

export async function GET() {
  try {
    const data = await prisma.thought.findMany({
      orderBy: {
        createdAt: 'desc'
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

    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json(
        { error: '❌ 업로드 권한이 없습니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!content) {
      return NextResponse.json(
        { error: '생각 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    const data = await prisma.thought.create({
      data: {
        content
      }
    });

    return NextResponse.json(
      { message: '✅ Thought created successfully', data },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
