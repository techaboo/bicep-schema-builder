# Bicep Schema Builder - Deployment Guide

Complete guide for deploying Azure resources using the production-ready Bicep templates.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Template Overview](#template-overview)
4. [Deployment Examples](#deployment-examples)
5. [Parameter Files](#parameter-files)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# Azure CLI
az --version  # Should be 2.50.0 or later

# Bicep CLI
az bicep version  # Should be 0.20.0 or later

# Login to Azure
az login

# Set your subscription
az account set --subscription "Your-Subscription-Name"
```

### Resource Group

```bash
# Create a resource group
az group create \
  --name myResourceGroup \
  --location eastus
```

---

## Quick Start

### 1. Deploy Storage Account

```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/storage-account.bicep \
  --parameters parameters/storage-account.parameters.json
```

### 2. Deploy with Inline Parameters

```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/storage-account.bicep \
  --parameters \
    storageAccountName=mystorageacct123 \
    skuName=Standard_LRS \
    enableManagedIdentity=true
```

### 3. Validate Before Deployment

```bash
az deployment group validate \
  --resource-group myResourceGroup \
  --template-file templates/storage-account.bicep \
  --parameters parameters/storage-account.parameters.json
```

---

## Template Overview

### Available Templates (10)

| Template | Purpose | Complexity | Deploy Time |
|----------|---------|------------|-------------|
| [storage-account.bicep](../templates/storage-account.bicep) | Secure blob storage | ⭐ Simple | ~1 min |
| [key-vault.bicep](../templates/key-vault.bicep) | Secrets management | ⭐⭐ Moderate | ~2 min |
| [sql-database.bicep](../templates/sql-database.bicep) | Relational database | ⭐⭐ Moderate | ~5 min |
| [cosmos-db.bicep](../templates/cosmos-db.bicep) | NoSQL database | ⭐⭐ Moderate | ~3 min |
| [app-service-plan.bicep](../templates/app-service-plan.bicep) | App hosting plan | ⭐ Simple | ~1 min |
| [web-app.bicep](../templates/web-app.bicep) | Web application | ⭐⭐ Moderate | ~3 min |
| [azure-functions.bicep](../templates/azure-functions.bicep) | Serverless compute | ⭐⭐⭐ Advanced | ~4 min |
| [virtual-machine.bicep](../templates/virtual-machine.bicep) | Linux VM with networking | ⭐⭐⭐ Advanced | ~5 min |
| [container-app.bicep](../templates/container-app.bicep) | Containerized apps | ⭐⭐⭐ Advanced | ~6 min |
| [vnet-with-subnets.bicep](../templates/vnet-with-subnets.bicep) | Virtual network | ⭐ Simple | ~2 min |

---

## Deployment Examples

### Storage Account

**Basic Deployment:**
```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/storage-account.bicep \
  --parameters \
    storageAccountName=mystg$(date +%s) \
    skuName=Standard_LRS
```

**With Managed Identity:**
```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/storage-account.bicep \
  --parameters \
    storageAccountName=mystg$(date +%s) \
    skuName=Standard_ZRS \
    enableManagedIdentity=true \
    accessTier=Cool
```

**Capture Outputs:**
```bash
DEPLOYMENT=$(az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/storage-account.bicep \
  --parameters storageAccountName=mystg$(date +%s) \
  --query properties.outputs -o json)

STORAGE_ID=$(echo $DEPLOYMENT | jq -r '.storageAccountId.value')
echo "Storage Account ID: $STORAGE_ID"
```

---

### Key Vault

**Secure Key Vault with Network Isolation:**
```bash
# Get your public IP
MY_IP=$(curl -s ifconfig.me)

az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/key-vault.bicep \
  --parameters \
    keyVaultName=mykv$(date +%s) \
    enableRbacAuthorization=true \
    networkAclsDefaultAction=Deny \
    allowedIpRules="[\"$MY_IP\"]"
```

**Grant RBAC Access:**
```bash
# Get the current user's object ID
USER_ID=$(az ad signed-in-user show --query id -o tsv)

# Get Key Vault name from deployment output
KV_NAME=$(az deployment group show \
  --resource-group myResourceGroup \
  --name <deployment-name> \
  --query properties.outputs.keyVaultName.value -o tsv)

# Assign Key Vault Secrets Officer role
az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee $USER_ID \
  --scope /subscriptions/<subscription-id>/resourceGroups/myResourceGroup/providers/Microsoft.KeyVault/vaults/$KV_NAME
```

---

### SQL Database

**Basic SQL Server + Database:**
```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/sql-database.bicep \
  --parameters \
    sqlServerName=mysqlsrv$(date +%s) \
    databaseName=mydb \
    administratorLogin=sqladmin \
    administratorLoginPassword='ComplexP@ssw0rd123!' \
    skuName=S1
```

**With Zone Redundancy:**
```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/sql-database.bicep \
  --parameters \
    sqlServerName=mysqlsrv$(date +%s) \
    databaseName=mydb \
    administratorLogin=sqladmin \
    administratorLoginPassword='ComplexP@ssw0rd123!' \
    skuName=P1 \
    zoneRedundant=true \
    requestedBackupStorageRedundancy=GeoZone
```

**Query Connection String:**
```bash
SQL_FQDN=$(az deployment group show \
  --resource-group myResourceGroup \
  --name <deployment-name> \
  --query properties.outputs.sqlServerFqdn.value -o tsv)

echo "Server=$SQL_FQDN;Database=mydb;User Id=sqladmin;Password=***"
```

---

### Cosmos DB

**Serverless Cosmos DB:**
```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/cosmos-db.bicep \
  --parameters \
    cosmosDbAccountName=mycosmos$(date +%s) \
    databaseName=mydb \
    containerName=mycontainer \
    enableServerless=true \
    partitionKeyPath='/userId'
```

**Production Cosmos DB with Continuous Backup:**
```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/cosmos-db.bicep \
  --parameters \
    cosmosDbAccountName=mycosmos$(date +%s) \
    databaseName=mydb \
    containerName=mycontainer \
    consistencyLevel=Strong \
    enableAutomaticFailover=true \
    enableMultipleWriteLocations=true \
    throughput=1000 \
    backupPolicyType=Continuous
```

---

### Azure Functions

**Node.js Function App:**
```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/azure-functions.bicep \
  --parameters \
    functionAppName=myfunc$(date +%s) \
    appServicePlanName=myfuncplan \
    storageAccountName=myfuncstg$(date +%s) \
    runtime=node \
    runtimeVersion=20 \
    skuName=Y1
```

**.NET Isolated on Premium Plan:**
```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/azure-functions.bicep \
  --parameters \
    functionAppName=myfunc$(date +%s) \
    appServicePlanName=myfuncplan \
    storageAccountName=myfuncstg$(date +%s) \
    runtime=dotnet-isolated \
    runtimeVersion=8 \
    skuName=EP1 \
    enableApplicationInsights=true
```

---

### Virtual Machine

**Ubuntu 22.04 VM:**
```bash
# Generate SSH key if needed
ssh-keygen -t rsa -b 4096 -f ~/.ssh/azure_vm -N ""

az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/virtual-machine.bicep \
  --parameters \
    vmName=myubuntuvm \
    adminUsername=azureuser \
    sshPublicKey="$(cat ~/.ssh/azure_vm.pub)" \
    vmSize=Standard_B2ms \
    ubuntuOSVersion=Ubuntu-2204
```

**Get SSH Command:**
```bash
SSH_CMD=$(az deployment group show \
  --resource-group myResourceGroup \
  --name <deployment-name> \
  --query properties.outputs.sshCommand.value -o tsv)

echo $SSH_CMD
# ssh azureuser@x.x.x.x
```

---

### Container Apps

**Deploy Hello World Container:**
```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/container-app.bicep \
  --parameters \
    containerAppName=myapp$(date +%s) \
    environmentName=myenv$(date +%s) \
    containerImage=mcr.microsoft.com/azuredocs/containerapps-helloworld:latest
```

**Custom Container with Scaling:**
```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/container-app.bicep \
  --parameters \
    containerAppName=myapp$(date +%s) \
    environmentName=myenv$(date +%s) \
    containerImage=myregistry.azurecr.io/myapp:latest \
    registryServer=myregistry.azurecr.io \
    registryUsername=myregistry \
    registryPassword='<registry-password>' \
    cpuCore=1.0 \
    memorySize=2Gi \
    minReplicas=2 \
    maxReplicas=20
```

**Get App URL:**
```bash
APP_URL=$(az deployment group show \
  --resource-group myResourceGroup \
  --name <deployment-name> \
  --query properties.outputs.containerAppUrl.value -o tsv)

curl $APP_URL
```

---

### Web App

**Node.js Web App:**
```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/web-app.bicep \
  --parameters \
    appServicePlanName=myplan \
    webAppName=mywebapp$(date +%s) \
    skuName=S1 \
    runtimeStack='NODE|20-lts' \
    enableManagedIdentity=true
```

**.NET 7 Web App:**
```bash
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/web-app.bicep \
  --parameters \
    appServicePlanName=myplan \
    webAppName=mywebapp$(date +%s) \
    skuName=P1v3 \
    runtimeStack='DOTNET|7.0' \
    enableManagedIdentity=true
```

---

## Parameter Files

### Using Parameter Files

```bash
# Deploy with parameter file
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/storage-account.bicep \
  --parameters parameters/storage-account.parameters.json
```

### Override Specific Parameters

```bash
# Use parameter file but override specific values
az deployment group create \
  --resource-group myResourceGroup \
  --template-file templates/storage-account.bicep \
  --parameters parameters/storage-account.parameters.json \
  --parameters storageAccountName=overridename
```

### Environment-Specific Parameters

```bash
# Create environment-specific parameter files
cp parameters/storage-account.parameters.json parameters/storage-account.dev.parameters.json
cp parameters/storage-account.parameters.json parameters/storage-account.prod.parameters.json

# Edit for each environment
# Deploy to dev
az deployment group create \
  --resource-group dev-rg \
  --template-file templates/storage-account.bicep \
  --parameters parameters/storage-account.dev.parameters.json

# Deploy to prod
az deployment group create \
  --resource-group prod-rg \
  --template-file templates/storage-account.bicep \
  --parameters parameters/storage-account.prod.parameters.json
```

---

## Best Practices

### Naming Conventions

```bash
# Use consistent naming patterns
ENVIRONMENT="dev"
PROJECT="bicep"
LOCATION="eastus"

# Generate unique names
STORAGE_NAME="${PROJECT}stg${ENVIRONMENT}$(date +%s)"
VM_NAME="${PROJECT}-${ENVIRONMENT}-vm-01"
```

### Tagging Strategy

```json
{
  "tags": {
    "value": {
      "Environment": "Production",
      "Project": "BicepSchemaBuilder",
      "CostCenter": "IT",
      "Owner": "platform-team@company.com",
      "ManagedBy": "Bicep",
      "DeployedOn": "2024-10-15"
    }
  }
}
```

### Security

**Use Key Vault for Secrets:**
```bash
# Store password in Key Vault
az keyvault secret set \
  --vault-name mykeyvault \
  --name sqlAdminPassword \
  --value 'ComplexP@ssw0rd123!'

# Reference in parameter file
{
  "administratorLoginPassword": {
    "reference": {
      "keyVault": {
        "id": "/subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/mykeyvault"
      },
      "secretName": "sqlAdminPassword"
    }
  }
}
```

### Deployment Validation

```bash
# Always validate first
az deployment group validate \
  --resource-group myResourceGroup \
  --template-file templates/sql-database.bicep \
  --parameters parameters/sql-database.parameters.json

# Use What-If to preview changes
az deployment group what-if \
  --resource-group myResourceGroup \
  --template-file templates/sql-database.bicep \
  --parameters parameters/sql-database.parameters.json
```

---

## Troubleshooting

### Common Issues

#### 1. Name Already Taken

```bash
# Error: Storage account name already exists
# Solution: Add timestamp or unique suffix
storageAccountName=mystg$(date +%s)
```

#### 2. Insufficient Permissions

```bash
# Check your role assignments
az role assignment list --assignee $(az ad signed-in-user show --query id -o tsv)

# Need at least Contributor on the resource group
az role assignment create \
  --role Contributor \
  --assignee <your-user-id> \
  --resource-group myResourceGroup
```

#### 3. Quota Exceeded

```bash
# Check VM quota
az vm list-usage --location eastus --output table

# Request quota increase through Azure Portal
```

#### 4. Template Validation Errors

```bash
# Lint the template
az bicep lint --file templates/storage-account.bicep

# Build to JSON to see full ARM template
az bicep build --file templates/storage-account.bicep
```

### Deployment Logs

```bash
# View deployment operations
az deployment group operation list \
  --resource-group myResourceGroup \
  --name <deployment-name>

# Get detailed error information
az deployment group show \
  --resource-group myResourceGroup \
  --name <deployment-name> \
  --query properties.error
```

### Rollback

```bash
# List recent deployments
az deployment group list \
  --resource-group myResourceGroup \
  --query "[].{Name:name, State:properties.provisioningState, Time:properties.timestamp}" \
  --output table

# Redeploy previous successful version
az deployment group create \
  --resource-group myResourceGroup \
  --name rollback-deployment \
  --template-file templates/storage-account.bicep \
  --parameters @parameters/storage-account.parameters.json.bak
```

---

## Additional Resources

- [Azure Bicep Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)
- [ARM Template Reference](https://docs.microsoft.com/en-us/azure/templates/)
- [Project Documentation](IMPROVEMENTS.md)

---

**Last Updated:** October 15, 2025
**Version:** 2.0.0
