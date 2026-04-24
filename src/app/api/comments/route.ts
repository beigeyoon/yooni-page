import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForServer } from "@/lib/supabaseForServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sendCommentNotification } from "@/lib/email";
import { ExtendedSession } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const supabaseForServer = getSupabaseForServer();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (postId) {
      const { data, error } = await supabaseForServer
        .from("comment")
        .select("*")
        .eq("postId", postId)
        .order("createdAt", { ascending: true });
      if (error) {
        return NextResponse.json({ error: "댓글을 불러오는데 실패했습니다." }, { status: 500 });
      }
      return NextResponse.json({ data }, { status: 200 });
    } else {
      const { data, error } = await supabaseForServer
        .from("comment")
        .select("*")
        .order("createdAt", { ascending: true });
      if (error) {
        return NextResponse.json({ error: "댓글을 불러오는데 실패했습니다." }, { status: 500 });
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
    const extendedSession = session as ExtendedSession | null;
    const userId = extendedSession?.user?.id;
    const sessionUser = extendedSession?.user;
    if (!session || !userId || !sessionUser) {
      return NextResponse.json(
        { error: "❌ 인증된 사용자가 아닙니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const content =
      typeof body.content === "string" ? body.content.trim() : "";
    const postId = typeof body.postId === "string" ? body.postId : "";

    if (!postId || !content) {
      return NextResponse.json({ error: "댓글 내용과 게시글 정보가 필요합니다." }, { status: 400 });
    }
    const payload = {
      postId,
      userId,
      content,
      userName: sessionUser.name || "익명",
      userImage: sessionUser.image || null,
    };

    const { data, error } = await supabaseForServer
      .from("comment")
      .insert([payload]);

    if (error) {
      return NextResponse.json({ error: "댓글 작성에 실패했습니다." }, { status: 500 });
    }

    // 댓글 생성 성공 시 이메일 알림 발송
    try {
      const { data: postData, error: postError } = await supabaseForServer
        .from("post")
        .select("title, category")
        .eq("id", postId)
        .single();

      if (!postError && postData) {
        sendCommentNotification({
          postTitle: postData.title,
          postId: payload.postId,
          postCategory: postData.category,
          commenterName: sessionUser.name || sessionUser.email || "익명",
          commentContent: payload.content,
          commentDate: new Date().toLocaleString('ko-KR'),
        }).catch(error => {
          console.error('이메일 알림 발송 실패:', error);
        });
      }
    } catch (emailError) {
      console.error('이메일 알림 처리 중 오류:', emailError);
    }

    return NextResponse.json(
      { message: "✅ Comment created successfully", data },
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
    const userId = (session as ExtendedSession | null)?.user?.id;
    if (!session || !userId) {
      return NextResponse.json(
        { error: "❌ 인증된 사용자가 아닙니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, content } = body;

    if (!id) {
      return NextResponse.json({ error: "댓글 id가 필요합니다." }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
    }

    const { data: comment, error: fetchError } = await supabaseForServer
      .from("comment")
      .select("userId")
      .eq("id", id)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: "❌ 본인 댓글만 수정할 수 있습니다." },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseForServer
      .from("comment")
      .update({ content: content.trim() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "댓글 수정에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json(
      { message: "✅ Comment updated successfully", data },
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
    const userId = (session as ExtendedSession | null)?.user?.id;
    if (!session || !userId) {
      return NextResponse.json(
        { error: "❌ 인증된 사용자가 아닙니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("id");

    if (!commentId) {
      return NextResponse.json({ error: "댓글 id가 필요합니다." }, { status: 400 });
    }

    const { data: comment, error: fetchError } = await supabaseForServer
      .from("comment")
      .select("userId")
      .eq("id", commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: "❌ 본인 댓글만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseForServer
      .from("comment")
      .delete()
      .eq("id", commentId);

    if (error) {
      return NextResponse.json({ error: "댓글 삭제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json(
      { message: "✅ Comment deleted successfully", data },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
