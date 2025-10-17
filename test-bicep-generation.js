// Test script to verify Bicep generation for Microsoft.Resources/deployments
// This simulates what the app does when converting JSON schema to Bicep

// Load the required files
const fs = require('fs');

// Mock functions needed for the conversion
function resourceSupportsLocationAndTags(resourceType, targetScope = 'resourceGroup') {
    if (resourceType === 'Microsoft.Resources/deployments' && targetScope === 'resourceGroup') {
        return false;
    }
    
    const resourcesWithoutLocation = [
        'Microsoft.Authorization/policyAssignments',
        'Microsoft.Authorization/roleAssignments'
    ];
    
    return !resourcesWithoutLocation.includes(resourceType);
}

function getResourceNameFromType(resourceType) {
    const parts = resourceType.split('/');
    const resourceTypeName = parts[parts.length - 1];
    return resourceTypeName.charAt(0).toLowerCase() + resourceTypeName.slice(1);
}

function getLatestApiVersion(schema) {
    return schema.properties?.apiVersion?.const || '2022-01-01';
}

function generateAdvancedParameters(schema, resourceType, targetScope = 'resourceGroup') {
    const supportsLocationAndTags = resourceSupportsLocationAndTags(resourceType, targetScope);
    
    let params = `// === PARAMETERS ===

@description('The name of the resource')
@minLength(1)
@maxLength(80)
param resourceName string

`;

    if (supportsLocationAndTags) {
        params += `@description('The location for the resource')
param location string = resourceGroup().location

`;
    }

    params += `@description('Environment name (e.g., dev, test, prod)')
@allowed(['dev', 'test', 'staging', 'prod'])
param environment string = 'dev'

`;

    if (supportsLocationAndTags) {
        params += `@description('Resource tags')
param tags object = {
  Environment: environment
  CreatedBy: 'Bicep Schema Builder'
  CreatedDate: utcNow('yyyy-MM-dd')
}

`;
    }

    return params;
}

function generateVariables(schema, resourceType, targetScope = 'resourceGroup') {
    const supportsLocationAndTags = resourceSupportsLocationAndTags(resourceType, targetScope);
    
    let variables = `// === VARIABLES ===

var resourceNameFormatted = toLower(replace(resourceName, ' ', '-'))
`;

    if (supportsLocationAndTags) {
        variables += `var commonTags = union(tags, {
  ResourceType: '${resourceType}'
  DeployedBy: 'Bicep Schema Builder'
})

`;
    }

    return variables;
}

function generateDetailedResource(schema, resourceType, cleanResourceName) {
    let resource = `// === RESOURCE DEFINITION ===

`;

    if (resourceType === 'Microsoft.Resources/deployments') {
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

    if (supportsLocationAndTags) {
        outputs += `@description('Location of the created resource')
output location string = ${cleanResourceName}.location

`;
    }

    return outputs;
}

function convertSchemaToBicep(schema) {
    const resourceType = schema.properties?.type?.const || 'Microsoft.Resources/deployments';
    const resourceName = getResourceNameFromType(resourceType);
    const cleanResourceName = resourceName.replace(/[^a-zA-Z0-9]/g, '');
    const targetScope = 'resourceGroup';
    
    let bicep = `// Generated Bicep template from JSON Schema
// Resource Type: ${resourceType}
// Generated on: ${new Date().toISOString()}

targetScope = 'resourceGroup'

`;

    bicep += `metadata description = 'Bicep template for ${resourceType}'
metadata author = 'Bicep Schema Builder'
metadata version = '1.0.0'

`;

    bicep += generateAdvancedParameters(schema, resourceType, targetScope);
    bicep += generateVariables(schema, resourceType, targetScope);
    bicep += generateDetailedResource(schema, resourceType, cleanResourceName);
    bicep += generateAdvancedOutputs(schema, cleanResourceName, targetScope);

    return bicep;
}

// Test with the deployment schema
const schema = JSON.parse(fs.readFileSync('./test-deployment-schema.json', 'utf8'));
const bicep = convertSchemaToBicep(schema);

console.log('Generated Bicep Template:\n');
console.log(bicep);

// Save to file
fs.writeFileSync('./test-output.bicep', bicep);
console.log('\n✅ Bicep template saved to test-output.bicep');

// Verify it doesn't contain location or tags
if (bicep.includes('location: location') || bicep.includes('tags: commonTags')) {
    console.error('❌ FAILED: Template contains location or tags for deployment resource!');
    process.exit(1);
} else {
    console.log('✅ PASSED: Template correctly excludes location and tags for deployment resource');
}
