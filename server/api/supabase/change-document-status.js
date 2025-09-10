export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { status, documentId, token } = body;

  const { error } = await supabase
    .from("documents")
    .update({
      status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("token", token);

  if (error) {
    console.error("Error from supabase api: ", error);
    return { error: "เปลี่ยนสถานะเอกสารไม่สำเร็จ" };
  }

  return { success: "เปลี่ยนสถานะเอกสารสำเร็จ" };
});
