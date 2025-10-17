// Simple test to see if Bicep generation works
function testBicepGeneration() {
    return `// Test Bicep Template
targetScope = 'resourceGroup'

param vmName string = 'test-vm'
param location string = 'East US'

var vmNameClean = toLower(replace('test-vm', ' ', '-'))
var networkInterfaceName = '\${vmNameClean}-nic'

resource testResource 'Microsoft.Compute/virtualMachines@2023-03-01' = {
  name: vmName
  location: location
}
`;
}