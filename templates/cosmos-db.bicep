@description('Location for the Cosmos DB account. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Name of the Cosmos DB account.')
@minLength(3)
@maxLength(44)
param cosmosDbAccountName string

@description('Database name.')
param databaseName string

@description('Container name.')
param containerName string

@description('API type for Cosmos DB.')
@allowed([
  'Sql'
  'MongoDB'
  'Cassandra'
  'Gremlin'
  'Table'
])
param apiType string = 'Sql'

@description('Consistency level.')
@allowed([
  'Eventual'
  'ConsistentPrefix'
  'Session'
  'BoundedStaleness'
  'Strong'
])
param consistencyLevel string = 'Session'

@description('Enable automatic failover.')
param enableAutomaticFailover bool = true

@description('Enable multiple write locations.')
param enableMultipleWriteLocations bool = false

@description('Enable serverless mode.')
param enableServerless bool = false

@description('Throughput for the container (RU/s). Ignored if serverless is enabled.')
@minValue(400)
@maxValue(1000000)
param throughput int = 400

@description('Partition key path.')
param partitionKeyPath string = '/id'

@description('Enable free tier (one per subscription).')
param enableFreeTier bool = false

@description('Backup policy type.')
@allowed([
  'Continuous'
  'Periodic'
])
param backupPolicyType string = 'Periodic'

@description('Backup interval in minutes (for Periodic backup).')
@minValue(60)
@maxValue(1440)
param backupIntervalInMinutes int = 240

@description('Backup retention in hours (for Periodic backup).')
@minValue(8)
@maxValue(720)
param backupRetentionInHours int = 8

@description('Optional tags to apply to the Cosmos DB account.')
param tags object = {}

var consistencyPolicy = {
  Eventual: {
    defaultConsistencyLevel: 'Eventual'
  }
  ConsistentPrefix: {
    defaultConsistencyLevel: 'ConsistentPrefix'
  }
  Session: {
    defaultConsistencyLevel: 'Session'
  }
  BoundedStaleness: {
    defaultConsistencyLevel: 'BoundedStaleness'
    maxStalenessPrefix: 100000
    maxIntervalInSeconds: 300
  }
  Strong: {
    defaultConsistencyLevel: 'Strong'
  }
}

var capabilities = apiType == 'MongoDB' ? [
  {
    name: 'EnableMongo'
  }
] : apiType == 'Cassandra' ? [
  {
    name: 'EnableCassandra'
  }
] : apiType == 'Gremlin' ? [
  {
    name: 'EnableGremlin'
  }
] : apiType == 'Table' ? [
  {
    name: 'EnableTable'
  }
] : []

resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2023-11-15' = {
  name: toLower(cosmosDbAccountName)
  location: location
  kind: apiType == 'MongoDB' ? 'MongoDB' : 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: consistencyPolicy[consistencyLevel]
    enableAutomaticFailover: enableAutomaticFailover
    enableMultipleWriteLocations: enableMultipleWriteLocations
    enableFreeTier: enableFreeTier
    capabilities: enableServerless ? union(capabilities, [
      {
        name: 'EnableServerless'
      }
    ]) : capabilities
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    backupPolicy: backupPolicyType == 'Continuous' ? {
      type: 'Continuous'
    } : {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: backupIntervalInMinutes
        backupRetentionIntervalInHours: backupRetentionInHours
      }
    }
    publicNetworkAccess: 'Enabled'
    minimalTlsVersion: 'Tls12'
  }
  tags: tags
}

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-11-15' = if (apiType == 'Sql') {
  parent: cosmosDbAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
    options: enableServerless ? {} : {
      throughput: throughput
    }
  }
}

resource container 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = if (apiType == 'Sql') {
  parent: database
  name: containerName
  properties: {
    resource: {
      id: containerName
      partitionKey: {
        paths: [
          partitionKeyPath
        ]
        kind: 'Hash'
      }
    }
  }
}

output cosmosDbAccountId string = cosmosDbAccount.id
output cosmosDbAccountName string = cosmosDbAccount.name
output cosmosDbEndpoint string = cosmosDbAccount.properties.documentEndpoint
output databaseId string = apiType == 'Sql' ? database.id : ''
output containerId string = apiType == 'Sql' ? container.id : ''
output primaryKey string = cosmosDbAccount.listKeys().primaryMasterKey
