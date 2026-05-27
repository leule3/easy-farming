<template>
    <div style="max-width:1000px;margin:50px auto;padding:30px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;">
            <h1 style="color:#1b4332;">📄 {{ $t('posts.title') }}</h1>
            
            <div style="display:flex;gap:15px;">
                <input type="text" v-model="searchQuery" @input="searchPosts" 
                       :placeholder="$t('posts.search')" 
                       style="padding:10px 15px;border:2px solid #ddd;border-radius:8px;font-size:14px;width:250px;">
                
                <button v-if="isSuperAdmin" @click="showCreateForm = !showCreateForm" 
                        style="padding:12px 24px;background:#2d6a4f;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">
                    + {{ $t('posts.new_post') }}
                </button>
            </div>
        </div>

        <!-- Create Post Form -->
        <div v-if="showCreateForm && isSuperAdmin" style="background:white;padding:25px;border-radius:12px;margin-bottom:25px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="margin-bottom:20px;">{{ $t('posts.create_title') }}</h2>
            <form @submit.prevent="createPost">
                <input type="text" v-model="newPost.title" :placeholder="$t('posts.post_title')" required
                       style="width:100%;padding:10px;border:2px solid #ddd;border-radius:8px;margin-bottom:15px;font-size:14px;">
                
                <textarea v-model="newPost.content" :placeholder="$t('posts.post_content')" required rows="5"
                          style="width:100%;padding:10px;border:2px solid #ddd;border-radius:8px;margin-bottom:15px;"></textarea>
                
                <div style="display:flex;gap:15px;margin-bottom:15px;">
                    <select v-model="newPost.post_type" 
                            style="padding:10px;border:2px solid #ddd;border-radius:8px;">
                        <option value="information">{{ $t('posts.type_info') }}</option>
                        <option value="warning">⚠️ {{ $t('posts.type_warning') }}</option>
                    </select>
                    
                    <select v-if="newPost.post_type === 'warning'" v-model="newPost.warning_type"
                            style="padding:10px;border:2px solid #ddd;border-radius:8px;">
                        <option value="flood">🌊 {{ $t('posts.warn_flood') }}</option>
                        <option value="wildfire">🔥 {{ $t('posts.warn_wildfire') }}</option>
                        <option value="locust_swarm">🦗 {{ $t('posts.warn_locust') }}</option>
                        <option value="general">⚠️ {{ $t('posts.warn_general') }}</option>
                    </select>
                </div>
                
                <button type="submit" :disabled="creating"
                        style="padding:12px 24px;background:#2d6a4f;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:700;">
                    {{ creating ? $t('posts.btn_posting') : $t('posts.btn_post') }}
                </button>
                <button type="button" @click="showCreateForm = false"
                        style="padding:12px 24px;background:#6c757d;color:white;border:none;border-radius:8px;cursor:pointer;margin-left:10px;">
                    {{ $t('posts.btn_cancel') }}
                </button>
            </form>
        </div>

        <!-- Posts List -->
        <div v-if="loading" style="text-align:center;padding:50px;">Loading posts...</div>
        
        <div v-else-if="posts.length === 0" style="text-align:center;padding:50px;color:#999;">
            No posts found.
        </div>

        <div v-else v-for="post in posts" :key="post.id" 
             :style="'background:white;padding:20px;border-radius:12px;margin-bottom:15px;box-shadow:0 2px 10px rgba(0,0,0,0.05);border-left:4px solid ' + (post.post_type === 'warning' ? '#d62828' : '#2d6a4f')">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <h3>{{ post.title }}</h3>
                <span v-if="post.post_type === 'warning'" 
                      style="background:#d62828;color:white;padding:3px 10px;border-radius:15px;font-size:12px;">
                    ⚠️ {{ post.warning_type?.replace('_', ' ') }}
                </span>
            </div>
            <p style="color:#666;margin:10px 0;">{{ post.content?.substring(0, 300) }}...</p>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <small style="color:#999;">By: {{ post.first_name }} {{ post.last_name }} | {{ formatDate(post.created_at) }}</small>
                <button v-if="isSuperAdmin" @click="deletePost(post.id)" 
                        style="padding:6px 12px;background:#d62828;color:white;border:none;border-radius:5px;cursor:pointer;font-size:12px;font-weight:bold;">
                    🗑️ {{ $t('posts.delete') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Posts',
    data() {
        return {
            posts: [],
            loading: true,
            searchQuery: '',
            showCreateForm: false,
            creating: false,
            newPost: {
                title: '',
                content: '',
                post_type: 'information',
                warning_type: null
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
        await this.fetchPosts()
    },
    methods: {
        async fetchPosts() {
            this.loading = true
            try {
                const response = await axios.get('/posts')
                this.posts = response.data.data
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
                const response = await axios.get(`/posts/search?query=${this.searchQuery}`)
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
        async deletePost(id) {
            if (confirm(this.$t('posts.confirm_delete'))) {
                try {
                    await axios.delete(`/posts/${id}`)
                    await this.fetchPosts()
                } catch (error) {
                    alert('Failed to delete post: ' + (error.response?.data?.message || error.message))
                }
            }
        },
        formatDate(date) {
            return new Date(date).toLocaleDateString()
        }
    }
}
</script>