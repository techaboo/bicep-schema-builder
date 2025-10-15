@description('Location for the resources. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Name of the Function App.')
@minLength(2)
@maxLength(60)
param functionAppName string

@description('Name of the App Service plan for the Function App.')
param appServicePlanName string

@description('Name of the storage account for the Function App.')
@minLength(3)
@maxLength(24)
param storageAccountName string

@description('App Service plan SKU.')
@allowed([
  'Y1'
  'EP1'
  'EP2'
  'EP3'
  'P1v2'
  'P2v2'
  'P3v2'
])
param skuName string = 'Y1'

@description('Runtime stack for the Function App.')
@allowed([
  'dotnet'
  'dotnet-isolated'
  'node'
  'python'
  'java'
  'powershell'
])
param runtime string = 'dotnet-isolated'

@description('Runtime version.')
param runtimeVersion string = '8'

@description('Enable Application Insights.')
param enableApplicationInsights bool = true

@description('Optional tags to apply to the resources.')
param tags object = {}

var skuTierMap = {
  Y1: 'Dynamic'
  EP1: 'ElasticPremium'
  EP2: 'ElasticPremium'
  EP3: 'ElasticPremium'
  P1v2: 'PremiumV2'
  P2v2: 'PremiumV2'
  P3v2: 'PremiumV2'
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
  tags: tags
}

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: skuName
    tier: skuTierMap[skuName]
  }
  kind: 'functionapp'
  properties: {
    reserved: true
  }
  tags: tags
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = if (enableApplicationInsights) {
  name: '${functionAppName}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Request_Source: 'rest'
  }
  tags: tags
}

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: '${toUpper(runtime)}|${runtimeVersion}'
      appSettings: concat([
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(functionAppName)
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: runtime
        }
      ], enableApplicationInsights ? [
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: applicationInsights!.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights!.properties.ConnectionString
        }
      ] : [])
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
  tags: tags
}

output functionAppId string = functionApp.id
output functionAppName string = functionApp.name
output functionAppHostname string = functionApp.properties.defaultHostName
output principalId string = functionApp.identity.principalId
output storageAccountId string = storageAccount.id
output applicationInsightsId string = enableApplicationInsights ? applicationInsights.id : ''
