<template>
    <div class="profile-page">
        <div class="profile-header">
            <div class="profile-avatar">
                {{ userInitials }}
            </div>
            <h1>{{ user.first_name }} {{ user.last_name }}</h1>
            <span :class="['role-badge', user.role]">{{ user.role.replace('_', ' ').toUpperCase() }}</span>
        </div>

        <div class="profile-content">
            <div class="card">
                <h2>Profile Information</h2>
                
                <div v-if="editing" class="profile-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">First Name</label>
                            <input type="text" v-model="editForm.first_name" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Last Name</label>
                            <input type="text" v-model="editForm.last_name" class="form-control">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Phone Number</label>
                        <input type="text" :value="user.phone_number" class="form-control" disabled>
                        <small>Phone number cannot be changed</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" v-model="editForm.email" class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Sex</label>
                        <input type="text" :value="user.sex" class="form-control" disabled>
                    </div>
                    
                    <div class="form-buttons">
                        <button @click="updateProfile" class="btn btn-primary" :disabled="saving">
                            {{ saving ? 'Saving...' : 'Save Changes' }}
                        </button>
                        <button @click="editing = false" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
                
                <div v-else class="profile-details">
                    <div class="detail-row">
                        <span class="detail-label">Full Name:</span>
                        <span>{{ user.first_name }} {{ user.last_name }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Phone:</span>
                        <span>{{ user.phone_number }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span>{{ user.email || 'Not set' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Sex:</span>
                        <span>{{ user.sex }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Role:</span>
                        <span>{{ user.role.replace('_', ' ').toUpperCase() }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Member Since:</span>
                        <span>{{ formatDate(user.created_at) }}</span>
                    </div>
                    
                    <button @click="startEditing" class="btn btn-primary mt-2">Edit Profile</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Profile',
    data() {
        return {
            user: JSON.parse(localStorage.getItem('user') || '{}'),
            editing: false,
            saving: false,
            editForm: {
                first_name: '',
                last_name: '',
                email: ''
            }
        }
    },
    computed: {
        userInitials() {
            if (!this.user.first_name) return '?'
            return (this.user.first_name[0] + (this.user.last_name?.[0] || '')).toUpperCase()
        }
    },
    methods: {
        startEditing() {
            this.editForm = {
                first_name: this.user.first_name,
                last_name: this.user.last_name,
                email: this.user.email || ''
            }
            this.editing = true
        },
        async updateProfile() {
            this.saving = true
            try {
                const response = await axios.put('/auth/profile', this.editForm)
                if (response.data.success) {
                    this.user.first_name = this.editForm.first_name
                    this.user.last_name = this.editForm.last_name
                    this.user.email = this.editForm.email
                    localStorage.setItem('user', JSON.stringify(this.user))
                    this.editing = false
                    alert('Profile updated successfully')
                }
            } catch (error) {
                alert('Failed to update profile')
            } finally {
                this.saving = false
            }
        },
        formatDate(dateString) {
            if (!dateString) return 'N/A'
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            })
        }
    }
}
</script>

<style scoped>
.profile-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.profile-header {
    text-align: center;
    margin-bottom: 30px;
}

.profile-avatar {
    width: 100px;
    height: 100px;
    background: #2d6a4f;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    font-weight: 700;
    margin: 0 auto 15px;
}

.role-badge {
    display: inline-block;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    background: #2d6a4f;
    color: white;
    margin-top: 10px;
}

.detail-row {
    display: flex;
    padding: 12px 0;
    border-bottom: 1px solid #eee;
}

.detail-label {
    font-weight: 600;
    width: 150px;
    color: #666;
}

.form-buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}
</style>