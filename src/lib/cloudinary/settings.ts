import "server-only";

import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  getCloudinaryAccount,
  listCloudinaryAccountsPublic,
  resolveConfiguredDefaultAccountId,
  type CloudinaryAccountPublic,
} from "@/lib/cloudinary/accounts";

const DEFAULT_ACCOUNT_KEY = "cloudinary_default_account";

export async function getDefaultCloudinaryAccountId(): Promise<string> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", DEFAULT_ACCOUNT_KEY)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const fromDb = data?.value?.trim();
  if (fromDb) {
    getCloudinaryAccount(fromDb);
    return fromDb;
  }

  return resolveConfiguredDefaultAccountId();
}

export async function setDefaultCloudinaryAccountId(
  accountId: string
): Promise<void> {
  getCloudinaryAccount(accountId);
  const supabase = createAdminSupabase();
  const { error } = await supabase.from("settings").upsert({
    key: DEFAULT_ACCOUNT_KEY,
    value: accountId,
  });
  if (error) throw new Error(error.message);
}

export async function getCloudinarySettings(): Promise<{
  accounts: CloudinaryAccountPublic[];
  defaultAccountId: string;
}> {
  return {
    accounts: listCloudinaryAccountsPublic(),
    defaultAccountId: await getDefaultCloudinaryAccountId(),
  };
}
