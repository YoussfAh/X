    /**
     * Get comprehensive service status
     */
    getStatus() {
        return {
            totalKeys: this.apiKeys.length,
            currentKeyIndex: this.currentKeyIndex + 1,
            availableKeys: this.apiKeys.map((key, index) => ({
                keyNumber: index + 1,
                isInitialized: !!this.models[index],
                hasTextModel: !!(this.models[index] && this.models[index].text),
                hasVisionModel: !!(this.models[index] && this.models[index].vision),
                keyPreview: key ? `${key.substring(0, 10)}...` : 'Not set',
                ...this.keyUsageStats[index]
            }))
        };
    }

    /**
     * Test all configured API keys
     */
    async testAllKeys() {
        const results = [];
        
        for (let i = 0; i < this.apiKeys.length; i++) {
            const modelSet = this.models[i];
            if (!modelSet) {
                results.push({
                    keyNumber: i + 1,
                    status: 'Not initialized',
                    error: 'Model not available'
                });
                continue;
            }

            try {
                const testPrompt = "Test connection. Respond with 'OK' only.";
                
                // Test text model
                let textResult = null;
                if (modelSet.text) {
                    try {
                        const result = await modelSet.text.generateContent(testPrompt);
                        textResult = result.response.text().trim();
                    } catch (error) {
                        textResult = `Text model error: ${error.message}`;
                    }
                }
                
                // Test vision model
                let visionResult = null;
                if (modelSet.vision) {
                    try {
                        const result = await modelSet.vision.generateContent(testPrompt);
                        visionResult = result.response.text().trim();
                    } catch (error) {
                        visionResult = `Vision model error: ${error.message}`;
                    }
                }
                
                results.push({
                    keyNumber: i + 1,
                    status: 'Working',
                    textModel: textResult,
                    visionModel: visionResult
                });
            } catch (error) {
                results.push({
                    keyNumber: i + 1,
                    status: 'Failed',
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Reset quota flags manually (for testing)
     */
    resetQuotaFlags() {
        this.apiKeys.forEach((_, index) => {
            this.keyUsageStats[index].quotaExceeded = false;
            this.keyUsageStats[index].quotaResetTime = null;
        });
        console.log('🔄 All quota flags reset manually');
    }

    /**
     * Get detailed usage statistics
     */
    getUsageStats() {
        return {
            totalKeys: this.apiKeys.length,
            currentActiveKey: this.currentKeyIndex + 1,
            keyStats: this.apiKeys.map((key, index) => ({
                keyNumber: index + 1,
                keyPreview: key ? `${key.substring(0, 10)}...` : 'Not set',
                ...this.keyUsageStats[index],
                successRate: this.keyUsageStats[index].requestCount > 0 
                    ? Math.round((this.keyUsageStats[index].successCount / this.keyUsageStats[index].requestCount) * 100) 
                    : 0
            }))
        };
    }

    /**
     * Force switch to a specific key (for testing)
     */
    switchToKey(keyIndex) {
        if (keyIndex >= 0 && keyIndex < this.apiKeys.length) {
            this.currentKeyIndex = keyIndex;
            console.log(`🔄 Manually switched to API key ${keyIndex + 1}`);
            return true;
        }
        return false;
    }

    /**
     * Check if any keys are available (not quota exceeded)
     */
    hasAvailableKeys() {
        return this.keyUsageStats.some(stat => !stat.quotaExceeded);
    }

    /**
     * Get next available key index
     */
    getNextAvailableKey() {
        for (let i = 0; i < this.apiKeys.length; i++) {
            const index = (this.currentKeyIndex + i) % this.apiKeys.length;
            if (!this.keyUsageStats[index].quotaExceeded) {
                return index;
            }
        }
        return -1; // No available keys
    }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;
```
