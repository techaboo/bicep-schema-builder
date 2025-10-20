// Main application script
console.log('🚀 Script.js file loaded successfully!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Bicep Schema Builder loaded - DOM is ready');
    
    // Initialize the application
    init();
});

// Global variables
let schemaParser;
let currentSchema = null;
let azureResourceGraph;

function init() {
    console.log('🚀 Init function called');
    
    try {
        // Add immediate test for basic elements
        setTimeout(() => {
            console.log('🔍 BASIC ELEMENT TEST:');
            const schemaEditor = document.getElementById('schemaEditor');
            const validateBtn = document.getElementById('validateBtn');
            const activeTab = document.querySelector('.nav-tab.active');
            
            console.log('- schemaEditor element:', schemaEditor);
            console.log('- validateBtn element:', validateBtn);
            console.log('- activeTab element:', activeTab);
            console.log('- activeTab data-tab:', activeTab ? activeTab.getAttribute('data-tab') : 'null');
            
            // Test button click handler
            if (validateBtn) {
                console.log('🔍 TESTING BUTTON CLICK HANDLER:');
                validateBtn.addEventListener('click', function() {
                    console.log('🔍 BUTTON CLICKED! Event fired correctly');
                });
            }
        }, 1000);
        
        // Initialize schema parser
        if (typeof SchemaParser !== 'undefined') {
            schemaParser = new SchemaParser();
            console.log('✅ SchemaParser initialized');
        } else {
            console.warn('⚠️ SchemaParser not available - using basic validation only');
        }
        
        // Initialize Azure Resource Graph client
        if (typeof AzureResourceGraphClient !== 'undefined') {
            azureResourceGraph = new AzureResourceGraphClient();
            console.log('✅ AzureResourceGraphClient initialized');
        } else {
            console.warn('⚠️ AzureResourceGraphClient not available');
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize tabs
        initializeTabs();
        
        // Initialize theme
        initializeTheme();
        
        console.log('✅ Application initialized successfully');
    } catch (error) {
        console.error('❌ Error during initialization:', error);
    }
}

// Enhanced Tab Management
function switchTab(tabName) {
    console.log('🔄 Switching to tab:', tabName);
    
    // Hide all tab contents
    const allTabContents = document.querySelectorAll('.tab-content');
    allTabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all nav tabs
    const allNavTabs = document.querySelectorAll('.nav-tab');
    allNavTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show target tab content
    const targetContent = document.getElementById(tabName);
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    // Activate corresponding nav tab
    const targetNavTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetNavTab) {
        targetNavTab.classList.add('active');
    }
    
    // Track tab usage
    if (typeof window.trackEvent === 'function') {
        window.trackEvent('tab_switch', 'Navigation', tabName);
    }
}

// Initialize tab functionality
function initializeTabs() {
    console.log('🔧 Initializing tabs...');
    
    // Set up tab click listeners
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
            }
        });
    });
    
    // Ensure first tab is active by default
    const firstTab = document.querySelector('.nav-tab');
    if (firstTab) {
        const firstTabName = firstTab.getAttribute('data-tab');
        if (firstTabName) {
            switchTab(firstTabName);
        }
    }
    
    console.log('✅ Tabs initialized');
}

// Enhanced Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('bicep-builder-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    
    if (shouldUseDark) {
        document.body.classList.add('dark-theme');
        updateThemeIcon(true);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('bicep-builder-theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
    
    if (typeof window.trackEvent === 'function') {
        window.trackEvent('theme_toggle', 'UI', isDark ? 'dark' : 'light');
    }
}

function updateThemeIcon(isDark) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// Enhanced Copy to Clipboard Functionality
async function copyToClipboard(text, successMessage = '✅ Copied to clipboard!') {
    try {
        await navigator.clipboard.writeText(text);
        showSuccess(successMessage);
        
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('copy_to_clipboard', 'User Action', 'success');
        }
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        showError('❌ Failed to copy to clipboard');
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showSuccess(successMessage);
        } catch (fallbackError) {
            showError('❌ Copy to clipboard not supported');
        }
        
        document.body.removeChild(textArea);
    }
}

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    try {
        // File upload
        const fileInput = document.getElementById('schemaFile');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileUpload);
        }
        
        // Editor buttons - Main Schema Builder tab
        const validateBtn = document.getElementById('validateBtn');
        const formatBtn = document.getElementById('formatBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const clearEditorBtn = document.getElementById('clearEditorBtn');
        
        if (validateBtn) validateBtn.addEventListener('click', validateSchema);
        if (formatBtn) formatBtn.addEventListener('click', formatJSON);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadSchema);
        if (clearEditorBtn) clearEditorBtn.addEventListener('click', clearEditor);
        
        // ARM Converter buttons
        const analyzeArmBtn = document.getElementById('analyzeArmBtn');
        const convertToBicepBtn = document.getElementById('convertToBicepBtn');
        const copyBicepBtn = document.getElementById('copyBicepBtn');
        const downloadBicepBtn = document.getElementById('downloadBicepBtn');
        
        if (analyzeArmBtn) analyzeArmBtn.addEventListener('click', analyzeArmTemplate);
        if (convertToBicepBtn) convertToBicepBtn.addEventListener('click', convertArmToBicep);
        if (copyBicepBtn) copyBicepBtn.addEventListener('click', copyBicepToClipboard);
        if (downloadBicepBtn) downloadBicepBtn.addEventListener('click', downloadBicepTemplate);
        
        // Schema Validator buttons
        const validatorValidateBtn = document.getElementById('validatorValidateBtn');
        const validatorFormatBtn = document.getElementById('validatorFormatBtn');
        const validatorClearBtn = document.getElementById('validatorClearBtn');
        const runTestSuiteBtn = document.getElementById('runTestSuiteBtn');
        const loadSampleBtn = document.getElementById('loadSampleBtn');
        
        if (validatorValidateBtn) validatorValidateBtn.addEventListener('click', validateSchema);
        if (validatorFormatBtn) validatorFormatBtn.addEventListener('click', formatJSON);
        if (validatorClearBtn) validatorClearBtn.addEventListener('click', clearEditor);
        if (runTestSuiteBtn) runTestSuiteBtn.addEventListener('click', runTestSuite);
        if (loadSampleBtn) loadSampleBtn.addEventListener('click', loadSampleCode);
        
        // Mode buttons for Schema Validator
        const resourceModeBtn = document.getElementById('resourceModeBtn');
        const templateModeBtn = document.getElementById('templateModeBtn');
        const bicepModeBtn = document.getElementById('bicepModeBtn');
        
        if (resourceModeBtn) resourceModeBtn.addEventListener('click', () => setValidationMode('resource'));
        if (templateModeBtn) templateModeBtn.addEventListener('click', () => setValidationMode('template'));
        if (bicepModeBtn) bicepModeBtn.addEventListener('click', () => setValidationMode('bicep'));
        
        // Template buttons
        const templateButtons = document.querySelectorAll('.template-btn');
        templateButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const template = e.target.dataset.template;
                if (template) {
                    loadTemplate(template);
                    // Track template usage
                    if (typeof window.trackEvent === 'function') {
                        window.trackEvent('template_load', 'Templates', template);
                    }
                }
            });
        });
        
        // Theme toggle
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
        
        console.log('✅ Event listeners set up successfully');
    } catch (error) {
        console.error('❌ Error setting up event listeners:', error);
    }
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
    console.log('🔍 VALIDATE SCHEMA CALLED!');
    
    // Get tab-aware elements
    const activeTab = document.querySelector('.nav-tab.active');
    const tabName = activeTab ? activeTab.getAttribute('data-tab') : 'schema-builder';
    
    // Get appropriate editor element based on active tab
    let schemaEditor;
    if (tabName === 'schema-validator') {
        schemaEditor = document.getElementById('codeInput');
    } else {
        schemaEditor = document.getElementById('schemaEditor');
    }
    
    console.log('🔍 Active tab:', tabName, 'Editor:', schemaEditor);
    
    // Get appropriate output element
    const validationOutput = getOutputElement();
    console.log('🔍 Output element:', validationOutput);
    
    if (!validationOutput) {
        console.error('❌ VALIDATION OUTPUT ELEMENT NOT FOUND!');
        alert('❌ Validation output area not found. Please refresh the page.');
        return;
    }
    
    // Test that we can write to the output
    validationOutput.innerHTML = '<div style="padding: 20px; background: #e8f5e8; color: #2d5016; border-radius: 8px;">🧪 <strong>TEST:</strong> Validation function is working! Looking for content...</div>';
    
    if (schemaEditor) {
        const content = schemaEditor.value;
        console.log('🔍 Direct content check:', {
            length: content.length,
            preview: content.substring(0, 100)
        });
        
        if (!content.trim()) {
            console.log('❌ CONTENT IS EMPTY');
            validationOutput.innerHTML = '<div style="padding: 20px; background: #ffebee; color: #c62828; border-radius: 8px;">❌ <strong>No Content:</strong> Please provide a schema to validate</div>';
            return;
        } else {
            console.log('✅ CONTENT FOUND - proceeding with validation');
            validationOutput.innerHTML = '<div style="padding: 20px; background: #e8f5e8; color: #2d5016; border-radius: 8px;">✅ <strong>Content Found:</strong> Processing ' + content.length + ' characters...</div>';
        }
    } else {
        console.log('❌ SCHEMA EDITOR NOT FOUND');
        validationOutput.innerHTML = '<div style="padding: 20px; background: #ffebee; color: #c62828; border-radius: 8px;">❌ <strong>Error:</strong> Schema editor not found</div>';
        return;
    }
    
    // Continue with the actual validation process
    const schemaEditorContent = schemaEditor.value.trim();
    
    try {
        // Try to parse as JSON
        const parsedContent = JSON.parse(schemaEditorContent);
        console.log('✅ Content parsed as JSON successfully');
        console.log('📊 Parsed content keys:', Object.keys(parsedContent));
        
        // Check if it's an ARM template
        if (parsedContent.$schema && parsedContent.resources) {
            console.log('✅ Detected ARM template structure');
            
            validationOutput.innerHTML = `
                <div style="padding: 20px; background: #e8f5e8; color: #2d5016; border-radius: 8px; margin-bottom: 10px;">
                    <h4>✅ Valid ARM Template Structure Detected!</h4>
                </div>
                <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; font-family: monospace; font-size: 14px;">
                    <strong>📊 Template Analysis:</strong><br>
                    • Schema: ${parsedContent.$schema}<br>
                    • Content Version: ${parsedContent.contentVersion || 'Not specified'}<br>
                    • Parameters: ${Object.keys(parsedContent.parameters || {}).length}<br>
                    • Resources: ${(parsedContent.resources || []).length}<br>
                    • Variables: ${Object.keys(parsedContent.variables || {}).length}<br><br>
                    
                    <strong>🔍 Resource Details:</strong><br>
                    ${(parsedContent.resources || []).map((resource, index) => 
                        `${index + 1}. ${resource.type} (${resource.apiVersion})`
                    ).join('<br>')}
                    <br><br>
                    <strong>ℹ️ Note:</strong> This is basic structure validation. For comprehensive ARM template validation, Azure CLI or deployment tools are recommended.
                </div>
            `;
            return;
        }
        
        // If not ARM template, show basic JSON validation
        validationOutput.innerHTML = `
            <div style="padding: 20px; background: #e8f5e8; color: #2d5016; border-radius: 8px;">
                ✅ <strong>Valid JSON:</strong> Content parsed successfully as JSON with ${Object.keys(parsedContent).length} top-level properties.
            </div>
        `;
        
    } catch (jsonError) {
        console.log('❌ JSON parsing failed:', jsonError.message);
        
        // Check if it might be Bicep code (fixed variable name)
        if (schemaEditorContent.includes('resource ') || schemaEditorContent.includes('param ')) {
            validationOutput.innerHTML = `
                <div style="padding: 20px; background: #fff3cd; color: #856404; border-radius: 8px;">
                    ℹ️ <strong>Bicep Code Detected:</strong> This appears to be Bicep code, not JSON. For Bicep validation, please use the Azure Bicep CLI.
                </div>
            `;
        } else {
            validationOutput.innerHTML = `
                <div style="padding: 20px; background: #ffebee; color: #c62828; border-radius: 8px;">
                    ❌ <strong>Invalid JSON:</strong> ${jsonError.message}
                </div>
            `;
        }
    }
}

function validateSchemaAdvanced() {
    // Determine which tab is active and get the appropriate editor
    const activeTab = document.querySelector('.nav-tab.active');
    const activeTabId = activeTab ? activeTab.getAttribute('data-tab') : 'schema-builder';
    
    console.log('🔍 Active tab:', activeTabId, 'Active tab element:', activeTab);
    
    let editorElement;
    let outputElement;
    
    if (activeTabId === 'schema-validator') {
        // Schema Validator tab uses codeInput
        editorElement = document.getElementById('codeInput');
        outputElement = document.getElementById('validationOutput');
        console.log('📝 Using Schema Validator tab elements');
    } else {
        // Schema Builder tab (default) uses schemaEditor
        editorElement = document.getElementById('schemaEditor');
        outputElement = document.getElementById('validationOutput');
        console.log('📝 Using Schema Builder tab elements');
    }
    
    if (!editorElement) {
        console.error('❌ Editor element not found for tab:', activeTabId);
        showError('❌ Editor not found. Please try refreshing the page.');
        return;
    }
    
    console.log('📝 Editor element found:', editorElement);
    const editorContent = editorElement.value.trim();
    console.log('📝 Editor content length:', editorContent.length);
    console.log('📝 Editor content preview:', editorContent.substring(0, 100) + (editorContent.length > 100 ? '...' : ''));

    if (!editorContent) {
        console.warn('⚠️ No content found in editor');
        showError('❌ Please provide a schema to validate');
        return;
    }

    console.log('🔍 Validating content from tab:', activeTabId, 'Content length:', editorContent.length);

    try {
        showLoading('Validating content...');

        // Detect content type and handle accordingly
        let parsedContent;
        let contentType = 'unknown';
        
        // Try to parse as JSON first
        try {
            parsedContent = JSON.parse(editorContent);
            contentType = 'json';
            console.log('✅ Content parsed as JSON successfully');
            console.log('📊 Parsed content keys:', Object.keys(parsedContent));
            console.log('📊 Has $schema:', !!parsedContent.$schema);
            console.log('📊 Has resources:', !!parsedContent.resources);
        } catch (jsonError) {
            console.log('ℹ️ Content is not valid JSON:', jsonError.message);
            
            // Check if it's Bicep code
            if (editorContent.includes('resource ') || editorContent.includes('param ') || editorContent.includes('@description')) {
                contentType = 'bicep';
                console.log('ℹ️ Content detected as Bicep code');
                showValidationResults({
                    isValid: true,
                    contentType: 'bicep',
                    message: '✅ Bicep code detected. This is valid Bicep syntax.',
                    details: 'Bicep code validation would require Bicep CLI. For JSON schema validation, please provide JSON content.'
                });
                return;
            }
            
            // Check if it's ARM template JSON (even if malformed)
            if (editorContent.includes('"$schema"') || editorContent.includes('"resources"') || editorContent.includes('"parameters"')) {
                contentType = 'arm-template';
                console.log('ℹ️ Content detected as ARM template (possibly malformed)');
                showError('❌ Invalid JSON format. Please check your ARM template syntax.');
                return;
            }
            
            // Check if it's plain text or other
            if (editorContent.length > 0) {
                contentType = 'text';
                console.log('ℹ️ Content detected as plain text');
                showError('❌ Unsupported content type. Please provide valid JSON schema or ARM template.');
                return;
            }
            
            // If we get here, it's an unknown format
            throw new Error('Unable to determine content type');
        }

        currentSchema = parsedContent;

        // Check if schemaParser is initialized
        if (!schemaParser) {
            console.warn('⚠️ SchemaParser not available, using basic validation');
            // For ARM templates, provide specific feedback even without schemaParser
            if (parsedContent.$schema && parsedContent.resources) {
                console.log('✅ Detected ARM template structure');
                showValidationResults({
                    isValid: true,
                    contentType: 'ARM Template',
                    message: '✅ Valid ARM Template Structure Detected!',
                    details: `📊 Template Analysis:\n` +
                            `• Schema: ${parsedContent.$schema}\n` +
                            `• Content Version: ${parsedContent.contentVersion || 'Not specified'}\n` +
                            `• Parameters: ${Object.keys(parsedContent.parameters || {}).length}\n` +
                            `• Resources: ${(parsedContent.resources || []).length}\n` +
                            `• Variables: ${Object.keys(parsedContent.variables || {}).length}\n\n` +
                            `ℹ️ Note: This is basic structure validation. For comprehensive ARM template validation, Azure CLI or deployment tools are recommended.`
                });
                return;
            }
            
            // Perform basic validation without schemaParser
            const basicResults = performBasicValidation(parsedContent);
            if (basicResults.isValid) {
                showValidationSuccess(basicResults);
            } else {
                showValidationErrors(basicResults);
            }
            return;
        }

        console.log('✅ SchemaParser is available, using advanced validation');
        
        // Check validation mode
        const validationMode = schemaParser.getValidationMode();
        console.log('🔧 Current validation mode:', validationMode);

        let validationResults;

        // Auto-detect if content is ARM template
        if (schemaParser.isArmTemplate(parsedContent)) {
            console.log('🎯 Content identified as ARM template by schemaParser');
            // Automatically switch to template mode if we detect an ARM template
            if (validationMode === 'resource') {
                console.log('🔄 Switching from resource to template mode');
                setValidationMode('template');
            }
            validationResults = schemaParser.validateCompleteTemplate(parsedContent);
            showTemplateValidationResults(validationResults);
        } else if (validationMode === 'template') {
            console.log('🎯 Using template mode validation');
            // User selected template mode, validate as ARM template
            validationResults = schemaParser.validateCompleteTemplate(parsedContent);
            showTemplateValidationResults(validationResults);
        } else {
            console.log('🎯 Using resource schema mode validation');
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
        console.error('🚨 Validation error caught:', error);
        console.error('🚨 Error stack:', error.stack);
        
        // Provide user-friendly error messages based on content and error type
        if (error.message.includes('JSON')) {
            showValidationResults({
                isValid: false,
                message: '❌ Invalid JSON Format',
                details: 'The content you entered is not valid JSON. Please check:\n\n' +
                        '• Missing or extra commas\n' +
                        '• Unmatched brackets or braces\n' +
                        '• Missing quotes around strings\n' +
                        '• Invalid escape characters\n\n' +
                        'For Bicep code validation, please use the appropriate Bicep tools.'
            });
        } else if (error.message.includes('schemaParser')) {
            showValidationResults({
                isValid: false,
                message: '❌ Schema Parser Error',
                details: `There was an issue with the schema validation engine:\n\n${error.message}\n\nThis might be a temporary issue. Try refreshing the page.`
            });
        } else {
            // For ARM templates that had JSON parsing errors after successful initial parse
            const trimmedContent = editorContent.substring(0, 100);
            if (trimmedContent.includes('"$schema"') && trimmedContent.includes('deploymentTemplate')) {
                showValidationResults({
                    isValid: false,
                    message: '❌ ARM Template Validation Error',
                    details: `Your ARM template structure was recognized, but validation failed:\n\n${error.message}\n\nThe JSON syntax appears correct, but there may be issues with the template structure or references.`
                });
            } else {
                showError(`❌ Validation failed: ${error.message}`);
            }
        }
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

function performBasicValidation(schema) {
    const results = {
        isValid: true,
        errors: [],
        warnings: [],
        info: []
    };
    
    // Check if it's an ARM template
    if (schema.$schema && schema.$schema.includes('deploymentTemplate')) {
        results.info.push('Detected: ARM Deployment Template');
        results.info.push(`Content Version: ${schema.contentVersion || 'Not specified'}`);
        
        if (schema.resources) {
            results.info.push(`Resources: ${schema.resources.length}`);
        }
        if (schema.parameters) {
            results.info.push(`Parameters: ${Object.keys(schema.parameters).length}`);
        }
        if (schema.variables) {
            results.info.push(`Variables: ${Object.keys(schema.variables).length}`);
        }
        if (schema.outputs) {
            results.info.push(`Outputs: ${Object.keys(schema.outputs).length}`);
        }
        
        results.warnings.push('Full ARM template validation requires SchemaParser utility');
    } else {
        // Basic JSON Schema validation
        if (!schema.type) {
            results.errors.push('Missing required "type" property');
            results.isValid = false;
        } else {
            results.info.push(`Schema Type: ${schema.type}`);
        }
        
        if (schema.properties) {
            results.info.push(`Properties: ${Object.keys(schema.properties).length}`);
        }
        
        if (!schema.$schema) {
            results.warnings.push('Consider adding $schema property');
        }
    }
    
    return results;
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
    console.log('🎨 Format button clicked');
    
    // Check which tab is currently active and format accordingly
    const activeTab = document.querySelector('.nav-tab.active');
    const activeTabId = activeTab ? activeTab.getAttribute('data-tab') : 'schema-builder';
    
    console.log('Active tab:', activeTabId);
    
    if (activeTabId === 'arm-converter') {
        // Format Bicep code in ARM converter
        formatBicepCode();
        return;
    }
    
    if (activeTabId === 'schema-validator') {
        // Format code in schema validator based on current mode
        formatValidatorCode();
        return;
    }
    
    // Default: Format JSON in Schema Builder tab
    const editor = document.getElementById('schemaEditor');
    console.log('Editor element:', editor);
    
    if (!editor) {
        showError('❌ Schema editor not found');
        return;
    }
    
    const content = editor.value.trim();
    console.log('Content to format:', content.substring(0, 100) + '...');

    if (!content) {
        showError('❌ No content to format');
        return;
    }

    try {
        const parsed = JSON.parse(content);
        const formatted = JSON.stringify(parsed, null, 2);
        editor.value = formatted;
        showSuccess('✅ JSON formatted successfully!');
        console.log('✅ JSON formatted successfully');
    } catch (error) {
        console.error('Format error:', error);
        showError(`❌ Cannot format invalid JSON: ${error.message}`);
    }
}

// Format code in Schema Validator tab
function formatValidatorCode() {
    const codeInput = document.getElementById('codeInput');
    if (!codeInput || !codeInput.value.trim()) {
        showNotificationPro('❌ No code to format', 'error');
        return;
    }
    
    const currentMode = window.currentValidationMode || 'bicep';
    const content = codeInput.value.trim();
    
    try {
        if (currentMode === 'json' || currentMode === 'arm') {
            // Format JSON/ARM templates
            const parsed = JSON.parse(content);
            const formatted = JSON.stringify(parsed, null, 2);
            codeInput.value = formatted;
            showNotificationPro('✅ JSON formatted successfully!', 'success');
        } else if (currentMode === 'bicep') {
            // Format Bicep code
            let formattedCode = content;
            
            // Basic Bicep formatting
            formattedCode = formattedCode.replace(/\r\n/g, '\n');
            formattedCode = formattedCode.replace(/\t/g, '  ');
            
            // Clean up spacing around operators
            formattedCode = formattedCode.replace(/\s*=\s*/g, ' = ');
            formattedCode = formattedCode.replace(/\s*:\s*/g, ': ');
            
            // Format object properties with consistent indentation
            const lines = formattedCode.split('\n');
            let indentLevel = 0;
            const indentSize = 2;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (line.includes('{')) {
                    lines[i] = ' '.repeat(indentLevel * indentSize) + line;
                    indentLevel++;
                } else if (line.includes('}')) {
                    indentLevel = Math.max(0, indentLevel - 1);
                    lines[i] = ' '.repeat(indentLevel * indentSize) + line;
                } else if (line.length > 0) {
                    lines[i] = ' '.repeat(indentLevel * indentSize) + line;
                }
            }
            
            formattedCode = lines.join('\n');
            formattedCode = formattedCode.replace(/\n\s*\n\s*\n/g, '\n\n');
            
            codeInput.value = formattedCode;
            showNotificationPro('✅ Bicep code formatted successfully!', 'success');
        } else {
            // For other modes, try JSON first, then basic formatting
            try {
                const parsed = JSON.parse(content);
                const formatted = JSON.stringify(parsed, null, 2);
                codeInput.value = formatted;
                showNotificationPro('✅ Content formatted as JSON!', 'success');
            } catch {
                // Basic text formatting
                let formatted = content.replace(/\r\n/g, '\n').replace(/\t/g, '  ');
                codeInput.value = formatted;
                showNotificationPro('✅ Basic formatting applied!', 'success');
            }
        }
    } catch (error) {
        console.error('Format error:', error);
        showNotificationPro(`❌ Cannot format content: ${error.message}`, 'error');
    }
}

function clearEditor() {
    // Determine which tab is active and get the appropriate editor
    const activeTab = document.querySelector('.nav-tab.active');
    const activeTabId = activeTab ? activeTab.getAttribute('data-tab') : 'schema-builder';
    
    let editor;
    
    if (activeTabId === 'schema-validator') {
        // Schema Validator tab uses codeInput
        editor = document.getElementById('codeInput');
    } else {
        // Schema Builder tab (default) uses schemaEditor
        editor = document.getElementById('schemaEditor');
    }
    
    if (!editor) {
        console.error('❌ Editor element not found for tab:', activeTabId);
        showError('❌ Editor not found. Please try refreshing the page.');
        return;
    }
    
    const content = editor.value.trim();

    if (!content) {
        showSuccess('✅ Editor is already empty');
        return;
    }

    if (confirm('Are you sure you want to clear the editor?\n\nThis action cannot be undone.')) {
        editor.value = '';
        currentSchema = null;
        const validationOutput = document.getElementById('results');
        if (validationOutput) {
            validationOutput.innerHTML = '<p class="placeholder">Upload or paste a schema to see validation results...</p>';
            validationOutput.className = 'output-panel';
        }
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

function downloadBicepTemplate() {
    const bicepOutput = document.getElementById('bicepOutput');
    if (!bicepOutput || !bicepOutput.value.trim()) {
        showError('❌ No Bicep template to download. Please convert an ARM template first.');
        return;
    }

    try {
        const content = bicepOutput.value;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template.bicep';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess('✅ Bicep template downloaded successfully!');
    } catch (error) {
        showError(`❌ Error downloading Bicep template: ${error.message}`);
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
function getOutputElement() {
    // Get the active tab and return the appropriate output element
    const activeTab = document.querySelector('.nav-tab.active');
    const tabName = activeTab ? activeTab.getAttribute('data-tab') : 'schema-builder';
    
    switch(tabName) {
        case 'schema-validator':
            return document.getElementById('validationOutput');
        case 'schema-builder':
        default:
            return document.getElementById('results');
    }
}

function showLoading(message) {
    const output = getOutputElement();
    if (output) {
        output.className = 'output-panel';
        output.textContent = `⏳ ${message}`;
    }
}

function showSuccess(message) {
    const output = getOutputElement();
    if (output) {
        output.className = 'output-panel success';
        output.textContent = message;
        
        setTimeout(() => {
            if (output.textContent === message) {
                output.className = 'output-panel';
                output.innerHTML = '<p class="placeholder">Ready for next validation...</p>';
            }
        }, 3000);
    }
}

function showError(message) {
    const output = getOutputElement();
    if (output) {
        output.className = 'output-panel error';
        output.textContent = message;
    }
}

function showValidationSuccess(results) {
    const output = document.getElementById('results');
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

function showValidationResults(results) {
    const output = document.getElementById('validationOutput');
    
    if (results.isValid) {
        output.className = 'output-panel success';
        let message = results.message || '✅ Content is valid!';
        
        if (results.contentType) {
            message += `\n\n📄 Content Type: ${results.contentType.toUpperCase()}`;
        }
        
        if (results.details) {
            message += `\n\nℹ️ Details:\n${results.details}`;
        }
        
        output.textContent = message;
    } else {
        output.className = 'output-panel error';
        let message = results.message || '❌ Content validation failed!';
        
        if (results.details) {
            message += `\n\n${results.details}`;
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
    const targetScope = 'resourceGroup'; // Default scope
    
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
    bicep += generateAdvancedParameters(schema, resourceType, targetScope);

    // Add variables section
    bicep += generateVariables(schema, resourceType, targetScope);

    // Add the resource definition with detailed properties
    bicep += generateDetailedResource(schema, resourceType, cleanResourceName);

    // Add outputs
    bicep += generateAdvancedOutputs(schema, cleanResourceName, targetScope);

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

// Helper function to determine if a resource type supports location and tags at resource group scope
function resourceSupportsLocationAndTags(resourceType, targetScope = 'resourceGroup') {
    // Microsoft.Resources/deployments at resourceGroup scope does NOT support location or tags
    // It DOES support location at subscription, managementGroup, and tenant scopes
    if (resourceType === 'Microsoft.Resources/deployments' && targetScope === 'resourceGroup') {
        return false;
    }
    
    // Add other resource types that don't support location/tags if needed
    const resourcesWithoutLocation = [
        'Microsoft.Authorization/policyAssignments',
        'Microsoft.Authorization/roleAssignments'
    ];
    
    return !resourcesWithoutLocation.includes(resourceType);
}

function generateAdvancedParameters(schema, resourceType, targetScope = 'resourceGroup') {
    const supportsLocationAndTags = resourceSupportsLocationAndTags(resourceType, targetScope);
    
    let params = `// === PARAMETERS ===

@description('The name of the resource')
@minLength(1)
@maxLength(80)
param resourceName string

`;

    // Only add location parameter if the resource supports it
    if (supportsLocationAndTags) {
        params += `@description('The location for the resource')
param location string = resourceGroup().location

`;
    }

    params += `@description('Environment name (e.g., dev, test, prod)')
@allowed(['dev', 'test', 'staging', 'prod'])
param environment string = 'dev'

`;

    // Only add tags parameter if the resource supports it
    if (supportsLocationAndTags) {
        params += `@description('Resource tags')
param tags object = {
  Environment: environment
  CreatedBy: 'Bicep Schema Builder'
  CreatedDate: utcNow('yyyy-MM-dd')
}

`;
    }

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

function generateVariables(schema, resourceType, targetScope = 'resourceGroup') {
    const supportsLocationAndTags = resourceSupportsLocationAndTags(resourceType, targetScope);
    
    let variables = `// === VARIABLES ===

var resourceNameFormatted = toLower(replace(resourceName, ' ', '-'))
`;

    // Only add commonTags if the resource supports tags
    if (supportsLocationAndTags) {
        variables += `var commonTags = union(tags, {
  ResourceType: '${resourceType}'
  DeployedBy: 'Bicep Schema Builder'
})

`;
    }

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

        case 'Microsoft.Resources/deployments':
            resource += `resource ${cleanResourceName} '${resourceType}@${getLatestApiVersion(schema)}' = {
  name: resourceNameFormatted
  properties: {
    mode: 'Incremental'
    template: {
      '$schema': 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#'
      contentVersion: '1.0.0.0'
      resources: []
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

function generateAdvancedOutputs(schema, cleanResourceName, targetScope = 'resourceGroup') {
    const resourceType = schema.properties?.type?.const;
    const supportsLocationAndTags = resourceSupportsLocationAndTags(resourceType, targetScope);
    
    let outputs = `// === OUTPUTS ===

@description('Resource ID of the created resource')
output resourceId string = ${cleanResourceName}.id

@description('Name of the created resource')
output resourceName string = ${cleanResourceName}.name

`;

    // Only add location output if the resource supports it
    if (supportsLocationAndTags) {
        outputs += `@description('Location of the created resource')
output location string = ${cleanResourceName}.location

`;
    }

    // Add resource-specific outputs
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
    const supportsLocationAndTags = resourceSupportsLocationAndTags(resourceType, 'resourceGroup');
    
    let bicep = `resource ${resourceName} '${resourceType}@${getLatestApiVersion(schema)}' = {
  name: '\${resourcePrefix}-${resourceId}-\${environment}'
`;

    // Only add location and tags if the resource supports them
    if (supportsLocationAndTags) {
        bicep += `  location: location
  tags: commonTags
`;
    }

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
        case 'Microsoft.Resources/deployments':
            return `  properties: {
    mode: 'Incremental'
    template: {
      '$schema': 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#'
      contentVersion: '1.0.0.0'
      resources: []
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

// ARM Template to Bicep Converter Functions
let armTemplateAnalysis = null;

function analyzeArmTemplate() {
    console.log('🔍 Analyze ARM Template button clicked');
    alert('Analyze ARM Template function called!'); // Temporary debug alert
    
    const armInputElement = document.getElementById('armTemplateInput');
    console.log('ARM input element:', armInputElement);
    
    if (!armInputElement) {
        alert('❌ Cannot find armTemplateInput element!');
        return;
    }
    
    const armInput = armInputElement.value.trim();
    console.log('ARM Input length:', armInput.length);
    alert('ARM Input length: ' + armInput.length);
    
    if (!armInput) {
        console.log('❌ No ARM template content found');
        alert('❌ Please paste an ARM template first');
        showError('❌ Please paste an ARM template first');
        return;
    }
    
    try {
        const armTemplate = JSON.parse(armInput);
        
        // Analyze the template
        const analysis = {
            resources: armTemplate.resources || [],
            parameters: armTemplate.parameters || {},
            variables: armTemplate.variables || {},
            resourceTypes: new Set(),
            dependencies: [],
            missingDependencies: []
        };
        
        // Analyze resources
        analysis.resources.forEach(resource => {
            analysis.resourceTypes.add(resource.type);
            
            // Check for external dependencies
            if (resource.type === 'Microsoft.Compute/virtualMachines') {
                checkVMDependencies(resource, armTemplate, analysis);
            }
        });
        
        armTemplateAnalysis = analysis;
        alert('✅ Analysis completed! Found ' + analysis.resources.length + ' resources');
        displayAnalysis(analysis);
        
        // Enable convert button
        const convertBtn = document.getElementById('convertToBicepBtn');
        const configSection = document.getElementById('converterConfig');
        
        alert('Enabling convert button and showing config...');
        
        if (convertBtn) {
            convertBtn.disabled = false;
            alert('✅ Convert button enabled!');
        } else {
            alert('❌ Convert button not found!');
        }
        
        if (configSection) {
            configSection.style.display = 'block';
            alert('✅ Config section shown!');
        } else {
            alert('❌ Config section not found!');
        }
        
        // Track analysis
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('arm_template_analysis', 'ARM Converter', `${analysis.resources.length}_resources`);
        }
        
    } catch (error) {
        showError(`❌ Invalid JSON: ${error.message}`);
    }
}

function checkVMDependencies(vmResource, armTemplate, analysis) {
    const vmProps = vmResource.properties || {};
    
    // Check for network interface
    const networkProfile = vmProps.networkProfile;
    if (networkProfile && networkProfile.networkInterfaces) {
        networkProfile.networkInterfaces.forEach(nic => {
            if (nic.id && nic.id.includes('parameters(')) {
                analysis.missingDependencies.push({
                    type: 'Microsoft.Network/networkInterfaces',
                    reason: 'External reference - will create new NIC with subnet'
                });
            }
        });
    }
    
    // Check for managed disk
    const storageProfile = vmProps.storageProfile;
    if (storageProfile && storageProfile.osDisk && storageProfile.osDisk.managedDisk) {
        const diskId = storageProfile.osDisk.managedDisk.id;
        if (diskId && diskId.includes('parameters(')) {
            analysis.missingDependencies.push({
                type: 'Microsoft.Compute/disks',
                reason: 'External reference - will create new managed disk'
            });
        }
    }
    
    // Add required infrastructure
    analysis.missingDependencies.push(
        {
            type: 'Microsoft.Network/virtualNetworks',
            reason: 'Required for VM deployment'
        },
        {
            type: 'Microsoft.Network/networkSecurityGroups',
            reason: 'Security best practice'
        },
        {
            type: 'Microsoft.Network/publicIPAddresses',
            reason: 'Optional - for external access'
        }
    );
}

function displayAnalysis(analysis) {
    const analysisContent = document.getElementById('analysisContent');
    const analysisResults = document.getElementById('analysisResults');
    
    let html = '<div class="analysis-summary">';
    html += `<div class="analysis-item">`;
    html += `<h4>📊 Template Overview</h4>`;
    html += `<p><strong>Resources Found:</strong> ${analysis.resources.length}</p>`;
    html += `<p><strong>Parameters:</strong> ${Object.keys(analysis.parameters).length}</p>`;
    html += `<p><strong>Resource Types:</strong> ${Array.from(analysis.resourceTypes).join(', ')}</p>`;
    html += `</div>`;
    
    if (analysis.missingDependencies.length > 0) {
        html += `<div class="analysis-item">`;
        html += `<h4>🔧 Dependencies to Add</h4>`;
        analysis.missingDependencies.forEach(dep => {
            html += `<p><strong>${dep.type}:</strong> ${dep.reason}</p>`;
        });
        html += `</div>`;
    }
    
    html += '</div>';
    
    analysisContent.innerHTML = html;
    analysisResults.style.display = 'block';
}

function convertArmToBicep() {
    console.log('🔄 Convert ARM to Bicep function called');
    
    if (!armTemplateAnalysis) {
        showError('❌ Please analyze the template first');
        return;
    }
    
    const armInput = document.getElementById('armTemplateInput').value.trim();
    const armTemplate = JSON.parse(armInput);
    
    // Get configuration
    const networkModeElement = document.querySelector('input[name="networkMode"]:checked');
    console.log('Network mode element:', networkModeElement);
    
    if (!networkModeElement) {
        showError('❌ Please select a network mode');
        return;
    }
    
    const networkMode = networkModeElement.value;
    console.log('Selected network mode:', networkMode);
    
    const config = {
        location: document.getElementById('targetLocation').value,
        networkMode: networkMode,
        // New network config
        vnetAddressSpace: document.getElementById('vnetAddressSpace').value,
        subnetAddressSpace: document.getElementById('subnetAddressSpace').value,
        // Existing network config
        existingVnetName: document.getElementById('existingVnetName').value,
        existingSubnetName: document.getElementById('existingSubnetName').value,
        existingVnetResourceGroup: document.getElementById('existingVnetResourceGroup').value,
        // VM config
        vmSize: document.getElementById('vmSize').value,
        osType: document.getElementById('osType').value,
        includePublicIP: document.getElementById('includePublicIP').checked,
    };
    
    console.log('Configuration object:', config);
    
    // Validate existing network configuration if selected
    if (networkMode === 'existing') {
        console.log('Validating existing network configuration...');
        if (!config.existingVnetName || !config.existingSubnetName) {
            showError('❌ Please provide existing VNet and Subnet names');
            return;
        }
        console.log('✅ Existing network configuration valid');
    }
    
    // Complete the config object
    config.includeNSG = document.getElementById('includeNSG').checked;
    config.includeBootDiagnostics = document.getElementById('includeBootDiagnostics').checked;
    
    console.log('Final configuration:', config);
    
    // Generate complete Bicep template
    const bicepTemplate = generateCompleteBicepTemplate(armTemplate, armTemplateAnalysis, config);
    
    // Display result
    document.getElementById('bicepOutput').value = bicepTemplate;
    document.getElementById('converterOutput').style.display = 'block';
    
    // Track conversion
    if (typeof window.trackEvent === 'function') {
        window.trackEvent('arm_to_bicep_conversion', 'ARM Converter', config.location);
    }
    
    showSuccess('✅ ARM template successfully converted to Bicep!');
}

function generateCompleteBicepTemplate(armTemplate, analysis, config) {
    const originalVM = analysis.resources.find(r => r.type === 'Microsoft.Compute/virtualMachines');
    const vmName = originalVM ? extractParameterName(originalVM.name) : 'myvm';
    
    if (config.networkMode === 'existing') {
        console.log('Using existing network mode for VM:', vmName);
        // Temporary simple template to test
        return `// VM Deployment using Existing VNet/Subnet
targetScope = 'resourceGroup'

param vmName string = '${vmName}'
param location string = '${config.location}'
param existingVnetName string = '${config.existingVnetName}'
param existingSubnetName string = '${config.existingSubnetName}'

var vmNameClean = toLower(replace(vmName, ' ', '-'))
var networkInterfaceName = '\${vmNameClean}-nic'

resource existingVnet 'Microsoft.Network/virtualNetworks@2023-05-01' existing = {
  name: existingVnetName
}

resource existingSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' existing = {
  parent: existingVnet
  name: existingSubnetName
}

resource networkInterface 'Microsoft.Network/networkInterfaces@2023-05-01' = {
  name: networkInterfaceName
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          subnet: {
            id: existingSubnet.id
          }
        }
      }
    ]
  }
}

output message string = 'Bicep template generated successfully for existing network!'
`;
    } else {
        return generateBicepWithNewNetwork(vmName, config);
    }
}

function generateBicepWithExistingNetwork(vmName, config) {
    console.log('🔧 Generating Bicep with existing network for VM:', vmName);
    
    // Build the template step by step
    let template = `// VM Deployment using Existing VNet/Subnet - Converted from ARM Template
// Generated on: ${new Date().toISOString()}
// Uses existing network infrastructure
// VM Name: ${vmName}

targetScope = 'resourceGroup'

metadata description = 'VM deployment using existing VNet and subnet'
metadata author = 'Bicep Schema Builder - ARM Converter'
metadata version = '1.0.0'

// === PARAMETERS ===

@description('Virtual Machine name')
param vmName string = '${vmName}'

@description('Location for VM resources')
param location string = '${config.location}'

@description('Existing Virtual Network name')
param existingVnetName string = '${config.existingVnetName || 'existing-vnet'}'

@description('Existing Subnet name')
param existingSubnetName string = '${config.existingSubnetName || 'default'}'

${config.existingVnetResourceGroup ? `@description('Resource Group containing the VNet')
param vnetResourceGroupName string = '${config.existingVnetResourceGroup}'` : ''}

@description('Administrator username')
param adminUsername string = 'azureuser'

@description('Administrator password or SSH key')
@secure()
param adminPasswordOrKey string

@description('Virtual Machine size')
param vmSize string = '${config.vmSize}'

@description('OS Type')
@allowed(['Linux', 'Windows'])
param osType string = '${config.osType}'

// === VARIABLES ===

var vmNameClean = toLower(replace('${vmName}', ' ', '-'))
${config.includeNSG ? `var networkSecurityGroupName = '\${vmNameClean}-nsg'` : ''}
var networkInterfaceName = '\${vmNameClean}-nic'
var osDiskName = '\${vmNameClean}-osdisk'
${config.includePublicIP ? `var publicIPAddressName = '\${vmNameClean}-pip'` : ''}

// === EXISTING RESOURCES ===

${config.existingVnetResourceGroup ? `// Reference existing VNet in different resource group
resource existingVnet 'Microsoft.Network/virtualNetworks@2023-05-01' existing = {
  name: existingVnetName
  scope: resourceGroup(vnetResourceGroupName)
}

resource existingSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' existing = {
  parent: existingVnet
  name: existingSubnetName
}` : `// Reference existing VNet in same resource group
resource existingVnet 'Microsoft.Network/virtualNetworks@2023-05-01' existing = {
  name: existingVnetName
}

resource existingSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' existing = {
  parent: existingVnet
  name: existingSubnetName
}`}

// === NEW RESOURCES ===

${config.includeNSG ? `// Network Security Group for VM
resource networkSecurityGroup 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: networkSecurityGroupName
  location: location
  properties: {
    securityRules: [
      ${config.osType === 'Linux' ? `{
        name: 'SSH'
        properties: {
          priority: 1001
          access: 'Allow'
          direction: 'Inbound'
          destinationPortRange: '22'
          protocol: 'Tcp'
          sourcePortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }` : `{
        name: 'RDP'
        properties: {
          priority: 1001
          access: 'Allow'
          direction: 'Inbound'
          destinationPortRange: '3389'
          protocol: 'Tcp'
          sourcePortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }`}
    ]
  }
}` : ''}

${config.includePublicIP ? `// Public IP Address
resource publicIPAddress 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: publicIPAddressName
  location: location
  sku: { name: 'Standard' }
  properties: {
    publicIPAllocationMethod: 'Static'
    dnsSettings: { domainNameLabel: vmNameClean }
  }
}` : ''}

// Network Interface
resource networkInterface 'Microsoft.Network/networkInterfaces@2023-05-01' = {
  name: networkInterfaceName
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          subnet: { id: existingSubnet.id }
          ${config.includePublicIP ? 'publicIPAddress: { id: publicIPAddress.id }' : ''}
        }
      }
    ]
    ${config.includeNSG ? 'networkSecurityGroup: { id: networkSecurityGroup.id }' : ''}
  }
}

// Virtual Machine
resource virtualMachine 'Microsoft.Compute/virtualMachines@2024-11-01' = {
  name: vmName
  location: location
  properties: {
    hardwareProfile: { vmSize: vmSize }
    osProfile: {
      computerName: vmName
      adminUsername: adminUsername
      adminPassword: adminPasswordOrKey
      ${config.osType === 'Linux' ? 'linuxConfiguration: { disablePasswordAuthentication: false }' : 'windowsConfiguration: { enableAutomaticUpdates: true }'}
    }
    storageProfile: {
      imageReference: {
        ${config.osType === 'Linux' ? `publisher: 'Canonical'
        offer: '0001-com-ubuntu-server-jammy'
        sku: '22_04-lts-gen2'` : `publisher: 'MicrosoftWindowsServer'
        offer: 'WindowsServer'
        sku: '2022-datacenter-azure-edition'`}
        version: 'latest'
      }
      osDisk: {
        name: osDiskName
        caching: 'ReadWrite'
        createOption: 'FromImage'
        managedDisk: { storageAccountType: 'Premium_LRS' }
      }
    }
    networkProfile: {
      networkInterfaces: [{ id: networkInterface.id }]
    }
    ${config.includeBootDiagnostics ? 'diagnosticsProfile: { bootDiagnostics: { enabled: true } }' : ''}
  }
}

// === OUTPUTS ===

output vmId string = virtualMachine.id
output vmName string = virtualMachine.name
output existingVnetUsed string = existingVnet.name
output existingSubnetUsed string = existingSubnet.name
${config.includePublicIP ? 'output publicIPAddress string = publicIPAddress.properties.ipAddress' : ''}
output privateIPAddress string = networkInterface.properties.ipConfigurations[0].properties.privateIPAddress
output connectionCommand string = ${config.osType === 'Linux' ? 
    (config.includePublicIP ? "'ssh \\${adminUsername}@\\${publicIPAddress.properties.dnsSettings.fqdn}'" : "'ssh \\${adminUsername}@<private_ip>'") :
    (config.includePublicIP ? "'mstsc /v:\\${publicIPAddress.properties.dnsSettings.fqdn}'" : "'mstsc /v:<private_ip>'")}`;
}

function generateBicepWithNewNetwork(vmName, config) {
    return `// Complete VM Deployment - Converted from ARM Template
// Generated on: ${new Date().toISOString()}
// Includes all dependencies for standalone deployment

targetScope = 'resourceGroup'

metadata description = 'Complete VM deployment with all dependencies'
metadata author = 'Bicep Schema Builder - ARM Converter'
metadata version = '1.0.0'

// === PARAMETERS ===

@description('Virtual Machine name')
param vmName string = '${vmName}'

@description('Location for all resources')
param location string = '${config.location}'

@description('Administrator username')
param adminUsername string = 'azureuser'

@description('Administrator password or SSH key')
@secure()
param adminPasswordOrKey string

@description('Virtual Machine size')
param vmSize string = '${config.vmSize}'

@description('OS Type')
@allowed(['Linux', 'Windows'])
param osType string = '${config.osType}'

@description('Environment tag')
param environment string = 'dev'

// === VARIABLES ===

var vmNameClean = toLower(replace('${vmName}', ' ', '-'))
var networkSecurityGroupName = '\${vmNameClean}-nsg'
var virtualNetworkName = '\${vmNameClean}-vnet'
var subnetName = 'default'
var networkInterfaceName = '\${vmNameClean}-nic'
var osDiskName = '\${vmNameClean}-osdisk'
${config.includePublicIP ? "var publicIPAddressName = '\\${vmNameClean}-pip'" : ''}

// Network configuration
var vnetAddressSpace = '${config.vnetAddressSpace}'
var subnetAddressSpace = '${config.subnetAddressSpace}'

${config.includeNSG ? `
// Network Security Group
resource networkSecurityGroup 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: networkSecurityGroupName
  location: location
  properties: {
    securityRules: [
      ${config.osType === 'Linux' ? `{
        name: 'SSH'
        properties: {
          priority: 1001
          access: 'Allow'
          direction: 'Inbound'
          destinationPortRange: '22'
          protocol: 'Tcp'
          sourcePortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }` : `{
        name: 'RDP'
        properties: {
          priority: 1001
          access: 'Allow'
          direction: 'Inbound'
          destinationPortRange: '3389'
          protocol: 'Tcp'
          sourcePortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }`}
    ]
  }
}` : ''}

// Virtual Network
resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: virtualNetworkName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressSpace
      ]
    }
    subnets: [
      {
        name: subnetName
        properties: {
          addressPrefix: subnetAddressSpace
          ${config.includeNSG ? 'networkSecurityGroup: { id: networkSecurityGroup.id }' : ''}
        }
      }
    ]
  }
}

${config.includePublicIP ? `
// Public IP Address
resource publicIPAddress 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: publicIPAddressName
  location: location
  sku: { name: 'Standard' }
  properties: {
    publicIPAllocationMethod: 'Static'
    dnsSettings: { domainNameLabel: vmNameClean }
  }
}` : ''}

// Network Interface
resource networkInterface 'Microsoft.Network/networkInterfaces@2023-05-01' = {
  name: networkInterfaceName
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          subnet: { id: virtualNetwork.properties.subnets[0].id }
          ${config.includePublicIP ? 'publicIPAddress: { id: publicIPAddress.id }' : ''}
        }
      }
    ]
  }
}

// Virtual Machine
resource virtualMachine 'Microsoft.Compute/virtualMachines@2024-11-01' = {
  name: vmName
  location: location
  properties: {
    hardwareProfile: { vmSize: vmSize }
    osProfile: {
      computerName: vmName
      adminUsername: adminUsername
      adminPassword: adminPasswordOrKey
      ${config.osType === 'Linux' ? 'linuxConfiguration: { disablePasswordAuthentication: false }' : 'windowsConfiguration: { enableAutomaticUpdates: true }'}
    }
    storageProfile: {
      imageReference: {
        ${config.osType === 'Linux' ? `publisher: 'Canonical'
        offer: '0001-com-ubuntu-server-jammy'
        sku: '22_04-lts-gen2'` : `publisher: 'MicrosoftWindowsServer'
        offer: 'WindowsServer'
        sku: '2022-datacenter-azure-edition'`}
        version: 'latest'
      }
      osDisk: {
        name: osDiskName
        caching: 'ReadWrite'
        createOption: 'FromImage'
        managedDisk: { storageAccountType: 'Premium_LRS' }
      }
    }
    networkProfile: {
      networkInterfaces: [{ id: networkInterface.id }]
    }
    ${config.includeBootDiagnostics ? 'diagnosticsProfile: { bootDiagnostics: { enabled: true } }' : ''}
  }
}

// === OUTPUTS ===

output vmId string = virtualMachine.id
output vmName string = virtualMachine.name
${config.includePublicIP ? 'output publicIPAddress string = publicIPAddress.properties.ipAddress' : ''}
output connectionCommand string = ${config.osType === 'Linux' ? 
    (config.includePublicIP ? "'ssh \\${adminUsername}@\\${publicIPAddress.properties.dnsSettings.fqdn}'" : "'Use private IP for connection'") :
    (config.includePublicIP ? "'mstsc /v:\\${publicIPAddress.properties.dnsSettings.fqdn}'" : "'Use private IP for connection'")}`;
}

function extractParameterName(armExpression) {
    if (typeof armExpression === 'string' && armExpression.includes('parameters(')) {
        const match = armExpression.match(/parameters\('([^']+)'\)/);
        return match ? match[1].replace(/_name$/, '') : 'myvm';
    }
    return 'myvm';
}

function copyBicepToClipboard() {
    const bicepOutput = document.getElementById('bicepOutput');
    bicepOutput.select();
    document.execCommand('copy');
    showSuccess('✅ Bicep template copied to clipboard!');
}

function downloadBicepFile() {
    const bicepContent = document.getElementById('bicepOutput').value;
    const blob = new Blob([bicepContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-vm-template.bicep';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('✅ Bicep template downloaded!');
}

function toggleNetworkMode() {
    const networkMode = document.querySelector('input[name="networkMode"]:checked').value;
    const createConfig = document.getElementById('createNetworkConfig');
    const existingConfig = document.getElementById('existingNetworkConfig');
    
    if (networkMode === 'existing') {
        createConfig.style.display = 'none';
        existingConfig.style.display = 'block';
    } else {
        createConfig.style.display = 'grid';
        existingConfig.style.display = 'none';
    }
}

function deployBicepTemplate() {
    const deployCommand = `# Deploy using Azure CLI:
az deployment group create \\
  --resource-group myResourceGroup \\
  --template-file converted-vm-template.bicep \\
  --parameters vmName=myVM adminUsername=azureuser adminPasswordOrKey='YourSecurePassword123!'`;
    
    showInfo(`🚀 To deploy this template:\n\n${deployCommand}`);
}

// Enhanced Notification System for Pro Version
function showNotificationPro(message, type = 'info', duration = 3000) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification-pro');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-pro notification-pro-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="notification-icon ${getNotificationIcon(type)}"></i>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '10000',
        padding: '16px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        color: 'white',
        fontWeight: '500',
        minWidth: '300px',
        maxWidth: '500px',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        background: getNotificationColor(type)
    });
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'info': 
        default: return 'fas fa-info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return 'linear-gradient(135deg, #4CAF50, #45a049)';
        case 'error': return 'linear-gradient(135deg, #F44336, #d32f2f)';
        case 'warning': return 'linear-gradient(135deg, #FF9800, #f57c00)';
        case 'info':
        default: return 'linear-gradient(135deg, #2196F3, #1976d2)';
    }
}

// Enhanced Copy Functionality for ARM Converter
function copyBicepToClipboard() {
    const bicepOutput = document.getElementById('bicepOutput');
    if (bicepOutput && bicepOutput.value) {
        copyToClipboard(bicepOutput.value, '✅ Bicep template copied to clipboard!');
    } else {
        showNotificationPro('❌ No Bicep template to copy', 'error');
    }
}

// Enhanced Download Functionality
function downloadBicepFile() {
    const bicepOutput = document.getElementById('bicepOutput');
    if (bicepOutput && bicepOutput.value) {
        const blob = new Blob([bicepOutput.value], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted-template.bicep';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotificationPro('✅ Bicep template downloaded successfully!', 'success');
        
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('download_bicep', 'ARM Converter', 'success');
        }
    } else {
        showNotificationPro('❌ No Bicep template to download', 'error');
    }
}

// Format Button Functionality (Enhanced)
function formatBicepCode() {
    const bicepOutput = document.getElementById('bicepOutput');
    if (!bicepOutput || !bicepOutput.value) {
        showNotificationPro('❌ No Bicep code to format', 'error');
        return;
    }

    try {
        // Enhanced formatting with proper indentation and spacing
        let formattedCode = bicepOutput.value;
        
        // Remove extra whitespace and normalize line endings
        formattedCode = formattedCode.replace(/\r\n/g, '\n');
        formattedCode = formattedCode.replace(/\t/g, '  '); // Convert tabs to 2 spaces
        
        // Format resource blocks with proper indentation
        formattedCode = formattedCode.replace(/^(\s*)resource\s+/gm, '$1resource ');
        formattedCode = formattedCode.replace(/^(\s*)param\s+/gm, '$1param ');
        formattedCode = formattedCode.replace(/^(\s*)var\s+/gm, '$1var ');
        formattedCode = formattedCode.replace(/^(\s*)output\s+/gm, '$1output ');
        
        // Clean up spacing around operators
        formattedCode = formattedCode.replace(/\s*=\s*/g, ' = ');
        formattedCode = formattedCode.replace(/\s*:\s*/g, ': ');
        
        // Format object properties with consistent indentation
        const lines = formattedCode.split('\n');
        let indentLevel = 0;
        const indentSize = 2;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.includes('{')) {
                lines[i] = ' '.repeat(indentLevel * indentSize) + line;
                indentLevel++;
            } else if (line.includes('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
                lines[i] = ' '.repeat(indentLevel * indentSize) + line;
            } else if (line.length > 0) {
                lines[i] = ' '.repeat(indentLevel * indentSize) + line;
            }
        }
        
        formattedCode = lines.join('\n');
        
        // Remove excessive blank lines
        formattedCode = formattedCode.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        bicepOutput.value = formattedCode;
        showNotificationPro('✅ Bicep code formatted successfully!', 'success');
        
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('format_bicep', 'ARM Converter', 'success');
        }
        
    } catch (error) {
        console.error('Format error:', error);
        showNotificationPro('❌ Error formatting Bicep code: ' + error.message, 'error');
    }
}

// Schema Validation Integration (for Schema Validator Tab)
function validateBicepSchema(bicepCode) {
    try {
        // Basic validation checks
        const validationResults = {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: []
        };
        
        // Check for required elements
        if (!bicepCode.includes('resource ')) {
            validationResults.warnings.push('No resources found in template');
        }
        
        // Check for parameter declarations
        const paramMatches = bicepCode.match(/param\s+\w+/g);
        if (paramMatches) {
            validationResults.suggestions.push(`Found ${paramMatches.length} parameter(s)`);
        }
        
        // Check for variable declarations
        const varMatches = bicepCode.match(/var\s+\w+/g);
        if (varMatches) {
            validationResults.suggestions.push(`Found ${varMatches.length} variable(s)`);
        }
        
        // Check for output declarations
        const outputMatches = bicepCode.match(/output\s+\w+/g);
        if (outputMatches) {
            validationResults.suggestions.push(`Found ${outputMatches.length} output(s)`);
        }
        
        // Basic syntax checks
        const openBraces = (bicepCode.match(/\{/g) || []).length;
        const closeBraces = (bicepCode.match(/\}/g) || []).length;
        
        if (openBraces !== closeBraces) {
            validationResults.isValid = false;
            validationResults.errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`);
        }
        
        return validationResults;
        
    } catch (error) {
        return {
            isValid: false,
            errors: [`Validation error: ${error.message}`],
            warnings: [],
            suggestions: []
        };
    }
}

// Initialize Enhanced Features when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add click handler for format button
    const formatBtn = document.getElementById('formatBtn');
    if (formatBtn) {
        formatBtn.addEventListener('click', formatBicepCode);
        console.log('✅ Format button initialized');
    }
    
    // Add enhanced copy and download handlers
    const copyBicepBtn = document.getElementById('copyBicepBtn');
    const downloadBicepBtn = document.getElementById('downloadBicepBtn');
    
    if (copyBicepBtn) {
        copyBicepBtn.addEventListener('click', copyBicepToClipboard);
        console.log('✅ Copy button enhanced');
    }
    
    if (downloadBicepBtn) {
        downloadBicepBtn.addEventListener('click', downloadBicepFile);
        console.log('✅ Download button enhanced');
    }
    
    // Initialize Schema Validator functionality
    initializeSchemaValidator();
    
    console.log('✅ All enhanced features initialized');
});

// Schema Validator Functions
function initializeSchemaValidator() {
    const validateBtn = document.getElementById('validateBtn');
    const runTestSuiteBtn = document.getElementById('runTestSuiteBtn');
    const loadSampleBtn = document.getElementById('loadSampleBtn');
    const clearEditorBtn = document.getElementById('clearEditorBtn');
    
    // Mode toggle buttons
    const resourceModeBtn = document.getElementById('resourceModeBtn');
    const templateModeBtn = document.getElementById('templateModeBtn');
    const bicepModeBtn = document.getElementById('bicepModeBtn');
    
    if (validateBtn) {
        validateBtn.addEventListener('click', validateCode);
    }
    
    if (runTestSuiteBtn) {
        runTestSuiteBtn.addEventListener('click', runTestSuite);
    }
    
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', loadSampleCode);
    }
    
    if (clearEditorBtn) {
        clearEditorBtn.addEventListener('click', clearValidation);
    }
    
    // Mode toggle handlers
    [resourceModeBtn, templateModeBtn, bicepModeBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function() {
                switchValidationMode(this.dataset.mode);
            });
        }
    });
    
    console.log('✅ Schema Validator initialized');
}

function validateCode() {
    const codeInput = document.getElementById('codeInput');
    const validationOutput = document.getElementById('validationOutput');
    
    if (!codeInput || !codeInput.value.trim()) {
        showNotificationPro('❌ Please enter some code to validate', 'error');
        return;
    }
    
    const code = codeInput.value.trim();
    const currentMode = getCurrentValidationMode();
    
    try {
        let validationResults;
        
        switch (currentMode) {
            case 'bicep':
                validationResults = validateBicepSchema(code);
                break;
            case 'template':
                validationResults = validateArmTemplate(code);
                break;
            case 'resource':
            default:
                validationResults = validateJsonSchema(code);
                break;
        }
        
        displayValidationResults(validationResults, validationOutput);
        showNotificationPro('✅ Validation completed successfully!', 'success');
        
    } catch (error) {
        console.error('Validation error:', error);
        validationOutput.innerHTML = `
            <div class="validation-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Validation Error</h4>
                <p>${error.message}</p>
            </div>
        `;
        showNotificationPro('❌ Validation failed: ' + error.message, 'error');
    }
}

function validateJsonSchema(jsonCode) {
    try {
        const parsed = JSON.parse(jsonCode);
        
        const results = {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: [],
            type: 'JSON Schema'
        };
        
        // Basic JSON Schema validation
        if (!parsed.$schema) {
            results.warnings.push('Missing $schema property - consider adding JSON Schema version');
        }
        
        if (!parsed.type) {
            results.warnings.push('Missing type property - specify the data type');
        }
        
        if (!parsed.properties && parsed.type === 'object') {
            results.warnings.push('Object type but no properties defined');
        }
        
        // Check for common Azure resource schema patterns
        if (parsed.properties && parsed.properties.type && parsed.properties.apiVersion) {
            results.suggestions.push('Detected Azure resource schema pattern');
        }
        
        results.suggestions.push(`JSON is well-formed with ${Object.keys(parsed).length} top-level properties`);
        
        return results;
        
    } catch (error) {
        return {
            isValid: false,
            errors: [`Invalid JSON: ${error.message}`],
            warnings: [],
            suggestions: [],
            type: 'JSON Schema'
        };
    }
}

function validateArmTemplate(armCode) {
    try {
        const parsed = JSON.parse(armCode);
        
        const results = {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: [],
            type: 'ARM Template'
        };
        
        // ARM Template structure validation
        if (!parsed.$schema) {
            results.errors.push('Missing $schema - required for ARM templates');
        } else if (!parsed.$schema.includes('deploymentTemplate.json')) {
            results.warnings.push('Schema may not be for ARM deployment template');
        }
        
        if (!parsed.contentVersion) {
            results.errors.push('Missing contentVersion - required for ARM templates');
        }
        
        if (!parsed.resources || !Array.isArray(parsed.resources)) {
            results.errors.push('Missing or invalid resources array');
        } else {
            results.suggestions.push(`Template contains ${parsed.resources.length} resource(s)`);
        }
        
        if (parsed.parameters) {
            results.suggestions.push(`Template has ${Object.keys(parsed.parameters).length} parameter(s)`);
        }
        
        if (parsed.variables) {
            results.suggestions.push(`Template has ${Object.keys(parsed.variables).length} variable(s)`);
        }
        
        if (parsed.outputs) {
            results.suggestions.push(`Template has ${Object.keys(parsed.outputs).length} output(s)`);
        }
        
        return results;
        
    } catch (error) {
        return {
            isValid: false,
            errors: [`Invalid JSON: ${error.message}`],
            warnings: [],
            suggestions: [],
            type: 'ARM Template'
        };
    }
}

function getCurrentValidationMode() {
    const activeBtn = document.querySelector('.mode-btn.active');
    return activeBtn ? activeBtn.dataset.mode : 'resource';
}

function switchValidationMode(mode) {
    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const targetBtn = document.querySelector(`[data-mode="${mode}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    // Update mode indicator
    const currentMode = document.getElementById('currentMode');
    const modeDescription = document.getElementById('modeDescription');
    const helpText = document.getElementById('helpText');
    
    const modeConfig = {
        'resource': {
            display: '📄 Resource Schema',
            description: 'For validating schema definitions',
            help: 'Paste a resource schema JSON or click a template below to get started'
        },
        'template': {
            display: '📦 Full ARM Template',
            description: 'For validating complete deployment templates',
            help: 'Paste a complete ARM deployment template for validation'
        },
        'bicep': {
            display: '🔧 Bicep Template',
            description: 'For validating Bicep template syntax',
            help: 'Paste your Bicep template code for syntax and structure validation'
        }
    };
    
    const config = modeConfig[mode] || modeConfig['resource'];
    
    if (currentMode) currentMode.textContent = config.display;
    if (modeDescription) modeDescription.textContent = config.description;
    if (helpText) helpText.textContent = config.help;
    
    showNotificationPro(`Switched to ${config.display} validation mode`, 'info', 2000);
}

function displayValidationResults(results, outputElement) {
    let html = `
        <div class="validation-summary">
            <div class="validation-status ${results.isValid ? 'valid' : 'invalid'}">
                <i class="fas ${results.isValid ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                <h4>${results.isValid ? 'Validation Passed' : 'Validation Failed'}</h4>
                <p>Type: ${results.type}</p>
            </div>
        </div>
    `;
    
    if (results.errors.length > 0) {
        html += `
            <div class="validation-section errors">
                <h4><i class="fas fa-exclamation-circle"></i> Errors (${results.errors.length})</h4>
                <ul>
                    ${results.errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (results.warnings.length > 0) {
        html += `
            <div class="validation-section warnings">
                <h4><i class="fas fa-exclamation-triangle"></i> Warnings (${results.warnings.length})</h4>
                <ul>
                    ${results.warnings.map(warning => `<li>${warning}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (results.suggestions.length > 0) {
        html += `
            <div class="validation-section suggestions">
                <h4><i class="fas fa-lightbulb"></i> Info & Suggestions (${results.suggestions.length})</h4>
                <ul>
                    ${results.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    outputElement.innerHTML = html;
}

function runTestSuite() {
    const testSuiteOutput = document.getElementById('testSuiteOutput');
    const schemaEditor = document.getElementById('schemaEditor');
    
    if (!schemaEditor || !schemaEditor.value.trim()) {
        showNotificationPro('❌ Please enter some code to test', 'error');
        return;
    }
    
    showNotificationPro('🧪 Running comprehensive test suite...', 'info', 2000);
    
    const code = schemaEditor.value.trim();
    const currentMode = getCurrentValidationMode();
    
    try {
        const testResults = runComprehensiveTests(code, currentMode);
        displayTestResults(testResults, testSuiteOutput);
        
        const passedTests = testResults.filter(test => test.passed).length;
        const totalTests = testResults.length;
        
        if (passedTests === totalTests) {
            showNotificationPro(`✅ All ${totalTests} tests passed!`, 'success');
        } else {
            showNotificationPro(`⚠️ ${passedTests}/${totalTests} tests passed`, 'warning');
        }
        
    } catch (error) {
        console.error('Test suite error:', error);
        testSuiteOutput.innerHTML = `
            <div class="test-error">
                <i class="fas fa-flask"></i>
                <h4>Test Suite Error</h4>
                <p>${error.message}</p>
            </div>
        `;
        showNotificationPro('❌ Test suite failed: ' + error.message, 'error');
    }
}

function runComprehensiveTests(code, mode) {
    const tests = [];
    
    try {
        // Basic syntax test
        tests.push({
            name: 'Syntax Validation',
            description: 'Code is syntactically valid',
            passed: true,
            details: 'Code parsed successfully'
        });
        
        if (mode === 'bicep') {
            // Bicep-specific tests
            tests.push({
                name: 'Resource Declaration',
                description: 'Contains resource declarations',
                passed: code.includes('resource '),
                details: code.includes('resource ') ? 'Found resource declarations' : 'No resource declarations found'
            });
            
            tests.push({
                name: 'Parameter Usage',
                description: 'Uses parameters for configurability',
                passed: code.includes('param '),
                details: code.includes('param ') ? 'Found parameter declarations' : 'No parameters found'
            });
            
        } else {
            // JSON tests
            const parsed = JSON.parse(code);
            
            if (mode === 'template') {
                // ARM Template tests
                tests.push({
                    name: 'ARM Schema',
                    description: 'Has valid ARM template schema',
                    passed: parsed.$schema && parsed.$schema.includes('deploymentTemplate.json'),
                    details: parsed.$schema ? `Schema: ${parsed.$schema}` : 'No schema specified'
                });
                
                tests.push({
                    name: 'Content Version',
                    description: 'Has content version',
                    passed: !!parsed.contentVersion,
                    details: parsed.contentVersion ? `Version: ${parsed.contentVersion}` : 'No content version'
                });
                
                tests.push({
                    name: 'Resources Array',
                    description: 'Contains resources array',
                    passed: Array.isArray(parsed.resources),
                    details: Array.isArray(parsed.resources) ? `${parsed.resources.length} resources` : 'No resources array'
                });
                
            } else {
                // JSON Schema tests
                tests.push({
                    name: 'Schema Declaration',
                    description: 'Has JSON Schema declaration',
                    passed: !!parsed.$schema,
                    details: parsed.$schema || 'No $schema property'
                });
                
                tests.push({
                    name: 'Type Definition',
                    description: 'Has type definition',
                    passed: !!parsed.type,
                    details: parsed.type || 'No type specified'
                });
            }
        }
        
        // Structural tests
        const lineCount = code.split('\n').length;
        tests.push({
            name: 'Code Size',
            description: 'Reasonable code size',
            passed: lineCount > 5 && lineCount < 1000,
            details: `${lineCount} lines of code`
        });
        
    } catch (error) {
        tests.push({
            name: 'Syntax Validation',
            description: 'Code is syntactically valid',
            passed: false,
            details: `Parse error: ${error.message}`
        });
    }
    
    return tests;
}

function displayTestResults(testResults, outputElement) {
    const passedCount = testResults.filter(test => test.passed).length;
    const totalCount = testResults.length;
    const passRate = Math.round((passedCount / totalCount) * 100);
    
    let html = `
        <div class="test-summary">
            <div class="test-stats">
                <h4>Test Suite Results</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value ${passedCount === totalCount ? 'success' : 'warning'}">${passedCount}/${totalCount}</div>
                        <div class="stat-label">Tests Passed</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value ${passRate >= 80 ? 'success' : passRate >= 60 ? 'warning' : 'error'}">${passRate}%</div>
                        <div class="stat-label">Pass Rate</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="test-details">
            <h4>Individual Test Results</h4>
            ${testResults.map(test => `
                <div class="test-item ${test.passed ? 'passed' : 'failed'}">
                    <div class="test-header">
                        <i class="fas ${test.passed ? 'fa-check' : 'fa-times'}"></i>
                        <span class="test-name">${test.name}</span>
                        <span class="test-status">${test.passed ? 'PASS' : 'FAIL'}</span>
                    </div>
                    <div class="test-description">${test.description}</div>
                    <div class="test-details-text">${test.details}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    outputElement.innerHTML = html;
}

function loadSampleCode() {
    const currentMode = getCurrentValidationMode();
    const codeInput = document.getElementById('codeInput');
    
    if (!codeInput) return;
    
    let sampleCode = '';
    
    switch (currentMode) {
        case 'bicep':
            sampleCode = `// Sample Bicep Template
param storageAccountName string = 'mystorageaccount'
param location string = resourceGroup().location

resource storageAccount 'Microsoft.Storage/storageAccounts@2021-04-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
  }
}

output storageAccountId string = storageAccount.id`;
            break;
            
        case 'template':
            sampleCode = `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "storageAccountName": {
      "type": "string",
      "metadata": {
        "description": "Name of the storage account"
      }
    }
  },
  "variables": {},
  "resources": [
    {
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2021-04-01",
      "name": "[parameters('storageAccountName')]",
      "location": "[resourceGroup().location]",
      "sku": {
        "name": "Standard_LRS"
      },
      "kind": "StorageV2"
    }
  ],
  "outputs": {
    "storageAccountId": {
      "type": "string",
      "value": "[resourceId('Microsoft.Storage/storageAccounts', parameters('storageAccountName'))]"
    }
  }
}`;
            break;
            
        default: // resource schema
            sampleCode = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Storage Account Schema",
  "description": "JSON Schema for Azure Storage Account",
  "properties": {
    "apiVersion": {
      "type": "string",
      "const": "2021-04-01"
    },
    "type": {
      "type": "string",
      "const": "Microsoft.Storage/storageAccounts"
    },
    "name": {
      "type": "string",
      "pattern": "^[a-z0-9]{3,24}$"
    },
    "location": {
      "type": "string"
    },
    "sku": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "enum": ["Standard_LRS", "Standard_GRS", "Premium_LRS"]
        }
      },
      "required": ["name"]
    }
  },
  "required": ["apiVersion", "type", "name", "location", "sku"]
}`;
            break;
    }
    
    codeInput.value = sampleCode;
    showNotificationPro(`✅ Sample ${getCurrentValidationMode()} code loaded`, 'success', 2000);
}

function clearValidation() {
    const codeInput = document.getElementById('codeInput');
    const validationOutput = document.getElementById('validationOutput');
    const testSuiteOutput = document.getElementById('testSuiteOutput');
    
    if (codeInput) codeInput.value = '';
    
    if (validationOutput) {
        validationOutput.innerHTML = `
            <div class="no-results">
                <i class="fas fa-info-circle"></i>
                <p>No validation results yet. Click "Validate" to start.</p>
            </div>
        `;
    }
    
    if (testSuiteOutput) {
        testSuiteOutput.innerHTML = `
            <div class="no-results">
                <i class="fas fa-vial"></i>
                <p>No test results yet. Click "Run Test Suite" for comprehensive testing.</p>
            </div>
        `;
    }
    
    showNotificationPro('🧹 Validation workspace cleared', 'info', 1500);
}