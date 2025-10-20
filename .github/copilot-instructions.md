# Copilot Instructions - Bicep Schema Builder# Copilot Instructions - Bicep Schema Builder



## 🏗️ Architecture Overview## 🏗️ Project Architecture



Client-side SPA for Azure Bicep/ARM development with **tab-aware validation system**:This is a **client-side web application** for Azure Bicep/ARM template development with a modular architecture:

- 4 main tabs: Schema Builder, ARM Converter, Schema Validator, Templates  

- Dual JSON Schema support: draft-07 (resources) + draft-04 (ARM templates)- **Frontend**: Vanilla JavaScript SPA with tabbed interface (`index.html`, `script.js`, `style.css`)

- Static deployment via GitHub Pages, no build step required- **Core Logic**: Tab-aware validation system with dual-mode schema/template validation

- **Utilities**: `utils/schemaParser.js` (JSON Schema validation) and `utils/azureResourceGraph.js` (Azure integration)

## 🎯 Critical Patterns- **Data**: 9 JSON schemas in `schemas/` (including ARM deployment template) and 7 production Bicep templates in `templates/`

- **Testing**: Node.js-based validation with AJV (`npm test`) supporting both draft-07 and draft-04 schemas

### Tab-Aware Element Management- **CI/CD**: GitHub Actions workflows for validation and GitHub Pages deployment

Elements like `validateBtn` exist in multiple tabs with different IDs. Always check active tab:

```javascript## 🎯 Key Development Patterns

const activeTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab');

// schema-builder → schemaEditor, validateBtn### Tab-Aware Element Binding

// schema-validator → codeInput, validatorValidateBtn  The app uses `data-tab` attributes for navigation. Always check active tab before operating on elements:

// arm-converter → armTemplateInput, analyzeArmBtn

``````javascript

const activeTab = document.querySelector('.nav-tab.active');

### Dual Schema Validation Architectureconst tabName = activeTab?.getAttribute('data-tab');

- `SchemaParser` class has `validationMode: 'resource'|'template'`const editor = document.getElementById(tabName === 'schema-validator' ? 'codeInput' : 'schemaEditor');

- AJV instances: one for draft-07, separate one for draft-04 (ARM templates)```

- ARM template detection: `parsedContent.$schema && parsedContent.resources`

### Dual Validation Modes

### Security-First Bicep TemplatesThe `SchemaParser` class supports both resource schemas and full ARM templates:

All templates in `templates/` follow hardcoded patterns in `SchemaParser.initializeBicepPatterns()`:- `validationMode: 'resource'` - Individual Azure resource validation

- API versions: 2023-2024 only- `validationMode: 'template'` - Complete ARM deployment template validation

- Default security: `supportsHttpsTrafficOnly: true`, `minimumTlsVersion: 'TLS1_2'`

- Managed identity: conditional `enableManagedIdentity` parameter### Schema Validation Strategy

- **AJV-based validation**: Two validators for draft-07 (default) and draft-04 (ARM templates)

## 🔧 Essential Workflows- **Bicep patterns**: Hardcoded API versions, resource types, and naming patterns in `SchemaParser.initializeBicepPatterns()`

- **Security-first templates**: All Bicep templates enforce HTTPS-only, TLS 1.2+, managed identities by default

### Local Development

```bash## 🎯 Complete Function Reference

python -m http.server 8000  # Required for fetch() calls

npm test  # Validates schemas with dual AJV setup### Core Application Functions

``````javascript

// Initialization & Setup

### Schema Updatesinit()                          // Main initialization function

1. Modify `schemas/*.json` (check `$schema` draft version)initializeTabs()               // Set up tab navigation and event listeners

2. Run `npm test` (handles both draft-04 and draft-07)initializeTheme()              // Load saved theme preference

3. Test in UI across relevant tabssetupEventListeners()          // Bind all UI event handlers

4. Update corresponding `templates/*.bicep` if needed

// Tab Management

### CI/CD Integration  switchTab(tabName)             // Navigate between tabs ('schema-builder', 'arm-converter', 'schema-validator', 'templates')

- `.github/workflows/validate.yml` triggers on `templates/**.bicep` and `schemas/**.json````

- Bicep compilation + AJV validation + Trivy security scanning

- Auto-deploy via GitHub Pages (static files only)### Theme System

```javascript

## 🚨 Key Gotchas// Theme Functions (Dark/Light Mode)

toggleTheme()                  // Switch between dark/light themes

- **File serving**: Must use HTTP server (not file://) for fetch() callsupdateThemeIcon(isDark)        // Update theme toggle button icon

- **Theme persistence**: `localStorage.getItem('bicep-builder-theme')` + `document.documentElement.setAttribute('data-theme', theme)`updateThemeButton(theme)       // Update button state and save preference

- **Utility availability**: Always check `typeof SchemaParser !== 'undefined'` before instantiation```

- **Mode switching**: Schema Validator has 3 modes affecting validation logic: resource/template/bicep
### Schema Builder Tab Functions
```javascript
// File Operations
handleFileUpload(event)        // Process uploaded JSON schema files
downloadSchema()               // Download current schema as JSON file
loadTemplate(templateName)     // Load predefined templates ('storage', 'webapp', 'vm', etc.)

// Editor Operations  
validateSchema()               // Main validation function with ARM/schema detection
formatJSON()                   // Format JSON content in active editor
clearEditor()                  // Clear editor content with confirmation
copyToClipboard(text, msg)     // Copy content to clipboard with notification

// Validation Modes
setValidationMode(mode)        // Switch between 'resource' and 'template' validation modes
```

### ARM Converter Tab Functions  
```javascript
// ARM Template Analysis & Conversion
analyzeArmTemplate()           // Analyze ARM template structure and resources
convertArmToBicep()           // Convert ARM template to Bicep format
downloadBicepTemplate()        // Download converted Bicep template

// ARM-specific formatting
formatBicepCode()             // Format Bicep code with proper indentation
```

### Schema Validator Tab Functions
```javascript
// Multi-format Validation
validateCode()                // Validate JSON/ARM/Bicep based on current mode
formatValidatorCode()         // Format code based on detected type (JSON/Bicep)
runTestSuite()               // Execute comprehensive validation test suite

// Mode Management (Schema Validator specific)
// Mode buttons: resourceModeBtn, templateModeBtn, bicepModeBtn
// Current modes: 'resource', 'template', 'bicep'
```

### Templates Tab Functions
```javascript
// Template Management
loadBicepTemplate(name)       // Load production Bicep templates
displayTemplateInfo(template) // Show template metadata and parameters
// Available templates: storage-account, web-app, virtual-machine, etc.
```

### Utility & Display Functions
```javascript
// Notification System
showSuccess(message)          // Green success notifications (3s timeout)
showError(message)           // Red error notifications (persistent)
showLoading(message)         // Loading state indicator
showNotificationPro(msg, type) // Advanced notifications with styling

// Validation Result Display
showValidationSuccess(results)     // Format and display successful validation
showValidationErrors(results)      // Format and display validation errors
showTemplateValidationResults(results) // ARM template-specific results
showValidationResults(results)     // Generic validation results

// Helper Functions
debounce(func, wait)          // Debounce function calls
createFallbackTemplate(name) // Generate basic template structure if file load fails
```

## 🔧 Critical Developer Workflows

### Local Development
```bash
# Serve locally (required for file loading - no build step needed)
python -m http.server 8000
# Open http://localhost:8000

# Test all schemas (validates both draft-07 and draft-04)
npm test

# Validate individual Bicep templates  
az bicep build --file templates/storage-account.bicep
```

### Complete Tab-by-Tab Workflow

#### Schema Builder Tab (`schema-builder`)
```javascript
// Key Elements: schemaFile, schemaEditor, validateBtn, formatBtn, downloadBtn, clearEditorBtn
// Primary Functions: validateSchema(), formatJSON(), downloadSchema(), clearEditor()
// File upload → Edit in schemaEditor → Validate → Format → Download
```

#### ARM Converter Tab (`arm-converter`) 
```javascript
// Key Elements: armTemplateInput, analyzeArmBtn, convertToBicepBtn, bicepOutput
// Primary Functions: analyzeArmTemplate(), convertArmToBicep(), downloadBicepTemplate()
// Paste ARM → Analyze → Configure → Convert to Bicep → Download
```

#### Schema Validator Tab (`schema-validator`)
```javascript
// Key Elements: codeInput, resourceModeBtn, templateModeBtn, bicepModeBtn, validatorValidateBtn
// Primary Functions: validateCode(), setValidationMode(), formatValidatorCode()
// Switch mode → Paste content → Validate → Format → Results
```

#### Templates Tab (`templates`)
```javascript
// Key Elements: Template cards, loadTemplate buttons for each predefined template
// Primary Functions: loadTemplate(), displayTemplateInfo()
// Browse templates → Load template → Edit in Schema Builder
```

### Schema Development Workflow
When modifying `schemas/*.json`:
1. Update the schema file (check `$schema` for draft version)
2. Run `npm test` to validate with AJV
3. Test in UI with sample data from the appropriate tab
4. Update corresponding Bicep template in `templates/` if API versions change

### Template Development Workflow
Bicep templates follow strict patterns:
- **API Versions**: Use 2023-2024 versions (defined in `SchemaParser.bicepPatterns.apiVersion`)
- **Security defaults**: `supportsHttpsTrafficOnly: true`, `minimumTlsVersion: 'TLS1_2'`
- **Managed identity**: `enableManagedIdentity` parameter with conditional identity block
- **Parameter patterns**: `@description()`, `@allowed()`, `@minLength()` decorators

## 🚨 Common Gotchas

### Element ID Conflicts Across Tabs
Critical elements have different IDs per tab - always use tab-aware selection:
```javascript
// ❌ Wrong - gets first match, could be wrong tab
document.getElementById('validateBtn')

// ✅ Correct - tab-aware selection
const activeTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab');
switch(activeTab) {
  case 'schema-builder': 
    document.getElementById('validateBtn');      // Schema Builder validate
    break;
  case 'schema-validator': 
    document.getElementById('validatorValidateBtn'); // Validator validate
    break;
  case 'arm-converter':
    document.getElementById('analyzeArmBtn');    // ARM analyze
    break;
}
```

### Editor Element Mapping by Tab
```javascript
// Each tab uses different editor elements:
'schema-builder'   → schemaEditor     (main JSON schema editor)
'arm-converter'    → armTemplateInput (ARM template input)
'schema-validator' → codeInput        (multi-format code input)
'templates'        → (readonly displays, loads into schemaEditor)
```

### Theme System Implementation
```javascript
// Theme persistence uses localStorage
localStorage.getItem('bicep-builder-theme')  // 'light' or 'dark'
document.documentElement.setAttribute('data-theme', theme)  // Apply theme
updateThemeIcon(isDark)  // Update toggle button appearance
```

### Validation Mode Confusion
Schema Validator tab has 3 distinct modes:
- `resourceModeBtn` → Individual resource schemas (JSON Schema draft-07)
- `templateModeBtn` → ARM deployment templates (JSON Schema draft-04) 
- `bicepModeBtn` → Bicep template syntax validation
- Mode affects validation logic and formatting behavior

### Schema Draft Version Requirements
- ARM templates (`armDeploymentTemplate.json`) use JSON Schema draft-04
- Individual resource schemas use JSON Schema draft-07
- Test script (`tests/validate-schemas.js`) handles both with separate AJV instances

### File Serving & Security
- App must be served via HTTP server (not file://) due to fetch() calls for templates
- Uses Content Security Policy: `upgrade-insecure-requests`
- No build step required - pure static files
```

## 🔗 Integration Points

### Azure Resource Graph
`utils/azureResourceGraph.js` provides live Azure resource querying when authenticated. Used in deployment builder for resource discovery.

### GitHub Pages Deployment  
Auto-deploys via `.github/workflows/deploy.yml` on main branch pushes. Static files only - no build step required.

### CI/CD Validation Pipeline
`.github/workflows/validate.yml` triggers on template/schema changes:
- **Bicep validation**: `az bicep build` for all templates in `templates/`
- **Schema validation**: AJV validation for both draft-07 and draft-04 schemas
- **Security scanning**: Trivy for Infrastructure as Code security checks
- **Triggers**: `templates/**.bicep`, `schemas/**.json`, `tests/**` file changes

## � File Organization Patterns

### Resource Naming Conventions
- **Schemas**: `schemas/{resourceType}.json` (camelCase, e.g., `storageAccount.json`)
- **Templates**: `templates/{resource-name}.bicep` (kebab-case, e.g., `storage-account.bicep`)
- **Tests**: `tests/validate-{type}.js` (descriptive)
- **Documentation**: Uppercase markdown files in root (e.g., `DEPLOYMENT-GUIDE.md`)

### Template Structure Pattern
All Bicep templates follow this structure:
```bicep
@description('...') param location string = resourceGroup().location
@description('...') @minLength(3) @maxLength(24) param resourceName string
@allowed([...]) param skuName string = 'Standard_LRS'
param enableManagedIdentity bool = false
param tags object = {}

resource mainResource '...' = {
  // Security-hardened properties by default
}
```

## 🧪 Testing Strategy

### Pre-commit Validation
```bash
npm test  # Validates all 9 schemas + ARM template structure with AJV
```

### Comprehensive UI Testing by Tab
```javascript
// Schema Builder Tab Testing
loadTemplate('storage') → validateSchema() → formatJSON() → downloadSchema()

// ARM Converter Tab Testing  
// Paste ARM template → analyzeArmTemplate() → convertArmToBicep() → downloadBicepTemplate()

// Schema Validator Tab Testing
setValidationMode('resource') → validateCode() → setValidationMode('template') → validateCode()

// Templates Tab Testing
// Click each template card → verify loadTemplate() → check content loads in Schema Builder
```

### Function Testing Checklist
- **Theme System**: toggleTheme() → verify localStorage persistence → check CSS custom properties
- **File Operations**: handleFileUpload() with valid/invalid JSON → downloadSchema() integrity
- **Validation Modes**: Test mode switching with content → verify validation behavior changes
- **Cross-tab Navigation**: switchTab() → verify active states → check element visibility
- **Error Handling**: Invalid JSON → network failures → missing elements

### Schema Update Testing Workflow
1. Modify schema in `schemas/`
2. Run `npm test` to catch JSON Schema validation issues
3. Test live in UI across all relevant tabs
4. Verify corresponding Bicep template still compiles with `az bicep build`
5. Test both upload and direct paste scenarios

### Browser Dev Tools Testing
```javascript
// Test tab-aware element selection
console.log(document.querySelector('.nav-tab.active')?.getAttribute('data-tab'))

// Test validation functions directly
validateSchema()  // or validateCode() depending on tab

// Test theme system
toggleTheme(); console.log(localStorage.getItem('bicep-builder-theme'))

// Test utility availability
console.log(typeof SchemaParser, typeof AzureResourceGraphClient)
```