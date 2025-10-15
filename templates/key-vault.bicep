@description('Location for the Key Vault. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Name of the Key Vault.')
@minLength(3)
@maxLength(24)
param keyVaultName string

@description('SKU for the Key Vault.')
@allowed([
  'standard'
  'premium'
])
param skuName string = 'standard'

@description('Enable soft delete for the Key Vault.')
param enableSoftDelete bool = true

@description('Soft delete retention period in days (7-90).')
@minValue(7)
@maxValue(90)
param softDeleteRetentionInDays int = 90

@description('Enable purge protection.')
param enablePurgeProtection bool = true

@description('Enable RBAC authorization instead of access policies.')
param enableRbacAuthorization bool = true

@description('Allow access from Azure services.')
@allowed([
  'AzureServices'
  'None'
])
param networkAclsBypass string = 'AzureServices'

@description('Default network action.')
@allowed([
  'Allow'
  'Deny'
])
param networkAclsDefaultAction string = 'Deny'

@description('Allowed IP addresses or CIDR ranges.')
param allowedIpRules array = []

@description('Enabled for deployment (VM retrieval).')
param enabledForDeployment bool = false

@description('Enabled for disk encryption.')
param enabledForDiskEncryption bool = false

@description('Enabled for template deployment.')
param enabledForTemplateDeployment bool = true

@description('Optional tags to apply to the Key Vault.')
param tags object = {}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: skuName
    }
    tenantId: subscription().tenantId
    enableSoftDelete: enableSoftDelete
    softDeleteRetentionInDays: softDeleteRetentionInDays
    enablePurgeProtection: enablePurgeProtection ? true : null
    enableRbacAuthorization: enableRbacAuthorization
    enabledForDeployment: enabledForDeployment
    enabledForDiskEncryption: enabledForDiskEncryption
    enabledForTemplateDeployment: enabledForTemplateDeployment
    networkAcls: {
      bypass: networkAclsBypass
      defaultAction: networkAclsDefaultAction
      ipRules: [for ip in allowedIpRules: {
        value: ip
      }]
    }
    publicNetworkAccess: networkAclsDefaultAction == 'Deny' ? 'Disabled' : 'Enabled'
  }
  tags: tags
}

output keyVaultId string = keyVault.id
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
output tenantId string = keyVault.properties.tenantId
