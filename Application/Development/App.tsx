/**
 *
 *
 * @module @sorrell/application-development/App
 *
 * @file      App.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/application-development/App */

import { NativeStorybookProvider } from "@sorrell/docs-react-native-storybook";
import StorybookUI from "./.rnstorybook/index";

/** Render the exhaustive native Storybook host. */
export default function App()
{
    return <NativeStorybookProvider><StorybookUI /></NativeStorybookProvider>;
}
