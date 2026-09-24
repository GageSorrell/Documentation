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

/** @module @sorrell/docs-react-native-storybook/Metro */

import type { MetroConfig, MetroStorybookOptions } from "./Types.js";

const appendUnique = (values: ReadonlyArray<string> | undefined, additions: ReadonlyArray<string>): Array<string> => Array.from(new Set([ ...(values ?? []), ...additions ]));

export const createMetroConfig = (config: MetroConfig = {}, options: MetroStorybookOptions = {}): MetroConfig => {
    const next: MetroConfig = {
        ...config,
        resolver: {
            ...(config.resolver ?? {}),
            sourceExts: appendUnique((config.resolver?.sourceExts as ReadonlyArray<string> | undefined), [ "ts", "tsx" ])
        },
        transformer: {
            ...(config.transformer ?? {}),
            unstable_allowRequireContext: true
        },
        storybook: {
            enabled: options.enabled ?? true,
            configPath: options.configPath ?? ".storybook",
            storybookEntrypoint: options.storybookEntrypoint ?? "storybook.requires"
        }
    };
    return options.withStorybook === undefined ? next : options.withStorybook(next, options);
};

export const withStorybookMetro = (config: MetroConfig, options: MetroStorybookOptions = {}): MetroConfig => createMetroConfig(config, options);
