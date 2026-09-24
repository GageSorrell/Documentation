/**
 *
 *
 * @module @sorrell/docs-cli/AutomationLayer
 *
 * @file      AutomationLayer.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-cli/AutomationLayer */

import { Layer } from "effect";
import { ChecksumService } from "./Checksum.js";
import { AtomicDirectoryPromotion, ManifestTracker, SafeTargetValidation, TemplateRenderer } from "./Generation.js";
import { ArchiveService, GitHubService, GitService, NetworkRetry, VercelService } from "./Integrations.js";
import { AutomationOrchestrator } from "./Orchestration.js";
import { PackageManagerSelection } from "./PackageManager.js";
import { WorkspaceDiscovery } from "./Workspace.js";
import { docsCliLayer } from "./services.js";

export const docsAutomationLayer = Layer.mergeAll(
    docsCliLayer,
    WorkspaceDiscovery.layer,
    PackageManagerSelection.layer,
    TemplateRenderer.layer,
    SafeTargetValidation.layer,
    AtomicDirectoryPromotion.layer,
    ManifestTracker.layer,
    ChecksumService.layer,
    GitService.layer,
    GitHubService.layer,
    VercelService.layer,
    ArchiveService.layer,
    NetworkRetry.layer,
    AutomationOrchestrator.layer
);
