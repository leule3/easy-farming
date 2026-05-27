<template>
    <div class="warnings-page">
        <div class="page-header">
            <h1>⚠️ Active Warnings</h1>
            <p>Stay informed about agricultural threats and disasters</p>
        </div>

        <div v-if="loading" class="spinner"></div>

        <div v-else-if="warnings.length === 0" class="empty-state">
            <div class="empty-icon">✅</div>
            <h3>No Active Warnings</h3>
            <p>There are currently no warning alerts. Stay safe!</p>
        </div>

        <div v-else class="warnings-grid">
            <div v-for="warning in warnings" :key="warning.id" 
                 :class="['warning-card', warning.warning_type]">
                <div class="warning-header">
                    <span class="warning-type-icon">
                        {{ getWarningIcon(warning.warning_type) }}
                    </span>
                    <h3>{{ warning.title }}</h3>
                </div>
                
                <p class="warning-content">{{ warning.content }}</p>
                
                <div class="warning-meta">
                    <span class="warning-severity">
                        Severity: {{ getWarningLabel(warning.warning_type) }}
                    </span>
                    <span class="warning-date">
                        {{ formatDate(warning.created_at) }}
                    </span>
                </div>
                
                <div class="warning-actions">
                    <button class="btn btn-sm btn-warning">
                        ⚠️ Take Action
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Warnings',
    data() {
        return {
            warnings: [],
            loading: true
        }
    },
    async mounted() {
        await this.fetchWarnings()
    },
    methods: {
        async fetchWarnings() {
            try {
                const response = await axios.get('/posts/warnings')
                this.warnings = response.data.data
            } catch (error) {
                console.error('Failed to fetch warnings:', error)
            } finally {
                this.loading = false
            }
        },
        getWarningIcon(type) {
            const icons = {
                'flood': '🌊',
                'wildfire': '🔥',
                'locust_swarm': '🦗',
                'general': '⚠️'
            }
            return icons[type] || '⚠️'
        },
        getWarningLabel(type) {
            const labels = {
                'flood': 'Flood Warning',
                'wildfire': 'Fire Danger',
                'locust_swarm': 'Pest Alert',
                'general': 'General Warning'
            }
            return labels[type] || 'Warning'
        },
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })
        }
    }
}
</script>

<style scoped>
.warnings-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.page-header {
    text-align: center;
    margin-bottom: 40px;
}

.page-header h1 {
    color: #d62828;
    font-size: 2.5em;
}

.warnings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
}

.warning-card {
    border-radius: 10px;
    padding: 25px;
    color: white;
    position: relative;
    overflow: hidden;
}

.warning-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.2);
}

.warning-card.flood {
    background: linear-gradient(135deg, #0066cc, #003d80);
}

.warning-card.wildfire {
    background: linear-gradient(135deg, #cc3300, #801f00);
}

.warning-card.locust_swarm {
    background: linear-gradient(135deg, #8B6914, #5c4510);
}

.warning-card.general {
    background: linear-gradient(135deg, #666666, #333333);
}

.warning-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    position: relative;
    z-index: 1;
}

.warning-type-icon {
    font-size: 2em;
}

.warning-header h3 {
    margin: 0;
    color: white;
}

.warning-content {
    line-height: 1.6;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
}

.warning-meta {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    margin-bottom: 15px;
    position: relative;
    z-index: 1;
}

.warning-severity {
    background: rgba(255,255,255,0.2);
    padding: 3px 10px;
    border-radius: 15px;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
}

.empty-icon {
    font-size: 4em;
    margin-bottom: 20px;
}
</style>