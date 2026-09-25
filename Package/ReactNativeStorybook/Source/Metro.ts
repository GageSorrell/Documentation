/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Metro
 *
 * @file      Metro.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { MetroConfig, MetroStorybookOptions } from "./Types.js";
const appendUnique = (
    values: ReadonlyArray<string> | undefined,
    additions: ReadonlyArray<string>
): Array<string> => Array.from(new Set([ ...(values ?? []), ...additions ]));
export/** @internal */
const createMetroConfig = (
    config: MetroConfig = {},
    options: MetroStorybookOptions = {}
): MetroConfig =>
{
    const next: MetroConfig = {
        ...config,
        resolver: {
            ...(config.resolver ?? {}),
            sourceExts: appendUnique(
                config.resolver?.sourceExts as
                    | ReadonlyArray<string>
                    | undefined,
                [ "ts", "tsx" ]
            )
        },
        storybook: {
            configPath: options.configPath ?? ".storybook",
            enabled: options.enabled ?? true,
            storybookEntrypoint:
                options.storybookEntrypoint ?? "storybook.requires"
        },
        transformer: {
            ...(config.transformer ?? {}),
            unstable_allowRequireContext: true
        }
    };
    return options.withStorybook === undefined
        ? next
        : options.withStorybook(next, options);
};
export/** @internal */
const withStorybookMetro = (
    config: MetroConfig,
    options: MetroStorybookOptions = {}
): MetroConfig => createMetroConfig(config, options);
