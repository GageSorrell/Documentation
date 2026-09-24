/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Controls
 *
 * @file      Controls.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-react-native-storybook/Controls */

import type { ControlsDefaults } from "./Types.js";

export const defaultControls: Required<Pick<ControlsDefaults, "expanded" | "sort" | "hideNoControlsWarning">> & Pick<ControlsDefaults, "exclude"> = {
    expanded: true,
    sort: "requiredFirst",
    hideNoControlsWarning: true,
    exclude: []
};

export const createControlsDefaults = (overrides: ControlsDefaults = {}): ControlsDefaults => {
    if (overrides.exclude === undefined) { return { ...defaultControls, ...overrides }; }
    return { ...defaultControls, ...overrides, exclude: overrides.exclude };
};
