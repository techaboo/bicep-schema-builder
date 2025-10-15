@description('Location for the resources. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Name of the virtual machine.')
@minLength(1)
@maxLength(64)
param vmName string

@description('Size of the virtual machine.')
@allowed([
  'Standard_B1s'
  'Standard_B1ms'
  'Standard_B2s'
  'Standard_B2ms'
  'Standard_B4ms'
  'Standard_D2s_v3'
  'Standard_D4s_v3'
  'Standard_D8s_v3'
  'Standard_D16s_v3'
  'Standard_E2s_v3'
  'Standard_E4s_v3'
  'Standard_F2s_v2'
  'Standard_F4s_v2'
  'Standard_F8s_v2'
])
param vmSize string = 'Standard_B2ms'

@description('Administrator username for the VM.')
param adminUsername string

@description('SSH public key for authentication.')
param sshPublicKey string

@description('OS disk type.')
@allowed([
  'Standard_LRS'
  'StandardSSD_LRS'
  'Premium_LRS'
  'StandardSSD_ZRS'
  'Premium_ZRS'
])
param osDiskType string = 'Premium_LRS'

@description('Ubuntu version for the VM.')
@allowed([
  'Ubuntu-2004'
  'Ubuntu-2204'
  'Ubuntu-2404'
])
param ubuntuOSVersion string = 'Ubuntu-2204'

@description('Name of the virtual network.')
param vnetName string = '${vmName}-vnet'

@description('Address prefix for the virtual network.')
param vnetAddressPrefix string = '10.0.0.0/16'

@description('Name of the subnet.')
param subnetName string = 'default'

@description('Address prefix for the subnet.')
param subnetAddressPrefix string = '10.0.0.0/24'

@description('Optional tags to apply to the resources.')
param tags object = {}

var imageReference = {
  'Ubuntu-2004': {
    publisher: 'Canonical'
    offer: '0001-com-ubuntu-server-focal'
    sku: '20_04-lts-gen2'
    version: 'latest'
  }
  'Ubuntu-2204': {
    publisher: 'Canonical'
    offer: '0001-com-ubuntu-server-jammy'
    sku: '22_04-lts-gen2'
    version: 'latest'
  }
  'Ubuntu-2404': {
    publisher: 'Canonical'
    offer: 'ubuntu-24_04-lts'
    sku: 'server-gen1'
    version: 'latest'
  }
}

var networkSecurityGroupName = '${vmName}-nsg'
var networkInterfaceName = '${vmName}-nic'
var publicIPAddressName = '${vmName}-pip'

resource networkSecurityGroup 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: networkSecurityGroupName
  location: location
  properties: {
    securityRules: [
      {
        name: 'SSH'
        properties: {
          priority: 1000
          protocol: 'Tcp'
          access: 'Allow'
          direction: 'Inbound'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '22'
        }
      }
    ]
  }
  tags: tags
}

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressPrefix
      ]
    }
    subnets: [
      {
        name: subnetName
        properties: {
          addressPrefix: subnetAddressPrefix
          networkSecurityGroup: {
            id: networkSecurityGroup.id
          }
        }
      }
    ]
  }
  tags: tags
}

resource publicIPAddress 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: publicIPAddressName
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    publicIPAddressVersion: 'IPv4'
    idleTimeoutInMinutes: 4
  }
  tags: tags
}

resource networkInterface 'Microsoft.Network/networkInterfaces@2023-09-01' = {
  name: networkInterfaceName
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          subnet: {
            id: virtualNetwork.properties.subnets[0].id
          }
          privateIPAllocationMethod: 'Dynamic'
          publicIPAddress: {
            id: publicIPAddress.id
          }
        }
      }
    ]
  }
  tags: tags
}

resource virtualMachine 'Microsoft.Compute/virtualMachines@2024-03-01' = {
  name: vmName
  location: location
  properties: {
    hardwareProfile: {
      vmSize: vmSize
    }
    storageProfile: {
      osDisk: {
        createOption: 'FromImage'
        managedDisk: {
          storageAccountType: osDiskType
        }
      }
      imageReference: imageReference[ubuntuOSVersion]
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: networkInterface.id
        }
      ]
    }
    osProfile: {
      computerName: vmName
      adminUsername: adminUsername
      linuxConfiguration: {
        disablePasswordAuthentication: true
        ssh: {
          publicKeys: [
            {
              path: '/home/${adminUsername}/.ssh/authorized_keys'
              keyData: sshPublicKey
            }
          ]
        }
      }
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
  tags: tags
}

output vmId string = virtualMachine.id
output vmName string = virtualMachine.name
output publicIPAddress string = publicIPAddress.properties.ipAddress
output privateIPAddress string = networkInterface.properties.ipConfigurations[0].properties.privateIPAddress
output sshCommand string = 'ssh ${adminUsername}@${publicIPAddress.properties.ipAddress}'
output principalId string = virtualMachine.identity.principalId
