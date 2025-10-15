@description('Location for the virtual network. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Name of the virtual network.')
param virtualNetworkName string

@description('Address space for the virtual network.')
param addressPrefixes array = [
  '10.10.0.0/16'
]

@description('Subnet definitions. Provide name, prefix, and optional NSG, delegations, or policy overrides.')
param subnets array = [
  {
    name: 'app'
    addressPrefix: '10.10.1.0/24'
  }
  {
    name: 'data'
    addressPrefix: '10.10.2.0/24'
  }
]

@description('Optional tags to apply to the virtual network.')
param tags object = {}

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: virtualNetworkName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: addressPrefixes
    }
    subnets: [for subnet in subnets: {
      name: subnet.name
      properties: {
        addressPrefix: subnet.addressPrefix
        privateEndpointNetworkPolicies: subnet.privateEndpointNetworkPolicies ?? 'Enabled'
        privateLinkServiceNetworkPolicies: subnet.privateLinkServiceNetworkPolicies ?? 'Enabled'
        networkSecurityGroup: contains(subnet, 'networkSecurityGroupId')
          ? {
              id: subnet.networkSecurityGroupId
            }
          : null
        delegations: contains(subnet, 'delegations') ? subnet.delegations : []
      }
    }]
  }
  tags: tags
}

output virtualNetworkId string = virtualNetwork.id
output subnetNames array = [for subnet in subnets: subnet.name]
