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

import {
    SkillCollisionError,
    SkillInstaller,
    skillsLayer
} from "../Source/index.js";

import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { Effect } from "effect";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
type InstallerApi = typeof SkillInstaller.Service;
const run = <Value>(
    operation: (installer: InstallerApi) => Effect.Effect<Value, unknown>
) =>
    Effect.runPromise(
        Effect.gen(function* ()
        {
            const installer = yield* SkillInstaller;
            return yield* operation(installer);
        }).pipe(Effect.provide(skillsLayer))
    );
describe("SkillInstaller", () =>
{
    it("installs every bundled skill and tracks managed files", async () =>
    {
        const directory = await mkdtemp(join(tmpdir(), "sorrell-skills-"));
        try
        {
            const installed = await run(
                (installer: {
                    readonly listAvailable: () => ReadonlyArray<SkillDefinition>;
                    readonly listInstalled: (
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        ReadonlyArray<InstalledSkill>,
                        SkillError
                    >;
                    readonly install: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly installFrom: (
                        source: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        SkillError | SkillCollisionError | SkillValidationError
                    >;
                    readonly update: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillNotManagedError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly uninstall: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<void, SkillError | SkillNotManagedError>;
                }) =>
                    Effect.gen(function* ()
                    {
                        const values = [];
                        for (const skill of installer.listAvailable())
                        {
                            values.push(
                                yield* installer.install(skill.name, {
                                    projectDirectory: directory
                                })
                            );
                        }
                        return values;
                    })
            );
            expect(installed).toHaveLength(6);
            expect(
                existsSync(
                    join(
                        directory,
                        ".codex",
                        "skills",
                        "sorrell-docs-create-site",
                        "SKILL.md"
                    )
                )
            ).toBe(true);
            expect(
                JSON.parse(
                    await readFile(
                        join(
                            directory,
                            ".codex",
                            "skills",
                            ".sorrell-skill-registry.json"
                        ),
                        "utf8"
                    )
                ).installations
            ).toHaveLength(6);
        }
        finally
        {
            await rm(directory, { force: true, recursive: true });
        }
    });
    it("refuses unmanaged collisions and permits managed update and uninstall", async () =>
    {
        const directory = await mkdtemp(join(tmpdir(), "sorrell-skills-"));
        const target = join(
            directory,
            ".codex",
            "skills",
            "sorrell-docs-create-site"
        );
        try
        {
            await run(
                (installer: {
                    readonly listAvailable: () => ReadonlyArray<SkillDefinition>;
                    readonly listInstalled: (
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        ReadonlyArray<InstalledSkill>,
                        SkillError
                    >;
                    readonly install: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly installFrom: (
                        source: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        SkillError | SkillCollisionError | SkillValidationError
                    >;
                    readonly update: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillNotManagedError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly uninstall: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<void, SkillError | SkillNotManagedError>;
                }) =>
                    installer.install("sorrell-docs-create-site", {
                        projectDirectory: directory
                    })
            );
            const updated = await run(
                (installer: {
                    readonly listAvailable: () => ReadonlyArray<SkillDefinition>;
                    readonly listInstalled: (
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        ReadonlyArray<InstalledSkill>,
                        SkillError
                    >;
                    readonly install: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly installFrom: (
                        source: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        SkillError | SkillCollisionError | SkillValidationError
                    >;
                    readonly update: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillNotManagedError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly uninstall: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<void, SkillError | SkillNotManagedError>;
                }) =>
                    installer.update("sorrell-docs-create-site", {
                        projectDirectory: directory
                    })
            );
            expect(updated.name).toBe("sorrell-docs-create-site");
            await run(
                (installer: {
                    readonly listAvailable: () => ReadonlyArray<SkillDefinition>;
                    readonly listInstalled: (
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        ReadonlyArray<InstalledSkill>,
                        SkillError
                    >;
                    readonly install: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly installFrom: (
                        source: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        SkillError | SkillCollisionError | SkillValidationError
                    >;
                    readonly update: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillNotManagedError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly uninstall: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<void, SkillError | SkillNotManagedError>;
                }) =>
                    installer.uninstall("sorrell-docs-create-site", {
                        projectDirectory: directory
                    })
            );
            expect(existsSync(target)).toBe(false);
            await writeFile(target, "unmanaged", { encoding: "utf8" });
            const result = await run(
                (installer: {
                    readonly listAvailable: () => ReadonlyArray<SkillDefinition>;
                    readonly listInstalled: (
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        ReadonlyArray<InstalledSkill>,
                        SkillError
                    >;
                    readonly install: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly installFrom: (
                        source: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        SkillError | SkillCollisionError | SkillValidationError
                    >;
                    readonly update: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillNotManagedError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly uninstall: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<void, SkillError | SkillNotManagedError>;
                }) =>
                    installer
                        .install("sorrell-docs-create-site", {
                            projectDirectory: directory
                        })
                        .pipe(
                            Effect.match({
                                onFailure: (
                                    cause:
                                        | SkillError
                                        | SkillValidationError
                                        | SkillNotFoundError
                                        | SkillCollisionError
                                ) => cause,
                                onSuccess: () => undefined
                            })
                        )
            );
            expect(result).toBeInstanceOf(SkillCollisionError);
        }
        finally
        {
            await rm(directory, { force: true, recursive: true });
        }
    });
    it("resolves Claude user scope independently from project scope", async () =>
    {
        const directory = await mkdtemp(join(tmpdir(), "sorrell-skills-"));
        try
        {
            const installed = await run(
                (installer: {
                    readonly listAvailable: () => ReadonlyArray<SkillDefinition>;
                    readonly listInstalled: (
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        ReadonlyArray<InstalledSkill>,
                        SkillError
                    >;
                    readonly install: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly installFrom: (
                        source: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        SkillError | SkillCollisionError | SkillValidationError
                    >;
                    readonly update: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillNotManagedError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly uninstall: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<void, SkillError | SkillNotManagedError>;
                }) =>
                    installer.install("sorrell-docs-write-content", {
                        agent: "claude",
                        homeDirectory: directory,
                        scope: "user"
                    })
            );
            expect(installed.directory).toBe(
                join(
                    directory,
                    ".claude",
                    "skills",
                    "sorrell-docs-write-content"
                )
            );
            expect(
                existsSync(join(installed.directory, "agents", "openai.yaml"))
            ).toBe(true);
        }
        finally
        {
            await rm(directory, { force: true, recursive: true });
        }
    });
    it("installs a generated product skill from a directory", async () =>
    {
        const directory = await mkdtemp(
            join(tmpdir(), "sorrell-product-skill-source-")
        );
        const source = join(directory, "fixture-product");
        try
        {
            await mkdir(join(source, "agents"), { recursive: true });
            await writeFile(
                join(source, "SKILL.md"),
                "---\nname: fixture-product\ndescription: Fixture product documentation.\n---\n\n" +
                    "# Fixture product\n"
            );
            await writeFile(
                join(source, "agents", "openai.yaml"),
                "name: fixture-product\ndescription: Fixture product documentation.\n"
            );
            const installed = await run(
                (installer: {
                    readonly listAvailable: () => ReadonlyArray<SkillDefinition>;
                    readonly listInstalled: (
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        ReadonlyArray<InstalledSkill>,
                        SkillError
                    >;
                    readonly install: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly installFrom: (
                        source: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        SkillError | SkillCollisionError | SkillValidationError
                    >;
                    readonly update: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<
                        InstalledSkill,
                        | SkillError
                        | SkillNotFoundError
                        | SkillNotManagedError
                        | SkillCollisionError
                        | SkillValidationError
                    >;
                    readonly uninstall: (
                        name: string,
                        options?: SkillInstallOptions
                    ) => Effect.Effect<void, SkillError | SkillNotManagedError>;
                }) =>
                    installer.installFrom(source, {
                        projectDirectory: directory
                    })
            );
            expect(installed.name).toBe("fixture-product");
            expect(
                existsSync(
                    join(
                        directory,
                        ".codex",
                        "skills",
                        "fixture-product",
                        "SKILL.md"
                    )
                )
            ).toBe(true);
        }
        finally
        {
            await rm(directory, { force: true, recursive: true });
        }
    });
});
