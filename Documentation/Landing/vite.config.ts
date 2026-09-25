/**
 *
 *
 * @module generated-documentation-landing/vite.config
 *
 * @file      vite.config.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    base: "/",
    build: { outDir: "Distribution" },
    plugins: [ react() ],
    server: {
        proxy: {
            "/docs": "http://localhost:4321",
            "/storybook": {
                target: "http://localhost:6006",
                rewrite: (path) => path.replace("/storybook", "")
            }
        }
    }
});
