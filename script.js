// Main application script
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Bicep Schema Builder loaded');
    
    // Initialize the application
    init();
});

// Global variables
let schemaParser;
let currentSchema = null;
let azureResourceGraph;

function init() {
    // Initialize schema parser
    schemaParser = new SchemaParser();
    
    // Initialize Azure Resource Graph client
    if (typeof AzureResourceGraphClient !== 'undefined') {
        azureResourceGraph = new AzureResourceGraphClient();
    }
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('✅ Application initialized');
}

function setupEventListeners() {
    // File upload
    const fileInput = document.getElementById('schemaFile');
    fileInput.addEventListener('change', handleFileUpload);
    
    // Editor buttons
    document.getElementById('validateBtn').addEventListener('click', validateSchema);
    document.getElementById('formatBtn').addEventListener('click', formatJSON);
    document.getElementById('downloadBtn').addEventListener('click', downloadSchema);
    
    // Template buttons
    const templateButtons = document.querySelectorAll('.template-btn');
    templateButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const template = e.target.dataset.template;
            loadTemplate(template);
            // Track template usage
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('template_load', 'Templates', template);
            }
        });
    });
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Export buttons
    const exportYaml = document.getElementById('exportYaml');
    const exportBicep = document.getElementById('exportBicep');
    if (exportYaml) exportYaml.addEventListener('click', exportAsYAML);
    if (exportBicep) exportBicep.addEventListener('click', exportAsBicep);
    
    // Azure integration buttons
    const azureAuth = document.getElementById('azureAuth');
    const azureResourceTypes = document.getElementById('azureResourceTypes');
    const azureValidate = document.getElementById('azureValidate');
    if (azureAuth) azureAuth.addEventListener('click', handleAzureAuth);
    if (azureResourceTypes) azureResourceTypes.addEventListener('click', browseAzureResourceTypes);
    if (azureValidate) azureValidate.addEventListener('click', validateWithAzure);
    
    // Editor real-time validation
    const editor = document.getElementById('schemaEditor');
    editor.addEventListener('input', debounce(validateSchemaRealTime, 1000));
    
    // Initialize theme
    initializeTheme();
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        showLoading('Loading schema...');
        const schema = await schemaParser.loadSchemaFromFile(file);
        currentSchema = schema;
        
        // Display in editor
        document.getElementById('schemaEditor').value = JSON.stringify(schema, null, 2);
        
        // Validate automatically
        validateSchema();
        
        showSuccess(`✅ Schema "${file.name}" loaded successfully!`);
    } catch (error) {
        showError(`❌ Error loading file: ${error.message}`);
    }
}

function validateSchema() {
    const editorContent = document.getElementById('schemaEditor').value.trim();
    
    if (!editorContent) {
        showError('❌ Please provide a schema to validate');
        return;
    }
    
    try {
        showLoading('Validating schema...');
        
        const schema = schemaParser.parseSchema(editorContent);
        currentSchema = schema;
        
        // Perform validation checks
        const validationResults = performDetailedValidation(schema);
        
        if (validationResults.isValid) {
            showValidationSuccess(validationResults);
        } else {
            showValidationErrors(validationResults);
        }
        
    } catch (error) {
        showError(`❌ Validation failed: ${error.message}`);
    }
}

function validateSchemaRealTime() {
    const editorContent = document.getElementById('schemaEditor').value.trim();
    if (!editorContent) return;
    
    try {
        JSON.parse(editorContent);
        // If we get here, JSON is valid
        document.getElementById('schemaEditor').style.borderColor = '#28a745';
    } catch (error) {
        document.getElementById('schemaEditor').style.borderColor = '#dc3545';
    }
}

function performDetailedValidation(schema) {
    const results = {
        isValid: true,
        errors: [],
        warnings: [],
        info: []
    };
    
    // Check for required top-level properties
    if (!schema.$schema) {
        results.warnings.push('Missing $schema property - recommended for JSON Schema validation');
    }
    
    if (!schema.type) {
        results.errors.push('Missing required "type" property');
        results.isValid = false;
    }
    
    if (!schema.title && !schema.description) {
        results.warnings.push('Consider adding title or description for better documentation');
    }
    
    // Check for Bicep-specific patterns
    if (schema.properties) {
        checkBicepProperties(schema.properties, results);
    }
    
    // Add info about schema
    results.info.push(`Schema type: ${schema.type || 'unknown'}`);
    if (schema.properties) {
        results.info.push(`Properties defined: ${Object.keys(schema.properties).length}`);
    }
    
    return results;
}

function checkBicepProperties(properties, results) {
    const bicepProperties = ['apiVersion', 'type', 'name', 'location', 'properties'];
    const foundBicepProps = bicepProperties.filter(prop => properties[prop]);
    
    if (foundBicepProps.length > 0) {
        results.info.push(`Bicep properties detected: ${foundBicepProps.join(', ')}`);
    }
    
    // Check for common Azure resource patterns
    if (properties.apiVersion && !properties.apiVersion.enum && !properties.apiVersion.pattern) {
        results.warnings.push('apiVersion should specify allowed values with enum or pattern');
    }
    
    if (properties.name && !properties.name.pattern && !properties.name.minLength) {
        results.warnings.push('Consider adding validation pattern for resource name');
    }
}

function formatJSON() {
    const editor = document.getElementById('schemaEditor');
    const content = editor.value.trim();
    
    if (!content) {
        showError('❌ No content to format');
        return;
    }
    
    try {
        const parsed = JSON.parse(content);
        editor.value = JSON.stringify(parsed, null, 2);
        showSuccess('✅ JSON formatted successfully!');
    } catch (error) {
        showError(`❌ Cannot format invalid JSON: ${error.message}`);
    }
}

function downloadSchema() {
    const content = document.getElementById('schemaEditor').value.trim();
    
    if (!content) {
        showError('❌ No schema to download');
        return;
    }
    
    try {
        // Validate JSON before download
        JSON.parse(content);
        
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bicep-schema.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess('✅ Schema downloaded successfully!');
    } catch (error) {
        showError(`❌ Cannot download invalid JSON: ${error.message}`);
    }
}

function loadTemplate(templateName) {
    const templates = {
        storage: 'schemas/storageAccount.json',
        webapp: 'schemas/webApp.json',
        vm: 'schemas/virtualMachine.json',
        keyvault: 'schemas/keyVault.json',
        sqldatabase: 'schemas/sqlDatabase.json',
        functions: 'schemas/azureFunctions.json',
        appplan: 'schemas/appServicePlan.json',
        vnet: 'schemas/virtualNetwork.json'
    };
    
    const templatePath = templates[templateName];
    if (!templatePath) {
        showError(`❌ Template "${templateName}" not found`);
        return;
    }
    
    // Load template from file
    fetch(templatePath)
        .then(response => response.json())
        .then(schema => {
            document.getElementById('schemaEditor').value = JSON.stringify(schema, null, 2);
            validateSchema();
            showSuccess(`✅ Loaded ${templateName} template`);
        })
        .catch(error => {
            // Fallback to inline template
            const fallbackTemplate = createFallbackTemplate(templateName);
            document.getElementById('schemaEditor').value = JSON.stringify(fallbackTemplate, null, 2);
            validateSchema();
            showSuccess(`✅ Loaded ${templateName} template (fallback)`);
        });
}

function createFallbackTemplate(templateName) {
    const baseTemplate = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "title": `${templateName.charAt(0).toUpperCase() + templateName.slice(1)} Schema`,
        "properties": {
            "apiVersion": { "type": "string" },
            "type": { "type": "string" },
            "name": { "type": "string" },
            "location": { "type": "string" }
        },
        "required": ["apiVersion", "type", "name"]
    };
    
    return baseTemplate;
}

// Utility functions
function showLoading(message) {
    const output = document.getElementById('validationOutput');
    output.className = 'output-panel';
    output.textContent = `⏳ ${message}`;
}

function showSuccess(message) {
    const output = document.getElementById('validationOutput');
    output.className = 'output-panel success';
    output.textContent = message;
    
    setTimeout(() => {
        if (output.textContent === message) {
            output.className = 'output-panel';
            output.innerHTML = '<p class="placeholder">Ready for next validation...</p>';
        }
    }, 3000);
}

function showError(message) {
    const output = document.getElementById('validationOutput');
    output.className = 'output-panel error';
    output.textContent = message;
}

function showValidationSuccess(results) {
    const output = document.getElementById('validationOutput');
    output.className = 'output-panel success';
    
    let message = '✅ Schema is valid!\n\n';
    
    if (results.info.length > 0) {
        message += 'ℹ️ Information:\n' + results.info.map(info => `  • ${info}`).join('\n') + '\n\n';
    }
    
    if (results.warnings.length > 0) {
        message += '⚠️ Warnings:\n' + results.warnings.map(warning => `  • ${warning}`).join('\n');
    }
    
    output.textContent = message;
}

function showValidationErrors(results) {
    const output = document.getElementById('validationOutput');
    output.className = 'output-panel error';
    
    let message = '❌ Schema validation failed!\n\n';
    
    if (results.errors.length > 0) {
        message += '🚨 Errors:\n' + results.errors.map(error => `  • ${error}`).join('\n') + '\n\n';
    }
    
    if (results.warnings.length > 0) {
        message += '⚠️ Warnings:\n' + results.warnings.map(warning => `  • ${warning}`).join('\n');
    }
    
    output.textContent = message;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('bicep-builder-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('bicep-builder-theme', newTheme);
    updateThemeButton(newTheme);
    
    // Track theme changes
    if (typeof window.trackEvent === 'function') {
        window.trackEvent('theme_toggle', 'UI', newTheme);
    }
}

function updateThemeButton(theme) {
    const themeButton = document.getElementById('themeToggle');
    if (themeButton) {
        themeButton.textContent = theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
    }
}

// Export Functions
function exportAsYAML() {
    const content = document.getElementById('schemaEditor').value.trim();
    if (!content) {
        showError('❌ No schema to export');
        return;
    }
    
    try {
        const schema = JSON.parse(content);
        const yamlContent = convertJSONToYAML(schema);
        
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bicep-schema.yaml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess('✅ Schema exported as YAML!');
        
        // Track export
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('export_yaml', 'Export', 'yaml');
        }
    } catch (error) {
        showError(`❌ Cannot export invalid JSON: ${error.message}`);
    }
}

function exportAsBicep() {
    const content = document.getElementById('schemaEditor').value.trim();
    if (!content) {
        showError('❌ No schema to export');
        return;
    }
    
    try {
        const schema = JSON.parse(content);
        const bicepContent = convertSchemaToBicep(schema);
        
        const blob = new Blob([bicepContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resource-template.bicep';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess('✅ Bicep template generated!');
        
        // Track export
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('export_bicep', 'Export', 'bicep');
        }
    } catch (error) {
        showError(`❌ Cannot generate Bicep: ${error.message}`);
    }
}

// Conversion Utilities
function convertJSONToYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';
    
    for (const [key, value] of Object.entries(obj)) {
        if (value === null) {
            yaml += `${spaces}${key}: null\n`;
        } else if (typeof value === 'boolean') {
            yaml += `${spaces}${key}: ${value}\n`;
        } else if (typeof value === 'number') {
            yaml += `${spaces}${key}: ${value}\n`;
        } else if (typeof value === 'string') {
            yaml += `${spaces}${key}: "${value}"\n`;
        } else if (Array.isArray(value)) {
            yaml += `${spaces}${key}:\n`;
            value.forEach(item => {
                if (typeof item === 'object') {
                    yaml += `${spaces}  -\n`;
                    yaml += convertJSONToYAML(item, indent + 2).split('\n').map(line => 
                        line ? `  ${line}` : ''
                    ).join('\n');
                } else {
                    yaml += `${spaces}  - ${JSON.stringify(item)}\n`;
                }
            });
        } else if (typeof value === 'object') {
            yaml += `${spaces}${key}:\n`;
            yaml += convertJSONToYAML(value, indent + 1);
        }
    }
    
    return yaml;
}

function convertSchemaToBicep(schema) {
    const resourceType = schema.properties?.type?.const || 'Microsoft.Resources/deployments';
    const resourceName = 'bicepResource';
    
    let bicep = `// Generated Bicep template from JSON Schema
// Resource Type: ${resourceType}

@description('The name of the resource')
param resourceName string = '${resourceName}'

@description('The location for the resource')
param location string = resourceGroup().location

`;

    // Add parameters based on schema properties
    if (schema.properties) {
        Object.entries(schema.properties).forEach(([propName, propSchema]) => {
            if (propName !== 'apiVersion' && propName !== 'type' && propName !== 'name' && propName !== 'location') {
                bicep += generateBicepParameter(propName, propSchema);
            }
        });
    }

    // Add the resource definition
    bicep += `
resource ${resourceName.replace(/[^a-zA-Z0-9]/g, '')} '${resourceType}@${getLatestApiVersion(schema)}' = {
  name: resourceName
  location: location
`;

    // Add properties
    if (schema.properties?.properties) {
        bicep += `  properties: {\n`;
        bicep += `    // Add your resource properties here based on the schema\n`;
        bicep += `  }\n`;
    }

    bicep += `}

output resourceId string = ${resourceName.replace(/[^a-zA-Z0-9]/g, '')}.id
`;

    return bicep;
}

function generateBicepParameter(name, schema) {
    let param = `@description('${schema.description || `Parameter for ${name}`}')\n`;
    
    if (schema.enum) {
        param += `@allowed([${schema.enum.map(v => `'${v}'`).join(', ')}])\n`;
    }
    
    const type = getBicepType(schema);
    param += `param ${name} ${type}\n\n`;
    
    return param;
}

function getBicepType(schema) {
    switch (schema.type) {
        case 'string': return 'string';
        case 'integer': 
        case 'number': return 'int';
        case 'boolean': return 'bool';
        case 'array': return 'array';
        case 'object': return 'object';
        default: return 'string';
    }
}

function getLatestApiVersion(schema) {
    if (schema.properties?.apiVersion?.enum) {
        const versions = schema.properties.apiVersion.enum;
        return versions[versions.length - 1];
    }
    return '2022-01-01';
}

// Enhanced Analytics Tracking
function trackSchemaValidation(isValid, resourceType = 'unknown') {
    if (typeof window.trackEvent === 'function') {
        window.trackEvent('schema_validation', 'Validation', `${isValid ? 'valid' : 'invalid'}_${resourceType}`);
    }
}

function trackFileUpload(fileSize, fileName) {
    if (typeof window.trackEvent === 'function') {
        window.trackEvent('file_upload', 'File Operations', `${fileName}_${Math.round(fileSize/1024)}KB`);
    }
}

// Add tracking to existing functions
const originalValidateSchema = validateSchema;
validateSchema = function() {
    const result = originalValidateSchema.apply(this, arguments);
    const content = document.getElementById('schemaEditor').value.trim();
    if (content) {
        try {
            const schema = JSON.parse(content);
            const resourceType = schema.properties?.type?.const || 'unknown';
            trackSchemaValidation(true, resourceType);
        } catch (error) {
            trackSchemaValidation(false);
        }
    }
    return result;
};

// Enhanced file upload tracking
const originalHandleFileUpload = handleFileUpload;
handleFileUpload = async function(event) {
    const file = event.target.files[0];
    if (file) {
        trackFileUpload(file.size, file.name);
    }
    return originalHandleFileUpload.apply(this, arguments);
};

// Azure Integration Functions
async function handleAzureAuth() {
    if (!azureResourceGraph) {
        showError('❌ Azure Resource Graph client not available');
        return;
    }

    try {
        showLoading('Connecting to Azure...');
        
        // For demo purposes, we'll simulate authentication
        // In a real implementation, you'd use MSAL.js or similar
        const mockAuth = await simulateAzureAuth();
        
        if (mockAuth.success) {
            azureResourceGraph.initialize(mockAuth.accessToken);
            updateAzureStatus(true);
            
            // Load resource types in background
            azureResourceGraph.getResourceTypes()
                .then(() => showSuccess('✅ Connected to Azure and loaded resource types'))
                .catch(error => showError(`⚠️ Connected but failed to load some data: ${error.message}`));
        } else {
            throw new Error(mockAuth.error);
        }
    } catch (error) {
        showError(`❌ Azure authentication failed: ${error.message}`);
        updateAzureStatus(false);
    }
}

async function simulateAzureAuth() {
    // Simulate authentication flow
    // In real implementation, replace with proper MSAL.js authentication
    return new Promise((resolve) => {
        setTimeout(() => {
            const shouldSucceed = Math.random() > 0.3; // 70% success rate for demo
            if (shouldSucceed) {
                resolve({
                    success: true,
                    accessToken: 'demo-token-' + Date.now() // Mock token
                });
            } else {
                resolve({
                    success: false,
                    error: 'Authentication cancelled by user'
                });
            }
        }, 2000);
    });
}

async function browseAzureResourceTypes() {
    if (!azureResourceGraph || !azureResourceGraph.isAuthenticated()) {
        showError('❌ Please connect to Azure first');
        return;
    }

    try {
        showLoading('Loading Azure resource types...');
        
        const resourceTypes = await azureResourceGraph.getResourceTypes();
        displayResourceTypeBrowser(resourceTypes);
        
    } catch (error) {
        showError(`❌ Failed to load resource types: ${error.message}`);
    }
}

function displayResourceTypeBrowser(resourceTypes) {
    const modal = createModal('Azure Resource Types', 'Close');
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search resource types...';
    searchInput.style.width = '100%';
    searchInput.style.padding = '10px';
    searchInput.style.marginBottom = '20px';
    searchInput.style.border = '1px solid #ccc';
    searchInput.style.borderRadius = '4px';
    
    const resourceList = document.createElement('div');
    resourceList.style.maxHeight = '400px';
    resourceList.style.overflowY = 'auto';
    
    function renderResourceTypes(types) {
        resourceList.innerHTML = '';
        types.forEach(rt => {
            const item = document.createElement('div');
            item.style.padding = '8px';
            item.style.border = '1px solid #eee';
            item.style.marginBottom = '5px';
            item.style.cursor = 'pointer';
            item.style.borderRadius = '4px';
            item.innerHTML = `
                <strong>${rt.type}</strong><br>
                <small>Provider: ${rt.provider}</small>
            `;
            item.addEventListener('click', () => {
                createSchemaForResourceType(rt.type);
                modal.remove();
            });
            resourceList.appendChild(item);
        });
    }
    
    searchInput.addEventListener('input', (e) => {
        const filtered = resourceTypes.filter(rt => 
            rt.type.toLowerCase().includes(e.target.value.toLowerCase())
        );
        renderResourceTypes(filtered);
    });
    
    renderResourceTypes(resourceTypes.slice(0, 50)); // Show first 50 initially
    
    modal.querySelector('.modal-content').appendChild(searchInput);
    modal.querySelector('.modal-content').appendChild(resourceList);
    
    showSuccess(`✅ Loaded ${resourceTypes.length} resource types`);
}

async function createSchemaForResourceType(resourceType) {
    try {
        showLoading(`Generating schema for ${resourceType}...`);
        
        const apiVersions = await azureResourceGraph.getApiVersions(resourceType);
        const locations = await azureResourceGraph.getResourceLocations(resourceType);
        
        const schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "title": `${resourceType} Schema`,
            "description": `Auto-generated schema for ${resourceType}`,
            "properties": {
                "apiVersion": {
                    "type": "string",
                    "enum": apiVersions,
                    "description": "The API version for the resource"
                },
                "type": {
                    "type": "string",
                    "const": resourceType,
                    "description": "The resource type"
                },
                "name": {
                    "type": "string",
                    "description": "The name of the resource"
                },
                "location": {
                    "type": "string",
                    "enum": locations,
                    "description": "The Azure region for the resource"
                },
                "properties": {
                    "type": "object",
                    "description": "Resource-specific properties"
                }
            },
            "required": ["apiVersion", "type", "name"]
        };
        
        document.getElementById('schemaEditor').value = JSON.stringify(schema, null, 2);
        validateSchema();
        showSuccess(`✅ Generated schema for ${resourceType}`);
        
        // Track schema generation
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('schema_generation', 'Azure Integration', resourceType);
        }
    } catch (error) {
        showError(`❌ Failed to generate schema: ${error.message}`);
    }
}

async function validateWithAzure() {
    const content = document.getElementById('schemaEditor').value.trim();
    if (!content) {
        showError('❌ No schema to validate');
        return;
    }

    if (!azureResourceGraph || !azureResourceGraph.isAuthenticated()) {
        showError('❌ Please connect to Azure first');
        return;
    }

    try {
        showLoading('Validating with Azure...');
        
        const schema = JSON.parse(content);
        const resourceType = schema.properties?.type?.const;
        
        if (!resourceType) {
            showError('❌ Schema must specify a resource type');
            return;
        }
        
        const isValid = await azureResourceGraph.validateResourceType(resourceType);
        const apiVersions = await azureResourceGraph.getApiVersions(resourceType);
        const schemaApiVersion = schema.properties?.apiVersion?.enum || schema.properties?.apiVersion?.const;
        
        let message = `✅ Azure Validation Results:\n\n`;
        
        if (isValid) {
            message += `✅ Resource type "${resourceType}" exists in Azure\n`;
        } else {
            message += `❌ Resource type "${resourceType}" not found in Azure\n`;
        }
        
        if (schemaApiVersion) {
            const validVersions = Array.isArray(schemaApiVersion) ? schemaApiVersion : [schemaApiVersion];
            const invalidVersions = validVersions.filter(v => !apiVersions.includes(v));
            
            if (invalidVersions.length === 0) {
                message += `✅ All API versions are valid\n`;
            } else {
                message += `⚠️ Invalid API versions: ${invalidVersions.join(', ')}\n`;
                message += `📋 Valid versions: ${apiVersions.slice(-3).join(', ')}\n`;
            }
        }
        
        const output = document.getElementById('validationOutput');
        output.className = isValid ? 'output-panel success' : 'output-panel error';
        output.textContent = message;
        
    } catch (error) {
        showError(`❌ Azure validation failed: ${error.message}`);
    }
}

function updateAzureStatus(connected) {
    const statusEl = document.getElementById('azureStatus');
    const authBtn = document.getElementById('azureAuth');
    const resourceTypesBtn = document.getElementById('azureResourceTypes');
    const validateBtn = document.getElementById('azureValidate');
    
    if (connected) {
        statusEl.innerHTML = '<p>✅ Connected to Azure. Live validation enabled.</p>';
        authBtn.textContent = '🔓 Disconnect from Azure';
        resourceTypesBtn.disabled = false;
        validateBtn.disabled = false;
    } else {
        statusEl.innerHTML = '<p>🔒 Not connected to Azure. Connect to enable live resource validation.</p>';
        authBtn.textContent = '🔐 Connect to Azure';
        resourceTypesBtn.disabled = true;
        validateBtn.disabled = true;
    }
}

function createModal(title, closeText) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); display: flex; align-items: center; 
        justify-content: center; z-index: 1000;
    `;
    
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.cssText = `
        background: white; padding: 20px; border-radius: 8px; 
        max-width: 600px; width: 90%; max-height: 80%; overflow-y: auto;
    `;
    
    const header = document.createElement('h3');
    header.textContent = title;
    header.style.marginBottom = '20px';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = closeText;
    closeBtn.style.cssText = 'float: right; padding: 5px 10px;';
    closeBtn.addEventListener('click', () => modal.remove());
    
    content.appendChild(closeBtn);
    content.appendChild(header);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    return modal;
}