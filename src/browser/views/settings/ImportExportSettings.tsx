import { useState } from "react";
import tw, { styled } from "twin.macro";

import { useTranslation, useHolodexApiKeyVerified } from "~/browser/hooks";
import { stores } from "~/common/stores";
import { DEFAULT_VSPO_CHANNELS } from "~/common/constants";
import { sendRuntimeMessage } from "~/common/helpers";

const Section = styled.div`
  ${tw`mb-8`}
`;

const SectionTitle = styled.h2`
  ${tw`text-lg font-semibold mb-4`}
`;

const SectionDescription = styled.p`
  ${tw`text-sm text-neutral-500 mb-4`}
`;

const Textarea = styled.textarea`
  ${tw`w-full h-72 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-black dark:text-white text-xs font-mono outline-none focus:border-indigo-500 mb-4 resize-y`}
`;

const Button = styled.button<{ variant?: "primary" | "danger" | "outline" }>`
  ${tw`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors mr-2`}
  ${(props) => {
    switch (props.variant) {
      case "danger":
        return tw`bg-red-600 hover:bg-red-700 text-white`;
      case "outline":
        return tw`border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:(bg-neutral-200 dark:bg-neutral-700)`;
      default:
        return tw`bg-indigo-600 hover:bg-indigo-700 text-white`;
    }
  }}
`;

const ButtonContainer = styled.div`
  ${tw`flex flex-wrap gap-2 mb-6`}
`;

const LockedContainer = styled.div`
  ${tw`flex flex-col items-center justify-center p-12 text-center bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800`}
`;

const LockedIcon = styled.div`
  ${tw`text-4xl mb-4`}
`;

const LockedTitle = styled.h3`
  ${tw`text-base font-semibold text-neutral-700 dark:text-neutral-300 mb-2`}
`;

const LockedDescription = styled.p`
  ${tw`text-sm text-neutral-500 max-w-sm`}
`;

export function Component() {
  const { t } = useTranslation();
  const [holodexApiKeyVerified] = useHolodexApiKeyVerified();

  const [jsonText, setJsonText] = useState("");
  const [isExported, setIsExported] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  if (!holodexApiKeyVerified) {
    return (
      <LockedContainer>
        <LockedIcon>🔒</LockedIcon>
        <LockedTitle>{t("nav_backup")}</LockedTitle>
        <LockedDescription>{t("locked_backup_desc")}</LockedDescription>
      </LockedContainer>
    );
  }

  const handleExport = async () => {
    if (isExported) {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(jsonText);
        setCopyStatus("copied");
        setTimeout(() => setCopyStatus("idle"), 2000);
      } catch (err) {
        console.error("Failed to copy text:", err);
      }
    } else {
      // Load and serialize data
      const currentSettings = await stores.settings.get();
      const currentFavoriteChannels = await stores.favoriteChannels.get();
      const currentFollowedChannels = await stores.followedChannels.get();
      const currentSidebarTabOrder = await stores.sidebarTabOrder.get();
      const currentChannelCache = await stores.channelCache.get();

      // Clean settings of any potential API key leftovers (though they live in separate stores, be absolutely safe)
      const cleanedSettings = { ...currentSettings };
      if ("holodexApiKey" in cleanedSettings) delete (cleanedSettings as any).holodexApiKey;
      if ("holodexApiKeyVerified" in cleanedSettings) delete (cleanedSettings as any).holodexApiKeyVerified;

      // Extract custom channels from the cache (channels not present in default VSPO channels)
      const defaultIds = new Set(DEFAULT_VSPO_CHANNELS.map((c) => c.id));
      const customChannelIds = currentChannelCache
        .filter((ch) => !defaultIds.has(ch.id))
        .map((ch) => ch.id);

      const exportData = {
        settings: cleanedSettings,
        favoriteChannels: currentFavoriteChannels,
        followedChannels: currentFollowedChannels,
        sidebarTabOrder: currentSidebarTabOrder,
        customChannels: customChannelIds,
      };

      setJsonText(JSON.stringify(exportData, null, 2));
      setIsExported(true);
    }
  };

  const handleImport = async () => {
    if (!jsonText.trim()) return;

    const confirmImport = window.confirm(t("confirm_import"));
    if (!confirmImport) return;

    try {
      // 1. Parse JSON
      let data: any;
      try {
        data = JSON.parse(jsonText);
      } catch (err) {
        alert(t("error_invalid_json"));
        return;
      }

      // 2. Validate Root Object
      if (!data || typeof data !== "object") {
        alert(t("error_invalid_json"));
        return;
      }

      // 3. Process Settings
      if (data.settings && typeof data.settings === "object") {
        // Strip out Holodex API key keys if present in import for safety
        const cleanedSettings = { ...data.settings };
        if (cleanedSettings.holodexApiKey !== undefined) delete cleanedSettings.holodexApiKey;
        if (cleanedSettings.holodexApiKeyVerified !== undefined) delete cleanedSettings.holodexApiKeyVerified;
        await stores.settings.set(cleanedSettings);
      }

      // 4. Process Favorite Channels
      if (Array.isArray(data.favoriteChannels)) {
        const validFavorites = data.favoriteChannels.filter((id: any) => typeof id === "string");
        await stores.favoriteChannels.set(validFavorites);
      }

      // 5. Process Followed Channels
      if (Array.isArray(data.followedChannels)) {
        const validFollowed = data.followedChannels.filter((id: any) => typeof id === "string");
        await stores.followedChannels.set(validFollowed);
      }

      // 6. Process Sidebar Tab Order
      if (Array.isArray(data.sidebarTabOrder)) {
        const validTabs = data.sidebarTabOrder.filter((tab: any) => typeof tab === "string");
        await stores.sidebarTabOrder.set(validTabs);
      }

      // 7. Process Custom Channels (just YouTube channel IDs as strings)
      const invalidCustomChannels: string[] = [];
      const validCustomChannelIds: string[] = [];

      if (Array.isArray(data.customChannels)) {
        for (const channelId of data.customChannels) {
          if (
            typeof channelId === "string" &&
            channelId.startsWith("UC") &&
            channelId.length === 24
          ) {
            validCustomChannelIds.push(channelId);
          } else {
            invalidCustomChannels.push(
              typeof channelId === "string" ? channelId : JSON.stringify(channelId)
            );
          }
        }
      }

      // Merge custom channels by checking cache or triggering API validation
      if (validCustomChannelIds.length > 0) {
        const currentCache = await stores.channelCache.get();
        const cacheIds = new Set(currentCache.map((ch) => ch.id));

        for (const id of validCustomChannelIds) {
          if (cacheIds.has(id)) {
            // Already cached, verify it's also followed
            const currentFollowed = await stores.followedChannels.get();
            if (!currentFollowed.includes(id)) {
              currentFollowed.push(id);
              await stores.followedChannels.set(currentFollowed);
            }
          } else {
            // Not in cache, request background script to fetch and cache details
            try {
              const success = await sendRuntimeMessage("addCustomChannel", id);
              if (!success) {
                invalidCustomChannels.push(id);
              }
            } catch (err) {
              console.error(`Failed to add custom channel ${id}:`, err);
              invalidCustomChannels.push(id);
            }
          }
        }
      }

      // 8. Result feedback
      if (invalidCustomChannels.length > 0) {
        const details = invalidCustomChannels.join(", ");
        const msg = t("error_invalid_custom_channels").replace("{details}", details);
        alert(msg);
      } else {
        alert(t("import_success"));
      }

      // Reset export state
      setJsonText("");
      setIsExported(false);
    } catch (err: any) {
      console.error("Import failed:", err);
      alert(err?.message || "An unexpected error occurred during import.");
    }
  };

  return (
    <Section>
      <SectionTitle>{t("section_backup")}</SectionTitle>
      <SectionDescription>{t("desc_backup")}</SectionDescription>

      <Textarea
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value);
          setIsExported(false); // Reset export status when user manually edits
        }}
        placeholder='Paste settings JSON here to import, or click "Export Settings" to generate configuration data...'
      />

      <ButtonContainer>
        <Button onClick={handleExport}>
          {isExported
            ? copyStatus === "copied"
              ? t("btn_copied")
              : t("btn_copy")
            : t("btn_export")}
        </Button>
        <Button
          variant="outline"
          onClick={handleImport}
          disabled={!jsonText.trim()}
          style={{ opacity: jsonText.trim() ? 1 : 0.5 }}
        >
          {t("btn_import")}
        </Button>
      </ButtonContainer>
    </Section>
  );
}

export default Component;
