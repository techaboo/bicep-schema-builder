// Enhanced Bicep Deployment Template
// Resource Type: Microsoft.Resources/deployments
// Generated on: 2025-10-17T04:40:27.912Z
// Enhanced with multiple deployment options and scenarios

targetScope = 'resourceGroup'

metadata description = 'Enhanced Bicep template for Microsoft.Resources/deployments with multiple configuration options'
metadata author = 'Bicep Schema Builder'
metadata version = '2.0.0'

// === PARAMETERS ===

@description('The name of the deployment')
@minLength(1)
@maxLength(80)
param deploymentName string

@description('The location for the deployment')
param location string = resourceGroup().location

@description('Environment name (e.g., dev, test, prod)')
@allowed(['dev', 'test', 'staging', 'prod'])
param environment string = 'dev'

@description('Deployment mode')
@allowed(['Incremental', 'Complete'])
param deploymentMode string = 'Incremental'

@description('Template deployment type')
@allowed(['basic', 'storageAccount', 'webApp', 'virtualMachine'])
param deploymentTemplate string = 'basic'

@description('Enable debug logging')
param debugMode bool = false

@description('Resource tags')
param tags object = {
  Environment: environment
  CreatedBy: 'Bicep Schema Builder'
  CreatedDate: utcNow('yyyy-MM-dd')
}

// === VARIABLES ===

var deploymentNameFormatted = toLower(replace(deploymentName, ' ', '-'))
var commonTags = union(tags, {
  ResourceType: 'Microsoft.Resources/deployments'
  DeployedBy: 'Bicep Schema Builder'
  DeploymentMode: deploymentMode
})

// Pre-defined templates for common scenarios
var templates = {
  basic: {
    '$schema': 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#'
    contentVersion: '1.0.0.0'
    resources: []
  }
  storageAccount: {
    '$schema': 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#'
    contentVersion: '1.0.0.0'
    parameters: {
      storageAccountName: {
        type: 'string'
        defaultValue: 'storage${uniqueString(resourceGroup().id)}'
      }
      location: {
        type: 'string'
        defaultValue: '[resourceGroup().location]'
      }
    }
    resources: [
      {
        type: 'Microsoft.Storage/storageAccounts'
        apiVersion: '2022-05-01'
        name: '[parameters(\'storageAccountName\')]'
        location: '[parameters(\'location\')]'
        sku: {
          name: 'Standard_LRS'
        }
        kind: 'StorageV2'
      }
    ]
    outputs: {
      storageAccountId: {
        type: 'string'
        value: '[resourceId(\'Microsoft.Storage/storageAccounts\', parameters(\'storageAccountName\'))]'
      }
    }
  }
  webApp: {
    '$schema': 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#'
    contentVersion: '1.0.0.0'
    parameters: {
      appName: {
        type: 'string'
        defaultValue: 'webapp-${uniqueString(resourceGroup().id)}'
      }
      location: {
        type: 'string'
        defaultValue: '[resourceGroup().location]'
      }
    }
    resources: [
      {
        type: 'Microsoft.Web/serverfarms'
        apiVersion: '2022-03-01'
        name: '[concat(parameters(\'appName\'), \'-plan\')]'
        location: '[parameters(\'location\')]'
        sku: {
          name: 'F1'
          capacity: 1
        }
      }
      {
        type: 'Microsoft.Web/sites'
        apiVersion: '2022-03-01'
        name: '[parameters(\'appName\')]'
        location: '[parameters(\'location\')]'
        dependsOn: [
          '[resourceId(\'Microsoft.Web/serverfarms\', concat(parameters(\'appName\'), \'-plan\'))]'
        ]
        properties: {
          serverFarmId: '[resourceId(\'Microsoft.Web/serverfarms\', concat(parameters(\'appName\'), \'-plan\'))]'
        }
      }
    ]
    outputs: {
      webAppId: {
        type: 'string'
        value: '[resourceId(\'Microsoft.Web/sites\', parameters(\'appName\'))]'
      }
      webAppUrl: {
        type: 'string'
        value: '[concat(\'https://\', parameters(\'appName\'), \'.azurewebsites.net\')]'
      }
    }
  }
}

// === MAIN DEPLOYMENT ===

resource mainDeployment 'Microsoft.Resources/deployments@2022-09-01' = {
  name: deploymentNameFormatted
  location: location
  tags: commonTags
  properties: {
    mode: deploymentMode
    template: templates[deploymentTemplate]
    debugSetting: debugMode ? {
      detailLevel: 'requestContent,responseContent'
    } : null
  }
}

// === OUTPUTS ===

@description('Resource ID of the created deployment')
output resourceId string = mainDeployment.id

@description('Name of the created deployment')
output deploymentName string = mainDeployment.name

@description('Location of the deployment')
output location string = mainDeployment.location

@description('Deployment mode used')
output mode string = deploymentMode

@description('Template type used')
output templateType string = deploymentTemplate

@description('Deployment provisioning state')
output provisioningState string = mainDeployment.properties.provisioningState

@description('Deployment outputs (if any)')
output deploymentOutputs object = mainDeployment.properties.outputs

@description('Deployment correlation ID')
output correlationId string = mainDeployment.properties.correlationId
