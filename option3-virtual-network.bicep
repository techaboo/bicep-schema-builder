// Option 3: Simple Virtual Network
// Network infrastructure deployment

targetScope = 'resourceGroup'

metadata description = 'Deploy Azure Virtual Network with subnets'
metadata author = 'Bicep Schema Builder'
metadata version = '1.0.0'

// === PARAMETERS ===

@description('Virtual Network name')
param vnetName string = 'vnet-${uniqueString(resourceGroup().id)}'

@description('The location for the virtual network')
param location string = resourceGroup().location

@description('Environment name')
@allowed(['dev', 'test', 'staging', 'prod'])
param environment string = 'dev'

@description('Virtual Network address prefix')
param vnetAddressPrefix string = '10.0.0.0/16'

@description('Default subnet address prefix')
param defaultSubnetPrefix string = '10.0.1.0/24'

@description('Web subnet address prefix')
param webSubnetPrefix string = '10.0.2.0/24'

@description('Database subnet address prefix')
param dbSubnetPrefix string = '10.0.3.0/24'

@description('Resource tags')
param tags object = {
  Environment: environment
  CreatedBy: 'Bicep Schema Builder'
  CreatedDate: utcNow('yyyy-MM-dd')
}

// === RESOURCES ===

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressPrefix
      ]
    }
    subnets: [
      {
        name: 'default'
        properties: {
          addressPrefix: defaultSubnetPrefix
        }
      }
      {
        name: 'web-subnet'
        properties: {
          addressPrefix: webSubnetPrefix
        }
      }
      {
        name: 'db-subnet'
        properties: {
          addressPrefix: dbSubnetPrefix
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
}

// === OUTPUTS ===

@description('Virtual Network resource ID')
output vnetId string = virtualNetwork.id

@description('Virtual Network name')
output vnetName string = virtualNetwork.name

@description('Default subnet resource ID')
output defaultSubnetId string = virtualNetwork.properties.subnets[0].id

@description('Web subnet resource ID')
output webSubnetId string = virtualNetwork.properties.subnets[1].id

@description('Database subnet resource ID')
output dbSubnetId string = virtualNetwork.properties.subnets[2].id

@description('Virtual Network address space')
output addressSpace array = virtualNetwork.properties.addressSpace.addressPrefixes
