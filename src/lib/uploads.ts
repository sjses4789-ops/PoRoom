"use server";

import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type UploadImageResult = { error: string } | { url: string };

// 게시글 서식 에디터(정보 게시판 등)에서 그림을 삽입할 때 쓴다. 업로드한
// 사용자의 uid 폴더 아래에만 쓸 수 있도록 RLS(0058_post_images_storage)로
// 강제되어 있어, 여기서는 형식/용량만 한 번 더 확인한다.
export async function uploadPostImage(formData: FormData): Promise<UploadImageResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "이미지 파일을 선택해주세요." };
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return { error: "PNG, JPG, WEBP, GIF 이미지만 업로드할 수 있어요." };
  if (file.size > MAX_BYTES) return { error: "이미지 용량은 5MB 이하여야 해요." };

  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("post-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { error: error.message };

  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  return { url: data.publicUrl };
}
