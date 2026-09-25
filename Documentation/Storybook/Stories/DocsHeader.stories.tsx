/**
 *
 *
 * @module @sorrell/docs-storybook-web/Stories/DocsHeader.stories
 *
 * @file      DocsHeader.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { DocsHeader } from "@sorrell/docs-ui";

const meta = { component: DocsHeader, title: "Landing/DocsHeader" } satisfies Meta<typeof DocsHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Navigation: Story = { args: { links: [ { href: "/docs/", label: "Docs" }, { href: "/storybook/", label: "Storybook" } ], title: "Sorrell Documentation" } };
export const KeyboardFocus: Story = { ...Navigation };
