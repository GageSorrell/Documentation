/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/vitest.config
 *
 * @file      vitest.config.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { URL, fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
export default defineConfig({
    resolve: {
        alias: {
            "react-native": fileURLToPath(
                new URL("./Test/ReactNativeStub.ts", import.meta.url)
            )
        }
    },
    test: {
        environment: "node",
        include: [ "Test/**/*.test.ts", "Test/**/*.test.tsx" ]
    }
});
