/**
 *
 *
 * @module @sorrell/application-development/.rnstorybook
 *
 * @file      index.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/application-development/.rnstorybook/index */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { view } from "./storybook.requires";

const StorybookUIRoot = view.getStorybookUI({
    storage: { getItem: AsyncStorage.getItem, setItem: AsyncStorage.setItem }
});
export default StorybookUIRoot;
