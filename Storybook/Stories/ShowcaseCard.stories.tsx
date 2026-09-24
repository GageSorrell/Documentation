/**
 * CSF stories for the typed web component fixture.
 *
 * @module @sorrell/docs-storybook-web/Stories/ShowcaseCard
 *
 * @file      ShowcaseCard.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { ShowcaseCard } from "../Source/ShowcaseCard.js";

const meta = {
    component: ShowcaseCard,
    parameters: {
        docs: {
            description: {
                component: "A small, typed fixture for validating component documentation and controls."
            }
        }
    },
    tags: [ "autodocs" ],
    title: "Components/Showcase Card"
} satisfies Meta<typeof ShowcaseCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: "A component fixture with extracted prop controls.",
        count: 3,
        title: "Documentation surface"
    }
};

export const Accent: Story = {
    args: {
        children: "The accent variant demonstrates a union prop.",
        count: 8,
        title: "Theme-aware fixture",
        tone: "accent"
    }
};
