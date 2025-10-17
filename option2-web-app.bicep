// Option 2: Web App with App Service Plan
// Complete web application deployment

targetScope = 'resourceGroup'

metadata description = 'Deploy Azure Web App with App Service Plan'
metadata author = 'Bicep Schema Builder'
metadata version = '1.0.0'

// === PARAMETERS ===

@description('Name of the web app (must be globally unique)')
@minLength(2)
@maxLength(60)
param webAppName string = 'webapp-${uniqueString(resourceGroup().id)}'

@description('Name of the App Service Plan')
param appServicePlanName string = '${webAppName}-plan'

@description('The location for the resources')
param location string = resourceGroup().location

@description('Environment name')
@allowed(['dev', 'test', 'staging', 'prod'])
param environment string = 'dev'

@description('App Service Plan SKU')
@allowed(['F1', 'D1', 'B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'P1v2', 'P2v2', 'P3v2'])
param appServicePlanSku string = 'F1'

@description('Runtime stack')
@allowed(['.NET 8', '.NET 6', 'Node.js 18', 'Node.js 20', 'Python 3.11', 'PHP 8.1', 'Java 17'])
param runtimeStack string = '.NET 8'

@description('Enable Application Insights')
param enableAppInsights bool = true

@description('Resource tags')
param tags object = {
  Environment: environment
  CreatedBy: 'Bicep Schema Builder'
  CreatedDate: utcNow('yyyy-MM-dd')
}

// === VARIABLES ===

var webAppNameClean = toLower(replace(webAppName, ' ', '-'))
var appInsightsName = '${webAppNameClean}-insights'

var runtimeStackMap = {
  '.NET 8': 'DOTNETCORE|8.0'
  '.NET 6': 'DOTNETCORE|6.0'  
  'Node.js 18': 'NODE|18-lts'
  'Node.js 20': 'NODE|20-lts'
  'Python 3.11': 'PYTHON|3.11'
  'PHP 8.1': 'PHP|8.1'
  'Java 17': 'JAVA|17-java17'
}

// === RESOURCES ===

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: appServicePlanSku
  }
  properties: {
    reserved: contains(runtimeStack, 'Node.js') || contains(runtimeStack, 'Python') || contains(runtimeStack, 'PHP')
  }
}

// Application Insights (conditional)
resource appInsights 'Microsoft.Insights/components@2020-02-02' = if (enableAppInsights) {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Request_Source: 'rest'
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: webAppNameClean
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: runtimeStackMap[runtimeStack]
      appSettings: []
    }
  }
}

// App Settings (conditional deployment)
resource webAppSettings 'Microsoft.Web/sites/config@2023-01-01' = if (enableAppInsights) {
  parent: webApp
  name: 'appsettings'
  properties: {
    APPINSIGHTS_INSTRUMENTATIONKEY: appInsights.properties.InstrumentationKey
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
  }
}

// === OUTPUTS ===

@description('Web App resource ID')
output webAppId string = webApp.id

@description('Web App name')
output webAppName string = webApp.name

@description('Web App URL')
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'

@description('App Service Plan resource ID')
output appServicePlanId string = appServicePlan.id

@description('Application Insights Instrumentation Key')
output appInsightsInstrumentationKey string = enableAppInsights ? appInsights.properties.InstrumentationKey : ''

@description('Application Insights Connection String')
output appInsightsConnectionString string = enableAppInsights ? appInsights.properties.ConnectionString : ''
