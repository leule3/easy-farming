<template>
    <div class="reports-page">
        <div class="page-header">
            <h1>📝 Problem Reports</h1>
            <button v-if="!isAdmin" @click="showForm = true" class="btn btn-primary">+ Report Problem</button>
        </div>

        <!-- Report Form -->
        <div v-if="showForm && !isAdmin" class="card report-form">
            <h2>Report a Problem</h2>
            <form @submit.prevent="submitReport">
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" v-model="form.title" class="form-control" required
                           placeholder="e.g., Crop disease outbreak">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Description *</label>
                    <textarea v-model="form.description" class="form-control" rows="5" required
                              placeholder="Describe the problem in detail..."></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Location</label>
                        <input type="text" v-model="form.location" class="form-control"
                               placeholder="Where is this happening?">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Severity</label>
                        <select v-model="form.severity" class="form-control">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-buttons">
                    <button type="submit" class="btn btn-primary" :disabled="submitting">
                        {{ submitting ? 'Submitting...' : 'Submit Report' }}
                    </button>
                    <button type="button" class="btn btn-secondary" @click="showForm = false">
                        Cancel
                    </button>
                </div>
            </form>
        </div>

        <!-- Reports List -->
        <div v-if="loading" class="spinner"></div>
        
        <div v-else-if="reports.length === 0" class="empty-state">
            <p>No reports submitted yet.</p>
        </div>

        <div v-else class="reports-list">
            <div v-for="report in reports" :key="report.id" :class="['report-card', report.severity, { 'prioritized-card': report.is_prioritized }]">
                <div class="report-header">
                    <h3>
                        <span v-if="report.is_prioritized" title="Admin Prioritized" style="font-size: 1.2em; margin-right: 5px;">🌟</span>
                        {{ report.title }}
                    </h3>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <span :class="['severity-badge', report.severity]">{{ report.severity }}</span>
                        <button v-if="isAdmin" @click="togglePriority(report)" 
                                :class="['btn-priority', report.is_prioritized ? 'active' : '']">
                            {{ report.is_prioritized ? 'Unprioritize' : 'Prioritize' }}
                        </button>
                    </div>
                </div>
                
                <p>{{ report.description }}</p>
                
                <div class="report-meta">
                    <span v-if="report.location">📍 {{ report.location }}</span>
                    <span>By: {{ report.first_name }} {{ report.last_name }}</span>
                    <span>{{ formatDate(report.created_at) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Reports',
    data() {
        return {
            reports: [],
            loading: true,
            showForm: false,
            submitting: false,
            form: {
                title: '',
                description: '',
                location: '',
                severity: 'medium'
            }
        }
    },
    computed: {
        isAdmin() {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            return user.role === 'super_admin' || user.role === 'branch_admin'
        }
    },
    async mounted() {
        await this.fetchReports()
    },
    methods: {
        async fetchReports() {
            try {
                const response = await axios.get('/reports')
                this.reports = response.data.data
            } catch (error) {
                console.error('Failed to fetch reports:', error)
            } finally {
                this.loading = false
            }
        },
        async submitReport() {
            this.submitting = true
            try {
                await axios.post('/reports', this.form)
                this.showForm = false
                this.form = { title: '', description: '', location: '', severity: 'medium' }
                await this.fetchReports()
            } catch (error) {
                alert('Failed to submit report')
            } finally {
                this.submitting = false
            }
        },
        async togglePriority(report) {
            try {
                const response = await axios.put(`/reports/${report.id}/priority`)
                if (response.data.success) {
                    report.is_prioritized = response.data.is_prioritized
                    // Re-sort the array so prioritized items jump to top immediately
                    this.reports.sort((a, b) => {
                        if (a.is_prioritized === b.is_prioritized) {
                            return new Date(b.created_at) - new Date(a.created_at)
                        }
                        return a.is_prioritized ? -1 : 1
                    })
                }
            } catch (error) {
                alert('Failed to update priority')
            }
        },
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString()
        }
    }
}
</script>

<style scoped>
.reports-page {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.report-form {
    margin-bottom: 30px;
}

.reports-list {
    display: grid;
    gap: 15px;
}

.report-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-left: 4px solid #ffc107;
}

.report-card.high { border-left-color: #ff6b6b; }
.report-card.critical { border-left-color: #d62828; background: #fff5f5; }

.prioritized-card {
    border: 2px solid #ffaa00;
    box-shadow: 0 4px 15px rgba(255, 170, 0, 0.2);
    position: relative;
}

.report-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 10px;
}

.severity-badge {
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    background: #ffc107;
    color: #333;
}

.severity-badge.high { background: #ff6b6b; color: white; }
.severity-badge.critical { background: #d62828; color: white; }

.btn-priority {
    padding: 4px 10px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}
.btn-priority:hover { background: #f0f0f0; }
.btn-priority.active {
    background: #ffaa00;
    color: white;
    border-color: #ffaa00;
}

.report-meta {
    display: flex;
    gap: 20px;
    color: #999;
    font-size: 14px;
    margin-top: 15px;
}
</style>