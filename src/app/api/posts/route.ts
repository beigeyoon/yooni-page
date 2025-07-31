import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/lib/supabaseForServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("id");
  const category = searchParams.get("category");
  const seriesId = searchParams.get("seriesId");

  if (postId) {
    const { data, error } = await supabaseForServer
      .from("post")
      .select("*")
      .eq("id", postId)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data }, { status: 200 });
  } else {
    let query = supabaseForServer.from("post").select("*");
    if (category) {
      query = query.eq("category", category);
    }
    if (seriesId) {
      query = query.eq("seriesId", seriesId);
    }
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
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
};

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "❌ 인증된 사용자가 아닙니다." },
      { status: 401 }
    );
  };

  const body = await request.json();
  const { id, ...rest } = body;
  const { data, error } = await supabaseForServer
    .from("post")
    .update({ ...rest })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  };

  return NextResponse.json(
    { message: "✅ Post updated successfully", data },
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
  const postId = searchParams.get("id");

  const { data, error } = await supabaseForServer
    .from("post")
    .delete()
    .eq("id", postId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "✅ Comment deleted successfully", data },
    { status: 200 }
  );
}