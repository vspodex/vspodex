import { useState } from "react";
import tw, { styled } from "twin.macro";
import { IconGripVertical } from "@tabler/icons-react";

import { useSettingsContext } from "~/browser/contexts";
import { useTranslation, useSidebarTabOrder } from "~/browser/hooks";

const DraggableList = styled.div`
  ${tw`flex flex-col gap-2 mb-6 max-w-md`}
`;

const DraggableRow = styled.div<{ isDragging: boolean }>`
  ${tw`flex items-center gap-3 p-2.5 rounded-lg border bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 transition-all cursor-move`}
  ${(props) => props.isDragging && tw`opacity-50 border-dashed border-indigo-500`}
`;

const GripIcon = styled.div`
  ${tw`text-neutral-400 cursor-grab active:cursor-grabbing flex-none`}
`;

const TabInfo = styled.div`
  ${tw`flex-1 overflow-hidden`}
`;

const TabName = styled.div`
  ${tw`font-medium text-sm text-neutral-800 dark:text-neutral-200`}
`;

const Section = styled.div`
  ${tw`mb-8`}
`;

const SectionTitle = styled.h2`
  ${tw`text-lg font-semibold mb-4`}
`;

const FormGroup = styled.div`
  ${tw`mb-4`}
`;

const Label = styled.label`
  ${tw`block text-sm font-medium mb-1`}
`;

const Select = styled.select`
  ${tw`w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-black dark:text-white text-sm outline-none focus:border-indigo-500`}
`;

const HelpText = styled.p`
  ${tw`text-xs text-neutral-400 mt-1`}
`;

const CheckboxLabel = styled.label`
  ${tw`flex items-center gap-2 text-sm font-medium cursor-pointer`}
`;

const Checkbox = styled.input`
  ${tw`w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 accent-indigo-500 cursor-pointer`}
`;

export function Component() {
  const { register } = useSettingsContext();
  const { t } = useTranslation();
  const [sidebarTabOrder, sidebarTabOrderStore] = useSidebarTabOrder({ suspense: true });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const themeProps = register("general.theme");
  const fontSizeProps = register("general.fontSize");
  const languageProps = register("general.language");
  const clickBehaviorProps = register("general.clickBehavior");
  const refreshIntervalProps = register("general.refreshInterval");

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newList = [...sidebarTabOrder];
    const draggedItem = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    sidebarTabOrderStore.set(newList);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const tabNames = {
    live: t("tooltip_live_streams"),
    members: t("tooltip_members"),
    upcoming: t("tooltip_upcoming_streams"),
    past: t("tooltip_past_streams"),
  };

  return (
    <>
      <Section>
        <SectionTitle>{t("section_appearance")}</SectionTitle>

        <FormGroup>
          <Label>{t("setting_theme")}</Label>
          <Select
            value={themeProps.value}
            onChange={(e) => themeProps.onChange(e.target.value)}
          >
            <option value="system">{t("setting_theme_system")}</option>
            <option value="dark">{t("setting_theme_dark")}</option>
            <option value="light">{t("setting_theme_light")}</option>
            <optgroup label={t("setting_theme_member_group")}>
              <option value="hinano">{t("setting_theme_hinano")}</option>
              <option value="lisa">{t("setting_theme_lisa")}</option>
              <option value="runa">{t("setting_theme_runa")}</option>
              <option value="yuuhi">{t("setting_theme_yuuhi")}</option>
              <option value="moka">{t("setting_theme_moka")}</option>
              <option value="ramune">{t("setting_theme_ramune")}</option>
              <option value="sumire">{t("setting_theme_sumire")}</option>
              <option value="nazuna">{t("setting_theme_nazuna")}</option>
              <option value="toto">{t("setting_theme_toto")}</option>
              <option value="uruha">{t("setting_theme_uruha")}</option>
              <option value="noa">{t("setting_theme_noa")}</option>
              <option value="kyupi">{t("setting_theme_kyupi")}</option>
              <option value="beni">{t("setting_theme_beni")}</option>
              <option value="ema">{t("setting_theme_ema")}</option>
              <option value="sena">{t("setting_theme_sena")}</option>
              <option value="ren">{t("setting_theme_ren")}</option>
              <option value="mimi">{t("setting_theme_mimi")}</option>
              <option value="tsuna">{t("setting_theme_tsuna")}</option>
              <option value="met">{t("setting_theme_met")}</option>
              <option value="akari">{t("setting_theme_akari")}</option>
              <option value="kuromu">{t("setting_theme_kuromu")}</option>
              <option value="kokage">{t("setting_theme_kokage")}</option>
            </optgroup>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>{t("setting_font_size")}</Label>
          <Select
            value={fontSizeProps.value}
            onChange={(e) => fontSizeProps.onChange(e.target.value)}
          >
            <option value="smallest">{t("setting_font_size_smallest")}</option>
            <option value="small">{t("setting_font_size_small")}</option>
            <option value="medium">{t("setting_font_size_medium")}</option>
            <option value="large">{t("setting_font_size_large")}</option>
            <option value="largest">{t("setting_font_size_largest")}</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>{t("setting_language")}</Label>
          <Select
            value={languageProps.value}
            onChange={(e) => languageProps.onChange(e.target.value)}
          >
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="zh">繁體中文</option>
          </Select>
        </FormGroup>
      </Section>

      <Section>
        <SectionTitle>{t("section_tab_order")}</SectionTitle>
        <HelpText style={{ marginBottom: "1rem" }}>{t("desc_tab_order")}</HelpText>
        <DraggableList>
          {sidebarTabOrder.map((tabKey, index) => (
            <DraggableRow
              key={tabKey}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
            >
              <GripIcon>
                <IconGripVertical size="1.25rem" />
              </GripIcon>
              <TabInfo>
                <TabName>{tabNames[tabKey as keyof typeof tabNames] || tabKey}</TabName>
              </TabInfo>
            </DraggableRow>
          ))}
        </DraggableList>
      </Section>

      <Section>
        <SectionTitle>{t("section_behavior")}</SectionTitle>

        <FormGroup>
          <Label>{t("setting_sort_by")}</Label>
          <Select
            value={register("general.sortBy").value}
            onChange={(e) => register("general.sortBy").onChange(e.target.value)}
          >
            <option value="viewerCount">{t("setting_sort_by_viewers")}</option>
            <option value="duration">{t("setting_sort_by_duration")}</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>{t("setting_sort_order")}</Label>
          <Select
            value={register("general.sortOrder").value}
            onChange={(e) => register("general.sortOrder").onChange(e.target.value)}
          >
            <option value="desc">{t("setting_sort_order_desc")}</option>
            <option value="asc">{t("setting_sort_order_asc")}</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>{t("setting_click_behavior")}</Label>
          <Select
            value={clickBehaviorProps.value}
            onChange={(e) => clickBehaviorProps.onChange(Number(e.target.value))}
          >
            <option value={0}>{t("setting_click_behavior_new_tab")}</option>
            <option value={1}>{t("setting_click_behavior_new_window")}</option>
            <option value={2}>{t("setting_click_behavior_current_tab")}</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>{t("setting_refresh_interval")}</Label>
          <Select
            value={refreshIntervalProps.value}
            onChange={(e) => refreshIntervalProps.onChange(Number(e.target.value))}
          >
            <option value={1}>{t("refresh_1_min")}</option>
            <option value={2}>{t("refresh_2_min")}</option>
            <option value={3}>{t("refresh_3_min")}</option>
            <option value={5}>{t("refresh_5_min")}</option>
            <option value={10}>{t("refresh_10_min")}</option>
          </Select>
          <HelpText>{t("setting_refresh_interval_desc")}</HelpText>
        </FormGroup>
      </Section>

      <Section>
        <SectionTitle>{t("section_past_streams")}</SectionTitle>

        <FormGroup>
          <Label>{t("setting_past_refresh_interval")}</Label>
          <Select
            value={register("general.pastStreamsRefreshInterval").value}
            onChange={(e) => register("general.pastStreamsRefreshInterval").onChange(Number(e.target.value))}
          >
            <option value={5}>{t("refresh_5_min")}</option>
            <option value={10}>{t("refresh_10_min")}</option>
            <option value={15}>{t("refresh_15_min")}</option>
            <option value={30}>{t("refresh_30_min")}</option>
          </Select>
          <HelpText>{t("setting_past_refresh_interval_desc")}</HelpText>
        </FormGroup>

        <FormGroup>
          <CheckboxLabel>
            <Checkbox
              type="checkbox"
              checked={register("general.showCollabStreams").value}
              onChange={(e) => register("general.showCollabStreams").onChange(e.target.checked)}
            />
            {t("setting_show_collab_streams")}
          </CheckboxLabel>
          <HelpText>{t("setting_show_collab_streams_desc")}</HelpText>
        </FormGroup>

        <FormGroup>
          <CheckboxLabel>
            <Checkbox
              type="checkbox"
              checked={register("general.enableExperimentalTwitchPast").value}
              onChange={(e) => register("general.enableExperimentalTwitchPast").onChange(e.target.checked)}
            />
            {t("setting_enable_twitch_past")}
          </CheckboxLabel>
          <HelpText>{t("setting_enable_twitch_past_desc")}</HelpText>
        </FormGroup>
      </Section>
    </>
  );
}

export default Component;
