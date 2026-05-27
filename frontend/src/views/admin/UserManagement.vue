<template>
    <div class="user-management">
        <div class="page-header">
            <h1>👥 User Management</h1>
            
            <div class="header-actions">
                <select v-model="userType" class="form-control">
                    <option value="branch_admin">Branch Admins</option>
                    <option value="da">Development Agents</option>
                    <option value="sms">SMSs</option>
                    <option value="farmer">Farmers</option>
                </select>
                
                <button v-if="canCreate" @click="showCreateForm = true" class="btn btn-primary">
                    + Add User
                </button>
            </div>
        </div>

        <!-- Create User Form -->
        <div v-if="showCreateForm" class="card">
            <h2>Create {{ userType.replace('_', ' ').toUpperCase() }} Account</h2>
            <form @submit.prevent="createUser">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">First Name *</label>
                        <input type="text" v-model="createForm.first_name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name *</label>
                        <input type="text" v-model="createForm.last_name" class="form-control" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Phone Number *</label>
                        <input type="text" v-model="createForm.phone_number" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password *</label>
                        <input type="password" v-model="createForm.password" class="form-control" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Sex *</label>
                        <select v-model="createForm.sex" class="form-control" required>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group" v-if="isSuperAdmin && ['branch_admin', 'da', 'sms'].includes(userType)">
                        <label class="form-label">Branch *</label>
                        <select v-model="createForm.branch_id" class="form-control" required>
                            <option value="" disabled selected>Select a branch</option>
                            <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                                {{ branch.branch_name }}
                            </option>
                        </select>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary">Create Account</button>
                <button type="button" @click="showCreateForm = false" class="btn btn-secondary">Cancel</button>
            </form>
        </div>

        <!-- Users Table -->
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Sex</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="userEntry in users" :key="userEntry.id">
                        <td>{{ userEntry.first_name }} {{ userEntry.last_name }}</td>
                        <td>{{ userEntry.phone_number }}</td>
                        <td>{{ userEntry.email || 'N/A' }}</td>
                        <td>{{ userEntry.sex }}</td>
                        <td>
                            <span :class="['badge', userEntry.status === 'active' ? 'badge-success' : 'badge-warning']">
                                {{ userEntry.status }}
                            </span>
                        </td>
                        <td>
                            <button @click="editingUser = { ...userEntry }" class="btn btn-sm btn-warning">Edit</button>
                            <button @click="deleteUser(userEntry)" class="btn btn-sm btn-danger">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Edit Modal -->
        <div v-if="editingUser" class="modal-overlay" @click.self="editingUser = null">
            <div class="modal">
                <div class="modal-header">
                    <h2>Edit User</h2>
                    <button @click="editingUser = null" class="modal-close">&times;</button>
                </div>
                <form @submit.prevent="updateUser">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">First Name</label>
                            <input type="text" v-model="editingUser.first_name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Last Name</label>
                            <input type="text" v-model="editingUser.last_name" class="form-control" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phone Number</label>
                        <input type="text" v-model="editingUser.phone_number" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" v-model="editingUser.email" class="form-control">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select v-model="editingUser.status" class="form-control">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Update User</button>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'UserManagement',
    data() {
        return {
            userType: 'branch_admin',
            users: [],
            branches: [],
            showCreateForm: false,
            editingUser: null,
            createForm: {
                first_name: '',
                last_name: '',
                phone_number: '',
                password: '',
                sex: 'Male',
                branch_id: null
            }
        }
    },
    computed: {
        isSuperAdmin() {
            return JSON.parse(localStorage.getItem('user') || '{}').role === 'super_admin'
        },
        canCreate() {
            if (this.isSuperAdmin) return ['branch_admin', 'da', 'sms'].includes(this.userType)
            return ['da', 'sms'].includes(this.userType)
        }
    },
    watch: {
        userType() {
            this.fetchUsers()
        }
    },
    async mounted() {
        await this.fetchBranches()
        await this.fetchUsers()
    },
    methods: {
        async fetchBranches() {
            try {
                const response = await axios.get('/branches')
                this.branches = response.data.data
            } catch (error) {
                console.error('Failed to fetch branches:', error)
            }
        },
        async fetchUsers() {
            try {
                const endpoints = {
                    'branch_admin': '/users/branch-admins',
                    'da': '/users/das',
                    'sms': '/users/sms',
                    'farmer': '/users/farmers'
                }
                const response = await axios.get(endpoints[this.userType])
                this.users = response.data.data
            } catch (error) {
                console.error('Failed to fetch users:', error)
            }
        },
        async createUser() {
            try {
                const endpoints = {
                    'branch_admin': '/users/branch-admins',
                    'da': '/users/das',
                    'sms': '/users/sms'
                }
                await axios.post(endpoints[this.userType], this.createForm)
                this.showCreateForm = false
                this.createForm = {
                    first_name: '', last_name: '', phone_number: '',
                    password: '', sex: 'Male', branch_id: null
                }
                await this.fetchUsers()
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to create user')
            }
        },
        async updateUser() {
            try {
                const endpoints = {
                    'branch_admin': '/users/branch-admins',
                    'da': '/users/das',
                    'sms': '/users/sms',
                    'farmer': '/users/farmers'
                }
                await axios.put(`${endpoints[this.userType]}/${this.editingUser.id}`, this.editingUser)
                this.editingUser = null
                await this.fetchUsers()
            } catch (error) {
                alert('Failed to update user: ' + (error.response?.data?.message || error.message))
            }
        },
        async deleteUser(user) {
            if (confirm(`Delete user: ${user.first_name} ${user.last_name}?`)) {
                try {
                    const endpoints = {
                        'branch_admin': '/users/branch-admins',
                        'da': '/users/das',
                        'sms': '/users/sms',
                        'farmer': '/users/farmers'
                    }
                    await axios.delete(`${endpoints[this.userType]}/${user.id}`)
                    await this.fetchUsers()
                } catch (error) {
                    alert('Failed to delete user: ' + (error.response?.data?.message || error.message))
                }
            }
        }
    }
}
</script>

<style scoped>
.user-management { max-width: 1200px; margin: 0 auto; padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.header-actions { display: flex; gap: 15px; }
.header-actions select { width: 200px; }
.card { margin-bottom: 30px; }
</style>