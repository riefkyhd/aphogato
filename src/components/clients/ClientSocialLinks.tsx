import {
  CLIENT_SOCIAL_LABELS,
  socialProfileUrl,
} from "@/lib/clients/socialAccounts";
import type { ClientSocialAccount } from "@/lib/types";

export function ClientSocialLinks({
  accounts,
}: {
  accounts: ClientSocialAccount[] | null | undefined;
}) {
  if (!accounts?.length) return null;

  return (
    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
      {accounts.map((account) => (
        <a
          key={account.platform}
          href={socialProfileUrl(account)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-secondary hover:text-text-primary underline-offset-2 hover:underline"
        >
          {CLIENT_SOCIAL_LABELS[account.platform]} @{account.username}
        </a>
      ))}
    </p>
  );
}
