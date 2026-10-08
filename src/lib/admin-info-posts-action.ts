"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { createRestPost } from "@/lib/rest";
import { ADMIN_INFO_POSTS } from "@/lib/admin-info-posts";

export type PublishInfoPostsResult =
  | { error: string }
  | { published: number; skipped: number; failed: string[] };

// 운영자(관리자) 계정으로 [휴식]-정보 게시판에 준비된 글(docs/info-board-posts-20.md)을 게시한다.
// 관리자만 실행할 수 있고, 같은 제목의 글이 이미 있으면 건너뛰므로 여러 번 눌러도 중복되지 않는다.
// 글쓰기는 일반 게시와 똑같이 createRestPost(RLS 포함)를 거치므로 작성자는 지금 로그인한 관리자 본인이다.
export async function publishAdminInfoPosts(): Promise<PublishInfoPostsResult> {
  if (!(await isCurrentUserAdmin())) return { error: "관리자만 실행할 수 있습니다." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: existing } = await supabase
    .from("rest_posts")
    .select("title")
    .eq("user_id", user.id)
    .eq("category", "정보")
    .returns<{ title: string }[]>();
  const existingTitles = new Set((existing ?? []).map((p) => p.title));

  let published = 0;
  let skipped = 0;
  const failed: string[] = [];

  // 번호 순서대로(1번이 가장 먼저, 20번이 가장 최근) 차례로 올린다.
  for (const post of ADMIN_INFO_POSTS) {
    if (existingTitles.has(post.title)) {
      skipped++;
      continue;
    }
    const result = await createRestPost(post.title, post.html, "정보", null, post.infoCategory);
    if ("error" in result) failed.push(`${post.no}번: ${result.error}`);
    else published++;
  }

  revalidatePath("/rest");
  return { published, skipped, failed };
}
