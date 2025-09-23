import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const config = useRuntimeConfig();

  const supabaseAdmin = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  );

  try {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      body.email,
      {
        data: body.userData,
        redirectTo: body.redirectTo,
      }
    );

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    });
  }
});
