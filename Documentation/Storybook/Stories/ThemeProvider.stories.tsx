/**
 *
 *
 * @module @sorrell/docs-storybook-web/Stories/ThemeProvider.stories
 *
 * @file      ThemeProvider.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider, ThemeToggle } from "@sorrell/docs-ui";

const meta = { component: ThemeProvider, title: "Landing/ThemeProvider" } satisfies Meta<typeof ThemeProvider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Light: Story = { args: { children: null, initialMode: "light" }, render: (args) => <ThemeProvider {...args}><ThemeToggle /></ThemeProvider> };
export const Dark: Story = { args: { children: null, initialMode: "dark" }, render: (args) => <ThemeProvider {...args}><ThemeToggle /></ThemeProvider> };
export const System: Story = { args: { children: null, initialMode: "system" }, render: (args) => <ThemeProvider {...args}><ThemeToggle /></ThemeProvider> };
