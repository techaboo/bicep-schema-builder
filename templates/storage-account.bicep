@description('Location for the storage account. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Globally unique storage account name (3-24 lowercase letters and digits).')
@minLength(3)
@maxLength(24)
param storageAccountName string

@description('SKU for the storage account.')
@allowed([
  'Premium_LRS'
  'Premium_ZRS'
  'Standard_GRS'
  'Standard_GZRS'
  'Standard_LRS'
  'Standard_RAGRS'
  'Standard_RAGZRS'
  'Standard_ZRS'
])
param skuName string = 'Standard_LRS'

@description('Access tier for Blob storage.')
@allowed([
  'Hot'
  'Cool'
])
param accessTier string = 'Hot'

@description('Enable managed identity for the storage account.')
param enableManagedIdentity bool = false

@description('Optional tags to apply to the storage account.')
param tags object = {}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: skuName
  }
  kind: 'StorageV2'
  properties: {
    accessTier: accessTier
    allowBlobPublicAccess: false
    allowCrossTenantReplication: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
  identity: enableManagedIdentity ? {
    type: 'SystemAssigned'
  } : null
  tags: tags
}

output storageAccountId string = storageAccount.id
output storageAccountName string = storageAccount.name
output storageAccountPrincipalId string = enableManagedIdentity ? storageAccount.identity.principalId : ''
