@description('Location for the resources. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Name of the Container App.')
@minLength(2)
@maxLength(32)
param containerAppName string

@description('Name of the Container Apps Environment.')
param environmentName string

@description('Container image to deploy.')
param containerImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('Container registry server.')
param registryServer string = 'mcr.microsoft.com'

@description('Container registry username (leave empty for public registries).')
param registryUsername string = ''

@description('Container registry password (leave empty for public registries).')
@secure()
param registryPassword string = ''

@description('CPU cores allocated to container (0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, or 2.0).')
param cpuCore string = '0.5'

@description('Memory allocated to container (format: 0.5Gi, 1Gi, 1.5Gi, 2Gi, etc).')
param memorySize string = '1Gi'

@description('Minimum number of replicas.')
@minValue(0)
@maxValue(30)
param minReplicas int = 1

@description('Maximum number of replicas.')
@minValue(1)
@maxValue(30)
param maxReplicas int = 10

@description('Environment variables for the container.')
param environmentVariables array = []

@description('Target port for ingress.')
param targetPort int = 80

@description('Enable external ingress.')
param externalIngress bool = true

@description('Transport protocol.')
@allowed([
  'http'
  'http2'
  'tcp'
])
param transport string = 'http'

@description('Allow insecure connections.')
param allowInsecure bool = false

@description('Optional tags to apply to the resources.')
param tags object = {}

resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
  tags: tags
}

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${environmentName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
  tags: tags
}

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: externalIngress
        targetPort: targetPort
        transport: transport
        allowInsecure: allowInsecure
      }
      registries: !empty(registryUsername) ? [
        {
          server: registryServer
          username: registryUsername
          passwordSecretRef: 'registry-password'
        }
      ] : []
      secrets: !empty(registryPassword) ? [
        {
          name: 'registry-password'
          value: registryPassword
        }
      ] : []
    }
    template: {
      containers: [
        {
          name: containerAppName
          image: containerImage
          resources: {
            cpu: json(cpuCore)
            memory: memorySize
          }
          env: environmentVariables
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
  tags: tags
}

output containerAppId string = containerApp.id
output containerAppName string = containerApp.name
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output principalId string = containerApp.identity.principalId
output environmentId string = containerAppEnvironment.id
