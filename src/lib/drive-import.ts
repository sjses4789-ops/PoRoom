"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ImportedWork = { id: string; title: string };

export type ImportWorksResult =
  | { ok: true; imported: ImportedWork[]; skipped: string[] }
  | { ok: false; reason: "not-pomowriter" | "no-drive-access" | "error"; message?: string };

const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const FOLDER_MIME = "application/vnd.google-apps.folder";

async function driveList(token: string, query: string) {
  const url = new URL(DRIVE_FILES_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("fields", "files(id,name)");
  url.searchParams.set("pageSize", "200");
  url.searchParams.set("spaces", "drive");
  return fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}

// PomoWriter 사용자의 구글 드라이브 "PomoWriter Projects" 폴더 하위의
// 폴더명들을 그대로 작품 목록으로 가져온다. 구글 로그인 시 드라이브
// 읽기 권한(scope)이 함께 부여돼 있어야 동작한다 — 권한이 없으면
// "no-drive-access"로 구분해서 반환한다(폴더 자체가 없는 "PomoWriter
// 미사용자"와는 다른 상황이므로 사용자에게 다른 안내를 보여줄 수 있게).
export async function importWorksFromDrive(): Promise<ImportWorksResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return { ok: false, reason: "error", message: "로그인이 필요합니다." };

  const token = session.provider_token;
  if (!token) {
    return { ok: false, reason: "no-drive-access" };
  }

  const rootRes = await driveList(
    token,
    `name = 'PomoWriter Projects' and mimeType = '${FOLDER_MIME}' and trashed = false`
  );

  if (rootRes.status === 401 || rootRes.status === 403) {
    return { ok: false, reason: "no-drive-access" };
  }
  if (!rootRes.ok) {
    return { ok: false, reason: "error", message: `Drive API 오류 (${rootRes.status})` };
  }

  const rootData = (await rootRes.json()) as { files?: { id: string; name: string }[] };
  const rootFolder = rootData.files?.[0];
  if (!rootFolder) {
    return { ok: false, reason: "not-pomowriter" };
  }

  const childRes = await driveList(
    token,
    `'${rootFolder.id}' in parents and mimeType = '${FOLDER_MIME}' and trashed = false`
  );
  if (!childRes.ok) {
    return { ok: false, reason: "error", message: `Drive API 오류 (${childRes.status})` };
  }
  const childData = (await childRes.json()) as { files?: { id: string; name: string }[] };
  const folderNames = (childData.files ?? []).map((f) => f.name).filter(Boolean);

  if (folderNames.length === 0) {
    return { ok: true, imported: [], skipped: [] };
  }

  const { data: existingWorks } = await supabase
    .from("works")
    .select("title")
    .eq("user_id", user.id);
  const existingTitles = new Set((existingWorks ?? []).map((w) => w.title));

  const toInsert = folderNames.filter((name) => !existingTitles.has(name));
  const skipped = folderNames.filter((name) => existingTitles.has(name));

  let imported: ImportedWork[] = [];
  if (toInsert.length > 0) {
    const { data } = await supabase
      .from("works")
      .insert(toInsert.map((title) => ({ user_id: user.id, title })))
      .select("id,title");
    imported = data ?? [];
  }

  revalidatePath("/me");
  return { ok: true, imported, skipped };
}
