import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForServer } from "@/lib/supabaseForServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

function isAdminEmail(email?: string | null) {
  return !!email && email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
}

function getPostPayload(body: Record<string, unknown>) {
  return {
    title: body.title,
    subtitle: body.subtitle,
    category: body.category,
    seriesId: body.seriesId,
    content: body.content,
    isPublished: body.isPublished,
    userId: body.userId,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabaseForServer = getSupabaseForServer();
    const session = await getServerSession(authOptions);
    const isAdmin = isAdminEmail(session?.user?.email);
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");
    const category = searchParams.get("category");
    const seriesId = searchParams.get("seriesId");
    const canPreviewUnpublished =
      searchParams.get("preview") === "true" && isAdmin;

    if (postId) {
      const { data, error } = await supabaseForServer
        .from("post")
        .select("*")
        .eq("id", postId)
        .single();
      if (error) {
        return NextResponse.json({ error: "게시글을 불러오는데 실패했습니다." }, { status: 500 });
      }
      if (!data?.isPublished && !canPreviewUnpublished) {
        return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
      }
      return NextResponse.json({ data }, { status: 200 });
    } else {
      let query = supabaseForServer.from("post").select("*");
      if (!canPreviewUnpublished) {
        query = query.eq("isPublished", true);
      }
      if (category) {
        query = query.eq("category", category);
      }
      if (seriesId) {
        query = query.eq("seriesId", seriesId);
      }
      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ error: "게시글 목록을 불러오는데 실패했습니다." }, { status: 500 });
      }
      return NextResponse.json({ data }, { status: 200 });
    }
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseForServer = getSupabaseForServer();
    const session = await getServerSession(authOptions);
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json(
        { error: "❌ 게시글 작성 권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const payload = getPostPayload(body);

    if (!payload.title || !payload.category || !payload.content || !payload.userId) {
      return NextResponse.json({ error: "필수 게시글 정보가 누락되었습니다." }, { status: 400 });
    }
    const { data, error } = await supabaseForServer
      .from("post")
      .insert([payload]);

    if (error) {
      return NextResponse.json({ error: "게시글 작성에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json(
      { message: "✅ Post created successfully", data },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabaseForServer = getSupabaseForServer();
    const session = await getServerSession(authOptions);
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json(
        { error: "❌ 게시글 수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body;
    const payload = getPostPayload(body);
    if (!id) {
      return NextResponse.json({ error: "게시글 id가 필요합니다." }, { status: 400 });
    }
    if (!payload.title || !payload.category || !payload.content || !payload.userId) {
      return NextResponse.json({ error: "필수 게시글 정보가 누락되었습니다." }, { status: 400 });
    }
    const { data, error } = await supabaseForServer
      .from("post")
      .update(payload)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "게시글 수정에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json(
      { message: "✅ Post updated successfully", data },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabaseForServer = getSupabaseForServer();
    const session = await getServerSession(authOptions);
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json(
        { error: "❌ 게시글 삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json({ error: "게시글 id가 필요합니다." }, { status: 400 });
    }

    const { data, error } = await supabaseForServer
      .from("post")
      .delete()
      .eq("id", postId);

    if (error) {
      return NextResponse.json({ error: "게시글 삭제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json(
      { message: "✅ Post deleted successfully", data },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
