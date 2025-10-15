@description('Location for the resources. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Name of the App Service plan.')
param appServicePlanName string

@description('Name of the App Service web app.')
@minLength(2)
@maxLength(60)
param webAppName string

@description('App Service plan SKU.')
@allowed([
  'F1'
  'D1'
  'B1'
  'B2'
  'B3'
  'S1'
  'S2'
  'S3'
  'P1v3'
  'P2v3'
  'P3v3'
])
param skuName string = 'S1'

@description('Desired runtime stack for the web app.')
@allowed([
  'DOTNET|6.0'
  'DOTNET|7.0'
  'NODE|18-lts'
  'NODE|20-lts'
  'PYTHON|3.10'
  'PYTHON|3.11'
])
param runtimeStack string = 'DOTNET|7.0'

@description('Optional application settings to configure.')
param appSettings array = []

@description('Whether to enable managed identity on the web app.')
param enableManagedIdentity bool = true

var skuTierMap = {
  F1: 'FREE'
  D1: 'SHARED'
  B1: 'BASIC'
  B2: 'BASIC'
  B3: 'BASIC'
  S1: 'STANDARD'
  S2: 'STANDARD'
  S3: 'STANDARD'
  P1v3: 'PREMIUMV3'
  P2v3: 'PREMIUMV3'
  P3v3: 'PREMIUMV3'
}

var linuxRuntimeStacks = [
  'PYTHON|3.10'
  'PYTHON|3.11'
]

var alwaysOnSkus = [
  'S1'
  'S2'
  'S3'
  'P1v3'
  'P2v3'
  'P3v3'
]

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: skuName
    tier: skuTierMap[skuName]
    size: skuName
    capacity: 1
  }
  kind: 'app'
  properties: {
    reserved: contains(linuxRuntimeStacks, runtimeStack)
    perSiteScaling: false
    maximumElasticWorkerCount: 1
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  kind: 'app'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: runtimeStack
      alwaysOn: contains(alwaysOnSkus, skuName)
      appSettings: concat([
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '0'
        }
      ], appSettings)
    }
  }
  identity: enableManagedIdentity ? {
    type: 'SystemAssigned'
  } : null
  tags: {
    'hidden-link:/appServicePlans/${appServicePlanName}': appServicePlan.id
  }
}

output webAppHostname string = webApp.properties.defaultHostName
output webAppId string = webApp.id
output principalId string = enableManagedIdentity ? webApp.identity.principalId : ''
