# Copilot Instructions - Bicep Schema Builder

## 🏗️ Project Architecture

This is a **client-side web application** for Azure Bicep/ARM template development with a modular architecture:

- **Frontend**: Vanilla JavaScript SPA with tabbed interface (`index.html`, `script.js`, `style.css`)
- **Core Logic**: Tab-aware validation system with dual-mode schema/template validation
- **Utilities**: `utils/schemaParser.js` (JSON Schema validation) and `utils/azureResourceGraph.js` (Azure integration)
- **Data**: 9 JSON schemas in `schemas/` (including ARM deployment template) and 7 production Bicep templates in `templates/`
- **Testing**: Node.js-based validation with AJV (`npm test`) supporting both draft-07 and draft-04 schemas
- **CI/CD**: GitHub Actions workflows for validation and GitHub Pages deployment

## 🎯 Key Development Patterns

### Tab-Aware Element Binding
The app uses `data-tab` attributes for navigation. Always check active tab before operating on elements:

```javascript
const activeTab = document.querySelector('.nav-tab.active');
const tabName = activeTab?.getAttribute('data-tab');
const editor = document.getElementById(tabName === 'schema-validator' ? 'codeInput' : 'schemaEditor');
```

### Dual Validation Modes
The `SchemaParser` class supports both resource schemas and full ARM templates:
- `validationMode: 'resource'` - Individual Azure resource validation
- `validationMode: 'template'` - Complete ARM deployment template validation

### Schema Validation Strategy
- **AJV-based validation**: Two validators for draft-07 (default) and draft-04 (ARM templates)
- **Bicep patterns**: Hardcoded API versions, resource types, and naming patterns in `SchemaParser.initializeBicepPatterns()`
- **Security-first templates**: All Bicep templates enforce HTTPS-only, TLS 1.2+, managed identities by default

### Event Binding Strategy
Use centralized button binding to avoid duplicate event listeners:

```javascript
const ACTIONS = [
  ['validateBtn', validateSchema],
  ['formatBtn', formatJson],
  // ...map all buttons to handlers
];

function bindUIActions() {
  for (const [id, handler] of ACTIONS) {
    const element = document.getElementById(id);
    if (element) element.addEventListener('click', handler);
  }
}
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
Elements like `validateBtn`, `schemaEditor` exist in multiple tabs. Always use tab-aware selection:
```javascript
// ❌ Wrong - gets first match
document.getElementById('validateBtn')

// ✅ Correct - tab-aware selection
const activeTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab');
if (activeTab === 'schema-validator') {
  document.getElementById('validatorValidateBtn');
}
```

### Schema Draft Version Confusion
- ARM templates use draft-04 (`schemas/armDeploymentTemplate.json`)
- Individual resource schemas use draft-07
- Test script handles both with separate AJV instances

### Utility Availability Checks
Always check for utility availability before instantiation:
```javascript
if (typeof SchemaParser !== 'undefined') {
  schemaParser = new SchemaParser();
} else {
  console.warn('⚠️ SchemaParser not available - using basic validation only');
}
```

### File Serving Requirements
The app must be served via HTTP server (not file://) due to fetch() calls for loading schemas and templates.
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
npm test  # Validates all 9 schemas + ARM template structure
```

### UI Testing Approach
- Use browser dev tools with tab-aware validation functions
- Test schema upload/validation in each tab independently
- Verify dual-mode validation (resource vs template modes)

### Schema Update Testing
1. Modify schema in `schemas/`
2. Run `npm test` to catch JSON Schema issues
3. Test live in UI with sample resource JSON
4. Verify corresponding Bicep template still compiles