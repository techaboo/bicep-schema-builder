// Azure Resource Graph Integration
class AzureResourceGraphClient {
    constructor() {
        this.baseUrl = 'https://management.azure.com';
        this.apiVersion = '2021-03-01';
        this.accessToken = null;
        this.resourceTypes = new Map();
        this.lastUpdate = null;
    }

    /**
     * Initialize the client with access token
     * @param {string} accessToken - Azure access token
     */
    initialize(accessToken) {
        this.accessToken = accessToken;
        this.loadCachedResourceTypes();
    }

    /**
     * Query Azure Resource Graph for resource types
     * @param {string} query - KQL query
     * @returns {Promise<Object>} Query results
     */
    async queryResourceGraph(query) {
        if (!this.accessToken) {
            throw new Error('Azure access token required. Please authenticate first.');
        }

        const url = `${this.baseUrl}/providers/Microsoft.ResourceGraph/resources?api-version=${this.apiVersion}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    subscriptions: [] // Will query all accessible subscriptions
                })
            });

            if (!response.ok) {
                throw new Error(`Azure Resource Graph query failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Azure Resource Graph query error:', error);
            throw error;
        }
    }

    /**
     * Get all available resource types from Azure
     * @returns {Promise<Array>} Array of resource types
     */
    async getResourceTypes() {
        const query = `
            Resources
            | distinct type
            | where type startswith "Microsoft."
            | order by type asc
            | limit 1000
        `;

        try {
            const result = await this.queryResourceGraph(query);
            const resourceTypes = result.data.map(row => ({
                type: row.type,
                provider: row.type.split('/')[0],
                resourceType: row.type.split('/')[1]
            }));

            // Cache the results
            this.resourceTypes.clear();
            resourceTypes.forEach(rt => {
                this.resourceTypes.set(rt.type, rt);
            });
            this.lastUpdate = new Date();
            this.saveCachedResourceTypes();

            return resourceTypes;
        } catch (error) {
            console.warn('Failed to fetch resource types from Azure:', error);
            return this.getCachedResourceTypes();
        }
    }

    /**
     * Get API versions for a specific resource type
     * @param {string} resourceType - The resource type (e.g., Microsoft.Storage/storageAccounts)
     * @returns {Promise<Array>} Array of API versions
     */
    async getApiVersions(resourceType) {
        const [provider, type] = resourceType.split('/');
        
        try {
            // This would require Microsoft.Resources provider API
            const url = `${this.baseUrl}/providers/${provider}/resourceTypes?api-version=2021-04-01`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const resourceTypeInfo = data.resourceTypes?.find(rt => rt.resourceType === type);
                return resourceTypeInfo?.apiVersions || [];
            }
        } catch (error) {
            console.warn('Failed to fetch API versions:', error);
        }

        // Fallback to common API versions
        return this.getDefaultApiVersions(resourceType);
    }

    /**
     * Validate if a resource type exists in Azure
     * @param {string} resourceType - The resource type to validate
     * @returns {boolean} True if the resource type exists
     */
    async validateResourceType(resourceType) {
        if (this.resourceTypes.size === 0) {
            await this.getResourceTypes();
        }
        
        return this.resourceTypes.has(resourceType);
    }

    /**
     * Get resource type suggestions based on partial input
     * @param {string} partial - Partial resource type string
     * @returns {Array} Array of matching resource types
     */
    getResourceTypeSuggestions(partial) {
        const suggestions = [];
        const lowerPartial = partial.toLowerCase();
        
        for (const [type, info] of this.resourceTypes) {
            if (type.toLowerCase().includes(lowerPartial)) {
                suggestions.push(info);
            }
        }
        
        return suggestions.slice(0, 10); // Limit to 10 suggestions
    }

    /**
     * Cache resource types in localStorage
     */
    saveCachedResourceTypes() {
        try {
            const cacheData = {
                resourceTypes: Array.from(this.resourceTypes.entries()),
                lastUpdate: this.lastUpdate
            };
            localStorage.setItem('azure-resource-types-cache', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to cache resource types:', error);
        }
    }

    /**
     * Load cached resource types from localStorage
     */
    loadCachedResourceTypes() {
        try {
            const cacheData = JSON.parse(localStorage.getItem('azure-resource-types-cache'));
            if (cacheData && cacheData.resourceTypes) {
                this.resourceTypes = new Map(cacheData.resourceTypes);
                this.lastUpdate = new Date(cacheData.lastUpdate);
                
                // Check if cache is older than 24 hours
                const now = new Date();
                const hoursSinceUpdate = (now - this.lastUpdate) / (1000 * 60 * 60);
                if (hoursSinceUpdate > 24) {
                    // Cache is stale, refresh in background
                    this.getResourceTypes().catch(console.warn);
                }
            }
        } catch (error) {
            console.warn('Failed to load cached resource types:', error);
        }
    }

    /**
     * Get cached resource types
     * @returns {Array} Array of cached resource types
     */
    getCachedResourceTypes() {
        return Array.from(this.resourceTypes.values());
    }

    /**
     * Get default API versions for common resource types
     * @param {string} resourceType - The resource type
     * @returns {Array} Array of default API versions
     */
    getDefaultApiVersions(resourceType) {
        const defaultVersions = {
            'Microsoft.Storage/storageAccounts': ['2021-04-01', '2021-06-01', '2021-08-01', '2022-05-01'],
            'Microsoft.Compute/virtualMachines': ['2021-03-01', '2021-07-01', '2022-03-01'],
            'Microsoft.Web/sites': ['2020-12-01', '2021-01-15', '2021-02-01', '2022-03-01'],
            'Microsoft.KeyVault/vaults': ['2019-09-01', '2021-04-01-preview', '2021-10-01'],
            'Microsoft.Sql/servers/databases': ['2021-02-01-preview', '2021-05-01-preview', '2021-11-01'],
            'Microsoft.Web/serverfarms': ['2020-12-01', '2021-01-15', '2021-02-01', '2022-03-01'],
            'Microsoft.Network/virtualNetworks': ['2020-11-01', '2021-02-01', '2021-05-01', '2022-01-01']
        };

        return defaultVersions[resourceType] || ['2022-01-01'];
    }

    /**
     * Get resource locations for a specific resource type
     * @param {string} resourceType - The resource type
     * @returns {Promise<Array>} Array of available locations
     */
    async getResourceLocations(resourceType) {
        const query = `
            Resources
            | where type == "${resourceType}"
            | distinct location
            | where isnotempty(location)
            | order by location asc
        `;

        try {
            const result = await this.queryResourceGraph(query);
            return result.data.map(row => row.location);
        } catch (error) {
            console.warn('Failed to fetch resource locations:', error);
            // Return common Azure regions as fallback
            return [
                'eastus', 'eastus2', 'westus', 'westus2', 'westus3',
                'centralus', 'southcentralus', 'northcentralus',
                'westeurope', 'northeurope', 'uksouth', 'ukwest',
                'francecentral', 'germanywestcentral', 'norwayeast',
                'switzerlandnorth', 'swedencentral'
            ];
        }
    }

    /**
     * Check if the client has a valid access token
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        return !!this.accessToken;
    }

    /**
     * Clear authentication and cached data
     */
    clearAuth() {
        this.accessToken = null;
        this.resourceTypes.clear();
        this.lastUpdate = null;
        localStorage.removeItem('azure-resource-types-cache');
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AzureResourceGraphClient;
} else {
    window.AzureResourceGraphClient = AzureResourceGraphClient;
}