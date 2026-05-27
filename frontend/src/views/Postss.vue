<template>
    <div class="posts-page">
        <div class="page-header">
            <h1>Agricultural Information</h1>
            
            <div class="header-actions">
                <div class="search-box">
                    <input type="text" v-model="searchQuery" @input="searchPosts" 
                           placeholder="Search posts..." class="form-control">
                    <span class="search-icon">🔍</span>
                </div>
                
                <button v-if="isSuperAdmin" @click="showCreateForm = true" class="btn btn-primary">
                    + New Post
                </button>
            </div>
        </div>

        <!-- Create Post Form -->
        <div v-if="showCreateForm" class="card create-post-card">
            <h2>Create New Post</h2>
            <form @submit.prevent="createPost">
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" v-model="newPost.title" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Content *</label>
                    <textarea v-model="newPost.content" class="form-control" rows="5" required></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Post Type</label>
                        <select v-model="newPost.post_type" class="form-control">
                            <option value="information">Information</option>
                            <option value="warning">Warning Alert</option>
                        </select>
                    </div>
                    
                    <div class="form-group" v-if="newPost.post_type === 'warning'">
                        <label class="form-label">Warning Type</label>
                        <select v-model="newPost.warning_type" class="form-control">
                            <option value="flood">🌊 Flood</option>
                            <option value="wildfire">🔥 Wildfire</option>
                            <option value="locust_swarm">🦗 Locust Swarm</option>
                            <option value="general">⚠️ General</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-buttons">
                    <button type="submit" class="btn btn-primary" :disabled="creating">
                        {{ creating ? 'Posting...' : 'Post Information' }}
                    </button>
                    <button type="button" class="btn btn-secondary" @click="showCreateForm = false">
                        Cancel
                    </button>
                </div>
            </form>
        </div>

        <!-- Edit Post Form -->
        <div v-if="editingPost" class="card create-post-card">
            <h2>Edit Post</h2>
            <form @submit.prevent="updatePost">
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" v-model="editingPost.title" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Content *</label>
                    <textarea v-model="editingPost.content" class="form-control" rows="5" required></textarea>
                </div>
                
                <div class="form-buttons">
                    <button type="submit" class="btn btn-primary">Update Post</button>
                    <button type="button" class="btn btn-secondary" @click="editingPost = null">
                        Cancel
                    </button>
                </div>
            </form>
        </div>

        <!-- Posts List -->
        <div v-if="loading" class="spinner"></div>
        
        <div v-else-if="posts.length === 0" class="empty-state">
            <p>No posts found.</p>
        </div>

        <div v-else class="posts-grid">
            <div v-for="post in posts" :key="post.id" :class="['post-card', post.post_type]">
                <div class="post-header">
                    <h3>{{ post.title }}</h3>
                    <span v-if="post.post_type === 'warning'" class="warning-badge">
                        ⚠️ {{ post.warning_type?.replace('_', ' ') }}
                    </span>
                </div>
                
                <p class="post-content">{{ post.content }}</p>
                
                <div class="post-meta">
                    <span>By: {{ post.first_name }} {{ post.last_name }}</span>
                    <span>{{ formatDate(post.created_at) }}</span>
                </div>
                
                <div class="post-actions">
                    <button @click="viewPost(post)" class="btn btn-sm btn-info">View</button>
                    
                    <template v-if="isSuperAdmin">
                        <button @click="editingPost = { ...post }" class="btn btn-sm btn-warning">Edit</button>
                        <button @click="confirmDelete(post)" class="btn btn-sm btn-danger">Delete</button>
                    </template>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
            <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1" class="btn btn-sm">
                Previous
            </button>
            <span>Page {{ currentPage }} of {{ totalPages }}</span>
            <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages" class="btn btn-sm">
                Next
            </button>
        </div>

        <!-- View Post Modal -->
        <div v-if="selectedPost" class="modal-overlay" @click.self="selectedPost = null">
            <div class="modal">
                <div class="modal-header">
                    <h2>{{ selectedPost.title }}</h2>
                    <button @click="selectedPost = null" class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>{{ selectedPost.content }}</p>
                    
                    <hr>
                    
                    <h3>Private Comments</h3>
                    <div v-for="comment in comments" :key="comment.id" class="comment-card">
                        <strong>{{ comment.first_name }} {{ comment.last_name }}</strong>
                        <p>{{ comment.comment }}</p>
                        <small>{{ formatDate(comment.created_at) }}</small>
                    </div>
                    
                    <div class="comment-form">
                        <textarea v-model="newComment" placeholder="Add a private comment..." 
                                  class="form-control" rows="3"></textarea>
                        <button @click="addComment" class="btn btn-primary mt-1">Send Comment</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import { mapGetters } from 'vuex'

export default {
    name: 'Posts',
    data() {
        return {
            posts: [],
            loading: true,
            searchQuery: '',
            currentPage: 1,
            totalPages: 1,
            showCreateForm: false,
            creating: false,
            newPost: {
                title: '',
                content: '',
                post_type: 'information',
                warning_type: null
            },
            editingPost: null,
            selectedPost: null,
            comments: [],
            newComment: ''
        }
    },
    computed: {
        ...mapGetters(['isSuperAdmin'])
    },
    async mounted() {
        await this.fetchPosts()
    },
    methods: {
        async fetchPosts() {
            this.loading = true
            try {
                const response = await axios.get('/posts', {
                    params: { page: this.currentPage, limit: 10 }
                })
                this.posts = response.data.data
                this.totalPages = response.data.pagination.pages
            } catch (error) {
                console.error('Failed to fetch posts:', error)
            } finally {
                this.loading = false
            }
        },

        async searchPosts() {
            if (!this.searchQuery.trim()) {
                await this.fetchPosts()
                return
            }
            try {
                const response = await axios.get('/posts/search', {
                    params: { query: this.searchQuery }
                })
                this.posts = response.data.data
            } catch (error) {
                console.error('Search failed:', error)
            }
        },

        async createPost() {
            this.creating = true
            try {
                await axios.post('/posts', this.newPost)
                this.showCreateForm = false
                this.newPost = { title: '', content: '', post_type: 'information', warning_type: null }
                await this.fetchPosts()
            } catch (error) {
                alert('Failed to create post: ' + (error.response?.data?.message || error.message))
            } finally {
                this.creating = false
            }
        },

        async updatePost() {
            try {
                await axios.put(`/posts/${this.editingPost.id}`, this.editingPost)
                this.editingPost = null
                await this.fetchPosts()
            } catch (error) {
                alert('Failed to update post')
            }
        },

        async confirmDelete(post) {
            if (confirm(`Delete post: "${post.title}"?`)) {
                try {
                    await axios.delete(`/posts/${post.id}`)
                    await this.fetchPosts()
                } catch (error) {
                    alert('Failed to delete post')
                }
            }
        },

        async viewPost(post) {
            this.selectedPost = post
            try {
                const response = await axios.get(`/posts/${post.id}/comments`)
                this.comments = response.data.data
            } catch (error) {
                console.error('Failed to fetch comments:', error)
            }
        },

        async addComment() {
            if (!this.newComment.trim()) return
            try {
                await axios.post(`/posts/${this.selectedPost.id}/comments`, {
                    comment: this.newComment
                })
                this.newComment = ''
                const response = await axios.get(`/posts/${this.selectedPost.id}/comments`)
                this.comments = response.data.data
            } catch (error) {
                alert('Failed to add comment')
            }
        },

        changePage(page) {
            this.currentPage = page
            this.fetchPosts()
        },

        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            })
        }
    }
}
</script>

<style scoped>
.posts-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    flex-wrap: wrap;
    gap: 20px;
}

.header-actions {
    display: flex;
    gap: 15px;
    align-items: center;
}

.search-box {
    position: relative;
}

.search-box input {
    padding-left: 35px;
    width: 300px;
}

.search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
}

.posts-grid {
    display: grid;
    gap: 20px;
}

.post-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-left: 4px solid #2d6a4f;
}

.post-card.warning {
    border-left-color: #d62828;
    background: #fff5f5;
}

.post-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 10px;
}

.warning-badge {
    background: #d62828;
    color: white;
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 12px;
    text-transform: uppercase;
}

.post-content {
    color: #666;
    line-height: 1.6;
    margin-bottom: 15px;
}

.post-meta {
    display: flex;
    justify-content: space-between;
    color: #999;
    font-size: 14px;
    margin-bottom: 15px;
}

.post-actions {
    display: flex;
    gap: 10px;
}

.create-post-card {
    margin-bottom: 30px;
}

.form-buttons {
    display: flex;
    gap: 10px;
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-top: 30px;
}

.empty-state {
    text-align: center;
    padding: 50px;
    color: #999;
}

.comment-card {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 10px;
}
</style>