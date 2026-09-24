/**
 * Deterministic serialization, checksums, and dataset validation.
 *
 * @module @sorrell/docs-api-reference/Serialization
 *
 * @file      Serialization.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { createHash } from "node:crypto";
import type { ApiReferenceRecord } from "@sorrell/docs-core";
import { ApiReferenceValidationError } from "./Errors.js";
import type { ApiReferenceDataset, ApiReferenceLlmDocument, ApiReferenceValidationResult } from "./Types.js";

const sortValue = (value: unknown): unknown => {
    if (Array.isArray(value)) {return value.map(sortValue);}
    if (value !== null && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).sort(([ left ], [ right ]) => left.localeCompare(right)).map(([ key, entry ]) => [ key, sortValue(entry) ]));
    }
    return value;
};

export const stableStringify = (value: unknown): string => JSON.stringify(sortValue(value));

export const checksumValue = (value: unknown): string => createHash("sha256").update(stableStringify(value)).digest("hex");

const recordKey = (record: ApiReferenceRecord): string => `${record.packageId}:${record.module}`;

export const validateApiRecords = (records: ReadonlyArray<ApiReferenceRecord>): ApiReferenceValidationResult => {
    const errors: Array<string> = [];
    const recordKeys = new Set<string>();
    for (const record of records) {
        const key = recordKey(record);
        if (recordKeys.has(key)) {errors.push(`duplicate record ${key}`);}
        recordKeys.add(key);
        if (record.exportCount !== record.declarations.length) {errors.push(`${key} exportCount does not match declarations`);}
        const declarationIds = new Set<string>();
        for (const declaration of record.declarations) {
            if (declarationIds.has(declaration.id)) {errors.push(`${key} has duplicate declaration ${declaration.id}`);}
            declarationIds.add(declaration.id);
            if (!/^[A-Za-z0-9_$.-]+$/.test(declaration.id)) {errors.push(`${key} has unsafe declaration id ${declaration.id}`);}
            if (declaration.signature.trim() === "") {errors.push(`${key}/${declaration.id} has an empty signature`);}
        }
    }
    return { valid: errors.length === 0, errors };
};

export const validateApiDataset = (dataset: ApiReferenceDataset): ApiReferenceValidationResult => {
    const recordsResult = validateApiRecords(dataset.records);
    const expected = checksumValue({ records: dataset.records, sourceRevision: dataset.sourceRevision });
    const errors = [ ...recordsResult.errors, ...(dataset.checksum === expected ? [] : [ "checksum does not match dataset contents" ]) ];
    return { valid: errors.length === 0, errors };
};

export const assertValidApiDataset = (dataset: ApiReferenceDataset): ApiReferenceDataset => {
    const result = validateApiDataset(dataset);
    if (!result.valid) {throw new ApiReferenceValidationError(result.errors);}
    return dataset;
};

export const createApiDataset = (records: ReadonlyArray<ApiReferenceRecord>, options: Pick<ApiReferenceDataset, "generatedAt" | "sourceRevision">): ApiReferenceDataset => ({
    version: 1,
    generatedAt: options.generatedAt,
    checksum: checksumValue({ records, sourceRevision: options.sourceRevision }),
    ...(options.sourceRevision === undefined ? {} : { sourceRevision: options.sourceRevision }),
    records
});

const sourceUrl = (record: ApiReferenceRecord): string | undefined => record.link?.href;

export const recordToLlmDocument = (record: ApiReferenceRecord): ApiReferenceLlmDocument => {
    const url = sourceUrl(record);
    return {
        title: record.displayName,
        context: `${record.packageName} ${record.version}`,
        ...(url === undefined ? {} : { url }),
        content: [
            record.summary,
            `Exports: ${record.exportCount}`,
            record.introductionVersion === undefined ? "" : `Added in ${record.introductionVersion}`,
            ...record.declarations.map((declaration) => [ declaration.name, declaration.description, declaration.signature ].join("\n"))
        ].filter(Boolean).join("\n\n")
    };
};
