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

import type {
    ApiReferenceAgentDocument,
    ApiReferenceDataset,
    ApiReferenceLlmDocument,
    ApiReferenceValidationResult
} from "./Types.js";
import type { ApiReferenceRecord } from "@sorrell/docs-core";
import { ApiReferenceValidationError } from "./Errors.js";
import { apiReferenceRecordToAgentDocument } from "@sorrell/docs-core";
import { createHash } from "node:crypto";
const sortValue = (value: unknown): unknown =>
{
    if (Array.isArray(value))
    {
        return value.map(sortValue);
    }
    if (value !== null && typeof value === "object")
    {
        return Object.fromEntries(
            Object.entries(value)
                .sort(
                    (
                        [ left ]: readonly [string, unknown],
                        [ right ]: readonly [string, unknown]
                    ) => left.localeCompare(right)
                )
                .map(([ key, entry ]: readonly [string, unknown]) => [
                    key,
                    sortValue(entry)
                ])
        );
    }
    return value;
};
export/** @internal */
const stableStringify = (value: unknown): string =>
    JSON.stringify(sortValue(value));
export/** @internal */
const checksumValue = (value: unknown): string =>
    createHash("sha256").update(stableStringify(value)).digest("hex");
const recordKey = (record: ApiReferenceRecord): string =>
    `${record.packageId}:${record.module}`;
export/** @internal */
const validateApiRecords = (
    records: ReadonlyArray<ApiReferenceRecord>
): ApiReferenceValidationResult =>
{
    const errors: Array<string> = [];
    const recordKeys = new Set<string>();
    for (const record of records)
    {
        const key = recordKey(record);
        if (recordKeys.has(key))
        {
            errors.push(`duplicate record ${key}`);
        }
        recordKeys.add(key);
        if (record.exportCount !== record.declarations.length)
        {
            errors.push(`${key} exportCount does not match declarations`);
        }
        const declarationIds = new Set<string>();
        for (const declaration of record.declarations)
        {
            if (declarationIds.has(declaration.id))
            {
                errors.push(
                    `${key} has duplicate declaration ${declaration.id}`
                );
            }
            declarationIds.add(declaration.id);
            if (!/^[A-Za-z0-9_$.-]+$/.test(declaration.id))
            {
                errors.push(
                    `${key} has unsafe declaration id ${declaration.id}`
                );
            }
            if (declaration.signature.trim() === "")
            {
                errors.push(`${key}/${declaration.id} has an empty signature`);
            }
        }
    }
    return {
        errors,
        valid: errors.length === 0
    };
};
export/** @internal */
const validateApiDataset = (
    dataset: ApiReferenceDataset
): ApiReferenceValidationResult =>
{
    const recordsResult = validateApiRecords(dataset.records);
    const expected = checksumValue({
        records: dataset.records,
        sourceRevision: dataset.sourceRevision
    });
    const errors = [
        ...recordsResult.errors,
        ...(dataset.checksum === expected
            ? []
            : [ "checksum does not match dataset contents" ])
    ];
    return {
        errors,
        valid: errors.length === 0
    };
};
export/** @internal */
const assertValidApiDataset = (
    dataset: ApiReferenceDataset
): ApiReferenceDataset =>
{
    const result = validateApiDataset(dataset);
    if (!result.valid)
    {
        throw new ApiReferenceValidationError(result.errors);
    }
    return dataset;
};
export/** @internal */
const createApiDataset = (
    records: ReadonlyArray<ApiReferenceRecord>,
    options: Pick<ApiReferenceDataset, "generatedAt" | "sourceRevision">
): ApiReferenceDataset => ({
    checksum: checksumValue({
        records,
        sourceRevision: options.sourceRevision
    }),
    generatedAt: options.generatedAt,
    version: 1,
    ...(options.sourceRevision === undefined
        ? {}
        : { sourceRevision: options.sourceRevision }),
    records
});
export/** @internal */
const recordToAgentDocument = (
    record: ApiReferenceRecord
): ApiReferenceAgentDocument => apiReferenceRecordToAgentDocument(record);
export/** @internal */
const recordToLlmDocument = (
    record: ApiReferenceRecord
): ApiReferenceLlmDocument => recordToAgentDocument(record);
