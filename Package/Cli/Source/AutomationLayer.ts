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

import {
    ArchiveService,
    GitHubService,
    GitService,
    NetworkRetry,
    VercelService
} from "./Integrations.js";
import {
    AtomicDirectoryPromotion,
    ManifestTracker,
    SafeTargetValidation,
    TemplateRenderer
} from "./Generation.js";
import { AutomationOrchestrator } from "./Orchestration.js";
import { ChecksumService } from "./Checksum.js";
import { DeploymentEnvironment } from "./Environment.js";
import { Layer } from "effect";
import { PackageManagerSelection } from "./PackageManager.js";
import { WorkspaceDiscovery } from "./Workspace.js";
import { docsCliLayer } from "./services.js";
export/** @internal */
const docsAutomationLayer = Layer.mergeAll(
    docsCliLayer,
    WorkspaceDiscovery.layer,
    PackageManagerSelection.layer,
    TemplateRenderer.layer,
    SafeTargetValidation.layer,
    AtomicDirectoryPromotion.layer,
    ManifestTracker.layer,
    ChecksumService.layer,
    DeploymentEnvironment.layer,
    GitService.layer,
    GitHubService.layer,
    VercelService.layer,
    ArchiveService.layer,
    NetworkRetry.layer,
    AutomationOrchestrator.layer
);
