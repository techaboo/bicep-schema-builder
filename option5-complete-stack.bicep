// Option 5: Complete Web Application Stack
// Multi-resource deployment with Storage, Web App, and Key Vault

targetScope = 'resourceGroup'

metadata description = 'Deploy complete web application stack'
metadata author = 'Bicep Schema Builder'
metadata version = '1.0.0'

// === PARAMETERS ===

@description('Application name prefix')
@minLength(2)
@maxLength(20)
param appNamePrefix string = 'myapp'

@description('The location for all resources')
param location string = resourceGroup().location

@description('Environment name')
@allowed(['dev', 'test', 'staging', 'prod'])
param environment string = 'dev'

@description('App Service Plan SKU')
@allowed(['F1', 'D1', 'B1', 'B2', 'S1', 'S2', 'P1v2'])
param appServicePlanSku string = 'F1'

@description('Storage account SKU')
@allowed(['Standard_LRS', 'Standard_GRS', 'Premium_LRS'])
param storageAccountSku string = 'Standard_LRS'

@description('Resource tags')
param tags object = {
  Environment: environment
  CreatedBy: 'Bicep Schema Builder'
  CreatedDate: utcNow('yyyy-MM-dd')
}

// === VARIABLES ===

var uniqueSuffix = uniqueString(resourceGroup().id)
var appNameClean = toLower(replace(appNamePrefix, ' ', ''))

var storageAccountName = '${appNameClean}stor${uniqueSuffix}'
var webAppName = '${appNameClean}-webapp-${uniqueSuffix}'
var appServicePlanName = '${appNameClean}-plan-${uniqueSuffix}'
var keyVaultName = '${appNameClean}-kv-${uniqueSuffix}'

// === RESOURCES ===

// Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: take(storageAccountName, 24)
  location: location
  tags: tags
  sku: {
    name: storageAccountSku
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: appServicePlanSku
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: webAppName
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      netFrameworkVersion: 'v8.0'
      appSettings: [
        {
          name: 'STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'ENVIRONMENT'
          value: environment
        }
      ]
    }
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: take(keyVaultName, 24)
  location: location
  tags: tags
  properties: {
    enabledForTemplateDeployment: true
    tenantId: tenant().tenantId
    sku: {
      name: 'standard'
      family: 'A'
    }
    accessPolicies: []
  }
}

// Store connection string in Key Vault
resource connectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'StorageConnectionString'
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
  }
}

// === OUTPUTS ===

@description('Web App URL')
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'

@description('Web App name')
output webAppName string = webApp.name

@description('Storage Account name')
output storageAccountName string = storageAccount.name

@description('Key Vault name')
output keyVaultName string = keyVault.name

@description('Key Vault URI')
output keyVaultUri string = keyVault.properties.vaultUri

@description('Resource Group location')
output deploymentLocation string = location

@description('Environment deployed')
output environment string = environment
