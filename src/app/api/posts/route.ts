import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/lib/supabaseForServer";
import { getServerSession } from "next-auth";
import { authOption } from "../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOption);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "❌ 인증된 사용자가 아닙니다." },
      { status: 401 }
    );
  };

  const body = await request.json();
  const { data, error } = await supabaseForServer
    .from("post")
    .insert([{ ...body }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  };

  return NextResponse.json(
    { message: "✅ Post created successfully", data },
    { status: 201 }
  );
}