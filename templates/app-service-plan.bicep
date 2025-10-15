@description('Location for the App Service plan. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Name of the App Service plan.')
@minLength(1)
@maxLength(40)
param appServicePlanName string

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
  'P1v2'
  'P2v2'
  'P3v2'
  'P1v3'
  'P2v3'
  'P3v3'
  'I1v2'
  'I2v2'
  'I3v2'
])
param skuName string = 'S1'

@description('Number of worker instances.')
@minValue(1)
@maxValue(30)
param capacity int = 1

@description('Enable per-site scaling.')
param perSiteScaling bool = false

@description('Enable zone redundancy (requires Premium v2/v3 or Isolated v2).')
param zoneRedundant bool = false

@description('Operating system.')
@allowed([
  'Windows'
  'Linux'
])
param operatingSystem string = 'Linux'

@description('Optional tags to apply to the App Service plan.')
param tags object = {}

var skuTierMap = {
  F1: 'Free'
  D1: 'Shared'
  B1: 'Basic'
  B2: 'Basic'
  B3: 'Basic'
  S1: 'Standard'
  S2: 'Standard'
  S3: 'Standard'
  P1v2: 'PremiumV2'
  P2v2: 'PremiumV2'
  P3v2: 'PremiumV2'
  P1v3: 'PremiumV3'
  P2v3: 'PremiumV3'
  P3v3: 'PremiumV3'
  I1v2: 'IsolatedV2'
  I2v2: 'IsolatedV2'
  I3v2: 'IsolatedV2'
}

var zoneRedundantSkus = [
  'P1v2'
  'P2v2'
  'P3v2'
  'P1v3'
  'P2v3'
  'P3v3'
  'I1v2'
  'I2v2'
  'I3v2'
]

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: skuName
    tier: skuTierMap[skuName]
    capacity: capacity
  }
  kind: operatingSystem == 'Linux' ? 'linux' : 'app'
  properties: {
    reserved: operatingSystem == 'Linux'
    perSiteScaling: perSiteScaling
    zoneRedundant: zoneRedundant && contains(zoneRedundantSkus, skuName)
    maximumElasticWorkerCount: perSiteScaling ? 30 : 1
  }
  tags: tags
}

output appServicePlanId string = appServicePlan.id
output appServicePlanName string = appServicePlan.name
output skuTier string = appServicePlan.sku.tier
output skuName string = appServicePlan.sku.name
