# Bicep Visual Builder – Prototype Experience

## 1. Vision
- Enable infrastructure engineers and app developers to compose Azure Bicep templates through a guided, visual-first workflow.
- Provide guardrails (schema-driven validation, contextual help, policy hints) while preserving the ability to drop into raw Bicep editing.
- Support a seamless transition from design to deployment within an authenticated Azure session.

## 2. Personas & Goals
- **Visual-first developer**: Prefers drag-and-drop authoring but still wants visibility into generated code.
- **Infra engineer**: Needs confidence that generated Bicep follows standards, supports parameterization, and integrates with CI/CD.
- **Reviewer/Architect**: Wants to inspect diffs, enforce modules, and validate against enterprise policies before approving deployment.

## 3. High-Level Architecture
```
+------------------------------------------------------------+
| Desktop/Web Shell (Electron or Tauri, alt: PWAs)           |
|  - UI Layer: React + Fluent UI + Zustand (state)           |
|  - Monaco Editor (Bicep mode) + Language Server bridge     |
|  - Visualization Canvas (Graph/Tree via D3/React Flow)    |
|  - Azure Auth Status Bar & Notification Center             |
|                                                            |
|  Services / Hooks                                          |
|  - Bicep Service: wasm-compiled bicep CLI & schemastore    |
|  - Template Library: local catalog + remote sync           |
|  - Validation Service: JSON schema + custom analyzers      |
|  - Azure SDK Bridge: @azure/identity, @azure/arm-resources |
|                                                            |
|  Local Storage                                             |
|  - IndexedDB (drafts, undo history, cached schemas)        |
|  - Settings (theme, CLI path, policy pack version)         |
+------------------------------------------------------------+
| External                                                  |
|  - Azure CLI / Azure Account Extension (auth)             |
|  - Bicep CLI (optional external dependency)               |
|  - Azure Resource Manager / ARM Deployment APIs           |
|  - Azure Policy / Template Specs (optional)               |
+------------------------------------------------------------+
```

## 4. Core Screens & Flows

### 4.1 Welcome & Workspace Selection
- Detects existing projects (recent files, Git repos).
- Offers "Create new template", "Import Bicep", "Browse template library".
- Shows Azure connection status and recommended tasks (connect, configure policy packs).

### 4.2 Visual Designer (Deployment Plan View)
- **Left rail**: Resource explorer (tree grouped by subscription/resource group/module). Includes search, filters, policy badges.
- **Canvas**: Drag-and-drop placement of resources; connectors represent dependencies (e.g., `dependsOn`, module outputs).
- **Property Panel**: Tabbed detail view (Basics, Parameters, Outputs, Tags, Advanced). Inline validation based on Bicep type system.
- **Breadcrumb & Tabs**: Navigate between main template and nested modules.
- Live preview toggles between Diagram, Form, Raw Code.

### 4.3 Code & Schema Pane
- Monaco editor with Bicep LSP: completions, diagnostics, hover docs.
- Two-way sync with visual designer (changes propagate both ways).
- Parameter/variable scaffolding wizard (auto-suggest defaults, secure values via Key Vault).
- "Explain this resource" tooltip leveraging reference docs.

### 4.4 Validation & Review Hub
- Aggregates validation results: syntax, schema compliance, naming conventions, policy pack, what-if preview.
- Provides remediation suggestions and quick-fix actions.
- Supports export of validation report (Markdown/HTML) for audits.

### 4.5 Deployment Center
- **Authentication Widget**: Shows signed-in account, subscriptions, `az` context. Displays spinner/status while authenticating; provides "Connect with Azure CLI" or "Device Login".
- **What-if Preview**: Uses ARM what-if API; displays resource diff visualization.
- **Deployment Targets**: Choose scope (subscription, resource group, management group).
- **Publish Actions**: `Deploy now`, `Generate deployment script`, `Create Template Spec`, `Export CICD pipeline yaml`.
- Tracks recent deployments, capture outputs, link to Azure Portal.

### 4.6 Resource Creation Wizard
- Guided steps: Select resource type → Choose preset/blueprint → Configure properties → Review generated module.
- Leverages schema metadata to display contextual help, allowed values, default values.
- Supports cloning resources, saving custom snippets to library.

### 4.7 Azure Session Feedback
- Top-right status indicator: `Disconnected`, `Connecting`, `Authenticated`.
- Toast & activity log entries when authentication succeeds/fails.
- Intelligent prompts when user attempts deployment without active session.

## 5. Key UX Patterns
- **Progressive disclosure**: Advanced settings tucked behind "Advanced" accordions.
- **Inline validation**: Real-time hints; highlight field-level errors; show aggregated issues panel.
- **Undo/Redo timeline**: Visual history slider for reverting to previous revisions.
- **Collaboration hooks**: Export sharable state (JSON manifest) or connect to Git for versioning.
- **Accessibility**: Keyboard-first navigation, high-contrast theme, screen reader labels.

## 6. Data Flow Overview
```
User action → UI dispatch → State store update (Zustand) → 
  - If visual edit: transform to Bicep AST via Bicep Service → update Monaco document.
  - If code edit: parse Bicep via LSP diagnostics → update visual graph model.
  - Validate → run schema + analyzer pipeline → surface results.
  - Deploy → Azure SDK client uses auth context → call ARM APIs.
```

## 7. Offline & Sync Strategy
- Core editing, validation, and template browsing work offline (local cache).
- Azure-dependent features (resource discovery, policy checks, deployments) greyed out with tooltip when offline.
- Local drafts auto-saved; optional sync to Git or OneDrive/SharePoint via extension.

## 8. Extensibility Hooks
- Plugin system for custom analyzers (drop-in JS modules).
- Policy pack import that injects enterprise rules (naming, tagging).
- Template marketplace integration (pull curated bicep modules from Git repos).
- Telemetry opt-in (Azure App Insights) for usage analytics.

## 9. Non-Functional Requirements
- Cross-platform desktop (Windows, macOS, Linux) with light web fallback.
- Fast parsing/render cycles (<150ms for most operations).
- Secure storage of credentials (leverage OS keychain via @azure/msal-node or VS Code account extension).
- Unit/integration tests using Vitest/Playwright; LSP contract tests.

## 10. Prototype Roadmap
1. Spike: Monaco + Bicep LSP integration inside Electron shell.
2. Implement resource palette + canvas with dummy data.
3. Create schema-driven form generator (leveraging bicep type metadata).
4. Hook up validation pane (local analyzers first).
5. Integrate Azure authentication (use Azure Identity with CLI credential fallback).
6. Enable `what-if` preview and deployment actions.

## 11. Recommended Tooling & SDKs
- **Runtime shell**: Electron (Node 20+) or Tauri (Rust backend, lighter footprint).
- **UI framework**: React 18 with Fluent UI v9 for native Azure look-and-feel; alternative is Svelte + Carbon.
- **State management**: Zustand or Redux Toolkit (predictable undo/redo) + React Query for async Azure data.
- **Diagramming**: React Flow or ElkJS (graph layout) for dependency visualization.
- **Editor**: Monaco Editor with Bicep language service (via `@azure-tools/monaco-bicep` or custom LSP bridge).
- **Bicep compilation**: `bicep-wasm` (compile/what-if locally) backed by optional local CLI fallback.
- **Schema intelligence**: Use `az bicep build-params` schemas, plus `@azure/arm-resources` for resource metadata.
- **Validation**: `ajv` for JSON schema checks, custom analyzers built on Bicep semantic model, Azure Policy Insights for compliance.
- **Azure authentication**: `@azure/identity` (DefaultAzureCredential, InteractiveBrowserCredential, AzureCliCredential) + MSAL for fallback, integrate with `azure-account` VS Code extension conceptually.
- **Azure management SDKs**: `@azure/arm-resources`, `@azure/arm-policy`, `@azure/arm-deployments`, `@azure/arm-template-specs`, `@azure/arm-resourcegraph`.
- **Deployment & what-if**: REST via `@azure/arm-resources` `DeploymentOperations`, or direct CLI invocation when CLI credential present.
- **Packaging & updates**: Electron Builder or Tauri updater, optional winget/Homebrew recipes.
- **Testing**: Vitest + React Testing Library, Playwright for end-to-end UI tests, dependency injection for Azure clients (nock for offline tests).

## 12. Seed Bicep Modules Included
- `templates/storage-account.bicep`: Opinionated StorageV2 account with TLS hardening, managed identity output.
- `templates/web-app.bicep`: App Service plan + Linux Web App scaffold, runtime selection, managed identity toggle.
- `templates/vnet-with-subnets.bicep`: Parametrized virtual network with subnet definitions, optional NSG/link policy handling.
- These modules can power the template library inside the GUI (Blueprint presets). Each exposes parameters aligned with the visual form fields so the UI can map inputs directly to module parameters.
