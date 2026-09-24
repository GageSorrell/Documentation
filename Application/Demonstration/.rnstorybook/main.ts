/**
 *
 *
 * @module @sorrell/application-demonstration/.rnstorybook/main
 *
 * @file      main.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/application-demonstration/.rnstorybook/main */

import type { StorybookConfig } from "@storybook/react-native";

const config: StorybookConfig = {
    deviceAddons: [ "@storybook/addon-ondevice-actions", "@storybook/addon-ondevice-controls" ],
    stories: [ "../Stories/**/*.stories.@(js|jsx|ts|tsx)" ]
};

export default config;
