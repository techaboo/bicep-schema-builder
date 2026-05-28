/**
 * deploymentService.js – Azure deployment operations and parameter file generation
 *
 * Provides:
 *   - Environment profile model (stored in sessionStorage)
 *   - Deterministic parameter file generation (same inputs → same output)
 *   - ARM deployment execution (POST to ARM API)
 *   - ARM What-If preview
 *   - Deployment status polling
 */

// ─────────────────────────────────────────────────────────────────────────────
// Environment profile
// ─────────────────────────────────────────────────────────────────────────────

const ENV_PROFILE_KEY = 'bicep_env_profile';

const DEFAULT_ENV_PROFILE = {
    environment: 'dev',
    resourceGroup: 'bicep-rg',
    location: 'eastus',
    subscriptionId: '',
    resourcePrefix: 'bicep',
    tags: {
        Environment: 'dev',
        ManagedBy: 'BicepSchemaBuilder',
        Project: 'bicep-schema-builder'
    }
};

/**
 * Loads the current environment profile from sessionStorage.
 * Falls back to defaults if none is stored.
 *
 * @returns {object} profile
 */
function loadEnvProfile() {
    try {
        const raw = sessionStorage.getItem(ENV_PROFILE_KEY);
        if (raw) {
            return Object.assign({}, DEFAULT_ENV_PROFILE, JSON.parse(raw));
        }
    } catch (_) {
        // ignore
    }
    return Object.assign({}, DEFAULT_ENV_PROFILE);
}

/**
 * Saves the environment profile to sessionStorage.
 *
 * @param {object} profile
 */
function saveEnvProfile(profile) {
    const merged = Object.assign({}, DEFAULT_ENV_PROFILE, profile);
    sessionStorage.setItem(ENV_PROFILE_KEY, JSON.stringify(merged));
    return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parameter file generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resource-specific default parameters for common Azure resource types.
 * These are merged with the environment profile to produce deterministic parameter files.
 */
const RESOURCE_DEFAULTS = {
    storage: {
        storageAccountName: '${prefix}stg${env}001',
        skuName: 'Standard_LRS',
        accessTier: 'Hot',
        enableManagedIdentity: true
    },
    webapp: {
        appServicePlanName: '${prefix}-${env}-plan',
        webAppName: '${prefix}-${env}-app',
        skuName: 'B1',
        runtimeStack: 'NODE|20-lts',
        enableManagedIdentity: true,
        httpsOnly: true
    },
    vm: {
        vmName: '${prefix}-${env}-vm01',
        adminUsername: 'azureuser',
        vmSize: 'Standard_B2ms',
        ubuntuOSVersion: 'Ubuntu-2204',
        authenticationType: 'sshPublicKey',
        sshPublicKey: 'REPLACE_WITH_YOUR_SSH_PUBLIC_KEY'
    },
    keyvault: {
        keyVaultName: '${prefix}-${env}-kv',
        skuName: 'standard',
        enableRbacAuthorization: true,
        enableSoftDelete: true,
        softDeleteRetentionInDays: 90
    },
    sqldatabase: {
        sqlServerName: '${prefix}-${env}-sql',
        databaseName: '${prefix}db',
        administratorLogin: 'sqladmin',
        skuName: 'S0',
        maxSizeBytes: 2147483648
    },
    functions: {
        functionAppName: '${prefix}-${env}-func',
        appServicePlanName: '${prefix}-${env}-funcplan',
        storageAccountName: '${prefix}funcstg${env}',
        runtime: 'node',
        runtimeVersion: '20',
        skuName: 'Y1',
        enableApplicationInsights: true
    },
    appplan: {
        appServicePlanName: '${prefix}-${env}-plan',
        skuName: 'B1',
        numberOfWorkers: 1
    },
    vnet: {
        vnetName: '${prefix}-${env}-vnet',
        vnetAddressPrefix: '10.0.0.0/16',
        subnetName: 'default',
        subnetAddressPrefix: '10.0.0.0/24'
    }
};

/**
 * Substitutes `${prefix}` and `${env}` placeholders in a parameter value.
 *
 * @param {string|any} value
 * @param {string} prefix
 * @param {string} env
 */
function interpolate(value, prefix, env) {
    if (typeof value !== 'string') return value;
    return value
        .replace(/\$\{prefix\}/g, prefix)
        .replace(/\$\{env\}/g, env);
}

/**
 * Recursively interpolates all string values in an object.
 */
function interpolateObject(obj, prefix, env) {
    if (typeof obj !== 'object' || obj === null) return interpolate(obj, prefix, env);
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
        result[k] = typeof v === 'object' ? interpolateObject(v, prefix, env) : interpolate(v, prefix, env);
    }
    return result;
}

/**
 * Generates a deterministic ARM parameters JSON object for a given resource type
 * and environment profile. The same inputs always produce the same output.
 *
 * @param {string} resourceId – e.g. 'storage', 'webapp', 'vm'
 * @param {object} envProfile
 * @param {object} [overrides] – additional resource-specific overrides from the UI config
 * @returns {object} ARM parameters object (ready for JSON.stringify)
 */
function generateParameterFile(resourceId, envProfile, overrides = {}) {
    const profile = Object.assign({}, DEFAULT_ENV_PROFILE, envProfile);
    const defaults = RESOURCE_DEFAULTS[resourceId] || {};
    const merged = Object.assign({}, defaults, overrides);
    const interpolated = interpolateObject(merged, profile.resourcePrefix, profile.environment);

    // Build the ARM parameters object format
    const parameters = {};
    for (const [key, value] of Object.entries(interpolated)) {
        parameters[key] = { value };
    }

    // Always include location and tags from the profile
    parameters.location = { value: profile.location };
    parameters.tags = { value: profile.tags };

    return {
        $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#',
        contentVersion: '1.0.0.0',
        parameters
    };
}

/**
 * Generates parameter files for all selected resources and returns a map of
 * filename → JSON string. Deterministic: same inputs → same map.
 *
 * @param {string[]} resourceIds – array of resource IDs
 * @param {object} envProfile
 * @param {Map<string, object>} [resourceConfigurations] – optional per-resource config overrides
 * @returns {Object.<string, string>} filename → JSON content
 */
function generateAllParameterFiles(resourceIds, envProfile, resourceConfigurations = new Map()) {
    const files = {};
    for (const id of resourceIds) {
        const overrides = resourceConfigurations.get(id) || {};
        const paramObj = generateParameterFile(id, envProfile, overrides);
        files[`parameters/${id}.parameters.json`] = JSON.stringify(paramObj, null, 2);
    }
    return files;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deployment name helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a deterministic deployment name from the profile.
 * Includes a Unix timestamp so successive deployments are distinguishable.
 *
 * @param {object} envProfile
 * @returns {string}
 */
function buildDeploymentName(envProfile) {
    const ts = Math.floor(Date.now() / 1000);
    const prefix = envProfile.resourcePrefix || 'bicep';
    const env = envProfile.environment || 'dev';
    return `${prefix}-${env}-${ts}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM deployment execution
// ─────────────────────────────────────────────────────────────────────────────

const ARM_API_VERSION = '2022-09-01';

/**
 * Submits an ARM deployment to Azure.
 * Requires the user to be authenticated (access token from AzureAuth.getAccessToken()).
 *
 * @param {object} envProfile
 * @param {object} armTemplate – compiled ARM JSON template
 * @param {object} armParameters – ARM parameters object (output of generateParameterFile)
 * @param {function} getAccessTokenFn – async function that returns a bearer token
 * @returns {Promise<{ deploymentName: string, deploymentId: string, status: string }>}
 */
async function deployToAzure(envProfile, armTemplate, armParameters, getAccessTokenFn) {
    const token = await getAccessTokenFn();
    const subId = envProfile.subscriptionId;
    const rg = envProfile.resourceGroup;
    const deploymentName = buildDeploymentName(envProfile);

    if (!subId) throw new Error('Subscription ID is required in the environment profile.');
    if (!rg) throw new Error('Resource Group is required in the environment profile.');

    const url = `https://management.azure.com/subscriptions/${subId}/resourcegroups/${rg}/providers/Microsoft.Resources/deployments/${deploymentName}?api-version=${ARM_API_VERSION}`;

    const body = {
        properties: {
            mode: 'Incremental',
            template: armTemplate,
            parameters: armParameters.parameters || {}
        }
    };

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err.error?.message || `${response.status} ${response.statusText}`;
        throw new Error(`Deployment failed: ${msg}`);
    }

    const result = await response.json();
    return {
        deploymentName,
        deploymentId: result.id,
        status: result.properties?.provisioningState || 'Accepted'
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// What-If preview
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs an ARM What-If operation to preview changes before deploying.
 *
 * @param {object} envProfile
 * @param {object} armTemplate
 * @param {object} armParameters
 * @param {function} getAccessTokenFn
 * @returns {Promise<{ changes: Array, status: string }>}
 */
async function whatIfDeployment(envProfile, armTemplate, armParameters, getAccessTokenFn) {
    const token = await getAccessTokenFn();
    const subId = envProfile.subscriptionId;
    const rg = envProfile.resourceGroup;

    if (!subId) throw new Error('Subscription ID is required in the environment profile.');
    if (!rg) throw new Error('Resource Group is required in the environment profile.');

    const url = `https://management.azure.com/subscriptions/${subId}/resourcegroups/${rg}/providers/Microsoft.Resources/deployments/what-if-preview/whatIf?api-version=${ARM_API_VERSION}`;

    const body = {
        properties: {
            mode: 'Incremental',
            template: armTemplate,
            parameters: armParameters.parameters || {}
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    // What-If returns 202 with a Location header for async results
    if (response.status === 202) {
        const location = response.headers.get('Location');
        if (!location) throw new Error('What-If operation returned 202 but no Location header.');
        return { asyncUrl: location, status: 'Running' };
    }

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err.error?.message || `${response.status} ${response.statusText}`;
        throw new Error(`What-If failed: ${msg}`);
    }

    const result = await response.json();
    return {
        changes: result.properties?.changes || [],
        status: result.status || 'Succeeded'
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Deployment status polling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Polls an ARM deployment until it reaches a terminal state.
 *
 * @param {object} envProfile
 * @param {string} deploymentName
 * @param {function} getAccessTokenFn
 * @param {function} [onUpdate] – called with { status, timestamp } on each poll tick
 * @returns {Promise<{ status: string, outputs: object }>}
 */
async function pollDeploymentStatus(envProfile, deploymentName, getAccessTokenFn, onUpdate) {
    const subId = envProfile.subscriptionId;
    const rg = envProfile.resourceGroup;
    const url = `https://management.azure.com/subscriptions/${subId}/resourcegroups/${rg}/providers/Microsoft.Resources/deployments/${deploymentName}?api-version=${ARM_API_VERSION}`;

    const TERMINAL_STATES = ['Succeeded', 'Failed', 'Canceled'];
    const POLL_INTERVAL_MS = 5000;
    const MAX_POLLS = 120; // 10 minutes max

    for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

        const token = await getAccessTokenFn();
        const response = await fetch(url, {
            headers: { Authorization: 'Bearer ' + token }
        });

        if (!response.ok) continue;

        const data = await response.json();
        const state = data.properties?.provisioningState || 'Running';
        const outputs = data.properties?.outputs || {};

        if (onUpdate) onUpdate({ status: state, timestamp: new Date().toISOString() });

        if (TERMINAL_STATES.includes(state)) {
            return { status: state, outputs };
        }
    }

    return { status: 'Timeout', outputs: {} };
}

/**
 * Polls an async What-If result URL.
 *
 * @param {string} asyncUrl
 * @param {function} getAccessTokenFn
 * @returns {Promise<{ changes: Array, status: string }>}
 */
async function pollWhatIfResult(asyncUrl, getAccessTokenFn) {
    const MAX_POLLS = 30;
    const POLL_INTERVAL_MS = 2000;

    for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

        const token = await getAccessTokenFn();
        const response = await fetch(asyncUrl, {
            headers: { Authorization: 'Bearer ' + token }
        });

        if (response.status === 202) continue; // still running

        if (response.ok) {
            const data = await response.json();
            return {
                changes: data.properties?.changes || [],
                status: data.status || 'Succeeded'
            };
        }

        const err = await response.json().catch(() => ({}));
        throw new Error(`What-If result failed: ${err.error?.message || response.status}`);
    }

    throw new Error('What-If operation timed out.');
}

// ─────────────────────────────────────────────────────────────────────────────
// What-If change rendering helpers
// ─────────────────────────────────────────────────────────────────────────────

const CHANGE_TYPE_ICONS = {
    Create: '🟢',
    Modify: '🟡',
    Delete: '🔴',
    NoChange: '⚪',
    Deploy: '🔵',
    Ignore: '⬛',
    Unsupported: '⚠️'
};

/**
 * Converts a What-If changes array into a human-readable HTML diff panel.
 *
 * @param {Array} changes
 * @returns {string} HTML string
 */
function renderWhatIfChanges(changes) {
    if (!changes || changes.length === 0) {
        return '<p class="whatif-no-changes">✅ No infrastructure changes detected.</p>';
    }

    const rows = changes.map(change => {
        const icon = CHANGE_TYPE_ICONS[change.changeType] || '❓';
        const type = change.resourceId ? change.resourceId.split('/').pop() : 'Unknown';
        const name = change.resourceId || '–';
        const changeType = change.changeType || 'Unknown';
        return `<tr class="whatif-row whatif-${changeType.toLowerCase()}">
            <td class="whatif-icon">${icon}</td>
            <td class="whatif-change-type">${changeType}</td>
            <td class="whatif-resource-type">${type}</td>
            <td class="whatif-resource-name" title="${name}">${name.split('/').slice(-2).join('/')}</td>
        </tr>`;
    });

    return `<table class="whatif-table">
        <thead>
            <tr>
                <th></th>
                <th>Change</th>
                <th>Type</th>
                <th>Resource</th>
            </tr>
        </thead>
        <tbody>${rows.join('')}</tbody>
    </table>
    <p class="whatif-summary">${changes.length} change(s) detected</p>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DEFAULT_ENV_PROFILE,
        loadEnvProfile,
        saveEnvProfile,
        generateParameterFile,
        generateAllParameterFiles,
        buildDeploymentName,
        deployToAzure,
        whatIfDeployment,
        pollDeploymentStatus,
        pollWhatIfResult,
        renderWhatIfChanges
    };
} else {
    window.DeploymentService = {
        DEFAULT_ENV_PROFILE,
        loadEnvProfile,
        saveEnvProfile,
        generateParameterFile,
        generateAllParameterFiles,
        buildDeploymentName,
        deployToAzure,
        whatIfDeployment,
        pollDeploymentStatus,
        pollWhatIfResult,
        renderWhatIfChanges
    };
}
