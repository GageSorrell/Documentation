/**
 *
 *
 * @module @sorrell/docs-skills/Test/Installer.test
 *
 * @file      Installer.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { SkillCollisionError, SkillInstaller, skillsLayer } from "../Source/index.js";

type InstallerApi = typeof SkillInstaller.Service;

const run = <Value>(operation: (installer: InstallerApi) => Effect.Effect<Value, unknown>) =>
    Effect.runPromise(Effect.gen(function*() {
        const installer = yield* SkillInstaller;
        return yield* operation(installer);
    }).pipe(Effect.provide(skillsLayer)));

describe("SkillInstaller", () => {
    it("installs every bundled skill and tracks managed files", async () => {
        const directory = await mkdtemp(join(tmpdir(), "sorrell-skills-"));
        try {
            const installed = await run((installer) => Effect.gen(function*() {
                const values = [];
                for (const skill of installer.listAvailable()) {
                    values.push(yield* installer.install(skill.name, { projectDirectory: directory }));
                }
                return values;
            }));
            expect(installed).toHaveLength(6);
            expect(existsSync(join(directory, ".codex", "skills", "sorrell-docs-create-site", "SKILL.md"))).toBe(true);
            expect(JSON.parse(await readFile(join(directory, ".codex", "skills", ".sorrell-skill-registry.json"), "utf8")).installations).toHaveLength(6);
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });

    it("refuses unmanaged collisions and permits managed update and uninstall", async () => {
        const directory = await mkdtemp(join(tmpdir(), "sorrell-skills-"));
        const target = join(directory, ".codex", "skills", "sorrell-docs-create-site");
        try {
            await run((installer) => installer.install("sorrell-docs-create-site", { projectDirectory: directory }));
            const updated = await run((installer) => installer.update("sorrell-docs-create-site", { projectDirectory: directory }));
            expect(updated.name).toBe("sorrell-docs-create-site");
            await run((installer) => installer.uninstall("sorrell-docs-create-site", { projectDirectory: directory }));
            expect(existsSync(target)).toBe(false);

            await writeFile(target, "unmanaged", { encoding: "utf8" });
            const result = await run((installer) => installer.install("sorrell-docs-create-site", { projectDirectory: directory }).pipe(
                Effect.match({
                    onFailure: (cause) => cause,
                    onSuccess: () => undefined
                })
            ));
            expect(result).toBeInstanceOf(SkillCollisionError);
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });

    it("resolves Claude user scope independently from project scope", async () => {
        const directory = await mkdtemp(join(tmpdir(), "sorrell-skills-"));
        try {
            const installed = await run((installer) => installer.install("sorrell-docs-write-content", {
                agent: "claude",
                scope: "user",
                homeDirectory: directory
            }));
            expect(installed.directory).toBe(join(directory, ".claude", "skills", "sorrell-docs-write-content"));
            expect(existsSync(join(installed.directory, "agents", "openai.yaml"))).toBe(true);
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
});
