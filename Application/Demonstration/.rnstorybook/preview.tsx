/**
 *
 *
 * @module @sorrell/application-demonstration/.rnstorybook/preview
 *
 * @file      preview.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/application-demonstration/.rnstorybook/preview */

/* eslint-disable @stylistic/max-len, @typescript-eslint/typedef, sort-imports */

import type { Preview } from "@storybook/react";
import { NativeStorybookProvider } from "@sorrell/docs-react-native-storybook";

const preview: Preview = { decorators: [ (Story) => <NativeStorybookProvider><Story /></NativeStorybookProvider> ] };
export default preview;
