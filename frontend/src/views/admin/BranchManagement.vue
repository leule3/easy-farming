<template>
    <div class="branch-management">
        <div class="page-header">
            <h1>🏢 Branch Management</h1>
            <button @click="showCreateForm = true" class="btn btn-primary">+ Add Branch</button>
        </div>

        <!-- Create Branch Form -->
        <div v-if="showCreateForm" class="card">
            <h2>Create New Branch</h2>
            <form @submit.prevent="createBranch">
                <div class="form-group">
                    <label class="form-label">Branch Name *</label>
                    <input type="text" v-model="form.branch_name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Location *</label>
                    <input type="text" v-model="form.location" class="form-control" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Region</label>
                        <input type="text" v-model="form.region" class="form-control">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Woreda</label>
                        <input type="text" v-model="form.woreda" class="form-control">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">Create Branch</button>
                <button type="button" @click="showCreateForm = false" class="btn btn-secondary">Cancel</button>
            </form>
        </div>

        <!-- Branches Table -->
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Branch Name</th>
                        <th>Location</th>
                        <th>Region</th>
                        <th>Woreda</th>
                        <th>DAs</th>
                        <th>SMSs</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="branch in branches" :key="branch.id">
                        <td>{{ branch.branch_name }}</td>
                        <td>{{ branch.location }}</td>
                        <td>{{ branch.region || 'N/A' }}</td>
                        <td>{{ branch.woreda || 'N/A' }}</td>
                        <td>{{ branch.da_count }}</td>
                        <td>{{ branch.sms_count }}</td>
                        <td>
                            <button @click="editingBranch = { ...branch }" class="btn btn-sm btn-warning">Edit</button>
                            <button @click="deleteBranch(branch)" class="btn btn-sm btn-danger">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Edit Modal -->
        <div v-if="editingBranch" class="modal-overlay" @click.self="editingBranch = null">
            <div class="modal">
                <div class="modal-header">
                    <h2>Edit Branch</h2>
                    <button @click="editingBranch = null" class="modal-close">&times;</button>
                </div>
                <form @submit.prevent="updateBranch">
                    <div class="form-group">
                        <label class="form-label">Branch Name</label>
                        <input type="text" v-model="editingBranch.branch_name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Location</label>
                        <input type="text" v-model="editingBranch.location" class="form-control" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Region</label>
                            <input type="text" v-model="editingBranch.region" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Woreda</label>
                            <input type="text" v-model="editingBranch.woreda" class="form-control">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Update Branch</button>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'BranchManagement',
    data() {
        return {
            branches: [],
            showCreateForm: false,
            editingBranch: null,
            form: {
                branch_name: '',
                location: '',
                region: '',
                woreda: ''
            }
        }
    },
    async mounted() {
        await this.fetchBranches()
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
        async createBranch() {
            try {
                await axios.post('/branches', this.form)
                this.showCreateForm = false
                this.form = { branch_name: '', location: '', region: '', woreda: '' }
                await this.fetchBranches()
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to create branch')
            }
        },
        async updateBranch() {
            try {
                await axios.put(`/branches/${this.editingBranch.id}`, this.editingBranch)
                this.editingBranch = null
                await this.fetchBranches()
            } catch (error) {
                alert('Failed to update branch')
            }
        },
        async deleteBranch(branch) {
            if (confirm(`Delete branch "${branch.branch_name}"?`)) {
                try {
                    await axios.delete(`/branches/${branch.id}`)
                    await this.fetchBranches()
                } catch (error) {
                    alert(error.response?.data?.message || 'Failed to delete branch')
                }
            }
        }
    }
}
</script>