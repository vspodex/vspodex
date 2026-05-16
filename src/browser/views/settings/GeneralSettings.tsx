import tw, { styled } from "twin.macro";

import { useSettingsContext } from "~/browser/contexts";

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

export function Component() {
  const { register } = useSettingsContext();

  const themeProps = register("general.theme");
  const fontSizeProps = register("general.fontSize");
  const clickBehaviorProps = register("general.clickBehavior");
  const refreshIntervalProps = register("general.refreshInterval");

  return (
    <>
      <Section>
        <SectionTitle>Appearance</SectionTitle>

        <FormGroup>
          <Label>Theme</Label>
          <Select
            value={themeProps.value}
            onChange={(e) => themeProps.onChange(e.target.value)}
          >
            <option value="system">System</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Font Size</Label>
          <Select
            value={fontSizeProps.value}
            onChange={(e) => fontSizeProps.onChange(e.target.value)}
          >
            <option value="smallest">Smallest</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="largest">Largest</option>
          </Select>
        </FormGroup>
      </Section>

      <Section>
        <SectionTitle>Behavior</SectionTitle>

        <FormGroup>
          <Label>Sort Streams By</Label>
          <Select
            value={register("general.sortBy").value}
            onChange={(e) => register("general.sortBy").onChange(e.target.value)}
          >
            <option value="viewerCount">Viewer Count</option>
            <option value="duration">Stream Duration</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Sort Order</Label>
          <Select
            value={register("general.sortOrder").value}
            onChange={(e) => register("general.sortOrder").onChange(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Click Behavior</Label>
          <Select
            value={clickBehaviorProps.value}
            onChange={(e) => clickBehaviorProps.onChange(Number(e.target.value))}
          >
            <option value={0}>Open in new tab</option>
            <option value={1}>Open in new window</option>
            <option value={2}>Open in current tab</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Stream Update Interval</Label>
          <Select
            value={refreshIntervalProps.value}
            onChange={(e) => refreshIntervalProps.onChange(Number(e.target.value))}
          >
            <option value={1}>1 minute</option>
            <option value={2}>2 minutes</option>
            <option value={3}>3 minutes</option>
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
          </Select>
          <HelpText>How often the extension checks for new live streams in the background.</HelpText>
        </FormGroup>
      </Section>
    </>
  );
}

export default Component;
