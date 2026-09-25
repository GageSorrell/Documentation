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

import type { ControlsDefaults } from "./Types.js";
export/** @internal */
const defaultControls: Required<
    Pick<ControlsDefaults, "expanded" | "sort" | "hideNoControlsWarning">
> &
    Pick<ControlsDefaults, "exclude"> = {
        exclude: [],
        expanded: true,
        hideNoControlsWarning: true,
        sort: "requiredFirst"
    };
export/** @internal */
const createControlsDefaults = (
    overrides: ControlsDefaults = {}
): ControlsDefaults =>
{
    if (overrides.exclude === undefined)
    {
        return { ...defaultControls, ...overrides };
    }
    return { ...defaultControls, ...overrides, exclude: overrides.exclude };
};
