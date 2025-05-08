import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/lib/supabaseForServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (postId) {
    const { data, error } = await supabaseForServer
      .from("comment")
      .select("*")
      .eq("postId", postId)
      .order("createdAt", { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data }, { status: 200 });
  } else {
    const { data, error } = await supabaseForServer
      .from("comment")
      .select("*")
      .order("createdAt", { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data }, { status: 200 });
  }
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "❌ 인증된 사용자가 아닙니다." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const { data, error } = await supabaseForServer
    .from("comment")
    .insert([{ ...body }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "✅ Comment created successfully", data },
    { status: 201 }
  );
};

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "❌ 인증된 사용자가 아닙니다." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { id, content, userId } = body;
  const { data: comment, error: fetchError } = await supabaseForServer
    .from("comment")
    .select("userId")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (comment.userId !== userId) {
    return NextResponse.json(
      { error: "❌ 본인 댓글만 수정할 수 있습니다." },
      { status: 403 }
    );
  }

  const { data, error } = await supabaseForServer
    .from("comment")
    .update({ content })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "✅ Comment updated successfully", data },
    { status: 200 }
  );
};

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "❌ 인증된 사용자가 아닙니다." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get("id");

  const { data, error } = await supabaseForServer
    .from("comment")
    .delete()
    .eq("id", commentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "✅ Comment deleted successfully", data },
    { status: 200 }
  );
}