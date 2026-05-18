import { useEffect, useState } from "react";
import tw, { styled } from "twin.macro";

import { sendRuntimeMessage } from "~/common/helpers";
import { useHolodexApiKey, useTwitchAccessToken, useTwitchUser } from "~/browser/hooks";

const Section = styled.div`
  ${tw`mb-8`}
`;

const SectionTitle = styled.h2`
  ${tw`text-lg font-semibold mb-4`}
`;

const SectionDescription = styled.p`
  ${tw`text-sm text-neutral-500 mb-4`}
`;

const InputGroup = styled.div`
  ${tw`flex gap-2 items-center`}
`;

const Input = styled.input`
  ${tw`flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-black dark:text-white text-sm outline-none focus:border-indigo-500`}
`;

const Button = styled.button<{ variant?: "primary" | "danger" }>`
  ${tw`px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer transition-colors`}
  ${(props) =>
    props.variant === "danger"
      ? tw`bg-red-600 hover:bg-red-700`
      : tw`bg-indigo-600 hover:bg-indigo-700`}
`;

const StatusBadge = styled.span<{ connected: boolean }>`
  ${tw`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium`}
  ${(props) =>
    props.connected
      ? tw`bg-green-500/10 text-green-400`
      : tw`bg-red-500/10 text-red-400`}
`;

const TwitchUserInfo = styled.div`
  ${tw`flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg`}
`;

const TwitchAvatar = styled.img`
  ${tw`w-10 h-10 rounded-full`}
`;

export function Component() {
  const [holodexApiKey, holodexStore] = useHolodexApiKey();
  const [twitchAccessToken] = useTwitchAccessToken();
  const [twitchUser] = useTwitchUser();

  const [apiKeyInput, setApiKeyInput] = useState(holodexApiKey || "");
  const [saving, setSaving] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");

  useEffect(() => {
    sendRuntimeMessage("getRedirectUrl").then((url: string) => {
      setRedirectUrl(url);
    }).catch(() => {});
  }, []);

  const handleSaveApiKey = async () => {
    setSaving(true);
    await holodexStore.set(apiKeyInput || null);

    // Try to refresh VSPO channels with the new key
    if (apiKeyInput) {
      try {
        await sendRuntimeMessage("refreshVspoChannels");
      } catch (error) {
        console.error("Failed to refresh channels:", error);
      }
    }

    setSaving(false);
  };

  const handleTwitchLogin = () => {
    sendRuntimeMessage("authorize");
  };

  const handleTwitchLogout = () => {
    sendRuntimeMessage("revoke");
  };

  return (
    <>
      <Section>
        <SectionTitle>Holodex API Key</SectionTitle>
        <SectionDescription css={tw`mb-3`}>
          To get your API key, you need to log in to Holodex and copy the key from your account settings.
        </SectionDescription>

        <div css={tw`mb-5`}>
          <Button
            as="a"
            href="https://holodex.net/login"
            target="_blank"
            rel="noopener"
            css={tw`inline-flex items-center gap-2 no-underline`}
          >
            🔑 Click here to login & obtain Holodex API Key
          </Button>
          <div css={tw`text-xs text-neutral-400 dark:text-neutral-500 mt-2 leading-relaxed`}>
            After logging in, navigate to <strong>Account Settings</strong> → <strong>API Key</strong> to generate and copy your API key.
          </div>
        </div>

        <InputGroup>
          <Input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Enter your Holodex API key..."
          />
          <Button onClick={handleSaveApiKey} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </InputGroup>

        <div css={tw`mt-2`}>
          <StatusBadge connected={!!holodexApiKey}>
            {holodexApiKey ? "✓ Connected" : "✗ Not configured"}
          </StatusBadge>
        </div>
      </Section>

      <Section>
        <SectionTitle>Twitch Account</SectionTitle>
        <SectionDescription>
          Connect your Twitch account to see followed Twitch streams in the popup.
          {redirectUrl && (
            <>
              <br />
              <span css={tw`text-xs mt-1 block`}>
                Add this redirect URL to your{" "}
                <a
                  href="https://dev.twitch.tv/console/apps"
                  target="_blank"
                  rel="noopener"
                  css={tw`text-indigo-400 hover:underline`}
                >
                  Twitch app
                </a>
                :{" "}
                <code css={tw`bg-neutral-200 dark:bg-neutral-700 px-1 rounded select-all`}>
                  {redirectUrl}
                </code>
              </span>
            </>
          )}
        </SectionDescription>

        {twitchUser ? (
          <>
            <TwitchUserInfo>
              <TwitchAvatar
                src={twitchUser.profileImageUrl}
                alt={twitchUser.displayName}
              />
              <div>
                <div css={tw`font-medium`}>{twitchUser.displayName}</div>
                <div css={tw`text-sm text-neutral-500`}>@{twitchUser.login}</div>
              </div>
            </TwitchUserInfo>
            <Button
              variant="danger"
              onClick={handleTwitchLogout}
              css={tw`mt-3`}
            >
              Disconnect Twitch
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleTwitchLogin}>
              🟣 Connect Twitch Account
            </Button>
            <div css={tw`mt-2`}>
              <StatusBadge connected={!!twitchAccessToken}>
                {twitchAccessToken ? "✓ Connected" : "✗ Not connected"}
              </StatusBadge>
            </div>
          </>
        )}
      </Section>
    </>
  );
}

export default Component;
