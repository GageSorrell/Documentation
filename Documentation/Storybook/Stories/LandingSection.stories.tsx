/**
 *
 *
 * @module @sorrell/docs-storybook-web/Stories/LandingSection.stories
 *
 * @file      LandingSection.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { LandingSection } from "@sorrell/docs-ui";

const meta = { component: LandingSection, title: "Landing/LandingSection" } satisfies Meta<typeof LandingSection>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: { children: null, title: "A focused section" }, render: (args) => <LandingSection {...args}><p>Section content remains readable and composable.</p></LandingSection> };
export const WithEyebrow: Story = { args: { children: null, eyebrow: "Featured", title: "An emphasized section" }, render: (args) => <LandingSection {...args}><p>Eyebrows provide a small semantic cue above the heading.</p></LandingSection> };
