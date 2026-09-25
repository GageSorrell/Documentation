/**
 * Normalized website configuration consumed by the Storybook dogfood app.
 *
 * @module @sorrell/docs-storybook-web/Configuration
 *
 * @file      Configuration.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { decodeDocsConfigSync } from "@sorrell/docs-core";

export const storybookConfig = decodeDocsConfigSync({
    metadata: { name: "Sorrell Documentation" },
    storybook: { enabled: true }
});
