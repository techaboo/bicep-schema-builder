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
    const clearEditorBtn = document.getElementById('clearEditorBtn');
    if (clearEditorBtn) clearEditorBtn.addEventListener('click', clearEditor);
    
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
    
    // Deployment builder buttons
    const validateAllResources = document.getElementById('validateAllResources');
    const configureResources = document.getElementById('configureResources');
    const previewDeployment = document.getElementById('previewDeployment');
    const exportSelectedBicep = document.getElementById('exportSelectedBicep');
    const downloadDeploymentPackage = document.getElementById('downloadDeploymentPackage');
    if (validateAllResources) validateAllResources.addEventListener('click', validateAllSelectedResources);
    if (configureResources) configureResources.addEventListener('click', openResourceConfigModal);
    if (previewDeployment) previewDeployment.addEventListener('click', previewSelectedDeployment);
    if (exportSelectedBicep) exportSelectedBicep.addEventListener('click', exportSelectedResourcesBicep);
    if (downloadDeploymentPackage) downloadDeploymentPackage.addEventListener('click', downloadDeploymentPackageZip);
    
    // Modal controls
    const closeConfigModal = document.getElementById('closeConfigModal');
    const saveConfig = document.getElementById('saveConfig');
    const resetConfig = document.getElementById('resetConfig');
    if (closeConfigModal) closeConfigModal.addEventListener('click', closeResourceConfigModal);
    if (saveConfig) saveConfig.addEventListener('click', saveResourceConfiguration);
    if (resetConfig) resetConfig.addEventListener('click', resetResourceConfiguration);
    
    // Resource selection checkboxes
    const resourceCheckboxes = document.querySelectorAll('.resource-checkbox input[type="checkbox"]');
    resourceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedResources);
    });
    
    // Editor real-time validation
    const editor = document.getElementById('schemaEditor');
    editor.addEventListener('input', debounce(validateSchemaRealTime, 1000));

    // Validation mode toggle buttons
    const resourceModeBtn = document.getElementById('resourceModeBtn');
    const templateModeBtn = document.getElementById('templateModeBtn');
    if (resourceModeBtn) resourceModeBtn.addEventListener('click', () => setValidationMode('resource'));
    if (templateModeBtn) templateModeBtn.addEventListener('click', () => setValidationMode('template'));

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

        const parsedContent = JSON.parse(editorContent);
        currentSchema = parsedContent;

        // Check validation mode
        const validationMode = schemaParser.getValidationMode();

        let validationResults;

        // Auto-detect if content is ARM template
        if (schemaParser.isArmTemplate(parsedContent)) {
            // Automatically switch to template mode if we detect an ARM template
            if (validationMode === 'resource') {
                setValidationMode('template');
            }
            validationResults = schemaParser.validateCompleteTemplate(parsedContent);
            showTemplateValidationResults(validationResults);
        } else if (validationMode === 'template') {
            // User selected template mode, validate as ARM template
            validationResults = schemaParser.validateCompleteTemplate(parsedContent);
            showTemplateValidationResults(validationResults);
        } else {
            // Resource schema mode
            const schema = schemaParser.parseSchema(editorContent);
            validationResults = performDetailedValidation(schema);

            if (validationResults.isValid) {
                showValidationSuccess(validationResults);
            } else {
                showValidationErrors(validationResults);
            }
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

function clearEditor() {
    const editor = document.getElementById('schemaEditor');
    const content = editor.value.trim();

    if (!content) {
        showSuccess('✅ Editor is already empty');
        return;
    }

    if (confirm('Are you sure you want to clear the editor?\n\nThis action cannot be undone.')) {
        editor.value = '';
        currentSchema = null;
        document.getElementById('validationOutput').innerHTML = '<p class="placeholder">Upload or paste a schema to see validation results...</p>';
        document.getElementById('validationOutput').className = 'output-panel';
        editor.style.borderColor = '';
        showSuccess('✅ Editor cleared successfully!');

        // Track clear action
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('editor_clear', 'Editor', 'clear');
        }
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
        armtemplate: 'schemas/armDeploymentTemplate.json',
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

    // If loading ARM template, switch to template mode
    if (templateName === 'armtemplate') {
        setValidationMode('template');
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

function showTemplateValidationResults(results) {
    const output = document.getElementById('validationOutput');

    if (results.valid) {
        output.className = 'output-panel success';

        let message = '✅ ARM Template is valid!\n\n';
        message += '📦 Template Information:\n';
        message += `  • Resource Count: ${results.resourceCount}\n`;
        message += `  • Has Parameters: ${results.hasParameters ? 'Yes' : 'No'}\n`;
        message += `  • Has Variables: ${results.hasVariables ? 'Yes' : 'No'}\n`;
        message += `  • Has Outputs: ${results.hasOutputs ? 'Yes' : 'No'}\n\n`;

        if (results.warnings.length > 0) {
            message += '⚠️ Warnings:\n' + results.warnings.map(warning => `  • ${warning}`).join('\n');
        }

        output.textContent = message;
    } else {
        output.className = 'output-panel error';

        let message = '❌ ARM Template validation failed!\n\n';

        if (results.errors.length > 0) {
            message += '🚨 Errors:\n' + results.errors.map(error => `  • ${error}`).join('\n') + '\n\n';
        }

        if (results.warnings.length > 0) {
            message += '⚠️ Warnings:\n' + results.warnings.map(warning => `  • ${warning}`).join('\n');
        }

        output.textContent = message;
    }
}

function setValidationMode(mode) {
    // Check if user is switching modes with content
    const editorContent = document.getElementById('schemaEditor').value.trim();
    const currentMode = schemaParser.getValidationMode();

    if (editorContent && currentMode !== mode) {
        const modeNames = {
            'resource': 'Resource Schema',
            'template': 'ARM Template'
        };

        const confirmMessage = `You're switching from ${modeNames[currentMode]} to ${modeNames[mode]} mode.\n\n` +
                              `Do you want to:\n` +
                              `• OK - Keep the current content and re-validate in the new mode\n` +
                              `• Cancel - Stay in ${modeNames[currentMode]} mode`;

        if (!confirm(confirmMessage)) {
            // User cancelled - revert the button state
            if (currentMode === 'resource') {
                document.getElementById('resourceModeBtn').classList.add('active');
                document.getElementById('templateModeBtn').classList.remove('active');
            } else {
                document.getElementById('templateModeBtn').classList.add('active');
                document.getElementById('resourceModeBtn').classList.remove('active');
            }
            return;
        }
    }

    // Update schema parser mode
    schemaParser.setValidationMode(mode);

    // Update UI
    const resourceModeBtn = document.getElementById('resourceModeBtn');
    const templateModeBtn = document.getElementById('templateModeBtn');
    const currentModeText = document.getElementById('currentMode');
    const modeDescription = document.getElementById('modeDescription');
    const helpText = document.getElementById('helpText');
    const helpBanner = document.getElementById('editorHelpBanner');

    if (mode === 'resource') {
        resourceModeBtn.classList.add('active');
        templateModeBtn.classList.remove('active');
        currentModeText.textContent = '📄 Resource Schema';
        if (modeDescription) modeDescription.textContent = 'For validating schema definitions';
        if (helpText) helpText.textContent = 'Paste a resource schema JSON or click a template below to get started';
        if (helpBanner) helpBanner.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)';
        document.getElementById('schemaEditor').placeholder = 'Paste your resource JSON schema here or upload a file...';
    } else if (mode === 'template') {
        templateModeBtn.classList.add('active');
        resourceModeBtn.classList.remove('active');
        currentModeText.textContent = '📦 Full ARM Template';
        if (modeDescription) modeDescription.textContent = 'For validating deployment templates';
        if (helpText) helpText.textContent = 'Paste a complete ARM deployment template with resources, parameters, and outputs';
        if (helpBanner) helpBanner.style.background = 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)';
        document.getElementById('schemaEditor').placeholder = 'Paste your complete ARM deployment template here or upload a file...';
    }

    // Re-validate if there's content
    if (editorContent) {
        validateSchema();
    }
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
    const resourceName = getResourceNameFromType(resourceType);
    const cleanResourceName = resourceName.replace(/[^a-zA-Z0-9]/g, '');
    
    let bicep = `// Generated Bicep template from JSON Schema
// Resource Type: ${resourceType}
// Generated on: ${new Date().toISOString()}

targetScope = 'resourceGroup'

`;

    // Add metadata
    bicep += `metadata description = 'Bicep template for ${resourceType}'
metadata author = 'Bicep Schema Builder'
metadata version = '1.0.0'

`;

    // Generate parameters based on schema
    bicep += generateAdvancedParameters(schema, resourceType);

    // Add variables section
    bicep += generateVariables(schema, resourceType);

    // Add the resource definition with detailed properties
    bicep += generateDetailedResource(schema, resourceType, cleanResourceName);

    // Add outputs
    bicep += generateAdvancedOutputs(schema, cleanResourceName);

    return bicep;
}

function generateBicepParameter(name, schema) {
    let param = `@description('${schema.description || `Parameter for ${name}`}')\n`;
    
    // Add validation decorators based on schema
    if (schema.minLength) {
        param += `@minLength(${schema.minLength})\n`;
    }
    if (schema.maxLength) {
        param += `@maxLength(${schema.maxLength})\n`;
    }
    if (schema.minimum !== undefined) {
        param += `@minValue(${schema.minimum})\n`;
    }
    if (schema.maximum !== undefined) {
        param += `@maxValue(${schema.maximum})\n`;
    }
    if (schema.enum) {
        param += `@allowed([${schema.enum.map(v => `'${v}'`).join(', ')}])\n`;
    }
    if (schema.pattern) {
        // Note: Bicep doesn't have regex validation, but we can add it as a comment
        param += `// Pattern validation: ${schema.pattern}\n`;
    }
    
    // Add security decorator for sensitive parameters
    const sensitiveFields = ['password', 'secret', 'key', 'token', 'connectionstring'];
    if (sensitiveFields.some(field => name.toLowerCase().includes(field))) {
        param += `@secure()\n`;
    }
    
    const type = getBicepType(schema);
    
    // Add default value if available
    let defaultValue = '';
    if (schema.default !== undefined) {
        if (typeof schema.default === 'string') {
            defaultValue = ` = '${schema.default}'`;
        } else {
            defaultValue = ` = ${JSON.stringify(schema.default)}`;
        }
    }
    
    param += `param ${name} ${type}${defaultValue}\n\n`;
    
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

function getResourceNameFromType(resourceType) {
    const parts = resourceType.split('/');
    const resourceTypeName = parts[parts.length - 1];
    return resourceTypeName.charAt(0).toLowerCase() + resourceTypeName.slice(1);
}

function generateAdvancedParameters(schema, resourceType) {
    let params = `// === PARAMETERS ===

@description('The name of the resource')
@minLength(1)
@maxLength(80)
param resourceName string

@description('The location for the resource')
param location string = resourceGroup().location

@description('Environment name (e.g., dev, test, prod)')
@allowed(['dev', 'test', 'staging', 'prod'])
param environment string = 'dev'

@description('Resource tags')
param tags object = {
  Environment: environment
  CreatedBy: 'Bicep Schema Builder'
  CreatedDate: utcNow('yyyy-MM-dd')
}

`;

    // Add resource-specific parameters based on schema
    if (schema.properties?.properties?.properties) {
        params += generateResourceSpecificParameters(schema.properties.properties.properties, resourceType);
    }

    return params;
}

function generateResourceSpecificParameters(propertiesSchema, resourceType) {
    let params = '';
    
    // Handle different resource types with specific parameters
    switch (resourceType) {
        case 'Microsoft.Network/virtualNetworks':
            params += `@description('Address space for the virtual network')
param addressSpaces array = ['10.0.0.0/16']

@description('Subnets configuration')
param subnets array = [
  {
    name: 'default'
    addressPrefix: '10.0.1.0/24'
    networkSecurityGroup: null
    routeTable: null
  }
]

@description('Enable DDoS protection')
param enableDdosProtection bool = false

@description('Enable VM protection')
param enableVmProtection bool = false

`;
            break;
            
        case 'Microsoft.Storage/storageAccounts':
            params += `@description('Storage account SKU')
@allowed(['Standard_LRS', 'Standard_GRS', 'Standard_RAGRS', 'Standard_ZRS', 'Premium_LRS', 'Premium_ZRS'])
param skuName string = 'Standard_LRS'

@description('Storage account kind')
@allowed(['Storage', 'StorageV2', 'BlobStorage', 'FileStorage', 'BlockBlobStorage'])
param kind string = 'StorageV2'

@description('Access tier for blob storage')
@allowed(['Hot', 'Cool'])
param accessTier string = 'Hot'

@description('Allow blob public access')
param allowBlobPublicAccess bool = false

@description('Require secure transfer')
param supportsHttpsTrafficOnly bool = true

`;
            break;
            
        case 'Microsoft.Web/sites':
            params += `@description('App Service Plan resource ID')
param appServicePlanId string

@description('Application settings')
param appSettings array = []

@description('Connection strings')
param connectionStrings array = []

@description('Enable HTTPS only')
param httpsOnly bool = true

@description('Runtime stack')
@allowed(['dotnet', 'node', 'python', 'java', 'php'])
param runtimeStack string = 'dotnet'

`;
            break;
            
        case 'Microsoft.Compute/virtualMachines':
            params += `@description('Virtual machine size')
@allowed(['Standard_B1s', 'Standard_B1ms', 'Standard_B2s', 'Standard_B2ms', 'Standard_D2s_v3', 'Standard_D4s_v3', 'Standard_D8s_v3'])
param vmSize string = 'Standard_B2s'

@description('Admin username for the VM')
@minLength(3)
@maxLength(20)
param adminUsername string

@description('Admin password for the VM')
@secure()
@minLength(8)
param adminPassword string

@description('Operating system type')
@allowed(['Windows', 'Linux'])
param osType string = 'Windows'

@description('OS disk type')
@allowed(['Standard_LRS', 'StandardSSD_LRS', 'Premium_LRS'])
param osDiskType string = 'StandardSSD_LRS'

@description('Subnet resource ID for the VM network interface')
param subnetId string

@description('Enable accelerated networking')
param enableAcceleratedNetworking bool = false

@description('VM image configuration')
param imageReference object = {
  publisher: 'MicrosoftWindowsServer'
  offer: 'WindowsServer'
  sku: '2022-Datacenter'
  version: 'latest'
}

`;
            break;
            
        default:
            // Generic parameter generation
            if (propertiesSchema && typeof propertiesSchema === 'object') {
                Object.entries(propertiesSchema).forEach(([propName, propSchema]) => {
                    if (propSchema && typeof propSchema === 'object') {
                        params += generateBicepParameter(propName, propSchema);
                    }
                });
            }
            break;
    }
    
    return params;
}

function generateVariables(schema, resourceType) {
    let variables = `// === VARIABLES ===

var resourceNameFormatted = toLower(replace(resourceName, ' ', '-'))
var commonTags = union(tags, {
  ResourceType: '${resourceType}'
  DeployedBy: 'Bicep Schema Builder'
})

`;

    // Add resource-specific variables
    switch (resourceType) {
        case 'Microsoft.Network/virtualNetworks':
            variables += `var subnetsFormatted = [for (subnet, i) in subnets: {
  name: subnet.name
  properties: {
    addressPrefix: subnet.addressPrefix
    networkSecurityGroup: subnet.networkSecurityGroup != null ? {
      id: subnet.networkSecurityGroup
    } : null
    routeTable: subnet.routeTable != null ? {
      id: subnet.routeTable  
    } : null
  }
}]

`;
            break;
            
        case 'Microsoft.Storage/storageAccounts':
            variables += `var storageAccountName = replace(resourceNameFormatted, '-', '')
var networkAcls = {
  defaultAction: 'Allow'
  bypass: 'AzureServices'
}

`;
            break;
            
        case 'Microsoft.Web/sites':
            variables += `var appSettingsFormatted = [for setting in appSettings: {
  name: setting.name
  value: setting.value
}]

var connectionStringsFormatted = [for conn in connectionStrings: {
  name: conn.name
  connectionString: conn.connectionString
  type: conn.type
}]

`;
            break;
    }

    return variables;
}

function generateDetailedResource(schema, resourceType, cleanResourceName) {
    let resource = `// === RESOURCE DEFINITION ===

`;

    switch (resourceType) {
        case 'Microsoft.Network/virtualNetworks':
            resource += `resource ${cleanResourceName} '${resourceType}@${getLatestApiVersion(schema)}' = {
  name: resourceNameFormatted
  location: location
  tags: commonTags
  properties: {
    addressSpace: {
      addressPrefixes: addressSpaces
    }
    subnets: subnetsFormatted
    enableDdosProtection: enableDdosProtection
    enableVmProtection: enableVmProtection
  }
}

`;
            break;
            
        case 'Microsoft.Storage/storageAccounts':
            resource += `resource ${cleanResourceName} '${resourceType}@${getLatestApiVersion(schema)}' = {
  name: storageAccountName
  location: location
  tags: commonTags
  sku: {
    name: skuName
  }
  kind: kind
  properties: {
    accessTier: accessTier
    allowBlobPublicAccess: allowBlobPublicAccess
    supportsHttpsTrafficOnly: supportsHttpsTrafficOnly
    networkAcls: networkAcls
    encryption: {
      services: {
        file: {
          keyType: 'Account'
          enabled: true
        }
        blob: {
          keyType: 'Account'
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

`;
            break;
            
        case 'Microsoft.Web/sites':
            resource += `resource ${cleanResourceName} '${resourceType}@${getLatestApiVersion(schema)}' = {
  name: resourceNameFormatted
  location: location
  tags: commonTags
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: httpsOnly
    siteConfig: {
      appSettings: appSettingsFormatted
      connectionStrings: connectionStringsFormatted
      metadata: [
        {
          name: 'CURRENT_STACK'
          value: runtimeStack
        }
      ]
    }
  }
}

`;
            break;
            
        case 'Microsoft.Compute/virtualMachines':
            resource += `// Network Interface for the Virtual Machine
resource ${cleanResourceName}NetworkInterface 'Microsoft.Network/networkInterfaces@2022-07-01' = {
  name: '\${resourceNameFormatted}-nic'
  location: location
  tags: commonTags
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          subnet: {
            id: subnetId
          }
        }
      }
    ]
    enableAcceleratedNetworking: enableAcceleratedNetworking
  }
}

// Virtual Machine Resource
resource ${cleanResourceName} '${resourceType}@${getLatestApiVersion(schema)}' = {
  name: resourceNameFormatted
  location: location
  tags: commonTags
  properties: {
    hardwareProfile: {
      vmSize: vmSize
    }
    osProfile: {
      computerName: take(resourceNameFormatted, 15) // Windows computer name limit
      adminUsername: adminUsername
      adminPassword: adminPassword
      windowsConfiguration: osType == 'Windows' ? {
        enableAutomaticUpdates: true
        provisionVMAgent: true
        patchSettings: {
          patchMode: 'AutomaticByOS'
        }
      } : null
      linuxConfiguration: osType == 'Linux' ? {
        disablePasswordAuthentication: false
        provisionVMAgent: true
      } : null
    }
    storageProfile: {
      imageReference: imageReference
      osDisk: {
        name: '\${resourceNameFormatted}-osdisk'
        createOption: 'FromImage'
        caching: 'ReadWrite'
        managedDisk: {
          storageAccountType: osDiskType
        }
        diskSizeGB: 128
      }
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: ${cleanResourceName}NetworkInterface.id
          properties: {
            primary: true
          }
        }
      ]
    }
    diagnosticsProfile: {
      bootDiagnostics: {
        enabled: true
      }
    }
  }
}

`;
            break;
            
        default:
            // Generic resource generation
            resource += `resource ${cleanResourceName} '${resourceType}@${getLatestApiVersion(schema)}' = {
  name: resourceNameFormatted
  location: location
  tags: commonTags
  properties: {
    // Configure properties based on your requirements
    // Refer to Azure documentation for ${resourceType} properties
  }
}

`;
            break;
    }

    return resource;
}

function generateAdvancedOutputs(schema, cleanResourceName) {
    let outputs = `// === OUTPUTS ===

@description('Resource ID of the created resource')
output resourceId string = ${cleanResourceName}.id

@description('Name of the created resource')
output resourceName string = ${cleanResourceName}.name

@description('Location of the created resource')
output location string = ${cleanResourceName}.location

`;

    // Add resource-specific outputs
    const resourceType = schema.properties?.type?.const;
    
    switch (resourceType) {
        case 'Microsoft.Network/virtualNetworks':
            outputs += `@description('Address space of the virtual network')
output addressSpace array = ${cleanResourceName}.properties.addressSpace.addressPrefixes

@description('Subnets in the virtual network')
output subnets array = [for (subnet, i) in ${cleanResourceName}.properties.subnets: {
  name: subnet.name
  id: subnet.id
  addressPrefix: subnet.properties.addressPrefix
}]

`;
            break;
            
        case 'Microsoft.Storage/storageAccounts':
            outputs += `@description('Primary endpoints of the storage account')
output primaryEndpoints object = ${cleanResourceName}.properties.primaryEndpoints

@description('Primary access key of the storage account')
output primaryKey string = ${cleanResourceName}.listKeys().keys[0].value

@description('Connection string for the storage account')
output connectionString string = 'DefaultEndpointsProtocol=https;AccountName=\${${cleanResourceName}.name};AccountKey=\${${cleanResourceName}.listKeys().keys[0].value};EndpointSuffix=core.windows.net'

`;
            break;
            
        case 'Microsoft.Web/sites':
            outputs += `@description('Default hostname of the web app')
output defaultHostName string = ${cleanResourceName}.properties.defaultHostName

@description('Outbound IP addresses')
output outboundIpAddresses string = ${cleanResourceName}.properties.outboundIpAddresses

@description('Site URL')
output siteUrl string = 'https://\${${cleanResourceName}.properties.defaultHostName}'

`;
            break;
            
        case 'Microsoft.Compute/virtualMachines':
            outputs += `@description('Private IP address of the virtual machine')
output privateIPAddress string = ${cleanResourceName}NetworkInterface.properties.ipConfigurations[0].properties.privateIPAddress

@description('Network interface resource ID')
output networkInterfaceId string = ${cleanResourceName}NetworkInterface.id

@description('Virtual machine size')
output vmSize string = ${cleanResourceName}.properties.hardwareProfile.vmSize

@description('Operating system type')
output osType string = osType

@description('Computer name')
output computerName string = ${cleanResourceName}.properties.osProfile.computerName

`;
            break;
    }

    return outputs;
}

function getLatestApiVersion(schema) {
    if (schema.properties?.apiVersion?.enum) {
        const versions = schema.properties.apiVersion.enum;
        
        // Use a known good version mapping for common resource types
        const resourceType = schema.properties?.type?.const;
        const validVersionsMap = {
            'Microsoft.Network/virtualNetworks': '2022-01-01',
            'Microsoft.Storage/storageAccounts': '2022-05-01',
            'Microsoft.Web/sites': '2022-03-01',
            'Microsoft.Compute/virtualMachines': '2022-08-01',
            'Microsoft.KeyVault/vaults': '2022-07-01',
            'Microsoft.Sql/servers': '2022-05-01-preview',
            'Microsoft.Web/serverfarms': '2022-03-01'
        };
        
        // If we have a known good version for this resource type, use it
        if (validVersionsMap[resourceType]) {
            return validVersionsMap[resourceType];
        }
        
        // Otherwise, try to find the latest stable (non-preview) version
        const stableVersions = versions.filter(v => !v.includes('preview'));
        if (stableVersions.length > 0) {
            return stableVersions[stableVersions.length - 1];
        }
        
        // Fallback to the last version in the list
        return versions[versions.length - 1];
    }
    
    // Default fallback
    return '2022-01-01';
}

// Deployment Builder Functions
let selectedResources = new Set();
let resourceConfigurations = new Map();

function updateSelectedResources() {
    const checkboxes = document.querySelectorAll('.resource-checkbox input[type="checkbox"]:checked');
    selectedResources.clear();
    
    checkboxes.forEach(checkbox => {
        selectedResources.add({
            id: checkbox.value,
            schema: checkbox.dataset.schema,
            name: checkbox.closest('.resource-checkbox').querySelector('.resource-name').textContent
        });
    });
    
    updateSelectedResourcesPreview();
}

function updateSelectedResourcesPreview() {
    const preview = document.getElementById('selectedResourcesPreview');
    const countElement = preview.querySelector('h4');
    const listElement = preview.querySelector('.selected-list');
    
    countElement.textContent = `Selected Resources (${selectedResources.size})`;
    listElement.innerHTML = '';
    
    selectedResources.forEach(resource => {
        const item = document.createElement('div');
        item.className = 'selected-item';
        item.innerHTML = `
            <div class="selected-item-info">
                <span class="resource-icon">${getResourceIcon(resource.id)}</span>
                <span class="resource-text">${resource.name}</span>
            </div>
            <button class="remove-item" data-resource="${resource.id}">✕</button>
        `;
        
        const removeBtn = item.querySelector('.remove-item');
        removeBtn.addEventListener('click', () => removeResource(resource.id));
        
        listElement.appendChild(item);
    });
}

function getResourceIcon(resourceId) {
    const iconMap = {
        'storage': '🗄️',
        'webapp': '🌐',
        'vm': '💻',
        'keyvault': '🔐',
        'sqldatabase': '🗃️',
        'functions': '⚡',
        'appplan': '📋',
        'vnet': '🌐'
    };
    return iconMap[resourceId] || '📦';
}

function removeResource(resourceId) {
    const checkbox = document.querySelector(`input[value="${resourceId}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }
    updateSelectedResources();
}

async function previewSelectedDeployment() {
    if (selectedResources.size === 0) {
        showError('❌ Please select at least one resource to preview');
        return;
    }
    
    try {
        showLoading('Generating deployment preview...');
        
        const bicepContent = await generateMultiResourceBicep();
        
        // Show preview in a modal or new section
        showDeploymentPreview(bicepContent);
        
        showSuccess('✅ Deployment preview generated!');
        
        // Track preview
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('deployment_preview', 'Deployment Builder', `${selectedResources.size}_resources`);
        }
    } catch (error) {
        showError(`❌ Failed to generate preview: ${error.message}`);
    }
}

async function exportSelectedResourcesBicep() {
    if (selectedResources.size === 0) {
        showError('❌ Please select at least one resource to export');
        return;
    }
    
    try {
        showLoading('Generating Bicep template...');
        
        const bicepContent = await generateMultiResourceBicep();
        
        const blob = new Blob([bicepContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'multi-resource-deployment.bicep';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess(`✅ Bicep template with ${selectedResources.size} resources exported!`);
        
        // Track export
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('multi_resource_export', 'Deployment Builder', `${selectedResources.size}_resources`);
        }
    } catch (error) {
        showError(`❌ Failed to export Bicep: ${error.message}`);
    }
}

async function downloadDeploymentPackageZip() {
    if (selectedResources.size === 0) {
        showError('❌ Please select at least one resource to download');
        return;
    }
    
    try {
        showLoading('Creating deployment package...');
        
        const deploymentFiles = await generateDeploymentPackage();
        
        // Create ZIP file (using JSZip if available, otherwise create individual files)
        if (typeof JSZip !== 'undefined') {
            const zip = new JSZip();
            
            Object.entries(deploymentFiles).forEach(([filename, content]) => {
                zip.file(filename, content);
            });
            
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'azure-deployment-package.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            // Fallback: download main template if JSZip not available
            const mainTemplate = deploymentFiles['main.bicep'];
            const blob = new Blob([mainTemplate], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'deployment-package.bicep';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        showSuccess(`✅ Deployment package created with ${selectedResources.size} resources!`);
        
        // Track download
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('deployment_package_download', 'Deployment Builder', `${selectedResources.size}_resources`);
        }
    } catch (error) {
        showError(`❌ Failed to create deployment package: ${error.message}`);
    }
}

async function generateMultiResourceBicep() {
    const includeParameters = document.getElementById('includeParameters').checked;
    const includeDependencies = document.getElementById('includeDependencies').checked;
    const includeOutputs = document.getElementById('includeOutputs').checked;
    const generateModules = document.getElementById('generateModules').checked;
    
    let bicepContent = `// Multi-Resource Azure Deployment Template
// Generated by Bicep Schema Builder
// Resources: ${Array.from(selectedResources).map(r => r.name).join(', ')}

targetScope = 'resourceGroup'

`;

    // Add common parameters
    if (includeParameters) {
        bicepContent += `// Common Parameters
@description('The location for all resources')
param location string = resourceGroup().location

@description('Environment name (e.g., dev, test, prod)')
param environment string = 'dev'

@description('Common resource prefix')
param resourcePrefix string = 'bicep'

`;
    }
    
    // Load and process each selected schema with validation
    const resourceSchemas = {};
    const validationWarnings = [];
    
    for (const resource of selectedResources) {
        try {
            const schema = await loadSchemaFile(resource.schema);
            
            // Validate API version and suggest corrections
            const validationResult = await validateResourceTypeOffline(
                schema.properties?.type?.const, 
                schema
            );
            
            if (!validationResult.resourceTypeValid) {
                validationWarnings.push(`⚠️ ${resource.name}: Resource type may not be valid`);
            }
            
            if (validationResult.schemaApiVersions.length > 0) {
                const invalidVersions = validationResult.schemaApiVersions.filter(v => 
                    !validationResult.availableApiVersions.includes(v)
                );
                
                if (invalidVersions.length > 0) {
                    validationWarnings.push(
                        `⚠️ ${resource.name}: API versions ${invalidVersions.join(', ')} may be invalid`
                    );
                    
                    // Auto-correct to use the latest valid version
                    if (validationResult.availableApiVersions.length > 0) {
                        const latestValid = validationResult.availableApiVersions[
                            validationResult.availableApiVersions.length - 1
                        ];
                        
                        // Update the schema to use the correct API version
                        if (schema.properties?.apiVersion?.enum) {
                            schema.properties.apiVersion.enum = [latestValid];
                        }
                        
                        validationWarnings.push(
                            `✅ ${resource.name}: Auto-corrected to use API version ${latestValid}`
                        );
                    }
                }
            }
            
            resourceSchemas[resource.id] = schema;
        } catch (error) {
            console.warn(`Failed to load schema for ${resource.name}:`, error);
            validationWarnings.push(`❌ ${resource.name}: Failed to load schema`);
        }
    }
    
    // Add validation warnings as comments if any
    if (validationWarnings.length > 0) {
        bicepContent += `// Validation Warnings:\n`;
        validationWarnings.forEach(warning => {
            bicepContent += `// ${warning}\n`;
        });
        bicepContent += `\n`;
    }
    
    // Generate individual resources or modules
    if (generateModules) {
        bicepContent += generateModularBicep(resourceSchemas, includeParameters, includeDependencies, includeOutputs);
    } else {
        bicepContent += generateInlineBicep(resourceSchemas, includeParameters, includeDependencies, includeOutputs);
    }
    
    return bicepContent;
}

function generateInlineBicep(resourceSchemas, includeParameters, includeDependencies, includeOutputs) {
    let bicep = `// Resource Definitions\n\n`;
    
    Object.entries(resourceSchemas).forEach(([resourceId, schema]) => {
        if (!schema) return;
        
        const resourceType = schema.properties?.type?.const || 'Microsoft.Resources/deployments';
        const resourceName = getResourceVariableName(resourceId);
        
        // Add resource-specific parameters
        if (includeParameters && schema.properties) {
            bicep += generateResourceParameters(resourceId, schema);
        }
        
        // Add resource definition with configuration
        const config = resourceConfigurations.get(resourceId) || {};
        bicep += generateConfiguredResource(resourceId, schema, config, resourceName, resourceType, includeDependencies, resourceSchemas);
    });
    
    // Add outputs
    if (includeOutputs) {
        bicep += `// Outputs\n`;
        Object.keys(resourceSchemas).forEach(resourceId => {
            const resourceName = getResourceVariableName(resourceId);
            bicep += `output ${resourceId}Id string = ${resourceName}.id\n`;
            bicep += `output ${resourceId}Name string = ${resourceName}.name\n`;
        });
    }
    
    return bicep;
}

function generateModularBicep(resourceSchemas, includeParameters, includeDependencies, includeOutputs) {
    let bicep = `// Module Definitions\n\n`;
    
    Object.entries(resourceSchemas).forEach(([resourceId, schema]) => {
        if (!schema) return;
        
        const moduleName = `${resourceId}Module`;
        
        bicep += `module ${moduleName} 'modules/${resourceId}.bicep' = {
  name: '${resourceId}-deployment'
  params: {
    location: location
    environment: environment
    resourcePrefix: resourcePrefix
  }
}

`;
    });
    
    // Add outputs for modules
    if (includeOutputs) {
        bicep += `// Module Outputs\n`;
        Object.keys(resourceSchemas).forEach(resourceId => {
            const moduleName = `${resourceId}Module`;
            bicep += `output ${resourceId}Id string = ${moduleName}.outputs.resourceId\n`;
            bicep += `output ${resourceId}Name string = ${moduleName}.outputs.resourceName\n`;
        });
    }
    
    return bicep;
}

function generateResourceParameters(resourceId, schema) {
    // Don't generate generic parameters for resources that have specific parameter generation
    const resourceType = schema.properties?.type?.const;
    const hasSpecificGeneration = [
        'Microsoft.Compute/virtualMachines',
        'Microsoft.Network/virtualNetworks', 
        'Microsoft.Storage/storageAccounts',
        'Microsoft.Web/sites'
    ].includes(resourceType);
    
    if (hasSpecificGeneration) {
        return ''; // Resource-specific parameters are generated in generateResourceSpecificParameters
    }
    
    let params = `// Parameters for ${resourceId}\n`;
    
    if (schema.properties) {
        Object.entries(schema.properties).forEach(([propName, propSchema]) => {
            if (!['apiVersion', 'type', 'name', 'location', 'properties', 'tags'].includes(propName)) {
                const bicepType = getBicepType(propSchema);
                params += `@description('${propSchema.description || `Configuration for ${propName}`}')\n`;
                
                if (propSchema.enum) {
                    params += `@allowed([${propSchema.enum.map(v => `'${v}'`).join(', ')}])\n`;
                }
                
                params += `param ${resourceId}_${propName} ${bicepType}\n\n`;
            }
        });
    }
    
    return params;
}

function getResourceVariableName(resourceId) {
    return resourceId.replace(/[^a-zA-Z0-9]/g, '');
}

function inferDependencies(resourceId, resourceSchemas) {
    const dependencies = [];
    
    // Common dependency patterns
    const dependencyMap = {
        'webapp': ['appplan'],
        'functions': ['appplan', 'storage'],
        'sqldatabase': ['storage'], // for backup storage
        'vm': ['vnet']
    };
    
    if (dependencyMap[resourceId]) {
        dependencyMap[resourceId].forEach(dep => {
            if (resourceSchemas[dep]) {
                dependencies.push(dep);
            }
        });
    }
    
    return dependencies;
}

async function loadSchemaFile(schemaName) {
    const response = await fetch(`schemas/${schemaName}.json`);
    if (!response.ok) {
        throw new Error(`Failed to load schema: ${schemaName}`);
    }
    return await response.json();
}

async function generateDeploymentPackage() {
    const files = {};
    
    // Main Bicep template
    files['main.bicep'] = await generateMultiResourceBicep();
    
    // Parameters file
    if (document.getElementById('includeParameters').checked) {
        files['main.parameters.json'] = generateParametersFile();
    }
    
    // Module files if using modular approach
    if (document.getElementById('generateModules').checked) {
        for (const resource of selectedResources) {
            try {
                const schema = await loadSchemaFile(resource.schema);
                files[`modules/${resource.id}.bicep`] = generateModuleFile(resource.id, schema);
            } catch (error) {
                console.warn(`Failed to generate module for ${resource.name}:`, error);
            }
        }
    }
    
    // README file
    files['README.md'] = generateReadmeFile();
    
    // Deployment script
    files['deploy.ps1'] = generateDeploymentScript();
    
    return files;
}

function generateParametersFile() {
    const params = {
        "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
        "contentVersion": "1.0.0.0",
        "parameters": {
            "location": {
                "value": "East US"
            },
            "environment": {
                "value": "dev"
            },
            "resourcePrefix": {
                "value": "myapp"
            }
        }
    };
    
    // Add resource-specific parameters based on selected resources
    for (const resource of selectedResources) {
        switch (resource.id) {
            case 'vm':
                params.parameters.vmSize = { "value": "Standard_B2s" };
                params.parameters.adminUsername = { "value": "azureuser" };
                params.parameters.adminPassword = { "value": "ChangeThisPassword123!" };
                params.parameters.osType = { "value": "Windows" };
                params.parameters.osDiskType = { "value": "StandardSSD_LRS" };
                params.parameters.subnetId = { 
                    "value": "/subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.Network/virtualNetworks/{vnet-name}/subnets/{subnet-name}" 
                };
                params.parameters.enableAcceleratedNetworking = { "value": false };
                break;
                
            case 'storage':
                params.parameters.skuName = { "value": "Standard_LRS" };
                params.parameters.kind = { "value": "StorageV2" };
                params.parameters.accessTier = { "value": "Hot" };
                break;
                
            case 'vnet':
                params.parameters.addressSpaces = { "value": ["10.0.0.0/16"] };
                params.parameters.subnets = { 
                    "value": [
                        {
                            "name": "default",
                            "addressPrefix": "10.0.1.0/24",
                            "networkSecurityGroup": null,
                            "routeTable": null
                        }
                    ]
                };
                break;
        }
    }
    
    return JSON.stringify(params, null, 2);
}

function generateModuleFile(resourceId, schema) {
    const resourceType = schema.properties?.type?.const || 'Microsoft.Resources/deployments';
    const resourceName = getResourceVariableName(resourceId);
    
    let moduleContent = `// ${resourceId} module
targetScope = 'resourceGroup'

@description('The location for the resource')
param location string

@description('Environment name')
param environment string

@description('Resource prefix')
param resourcePrefix string

resource ${resourceName} '${resourceType}@${getLatestApiVersion(schema)}' = {
  name: '\${resourcePrefix}-${resourceId}-\${environment}'
  location: location
  properties: {
    // Add your resource-specific configuration here
  }
}

output resourceId string = ${resourceName}.id
output resourceName string = ${resourceName}.name
`;

    return moduleContent;
}

function generateReadmeFile() {
    const resourceList = Array.from(selectedResources).map(r => `- ${r.name}`).join('\n');
    
    return `# Azure Deployment Package

This package contains Bicep templates for deploying Azure resources.

## Resources Included

${resourceList}

## Deployment Instructions

### Prerequisites
- Azure CLI installed
- Azure subscription access
- Resource group created

### Deploy using Azure CLI

\`\`\`bash
# Login to Azure
az login

# Set subscription
az account set --subscription <your-subscription-id>

# Create resource group (if not exists)
az group create --name <resource-group-name> --location <location>

# Deploy the template
az deployment group create \\
  --resource-group <resource-group-name> \\
  --template-file main.bicep \\
  --parameters @main.parameters.json
\`\`\`

### Deploy using PowerShell

\`\`\`powershell
# Run the provided deployment script
.\\deploy.ps1 -ResourceGroupName "<resource-group-name>" -Location "<location>"
\`\`\`

## Customization

Edit the \`main.parameters.json\` file to customize the deployment parameters for your environment.

Generated by Bicep Schema Builder - https://techaboo.github.io/bicep-schema-builder/
`;
}

function generateDeploymentScript() {
    return `# Azure Deployment Script
# Generated by Bicep Schema Builder

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$Location,
    
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [string]$ParametersFile = "main.parameters.json"
)

Write-Host "🚀 Starting Azure deployment..." -ForegroundColor Green

# Login check
try {
    $context = Get-AzContext
    if (!$context) {
        Write-Host "Please login to Azure first..." -ForegroundColor Yellow
        Connect-AzAccount
    }
} catch {
    Write-Host "Please install Azure PowerShell module: Install-Module -Name Az" -ForegroundColor Red
    exit 1
}

# Set subscription if provided
if ($SubscriptionId) {
    Set-AzContext -SubscriptionId $SubscriptionId
}

# Create resource group if it doesn't exist
$rg = Get-AzResourceGroup -Name $ResourceGroupName -ErrorAction SilentlyContinue
if (!$rg) {
    Write-Host "Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
    New-AzResourceGroup -Name $ResourceGroupName -Location $Location
}

# Deploy Bicep template
Write-Host "Deploying Bicep template..." -ForegroundColor Yellow
try {
    $deployment = New-AzResourceGroupDeployment \\
        -ResourceGroupName $ResourceGroupName \\
        -TemplateFile "main.bicep" \\
        -TemplateParameterFile $ParametersFile \\
        -Verbose

    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "Deployment Name: $($deployment.DeploymentName)" -ForegroundColor Cyan
    
    # Display outputs
    if ($deployment.Outputs.Count -gt 0) {
        Write-Host "\\n📋 Deployment Outputs:" -ForegroundColor Cyan
        $deployment.Outputs.GetEnumerator() | ForEach-Object {
            Write-Host "  $($_.Key): $($_.Value.Value)" -ForegroundColor White
        }
    }
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
`;
}

function showDeploymentPreview(bicepContent) {
    // Remove existing preview
    const existingPreview = document.querySelector('.deployment-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'deployment-preview';
    previewContainer.innerHTML = `
        <h4>🔍 Deployment Preview</h4>
        <button id="closePreview" style="float: right; margin-top: -30px;">✕</button>
        <pre><code>${bicepContent}</code></pre>
    `;
    
    // Add close functionality
    previewContainer.querySelector('#closePreview').addEventListener('click', () => {
        previewContainer.remove();
    });
    
    // Insert after the deployment builder section
    const deploymentSection = document.querySelector('.deployment-builder-section');
    deploymentSection.appendChild(previewContainer);
    
    // Scroll to preview
    previewContainer.scrollIntoView({ behavior: 'smooth' });
}

// Resource Configuration Modal Functions
async function openResourceConfigModal() {
    if (selectedResources.size === 0) {
        showError('❌ Please select at least one resource to configure');
        return;
    }
    
    const modal = document.getElementById('resourceConfigModal');
    const tabsContainer = document.getElementById('configTabs');
    const panelsContainer = document.getElementById('configPanels');
    
    // Clear existing tabs and panels
    tabsContainer.innerHTML = '';
    panelsContainer.innerHTML = '';
    
    // Create tabs for each selected resource
    let firstTab = true;
    for (const resource of selectedResources) {
        try {
            const schema = await loadSchemaFile(resource.schema);
            
            // Create tab button
            const tabButton = document.createElement('button');
            tabButton.className = `tab-button${firstTab ? ' active' : ''}`;
            tabButton.textContent = `${getResourceIcon(resource.id)} ${resource.name}`;
            tabButton.addEventListener('click', () => switchConfigTab(resource.id));
            tabsContainer.appendChild(tabButton);
            
            // Create tab panel
            const tabPanel = document.createElement('div');
            tabPanel.className = `config-panel${firstTab ? ' active' : ''}`;
            tabPanel.id = `config-${resource.id}`;
            tabPanel.innerHTML = generateConfigForm(resource, schema);
            panelsContainer.appendChild(tabPanel);
            
            // Initialize configuration if not exists
            if (!resourceConfigurations.has(resource.id)) {
                resourceConfigurations.set(resource.id, getDefaultConfiguration(schema));
            }
            
            firstTab = false;
        } catch (error) {
            console.warn(`Failed to load schema for ${resource.name}:`, error);
        }
    }
    
    // Show modal
    modal.style.display = 'flex';
    
    // Load saved configurations
    loadSavedConfigurations();
}

function closeResourceConfigModal() {
    const modal = document.getElementById('resourceConfigModal');
    modal.style.display = 'none';
}

function switchConfigTab(resourceId) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    // Find the correct tab button to activate
    document.querySelectorAll('.tab-button').forEach(btn => {
        const btnResourceId = getResourceIdFromName(btn.textContent);
        if (btnResourceId === resourceId) {
            btn.classList.add('active');
        }
    });
    
    // Update panels
    document.querySelectorAll('.config-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`config-${resourceId}`)?.classList.add('active');
}

function getResourceIdFromName(buttonText) {
    const nameMap = {
        'Storage Account': 'storage',
        'Web App': 'webapp',
        'Virtual Machine': 'vm',
        'Key Vault': 'keyvault',
        'SQL Database': 'sqldatabase',
        'Azure Functions': 'functions',
        'App Service Plan': 'appplan',
        'Virtual Network': 'vnet'
    };
    
    for (const [name, id] of Object.entries(nameMap)) {
        if (buttonText.includes(name)) return id;
    }
    return 'unknown';
}

function generateConfigForm(resource, schema) {
    let html = `<h4>Configure ${resource.name}</h4>`;
    
    if (schema.properties?.properties?.properties) {
        html += generatePropertyForm(schema.properties.properties.properties, '', true);
    } else if (schema.properties?.properties) {
        html += generatePropertyForm(schema.properties.properties, '', true);
    }
    
    return html;
}

function generatePropertyForm(properties, parentPath = '', isRoot = false) {
    let html = '';
    
    Object.entries(properties).forEach(([propName, propSchema]) => {
        const fullPath = parentPath ? `${parentPath}.${propName}` : propName;
        const fieldId = `field-${fullPath.replace(/\./g, '-')}`;
        
        html += `<div class="config-section">
            <div class="config-section-header" onclick="toggleConfigSection('${fieldId}')">
                <h5 class="config-section-title">
                    ${propName}
                    ${propSchema.required?.includes(propName) ? '<span class="field-required">*</span>' : '<span class="field-optional">(optional)</span>'}
                </h5>
                <span class="config-section-toggle">▼</span>
            </div>
            <div class="config-section-body" id="${fieldId}">`;
        
        if (propSchema.description) {
            html += `<div class="config-field-description">${propSchema.description}</div>`;
        }
        
        html += generateFieldControl(propName, propSchema, fullPath);
        
        // Handle nested objects
        if (propSchema.type === 'object' && propSchema.properties) {
            html += generatePropertyForm(propSchema.properties, fullPath, false);
        }
        
        html += `</div></div>`;
    });
    
    return html;
}

function generateFieldControl(propName, propSchema, fullPath) {
    const fieldId = `input-${fullPath.replace(/\./g, '-')}`;
    let html = '';
    
    html += `<div class="config-field">
        <label class="config-field-label">
            <input type="checkbox" class="config-checkbox" id="enable-${fieldId}" onchange="toggleField('${fieldId}')">
            Include ${propName}
        </label>
        <div class="config-field-control">`;
    
    switch (propSchema.type) {
        case 'string':
            if (propSchema.enum) {
                html += `<select class="config-select" id="${fieldId}" disabled>`;
                propSchema.enum.forEach(option => {
                    html += `<option value="${option}">${option}</option>`;
                });
                html += `</select>`;
            } else {
                html += `<input type="text" class="config-input" id="${fieldId}" 
                    placeholder="${propSchema.default || ''}" 
                    ${propSchema.pattern ? `pattern="${propSchema.pattern}"` : ''}
                    ${propSchema.minLength ? `minlength="${propSchema.minLength}"` : ''}
                    ${propSchema.maxLength ? `maxlength="${propSchema.maxLength}"` : ''}
                    disabled>`;
            }
            break;
            
        case 'number':
        case 'integer':
            html += `<input type="number" class="config-input" id="${fieldId}" 
                ${propSchema.minimum !== undefined ? `min="${propSchema.minimum}"` : ''}
                ${propSchema.maximum !== undefined ? `max="${propSchema.maximum}"` : ''}
                placeholder="${propSchema.default || ''}" disabled>`;
            break;
            
        case 'boolean':
            html += `<select class="config-select" id="${fieldId}" disabled>
                <option value="true">True</option>
                <option value="false">False</option>
            </select>`;
            break;
            
        case 'array':
            html += `<div class="config-array" id="${fieldId}">
                <div class="array-items"></div>
                <div class="config-array-controls">
                    <button type="button" class="add-array-item" onclick="addArrayItem('${fieldId}')">+ Add Item</button>
                </div>
            </div>`;
            break;
            
        case 'object':
            html += `<textarea class="config-input" id="${fieldId}" rows="3" 
                placeholder="Enter JSON object..." disabled></textarea>`;
            break;
            
        default:
            html += `<input type="text" class="config-input" id="${fieldId}" 
                placeholder="${propSchema.default || ''}" disabled>`;
            break;
    }
    
    html += `</div></div>`;
    
    return html;
}

function toggleConfigSection(sectionId) {
    const section = document.getElementById(sectionId).parentElement;
    section.classList.toggle('collapsed');
}

function toggleField(fieldId) {
    const checkbox = document.getElementById(`enable-${fieldId}`);
    const field = document.getElementById(fieldId);
    
    if (checkbox.checked) {
        field.disabled = false;
        field.style.opacity = '1';
    } else {
        field.disabled = true;
        field.style.opacity = '0.5';
        field.value = '';
    }
}

function addArrayItem(fieldId) {
    const arrayContainer = document.getElementById(fieldId).querySelector('.array-items');
    const itemIndex = arrayContainer.children.length;
    
    const item = document.createElement('div');
    item.className = 'config-array-item';
    item.innerHTML = `
        <input type="text" class="config-input" placeholder="Enter value..." style="flex: 1;">
        <button type="button" class="remove-array-item" onclick="removeArrayItem(this)">Remove</button>
    `;
    
    arrayContainer.appendChild(item);
}

function removeArrayItem(button) {
    button.parentElement.remove();
}

function saveResourceConfiguration() {
    // Collect configuration from all forms
    for (const resource of selectedResources) {
        const config = collectResourceConfig(resource.id);
        resourceConfigurations.set(resource.id, config);
    }
    
    closeResourceConfigModal();
    showSuccess('✅ Resource configuration saved!');
    
    // Update preview
    updateSelectedResourcesPreview();
}

function resetResourceConfiguration() {
    if (confirm('Are you sure you want to reset all configurations to defaults?')) {
        resourceConfigurations.clear();
        
        // Reset all form fields
        document.querySelectorAll('.config-checkbox').forEach(checkbox => {
            checkbox.checked = false;
            checkbox.onchange();
        });
        
        showSuccess('🔄 Configuration reset to defaults');
    }
}

function collectResourceConfig(resourceId) {
    const config = {};
    const panel = document.getElementById(`config-${resourceId}`);
    
    panel.querySelectorAll('.config-checkbox:checked').forEach(checkbox => {
        const fieldId = checkbox.id.replace('enable-', '');
        const field = document.getElementById(fieldId);
        const fieldPath = fieldId.replace('input-', '').replace(/-/g, '.');
        
        if (field && !field.disabled) {
            setNestedValue(config, fieldPath, getFieldValue(field));
        }
    });
    
    return config;
}

function getFieldValue(field) {
    if (field.type === 'checkbox') {
        return field.checked;
    } else if (field.type === 'number') {
        return parseFloat(field.value) || 0;
    } else if (field.classList.contains('config-array')) {
        const items = [];
        field.querySelectorAll('.config-array-item input').forEach(input => {
            if (input.value.trim()) items.push(input.value.trim());
        });
        return items;
    } else if (field.tagName === 'TEXTAREA') {
        try {
            return JSON.parse(field.value);
        } catch {
            return field.value;
        }
    } else {
        return field.value;
    }
}

function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
}

function getDefaultConfiguration(schema) {
    const config = {};
    
    if (schema.properties?.properties?.properties) {
        extractDefaults(schema.properties.properties.properties, config);
    }
    
    return config;
}

function extractDefaults(properties, config, path = '') {
    Object.entries(properties).forEach(([propName, propSchema]) => {
        if (propSchema.default !== undefined) {
            setNestedValue(config, path ? `${path}.${propName}` : propName, propSchema.default);
        }
        
        if (propSchema.type === 'object' && propSchema.properties) {
            extractDefaults(propSchema.properties, config, path ? `${path}.${propName}` : propName);
        }
    });
}

function loadSavedConfigurations() {
    for (const [resourceId, config] of resourceConfigurations.entries()) {
        const panel = document.getElementById(`config-${resourceId}`);
        if (!panel) continue;
        
        // Load configuration into form fields
        loadConfigIntoForm(panel, config);
    }
}

function loadConfigIntoForm(panel, config, prefix = '') {
    Object.entries(config).forEach(([key, value]) => {
        const fieldPath = prefix ? `${prefix}-${key}` : key;
        const fieldId = `input-${fieldPath}`;
        const enableId = `enable-${fieldId}`;
        
        const checkbox = document.getElementById(enableId);
        const field = document.getElementById(fieldId);
        
        if (checkbox && field) {
            checkbox.checked = true;
            toggleField(fieldId);
            
            if (typeof value === 'object' && !Array.isArray(value)) {
                if (field.tagName === 'TEXTAREA') {
                    field.value = JSON.stringify(value, null, 2);
                } else {
                    loadConfigIntoForm(panel, value, fieldPath);
                }
            } else if (Array.isArray(value)) {
                value.forEach(item => {
                    addArrayItem(fieldId);
                    const lastInput = field.querySelector('.config-array-item:last-child input');
                    if (lastInput) lastInput.value = item;
                });
            } else {
                field.value = value;
            }
        }
    });
}

function generateConfiguredResource(resourceId, schema, config, resourceName, resourceType, includeDependencies, resourceSchemas) {
    let bicep = `resource ${resourceName} '${resourceType}@${getLatestApiVersion(schema)}' = {
  name: '\${resourcePrefix}-${resourceId}-\${environment}'
  location: location
  tags: commonTags\n`;

    // Generate properties based on configuration
    if (Object.keys(config).length > 0) {
        bicep += `  properties: {\n`;
        bicep += generatePropertiesFromConfig(config, '    ');
        bicep += `  }\n`;
    } else {
        // Fallback to default properties for common resource types
        bicep += generateDefaultPropertiesForResource(resourceType, resourceId);
    }

    // Add dependencies if enabled
    if (includeDependencies) {
        const dependencies = inferDependencies(resourceId, resourceSchemas);
        if (dependencies.length > 0) {
            bicep += `  dependsOn: [\n`;
            dependencies.forEach(dep => {
                bicep += `    ${getResourceVariableName(dep)}\n`;
            });
            bicep += `  ]\n`;
        }
    }

    bicep += `}\n\n`;
    
    return bicep;
}

function generatePropertiesFromConfig(config, indent = '') {
    let properties = '';
    
    Object.entries(config).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            properties += `${indent}${key}: {\n`;
            properties += generatePropertiesFromConfig(value, indent + '  ');
            properties += `${indent}}\n`;
        } else if (Array.isArray(value)) {
            properties += `${indent}${key}: [\n`;
            value.forEach((item, index) => {
                if (typeof item === 'object') {
                    properties += `${indent}  {\n`;
                    properties += generatePropertiesFromConfig(item, indent + '    ');
                    properties += `${indent}  }${index < value.length - 1 ? ',' : ''}\n`;
                } else {
                    properties += `${indent}  ${typeof item === 'string' ? `'${item}'` : item}${index < value.length - 1 ? ',' : ''}\n`;
                }
            });
            properties += `${indent}]\n`;
        } else {
            const valueStr = typeof value === 'string' ? `'${value}'` : value;
            properties += `${indent}${key}: ${valueStr}\n`;
        }
    });
    
    return properties;
}

function generateDefaultPropertiesForResource(resourceType, resourceId) {
    // Fallback to default properties if no configuration exists
    switch (resourceType) {
        case 'Microsoft.Network/virtualNetworks':
            return `  properties: {
    addressSpace: {
      addressPrefixes: addressSpaces
    }
    subnets: subnetsFormatted
    enableDdosProtection: enableDdosProtection
    enableVmProtection: enableVmProtection
  }
`;
        case 'Microsoft.Storage/storageAccounts':
            return `  sku: {
    name: skuName
  }
  kind: kind
  properties: {
    accessTier: accessTier
    allowBlobPublicAccess: allowBlobPublicAccess
    supportsHttpsTrafficOnly: supportsHttpsTrafficOnly
  }
`;
        case 'Microsoft.Web/sites':
            return `  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: httpsOnly
    siteConfig: {
      appSettings: appSettingsFormatted
    }
  }
`;
        default:
            return `  properties: {
    // Configure properties based on your requirements
  }
`;
    }
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

    try {
        showLoading('Validating with Azure...');
        
        const schema = JSON.parse(content);
        const resourceType = schema.properties?.type?.const;
        
        if (!resourceType) {
            showError('❌ Schema must specify a resource type');
            return;
        }
        
        // Use offline validation if Azure connection is not available
        const useOfflineValidation = !azureResourceGraph || !azureResourceGraph.isAuthenticated();
        let validationResult;
        
        if (useOfflineValidation) {
            validationResult = await validateResourceTypeOffline(resourceType, schema);
        } else {
            try {
                validationResult = await validateResourceTypeOnline(resourceType, schema);
            } catch (error) {
                console.warn('Online validation failed, falling back to offline:', error);
                validationResult = await validateResourceTypeOffline(resourceType, schema);
            }
        }
        
        displayValidationResults(validationResult, resourceType, useOfflineValidation);
        
    } catch (error) {
        showError(`❌ Azure validation failed: ${error.message}`);
    }
}

async function validateResourceTypeOnline(resourceType, schema) {
    const isValid = await azureResourceGraph.validateResourceType(resourceType);
    const apiVersions = await azureResourceGraph.getApiVersions(resourceType);
    const schemaApiVersion = schema.properties?.apiVersion?.enum || schema.properties?.apiVersion?.const;
    
    return {
        resourceTypeValid: isValid,
        availableApiVersions: apiVersions,
        schemaApiVersions: Array.isArray(schemaApiVersion) ? schemaApiVersion : [schemaApiVersion],
        validationSource: 'Azure API'
    };
}

async function validateResourceTypeOffline(resourceType, schema) {
    // Known valid Azure resource types and their API versions
    const knownResourceTypes = {
        'Microsoft.Network/virtualNetworks': {
            valid: true,
            apiVersions: ['2020-11-01', '2021-02-01', '2021-05-01', '2021-08-01', '2022-01-01', '2022-05-01', '2022-07-01', '2022-09-01']
        },
        'Microsoft.Storage/storageAccounts': {
            valid: true,
            apiVersions: ['2021-04-01', '2021-06-01', '2021-08-01', '2021-09-01', '2022-05-01', '2022-09-01']
        },
        'Microsoft.Compute/virtualMachines': {
            valid: true,
            apiVersions: ['2021-03-01', '2021-07-01', '2021-11-01', '2022-03-01', '2022-08-01', '2022-11-01']
        },
        'Microsoft.Web/sites': {
            valid: true,
            apiVersions: ['2021-02-01', '2021-03-01', '2022-03-01', '2022-09-01']
        },
        'Microsoft.Web/serverfarms': {
            valid: true,
            apiVersions: ['2021-02-01', '2021-03-01', '2022-03-01', '2022-09-01']
        },
        'Microsoft.KeyVault/vaults': {
            valid: true,
            apiVersions: ['2021-10-01', '2022-07-01', '2023-02-01']
        },
        'Microsoft.Sql/servers': {
            valid: true,
            apiVersions: ['2021-11-01', '2022-05-01-preview', '2022-08-01-preview']
        },
        'Microsoft.Insights/components': {
            valid: true,
            apiVersions: ['2020-02-02']
        }
    };
    
    const schemaApiVersion = schema.properties?.apiVersion?.enum || schema.properties?.apiVersion?.const;
    const resourceInfo = knownResourceTypes[resourceType];
    
    return {
        resourceTypeValid: resourceInfo?.valid || false,
        availableApiVersions: resourceInfo?.apiVersions || [],
        schemaApiVersions: Array.isArray(schemaApiVersion) ? schemaApiVersion : [schemaApiVersion].filter(v => v),
        validationSource: 'Offline Database'
    };
}

function displayValidationResults(result, resourceType, isOffline) {
    let message = `${isOffline ? '🔍 Offline' : '✅ Azure'} Validation Results:\n\n`;
    
    if (result.resourceTypeValid) {
        message += `✅ Resource type "${resourceType}" exists in Azure\n`;
    } else {
        message += `❌ Resource type "${resourceType}" not found in Azure\n`;
        
        // Suggest similar resource types
        const suggestions = findSimilarResourceTypes(resourceType);
        if (suggestions.length > 0) {
            message += `💡 Similar resource types:\n`;
            suggestions.forEach(suggestion => {
                message += `   - ${suggestion}\n`;
            });
        }
    }
    
    if (result.schemaApiVersions.length > 0 && result.schemaApiVersions[0]) {
        const invalidVersions = result.schemaApiVersions.filter(v => !result.availableApiVersions.includes(v));
        const validVersions = result.schemaApiVersions.filter(v => result.availableApiVersions.includes(v));
        
        if (invalidVersions.length === 0) {
            message += `✅ All API versions are valid\n`;
        } else {
            message += `⚠️ Invalid API versions: ${invalidVersions.join(', ')}\n`;
            
            // Show the latest available versions
            const latestVersions = result.availableApiVersions.slice(-3);
            message += `📋 Latest valid versions: ${latestVersions.join(', ')}\n`;
            
            if (validVersions.length > 0) {
                message += `✅ Valid versions from schema: ${validVersions.join(', ')}\n`;
            }
        }
    }
    
    message += `\n📡 Source: ${result.validationSource}`;
    
    if (isOffline) {
        message += `\n💡 Connect to Azure for live validation`;
    }
    
    const output = document.getElementById('validationOutput');
    output.className = result.resourceTypeValid ? 'output-panel success' : 'output-panel warning';
    output.innerHTML = `<pre>${message}</pre>`;
}

function findSimilarResourceTypes(resourceType) {
    const allTypes = [
        'Microsoft.Network/virtualNetworks',
        'Microsoft.Storage/storageAccounts',
        'Microsoft.Compute/virtualMachines',
        'Microsoft.Web/sites',
        'Microsoft.Web/serverfarms',
        'Microsoft.KeyVault/vaults',
        'Microsoft.Sql/servers',
        'Microsoft.Network/networkSecurityGroups',
        'Microsoft.Network/publicIPAddresses',
        'Microsoft.Network/loadBalancers',
        'Microsoft.ContainerRegistry/registries',
        'Microsoft.ContainerService/managedClusters'
    ];
    
    const input = resourceType.toLowerCase();
    const suggestions = [];
    
    // Find partial matches
    allTypes.forEach(type => {
        const typeLower = type.toLowerCase();
        if (typeLower.includes(input.split('/')[1]) || input.includes(typeLower.split('/')[1])) {
            suggestions.push(type);
        }
    });
    
    return suggestions.slice(0, 3);
}

async function validateAllSelectedResources() {
    if (selectedResources.size === 0) {
        showError('❌ Please select at least one resource to validate');
        return;
    }
    
    try {
        showLoading('Validating selected resources...');
        
        const results = [];
        const useOfflineValidation = !azureResourceGraph || !azureResourceGraph.isAuthenticated();
        
        for (const resource of selectedResources) {
            try {
                const schema = await loadSchemaFile(resource.schema);
                const resourceType = schema.properties?.type?.const;
                
                if (!resourceType) {
                    results.push({
                        resourceName: resource.name,
                        status: 'error',
                        message: 'No resource type specified in schema'
                    });
                    continue;
                }
                
                let validationResult;
                if (useOfflineValidation) {
                    validationResult = await validateResourceTypeOffline(resourceType, schema);
                } else {
                    try {
                        validationResult = await validateResourceTypeOnline(resourceType, schema);
                    } catch (error) {
                        validationResult = await validateResourceTypeOffline(resourceType, schema);
                    }
                }
                
                const issues = [];
                let status = 'success';
                
                if (!validationResult.resourceTypeValid) {
                    status = 'error';
                    issues.push('Resource type not found in Azure');
                }
                
                if (validationResult.schemaApiVersions.length > 0) {
                    const invalidVersions = validationResult.schemaApiVersions.filter(v => 
                        !validationResult.availableApiVersions.includes(v)
                    );
                    
                    if (invalidVersions.length > 0) {
                        if (status !== 'error') status = 'warning';
                        issues.push(`Invalid API versions: ${invalidVersions.join(', ')}`);
                        
                        if (validationResult.availableApiVersions.length > 0) {
                            const latest = validationResult.availableApiVersions[
                                validationResult.availableApiVersions.length - 1
                            ];
                            issues.push(`Suggested version: ${latest}`);
                        }
                    }
                }
                
                results.push({
                    resourceName: resource.name,
                    resourceType: resourceType,
                    status: status,
                    message: issues.length > 0 ? issues.join('; ') : 'All validations passed',
                    validationResult: validationResult
                });
                
            } catch (error) {
                results.push({
                    resourceName: resource.name,
                    status: 'error',
                    message: `Failed to validate: ${error.message}`
                });
            }
        }
        
        displayBulkValidationResults(results, useOfflineValidation);
        
    } catch (error) {
        showError(`❌ Validation failed: ${error.message}`);
    }
}

function displayBulkValidationResults(results, isOffline) {
    let message = `${isOffline ? '🔍 Offline' : '✅ Azure'} Bulk Validation Results:\n\n`;
    
    const successCount = results.filter(r => r.status === 'success').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    message += `📊 Summary: ${successCount} valid, ${warningCount} warnings, ${errorCount} errors\n\n`;
    
    results.forEach(result => {
        const icon = result.status === 'success' ? '✅' : 
                     result.status === 'warning' ? '⚠️' : '❌';
        
        message += `${icon} ${result.resourceName}`;
        if (result.resourceType) {
            message += ` (${result.resourceType})`;
        }
        message += `\n`;
        
        if (result.message !== 'All validations passed') {
            message += `   ${result.message}\n`;
        }
        
        message += `\n`;
    });
    
    if (isOffline) {
        message += `\n💡 Connect to Azure for live validation`;
    }
    
    const output = document.getElementById('validationOutput');
    const overallStatus = errorCount > 0 ? 'error' : 
                         warningCount > 0 ? 'warning' : 'success';
    
    output.className = `output-panel ${overallStatus}`;
    output.innerHTML = `<pre>${message}</pre>`;
    
    showSuccess(`✅ Validated ${results.length} resources`);
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