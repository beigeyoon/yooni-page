import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForServer } from "@/lib/supabaseForServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const supabaseForServer = getSupabaseForServer();
    const { data, error } = await supabaseForServer
      .from('series')
      .select('*');

    if (error) {
      return NextResponse.json({ error: "시리즈를 불러오는데 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseForServer = getSupabaseForServer();
    const session = await getServerSession(authOptions);
    if (!session || session.user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "❌ 업로드 권한이 없습니다." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { data, error } = await supabaseForServer
      .from("series")
      .insert([{ ...body }]);

    if (error) {
      return NextResponse.json({ error: "시리즈 생성에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json(
      { message: "✅ Series created successfully", data },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
