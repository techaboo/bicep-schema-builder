@description('Location for the resources. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Name of the SQL Server.')
@minLength(1)
@maxLength(63)
param sqlServerName string

@description('Name of the SQL Database.')
@minLength(1)
@maxLength(128)
param databaseName string

@description('Administrator username for the SQL Server.')
param administratorLogin string

@description('Administrator password for the SQL Server.')
@secure()
param administratorLoginPassword string

@description('SQL Database SKU.')
@allowed([
  'Basic'
  'S0'
  'S1'
  'S2'
  'S3'
  'P1'
  'P2'
  'P4'
  'P6'
  'P11'
  'P15'
  'GP_Gen5_2'
  'GP_Gen5_4'
  'GP_Gen5_8'
  'GP_Gen5_16'
  'BC_Gen5_2'
  'BC_Gen5_4'
])
param skuName string = 'S0'

@description('Enable zone redundancy for the database.')
param zoneRedundant bool = false

@description('Maximum size of the database in bytes.')
param maxSizeBytes int = 2147483648

@description('Backup storage redundancy.')
@allowed([
  'Geo'
  'Local'
  'Zone'
  'GeoZone'
])
param requestedBackupStorageRedundancy string = 'Local'

@description('Optional tags to apply to the resources.')
param tags object = {}

var skuTierMap = {
  Basic: 'Basic'
  S0: 'Standard'
  S1: 'Standard'
  S2: 'Standard'
  S3: 'Standard'
  P1: 'Premium'
  P2: 'Premium'
  P4: 'Premium'
  P6: 'Premium'
  P11: 'Premium'
  P15: 'Premium'
  GP_Gen5_2: 'GeneralPurpose'
  GP_Gen5_4: 'GeneralPurpose'
  GP_Gen5_8: 'GeneralPurpose'
  GP_Gen5_16: 'GeneralPurpose'
  BC_Gen5_2: 'BusinessCritical'
  BC_Gen5_4: 'BusinessCritical'
}

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
  tags: tags
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  sku: {
    name: skuName
    tier: skuTierMap[skuName]
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: maxSizeBytes
    zoneRedundant: zoneRedundant
    requestedBackupStorageRedundancy: requestedBackupStorageRedundancy
  }
  tags: tags
}

resource allowAzureServices 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sqlServer
  name: 'AllowAllWindowsAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

output sqlServerId string = sqlServer.id
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output databaseId string = sqlDatabase.id
output databaseName string = sqlDatabase.name
