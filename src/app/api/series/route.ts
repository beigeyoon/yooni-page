import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  try {
    const series = await prisma.series.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ data: series });
  } catch (error) {
    console.error('시리즈 조회 에러:', error);
    return NextResponse.json({ error: '시리즈 조회 실패' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('시리즈 생성 - 세션:', session);
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 });
    }

    const body = await req.json();
    console.log('시리즈 생성 - 요청 데이터:', body);
    
    const { title, description, category } = body;
    
    if (!title) {
      return NextResponse.json({ error: '제목은 필수입니다' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: '카테고리는 필수입니다' }, { status: 400 });
    }

    console.log('시리즈 생성 데이터:', { title, description, category });

    console.log('Prisma create 호출 시작');
    const series = await (prisma as any).series.create({
      data: {
        title,
        description,
        category
      }
    });
    console.log('Prisma create 호출 완료:', series);

    console.log('시리즈 생성 성공:', series);

    return NextResponse.json({ data: series });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('시리즈 생성 실패:', errorMessage);
    return NextResponse.json({ 
      error: '시리즈 생성 실패',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '시리즈 ID가 필요합니다' }, { status: 400 });
    }

    const { title, description, category } = await req.json();
    
    if (!title) {
      return NextResponse.json({ error: '제목은 필수입니다' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: '카테고리는 필수입니다' }, { status: 400 });
    }

    const series = await (prisma as any).series.update({
      where: { id },
      data: {
        title,
        description,
        category
      }
    });

    return NextResponse.json({ data: series });
  } catch (error) {
    console.error('시리즈 수정 에러:', error);
    return NextResponse.json({ error: '시리즈 수정 실패' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '시리즈 ID가 필요합니다' }, { status: 400 });
    }

    await prisma.series.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('시리즈 삭제 에러:', error);
    return NextResponse.json({ error: '시리즈 삭제 실패' }, { status: 500 });
  }
} 