// Option 1: Storage Account Deployment
// Simple and commonly used Azure resource

targetScope = 'resourceGroup'

metadata description = 'Deploy an Azure Storage Account with configurable options'
metadata author = 'Bicep Schema Builder'
metadata version = '1.0.0'

// === PARAMETERS ===

@description('Storage account name (must be globally unique)')
@minLength(3)
@maxLength(24)
param storageAccountName string = 'stor${uniqueString(resourceGroup().id)}'

@description('The location for the storage account')
param location string = resourceGroup().location

@description('Environment name')
@allowed(['dev', 'test', 'staging', 'prod'])
param environment string = 'dev'

@description('Storage account SKU')
@allowed(['Standard_LRS', 'Standard_GRS', 'Standard_RAGRS', 'Standard_ZRS', 'Premium_LRS'])
param storageAccountSku string = 'Standard_LRS'

@description('Storage account kind')
@allowed(['Storage', 'StorageV2', 'BlobStorage', 'FileStorage', 'BlockBlobStorage'])
param storageKind string = 'StorageV2'

@description('Enable blob public access')
param allowBlobPublicAccess bool = false

@description('Enable HTTPS traffic only')
param supportsHttpsTrafficOnly bool = true

@description('Resource tags')
param tags object = {
  Environment: environment
  CreatedBy: 'Bicep Schema Builder'
  CreatedDate: utcNow('yyyy-MM-dd')
}

// === VARIABLES ===

var storageAccountNameClean = toLower(replace(storageAccountName, ' ', ''))

// === RESOURCES ===

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountNameClean
  location: location
  tags: tags
  sku: {
    name: storageAccountSku
  }
  kind: storageKind
  properties: {
    allowBlobPublicAccess: allowBlobPublicAccess
    supportsHttpsTrafficOnly: supportsHttpsTrafficOnly
    encryption: {
      services: {
        blob: {
          enabled: true
        }
        file: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

// === OUTPUTS ===

@description('Storage account resource ID')
output storageAccountId string = storageAccount.id

@description('Storage account name')
output storageAccountName string = storageAccount.name

@description('Storage account primary endpoints')
output primaryEndpoints object = storageAccount.properties.primaryEndpoints

@description('Storage account primary access key')
@secure()
output storageAccountKey string = storageAccount.listKeys().keys[0].value

@description('Connection string')
@secure()
output connectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
