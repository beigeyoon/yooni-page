import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/lib/supabaseForServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sendCommentNotification } from "@/lib/email";

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

  // 댓글 생성 성공 시 이메일 알림 발송
  try {
    // 포스트 정보 가져오기
    const { data: postData, error: postError } = await supabaseForServer
      .from("post")
      .select("title, category")
      .eq("id", body.postId)
      .single();

    if (!postError && postData) {
      // 이메일 알림 발송 (비동기로 처리하여 응답 지연 방지)
      sendCommentNotification({
        postTitle: postData.title,
        postId: body.postId,
        postCategory: postData.category,
        commenterName: session.user.name || session.user.email || "익명",
        commentContent: body.content,
        commentDate: new Date().toLocaleString('ko-KR'),
      }).catch(error => {
        console.error('이메일 알림 발송 실패:', error);
      });
    }
  } catch (emailError) {
    console.error('이메일 알림 처리 중 오류:', emailError);
    // 이메일 발송 실패해도 댓글 생성은 성공으로 처리
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