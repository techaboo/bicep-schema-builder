# Copilot Instructions - Bicep Schema Builder

## 🏗️ Project Architecture

This is a **client-side web application** for Azure Bicep/ARM template development with a modular architecture:

- **Frontend**: Vanilla JavaScript SPA with tabbed interface (`index.html`, `script.js`, `style.css`)
- **Core Logic**: Tab-aware validation system with dual-mode schema/template validation
- **Utilities**: `utils/schemaParser.js` (JSON Schema validation) and `utils/azureResourceGraph.js` (Azure integration)
- **Data**: 9 JSON schemas in `schemas/` and 7 production Bicep templates in `templates/`
- **Testing**: Node.js-based validation with AJV (`npm test`)

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
# Serve locally (required for file loading)
python -m http.server 8000
# Open http://localhost:8000

# Test schemas
npm test

# Validate Bicep templates  
az bicep build --file templates/storage-account.bicep
```

### Schema Updates
When modifying `schemas/*.json`:
1. Update the schema file
2. Run `npm test` to validate with AJV
3. Test in UI with sample data
4. Update corresponding Bicep template if needed

### Template Development
Bicep templates use 2023-2024 API versions and follow security-first patterns:
- Managed identity by default (`enableManagedIdentity: true`)
- HTTPS-only, TLS 1.2+ enforcement
- Private endpoints where applicable

## 🚨 Common Gotchas

### Theme Duplication Issue
`script.js` has duplicate `initializeTheme()` functions - keep only the version using `document.documentElement.setAttribute('data-theme', theme)`.

### ID Conflicts Across Tabs
Elements like `validateBtn`, `schemaEditor` exist in multiple tabs. Always use tab-aware selection:
```javascript
// ❌ Wrong - gets first match
document.getElementById('validateBtn')

// ✅ Correct - tab-aware
const activeTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab');
if (activeTab === 'schema-validator') {
  document.getElementById('validatorValidateBtn');
}
```

### Schema Parser Availability
Always check for utility availability:
```javascript
if (typeof SchemaParser !== 'undefined') {
  schemaParser = new SchemaParser();
} else {
  // Use fallback validation
  performBasicValidation();
}
```

## 🔗 Integration Points

### Azure Resource Graph
`utils/azureResourceGraph.js` provides live Azure resource querying when authenticated.

### GitHub Pages Deployment  
Auto-deploys via `.github/workflows/deploy.yml` on main branch pushes. No build step required (static files).

### CI/CD Validation
`.github/workflows/validate.yml` runs on template/schema changes:
- Bicep template compilation with Azure CLI
- JSON schema validation with AJV
- Security scanning with Trivy

## 📝 File Naming Conventions

- Schemas: `schemas/{resourceType}.json` (e.g., `storageAccount.json`)
- Templates: `templates/{resource-name}.bicep` (kebab-case)
- Tests: `tests/validate-{type}.js`
- Docs: Uppercase markdown in root (e.g., `DEPLOYMENT-GUIDE.md`)

## 🧪 Testing Strategy

Run `npm test` before commits - validates all schemas with AJV and checks ARM template structure. For UI testing, use browser dev tools with the tab-aware validation functions.