import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/lib/supabaseForServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const { data, error } = await supabaseForServer
    .from('series')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  console.log('series data:', NextResponse.json({ data }, { status: 200 }));
  return NextResponse.json({ data }, { status: 200 });
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return NextResponse.json(
      { error: "❌ 업로드 권한이 없습니다." },
      { status: 401 }
    );
  };

  const body = await request.json();
  
  const { data, error } = await supabaseForServer
    .from("series")
    .insert([{ ...body }]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  
    return NextResponse.json(
      { message: "✅ Comment created successfully", data },
      { status: 201 }
    );
};