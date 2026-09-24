/**
 * Types for the canonical Sorrell documentation skills.
 *
 * @module @sorrell/docs-skills/Types
 *
 * @file      Types.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export type SkillAgent = "claude" | "codex";
export type SkillScope = "project" | "user";

export interface SkillDefinition {
    readonly name: string;
    readonly description: string;
    readonly directory: string;
}

export interface SkillInstallOptions {
    readonly agent?: SkillAgent;
    readonly scope?: SkillScope;
    readonly projectDirectory?: string;
    readonly homeDirectory?: string;
    readonly codexHome?: string;
}

export interface InstalledSkill {
    readonly name: string;
    readonly description: string;
    readonly agent: SkillAgent;
    readonly scope: SkillScope;
    readonly directory: string;
    readonly checksum: string;
    readonly installedAt: string;
}

export interface SkillRegistryEntry {
    readonly name: string;
    readonly checksum: string;
    readonly installedAt: string;
}
