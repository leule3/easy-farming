<template>
    <div class="innovations-page">
        <div class="page-header">
            <h1>💡 Agricultural Innovations</h1>
            <button @click="showForm = true" class="btn btn-primary">+ Share Innovation</button>
        </div>

        <!-- Innovation Form -->
        <div v-if="showForm" class="card innovation-form">
            <h2>Share Your Innovation</h2>
            <form @submit.prevent="submitInnovation">
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" v-model="form.title" class="form-control" required
                           placeholder="e.g., New irrigation technique">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Description *</label>
                    <textarea v-model="form.description" class="form-control" rows="5" required
                              placeholder="Describe your innovative idea..."></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select v-model="form.category" class="form-control">
                        <option value="Crop Production">Crop Production</option>
                        <option value="Irrigation">Irrigation</option>
                        <option value="Pest Control">Pest Control</option>
                        <option value="Soil Management">Soil Management</option>
                        <option value="Livestock">Livestock</option>
                        <option value="Post-Harvest">Post-Harvest</option>
                        <option value="General">General</option>
                    </select>
                </div>
                
                <div class="form-buttons">
                    <button type="submit" class="btn btn-primary" :disabled="submitting">
                        {{ submitting ? 'Sharing...' : 'Share Innovation' }}
                    </button>
                    <button type="button" class="btn btn-secondary" @click="showForm = false">
                        Cancel
                    </button>
                </div>
            </form>
        </div>

        <!-- Innovations List -->
        <div v-if="loading" class="spinner"></div>
        
        <div v-else-if="innovations.length === 0" class="empty-state">
            <p>No innovations shared yet. Be the first to share!</p>
        </div>

        <div v-else class="innovations-grid">
            <div v-for="innovation in innovations" :key="innovation.id" class="innovation-card">
                <div class="innovation-header">
                    <span class="category-badge">{{ innovation.category }}</span>
                    <h3>{{ innovation.title }}</h3>
                </div>
                
                <p class="innovation-content">{{ innovation.description }}</p>
                
                <div class="innovation-meta">
                    <span>By: {{ innovation.first_name }} {{ innovation.last_name }}</span>
                    <span>{{ formatDate(innovation.created_at) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Innovations',
    data() {
        return {
            innovations: [],
            loading: true,
            showForm: false,
            submitting: false,
            form: {
                title: '',
                description: '',
                category: 'General'
            }
        }
    },
    async mounted() {
        await this.fetchInnovations()
    },
    methods: {
        async fetchInnovations() {
            try {
                const response = await axios.get('/innovations')
                this.innovations = response.data.data
            } catch (error) {
                console.error('Failed to fetch innovations:', error)
            } finally {
                this.loading = false
            }
        },
        async submitInnovation() {
            this.submitting = true
            try {
                await axios.post('/innovations', this.form)
                this.showForm = false
                this.form = { title: '', description: '', category: 'General' }
                await this.fetchInnovations()
            } catch (error) {
                alert('Failed to share innovation')
            } finally {
                this.submitting = false
            }
        },
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString()
        }
    }
}
</script>

<style scoped>
.innovations-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.innovation-form {
    margin-bottom: 30px;
}

.innovations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
}

.innovation-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-top: 3px solid #2d6a4f;
}

.innovation-header {
    margin-bottom: 15px;
}

.category-badge {
    background: #2d6a4f;
    color: white;
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 12px;
    display: inline-block;
    margin-bottom: 10px;
}

.innovation-content {
    color: #666;
    line-height: 1.6;
    margin-bottom: 15px;
}

.innovation-meta {
    display: flex;
    justify-content: space-between;
    color: #999;
    font-size: 14px;
}
</style>