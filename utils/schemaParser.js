// Schema Parser Utility Functions for Bicep Schema Builder
class SchemaParser {
    constructor() {
        this.schemas = new Map();
        this.validationRules = new Map();
        this.bicepPatterns = this.initializeBicepPatterns();
    }

    /**
     * Initialize common Bicep resource patterns
     */
    initializeBicepPatterns() {
        return {
            apiVersion: {
                storage: ['2021-04-01', '2021-06-01', '2021-08-01', '2022-05-01'],
                compute: ['2021-03-01', '2021-07-01', '2022-03-01'],
                network: ['2021-02-01', '2021-05-01', '2021-08-01'],
                keyvault: ['2019-09-01', '2021-04-01-preview', '2021-10-01']
            },
            resourceTypes: {
                'Microsoft.Storage/storageAccounts': 'Storage Account',
                'Microsoft.Compute/virtualMachines': 'Virtual Machine',
                'Microsoft.Web/sites': 'Web App',
                'Microsoft.KeyVault/vaults': 'Key Vault',
                'Microsoft.Network/virtualNetworks': 'Virtual Network'
            },
            namePatterns: {
                storageAccount: '^[a-z0-9]{3,24}$',
                keyVault: '^[a-zA-Z0-9-]{3,24}$',
                virtualMachine: '^[a-zA-Z0-9-_.]{1,64}$'
            }
        };
    }

    /**
     * Parse a JSON schema with enhanced validation
     * @param {string} schemaJson - The JSON schema string
     * @returns {Object} Parsed schema object
     */
    parseSchema(schemaJson) {
        try {
            const schema = JSON.parse(schemaJson);
            return this.validateAndEnhanceSchema(schema);
        } catch (error) {
            console.error('Error parsing schema:', error);
            throw new Error(`Invalid JSON format: ${error.message}`);
        }
    }

    /**
     * Validate and enhance schema with Bicep-specific checks
     * @param {Object} schema - The schema object to validate
     * @returns {Object} Enhanced schema
     */
    validateAndEnhanceSchema(schema) {
        if (!schema || typeof schema !== 'object') {
            throw new Error('Schema must be an object');
        }

        // Basic JSON Schema validation
        this.validateJsonSchema(schema);
        
        // Bicep-specific validation
        this.validateBicepSchema(schema);
        
        // Enhance with suggestions
        return this.enhanceSchema(schema);
    }

    /**
     * Validate basic JSON Schema structure
     * @param {Object} schema - Schema to validate
     */
    validateJsonSchema(schema) {
        const errors = [];
        
        // Check for valid type
        if (schema.type && !['object', 'array', 'string', 'number', 'boolean', 'null'].includes(schema.type)) {
            errors.push(`Invalid type: ${schema.type}`);
        }
        
        // Validate $schema if present
        if (schema.$schema && !schema.$schema.startsWith('http')) {
            errors.push('$schema must be a valid URI');
        }
        
        // Check properties structure
        if (schema.properties && typeof schema.properties !== 'object') {
            errors.push('Properties must be an object');
        }
        
        if (errors.length > 0) {
            throw new Error(`Schema validation errors: ${errors.join(', ')}`);
        }
    }

    /**
     * Validate Bicep-specific schema requirements
     * @param {Object} schema - Schema to validate
     */
    validateBicepSchema(schema) {
        if (!schema.properties) return;
        
        const props = schema.properties;
        const warnings = [];
        
        // Check for common Bicep properties
        if (props.apiVersion) {
            this.validateApiVersion(props.apiVersion, warnings);
        }
        
        if (props.type) {
            this.validateResourceType(props.type, warnings);
        }
        
        if (props.name) {
            this.validateResourceName(props.name, warnings);
        }
        
        // Store warnings for later use
        schema._bicepWarnings = warnings;
    }

    /**
     * Validate API version format
     */
    validateApiVersion(apiVersionSchema, warnings) {
        if (apiVersionSchema.enum) {
            const invalidVersions = apiVersionSchema.enum.filter(v => 
                !/^\d{4}-\d{2}-\d{2}(-preview)?$/.test(v)
            );
            if (invalidVersions.length > 0) {
                warnings.push(`Invalid API version format: ${invalidVersions.join(', ')}`);
            }
        } else if (!apiVersionSchema.pattern) {
            warnings.push('API version should have enum values or pattern validation');
        }
    }

    /**
     * Validate resource type
     */
    validateResourceType(typeSchema, warnings) {
        if (typeSchema.const) {
            if (!this.bicepPatterns.resourceTypes[typeSchema.const]) {
                warnings.push(`Unknown resource type: ${typeSchema.const}`);
            }
        } else if (typeSchema.enum) {
            const unknownTypes = typeSchema.enum.filter(t => 
                !this.bicepPatterns.resourceTypes[t]
            );
            if (unknownTypes.length > 0) {
                warnings.push(`Unknown resource types: ${unknownTypes.join(', ')}`);
            }
        }
    }

    /**
     * Validate resource name constraints
     */
    validateResourceName(nameSchema, warnings) {
        if (!nameSchema.pattern && !nameSchema.minLength && !nameSchema.maxLength) {
            warnings.push('Resource name should have validation constraints (pattern, length)');
        }
        
        if (nameSchema.pattern) {
            try {
                new RegExp(nameSchema.pattern);
            } catch (error) {
                warnings.push(`Invalid name pattern: ${error.message}`);
            }
        }
    }

    /**
     * Enhance schema with suggestions and optimizations
     * @param {Object} schema - Schema to enhance
     * @returns {Object} Enhanced schema
     */
    enhanceSchema(schema) {
        // Add metadata if missing
        if (!schema.$schema) {
            schema.$schema = 'http://json-schema.org/draft-07/schema#';
        }
        
        if (!schema.title && schema.properties?.type?.const) {
            const resourceType = this.bicepPatterns.resourceTypes[schema.properties.type.const];
            if (resourceType) {
                schema.title = `${resourceType} Schema`;
            }
        }
        
        // Add common Bicep properties if this looks like a resource schema
        if (this.looksLikeBicepResource(schema)) {
            schema = this.addBicepDefaults(schema);
        }
        
        return schema;
    }

    /**
     * Check if schema looks like a Bicep resource
     */
    looksLikeBicepResource(schema) {
        if (!schema.properties) return false;
        
        const bicepProps = ['apiVersion', 'type', 'name', 'location'];
        const hasBicepProps = bicepProps.some(prop => schema.properties[prop]);
        
        return hasBicepProps || (schema.title && schema.title.toLowerCase().includes('bicep'));
    }

    /**
     * Add default Bicep properties to schema
     */
    addBicepDefaults(schema) {
        if (!schema.properties.apiVersion) {
            schema.properties.apiVersion = {
                type: 'string',
                description: 'The API version for the resource'
            };
        }
        
        if (!schema.properties.type) {
            schema.properties.type = {
                type: 'string',
                description: 'The resource type'
            };
        }
        
        if (!schema.properties.name) {
            schema.properties.name = {
                type: 'string',
                description: 'The name of the resource'
            };
        }
        
        // Ensure required array includes basic properties
        if (!schema.required) {
            schema.required = [];
        }
        
        ['apiVersion', 'type', 'name'].forEach(prop => {
            if (!schema.required.includes(prop)) {
                schema.required.push(prop);
            }
        });
        
        return schema;
    }

    /**
     * Load schema from file with progress tracking
     * @param {File} file - The schema file to load
     * @returns {Promise<Object>} Promise resolving to parsed schema
     */
    async loadSchemaFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.includes('json') && !file.name.endsWith('.json')) {
                reject(new Error('File must be a JSON file'));
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                reject(new Error('File too large (max 10MB)'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const schema = this.parseSchema(e.target.result);
                    this.addSchema(file.name, schema);
                    resolve(schema);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    }

    /**
     * Generate schema template for specific Bicep resource type
     * @param {string} resourceType - The Azure resource type
     * @returns {Object} Schema template
     */
    generateTemplate(resourceType) {
        const templates = {
            'Microsoft.Storage/storageAccounts': this.generateStorageAccountTemplate(),
            'Microsoft.Compute/virtualMachines': this.generateVirtualMachineTemplate(),
            'Microsoft.Web/sites': this.generateWebAppTemplate(),
            'Microsoft.KeyVault/vaults': this.generateKeyVaultTemplate()
        };
        
        return templates[resourceType] || this.generateGenericTemplate(resourceType);
    }

    generateStorageAccountTemplate() {
        return {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "title": "Storage Account Schema",
            "description": "Schema for Azure Storage Account resource",
            "properties": {
                "apiVersion": {
                    "type": "string",
                    "enum": this.bicepPatterns.apiVersion.storage
                },
                "type": {
                    "type": "string",
                    "const": "Microsoft.Storage/storageAccounts"
                },
                "name": {
                    "type": "string",
                    "pattern": this.bicepPatterns.namePatterns.storageAccount,
                    "description": "Storage account name (3-24 lowercase alphanumeric characters)"
                },
                "location": {
                    "type": "string",
                    "description": "Azure region"
                },
                "sku": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "enum": ["Standard_LRS", "Standard_GRS", "Standard_RAGRS", "Premium_LRS"]
                        }
                    },
                    "required": ["name"]
                },
                "kind": {
                    "type": "string",
                    "enum": ["Storage", "StorageV2", "BlobStorage", "FileStorage", "BlockBlobStorage"]
                }
            },
            "required": ["apiVersion", "type", "name", "location", "sku", "kind"]
        };
    }

    generateGenericTemplate(resourceType) {
        return {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "title": `${resourceType} Schema`,
            "properties": {
                "apiVersion": { "type": "string" },
                "type": { "type": "string", "const": resourceType },
                "name": { "type": "string" },
                "location": { "type": "string" },
                "properties": { "type": "object" }
            },
            "required": ["apiVersion", "type", "name"]
        };
    }

    /**
     * Get validation summary for a schema
     * @param {Object} schema - Schema to analyze
     * @returns {Object} Validation summary
     */
    getValidationSummary(schema) {
        return {
            isBicepResource: this.looksLikeBicepResource(schema),
            warnings: schema._bicepWarnings || [],
            propertyCount: schema.properties ? Object.keys(schema.properties).length : 0,
            requiredCount: schema.required ? schema.required.length : 0,
            hasValidation: this.hasValidationRules(schema),
            resourceType: schema.properties?.type?.const || 'unknown'
        };
    }

    hasValidationRules(schema) {
        if (!schema.properties) return false;
        
        return Object.values(schema.properties).some(prop => 
            prop.pattern || prop.enum || prop.minimum || prop.maximum || 
            prop.minLength || prop.maxLength
        );
    }

    // Schema management methods
    addSchema(name, schema) {
        this.schemas.set(name, {
            schema,
            timestamp: new Date(),
            summary: this.getValidationSummary(schema)
        });
    }

    getSchemas() {
        return this.schemas;
    }

    removeSchema(name) {
        return this.schemas.delete(name);
    }

    clearSchemas() {
        this.schemas.clear();
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SchemaParser;
} else {
    window.SchemaParser = SchemaParser;
}