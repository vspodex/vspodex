import tw, { styled } from "twin.macro";

import { useSettingsContext } from "~/browser/contexts";
import { useTranslation } from "~/browser/hooks";

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

  const themeProps = register("general.theme");
  const fontSizeProps = register("general.fontSize");
  const languageProps = register("general.language");
  const clickBehaviorProps = register("general.clickBehavior");
  const refreshIntervalProps = register("general.refreshInterval");

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
