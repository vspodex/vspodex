import { useEffect, useState } from "react";
import tw, { styled } from "twin.macro";

import { sendRuntimeMessage } from "~/common/helpers";
import { useHolodexApiKey, useHolodexApiKeyVerified, useTwitchAccessToken, useTwitchUser, useTranslation } from "~/browser/hooks";

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

const HolodexDescription = styled(SectionDescription)`
  ${tw`mb-6`}
`;

const HolodexButton = styled.a`
  ${tw`px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer transition-colors bg-indigo-600 hover:bg-indigo-700 inline-flex items-center gap-2 no-underline`}
`;

const ButtonWrapper = styled.div`
  ${tw`mb-6`}
`;

const HolodexInstruction = styled.div`
  ${tw`text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed mb-6 mt-4`}
`;

const HolodexInputGroup = styled(InputGroup)`
  ${tw`mt-8`}
`;

const TwitchAvatar = styled.img`
  ${tw`w-10 h-10 rounded-full`}
`;

export function Component() {
  const [holodexApiKey, holodexStore] = useHolodexApiKey();
  const [holodexApiKeyVerified, holodexApiKeyVerifiedStore] = useHolodexApiKeyVerified();
  const [twitchAccessToken] = useTwitchAccessToken();
  const [twitchUser] = useTwitchUser();
  const { t } = useTranslation();

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

    if (!apiKeyInput) {
      await holodexStore.set(null);
      await holodexApiKeyVerifiedStore.set(false);
      setSaving(false);
      return;
    }

    try {
      const isValid = await sendRuntimeMessage("validateHolodexApiKey", apiKeyInput);
      if (!isValid) {
        alert(t("alert_invalid_holodex_key"));
        await holodexStore.set(apiKeyInput);
        await holodexApiKeyVerifiedStore.set(false);
      } else {
        await holodexStore.set(apiKeyInput);
        await holodexApiKeyVerifiedStore.set(true);
        // Try to refresh VSPO channels with the new key
        try {
          await sendRuntimeMessage("refreshVspoChannels");
        } catch (error) {
          console.error("Failed to refresh channels:", error);
        }
      }
    } catch (error) {
      console.error("Failed to validate API key:", error);
      alert(t("alert_validation_error"));
    } finally {
      setSaving(false);
    }
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
        <SectionTitle>{t("section_holodex_key")}</SectionTitle>
        <HolodexDescription>
          {t("desc_holodex_key")}
        </HolodexDescription>

        <ButtonWrapper>
          <HolodexButton
            href="https://holodex.net/login"
            target="_blank"
            rel="noopener"
          >
            {t("btn_holodex_login")}
          </HolodexButton>
        </ButtonWrapper>

        <HolodexInstruction>
          {t("inst_holodex_key")}
        </HolodexInstruction>

        <HolodexInputGroup>
          <Input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={t("placeholder_holodex_key")}
          />
          <Button onClick={handleSaveApiKey} disabled={saving}>
            {saving ? t("btn_saving") : t("btn_save")}
          </Button>
        </HolodexInputGroup>

        <div css={tw`mt-2`}>
          <StatusBadge connected={!!holodexApiKey && holodexApiKeyVerified}>
            {!!holodexApiKey && holodexApiKeyVerified
              ? t("status_connected")
              : holodexApiKey
              ? t("status_not_connected")
              : t("status_not_configured")}
          </StatusBadge>
        </div>
      </Section>

      <Section>
        <SectionTitle>{t("section_twitch")}</SectionTitle>
        <SectionDescription>
          {t("desc_twitch")}
          {redirectUrl && (
            <>
              <br />
              <span css={tw`text-xs mt-1 block`}>
                {t("twitch_redirect_url")}{" "}
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
              {t("btn_twitch_disconnect")}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleTwitchLogin}>
              {t("btn_twitch_connect")}
            </Button>
            <div css={tw`mt-2`}>
              <StatusBadge connected={!!twitchAccessToken}>
                {twitchAccessToken ? t("status_connected") : t("status_not_connected")}
              </StatusBadge>
            </div>
          </>
        )}
      </Section>
    </>
  );
}

export default Component;
