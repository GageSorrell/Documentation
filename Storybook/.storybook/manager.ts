/**
 * Manager theme for the independent web Storybook surface.
 *
 * @module @sorrell/docs-storybook-web/.storybook/manager
 *
 * @file      manager.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { addons } from "storybook/manager-api";
import { themes } from "storybook/theming";

addons.setConfig({
    enableShortcuts: true,
    theme: themes.dark
});
