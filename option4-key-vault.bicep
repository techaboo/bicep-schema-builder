// Option 4: Key Vault
// Secure secrets management

targetScope = 'resourceGroup'

metadata description = 'Deploy Azure Key Vault with basic configuration'
metadata author = 'Bicep Schema Builder'
metadata version = '1.0.0'

// === PARAMETERS ===

@description('Key Vault name (must be globally unique)')
@minLength(3)
@maxLength(24)
param keyVaultName string = 'kv-${uniqueString(resourceGroup().id)}'

@description('The location for the Key Vault')
param location string = resourceGroup().location

@description('Environment name')
@allowed(['dev', 'test', 'staging', 'prod'])
param environment string = 'dev'

@description('Object ID of the user/service principal to grant access')
param principalId string = ''

@description('Enable Key Vault for deployment')
param enabledForDeployment bool = true

@description('Enable Key Vault for template deployment')
param enabledForTemplateDeployment bool = true

@description('Enable Key Vault for disk encryption')
param enabledForDiskEncryption bool = true

@description('Key Vault SKU')
@allowed(['standard', 'premium'])
param skuName string = 'standard'

@description('Resource tags')
param tags object = {
  Environment: environment
  CreatedBy: 'Bicep Schema Builder'
  CreatedDate: utcNow('yyyy-MM-dd')
}

// === VARIABLES ===

var keyVaultNameClean = toLower(replace(keyVaultName, ' ', '-'))

// === RESOURCES ===

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultNameClean
  location: location
  tags: tags
  properties: {
    enabledForDeployment: enabledForDeployment
    enabledForTemplateDeployment: enabledForTemplateDeployment
    enabledForDiskEncryption: enabledForDiskEncryption
    tenantId: tenant().tenantId
    sku: {
      name: skuName
      family: 'A'
    }
    accessPolicies: !empty(principalId) ? [
      {
        tenantId: tenant().tenantId
        objectId: principalId
        permissions: {
          keys: [
            'get'
            'list'
            'create'
            'update'
            'delete'
          ]
          secrets: [
            'get'
            'list'
            'set'
            'delete'
          ]
          certificates: [
            'get'
            'list'
            'create'
            'update'
            'delete'
          ]
        }
      }
    ] : []
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// === OUTPUTS ===

@description('Key Vault resource ID')
output keyVaultId string = keyVault.id

@description('Key Vault name')
output keyVaultName string = keyVault.name

@description('Key Vault URI')
output keyVaultUri string = keyVault.properties.vaultUri

@description('Key Vault resource location')
output location string = keyVault.location
