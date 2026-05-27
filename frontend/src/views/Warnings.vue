<template>
    <div style="max-width:1000px;margin:50px auto;padding:30px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:40px;">
            <div style="text-align:left;">
                <h1 style="color:#d62828;font-size:2.5em;">⚠️ {{ $t('nav.warnings') || 'Active Warnings' }}</h1>
                <p style="color:#666;">Stay informed about agricultural threats and disasters</p>
            </div>
            <button v-if="isSuperAdmin" @click="openCreateForm" 
                    style="padding:12px 24px;background:#d62828;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">
                + Add Warning
            </button>
        </div>

        <!-- Create/Edit Form -->
        <div v-if="showForm && isSuperAdmin" style="background:white;padding:25px;border-radius:12px;margin-bottom:25px;box-shadow:0 2px 10px rgba(0,0,0,0.1); border-top:4px solid #d62828;">
            <h2 style="margin-bottom:20px;">{{ isEditing ? 'Edit Warning' : 'Create New Warning' }}</h2>
            <form @submit.prevent="saveWarning">
                <input type="text" v-model="form.title" placeholder="Warning title" required
                       style="width:100%;padding:10px;border:2px solid #ddd;border-radius:8px;margin-bottom:15px;font-size:14px;">
                
                <textarea v-model="form.content" placeholder="Warning content..." required rows="5"
                          style="width:100%;padding:10px;border:2px solid #ddd;border-radius:8px;margin-bottom:15px;"></textarea>
                
                <div style="margin-bottom:15px;">
                    <label style="display:block;margin-bottom:5px;font-weight:bold;">Warning Type:</label>
                    <select v-model="form.warning_type" required
                            style="padding:10px;border:2px solid #ddd;border-radius:8px;width:100%;max-width:300px;">
                        <option value="flood">🌊 Flood</option>
                        <option value="wildfire">🔥 Wildfire</option>
                        <option value="locust_swarm">🦗 Locust Swarm</option>
                        <option value="general">⚠️ General</option>
                    </select>
                </div>
                
                <button type="submit" :disabled="saving"
                        style="padding:12px 24px;background:#d62828;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:700;">
                    {{ saving ? 'Saving...' : 'Save Warning' }}
                </button>
                <button type="button" @click="cancelForm"
                        style="padding:12px 24px;background:#6c757d;color:white;border:none;border-radius:8px;cursor:pointer;margin-left:10px;">
                    Cancel
                </button>
            </form>
        </div>

        <div v-if="loading" style="text-align:center;padding:50px;">Loading warnings...</div>

        <div v-else-if="warnings.length === 0" style="text-align:center;padding:60px;">
            <div style="font-size:4em;">✅</div>
            <h3>No Active Warnings</h3>
            <p style="color:#999;">There are currently no warning alerts.</p>
        </div>

        <div v-else style="display:grid;grid-template-columns:repeat(auto-fill, minmax(350px, 1fr));gap:20px;">
            <div v-for="warning in warnings" :key="warning.id" 
                 :style="getWarningStyle(warning.warning_type)">
                
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px;">
                    <span style="font-size:2em;">{{ getWarningIcon(warning.warning_type) }}</span>
                    <h3 style="margin:0;color:white;">{{ warning.title }}</h3>
                </div>
                
                <p style="color:white;line-height:1.6;margin-bottom:20px;flex-grow:1;">{{ warning.content }}</p>
                
                <div style="display:flex;justify-content:space-between;color:rgba(255,255,255,0.8);font-size:14px;margin-bottom:15px;">
                    <span>{{ getWarningLabel(warning.warning_type) }}</span>
                    <span>{{ formatDate(warning.created_at) }}</span>
                </div>
                
                <!-- Admin Controls -->
                <div v-if="isSuperAdmin" style="display:flex;gap:10px;border-top:1px solid rgba(255,255,255,0.2);padding-top:15px;">
                    <button @click="editWarning(warning)" style="padding:6px 12px;background:white;color:#333;border:none;border-radius:5px;cursor:pointer;font-size:12px;font-weight:bold;flex:1;">
                        ✏️ Edit
                    </button>
                    <button @click="deleteWarning(warning.id)" style="padding:6px 12px;background:rgba(255,0,0,0.3);color:white;border:1px solid rgba(255,255,255,0.3);border-radius:5px;cursor:pointer;font-size:12px;font-weight:bold;flex:1;">
                        🗑️ Delete
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
            loading: true,
            showForm: false,
            isEditing: false,
            saving: false,
            form: {
                id: null,
                title: '',
                content: '',
                post_type: 'warning',
                warning_type: 'general'
            }
        }
    },
    computed: {
        isSuperAdmin() {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            return user.role === 'super_admin'
        }
    },
    async mounted() {
        await this.fetchWarnings()
    },
    methods: {
        async fetchWarnings() {
            try {
                const response = await axios.get('/posts/warnings')
                const allWarnings = response.data.data
                const oneWeekAgo = new Date()
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                this.warnings = allWarnings.filter(warning => {
                    const warningDate = new Date(warning.created_at)
                    return warningDate >= oneWeekAgo
                })
            } catch (error) {
                console.error('Failed to fetch warnings:', error)
            } finally {
                this.loading = false
            }
        },
        openCreateForm() {
            this.isEditing = false
            this.form = { id: null, title: '', content: '', post_type: 'warning', warning_type: 'general' }
            this.showForm = true
        },
        editWarning(warning) {
            this.isEditing = true
            this.form = {
                id: warning.id,
                title: warning.title,
                content: warning.content,
                post_type: 'warning',
                warning_type: warning.warning_type
            }
            this.showForm = true
            window.scrollTo({ top: 0, behavior: 'smooth' })
        },
        cancelForm() {
            this.showForm = false
            this.form = { id: null, title: '', content: '', post_type: 'warning', warning_type: 'general' }
        },
        async saveWarning() {
            this.saving = true
            try {
                if (this.isEditing) {
                    await axios.put(`/posts/${this.form.id}`, this.form)
                } else {
                    await axios.post('/posts', this.form)
                }
                this.cancelForm()
                await this.fetchWarnings()
            } catch (error) {
                alert('Failed to save warning: ' + (error.response?.data?.message || error.message))
            } finally {
                this.saving = false
            }
        },
        async deleteWarning(id) {
            if (confirm('Are you sure you want to delete this warning?')) {
                try {
                    await axios.delete(`/posts/${id}`)
                    await this.fetchWarnings()
                } catch (error) {
                    alert('Failed to delete warning: ' + (error.response?.data?.message || error.message))
                }
            }
        },
        getWarningStyle(type) {
            const colors = {
                flood: 'background:linear-gradient(135deg, #0066cc, #003d80);',
                wildfire: 'background:linear-gradient(135deg, #cc3300, #801f00);',
                locust_swarm: 'background:linear-gradient(135deg, #8B6914, #5c4510);',
                general: 'background:linear-gradient(135deg, #666666, #333333);'
            }
            return (colors[type] || colors.general) + 'padding:25px;border-radius:12px;color:white;display:flex;flex-direction:column;'
        },
        getWarningIcon(type) {
            const icons = { flood: '🌊', wildfire: '🔥', locust_swarm: '🦗', general: '⚠️' }
            return icons[type] || '⚠️'
        },
        getWarningLabel(type) {
            const labels = { flood: 'Flood Warning', wildfire: 'Fire Danger', locust_swarm: 'Pest Alert', general: 'General Warning' }
            return labels[type] || 'Warning'
        },
        formatDate(date) {
            return new Date(date).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            })
        }
    }
}
</script>