<template>
    <div class="forum-container">
        <div class="forum-header">
            <h1>Discussion Forum</h1>
            <button @click="showNewDiscussion = true" class="btn btn-primary">Start New Discussion</button>
        </div>

        <!-- New Discussion Form -->
        <div v-if="showNewDiscussion" class="new-discussion-form">
            <h2>Start a New Discussion</h2>
            <input type="text" v-model="newDiscussion.title" placeholder="Discussion title" class="form-control" required>
            <textarea v-model="newDiscussion.content" placeholder="Describe your question or topic..." class="form-control" rows="5" required></textarea>
            <div class="form-buttons">
                <button @click="createDiscussion" class="btn btn-primary">Post Discussion</button>
                <button @click="showNewDiscussion = false" class="btn btn-secondary">Cancel</button>
            </div>
        </div>

        <!-- Discussions List -->
        <div class="discussions-list">
            <div v-for="discussion in discussions" :key="discussion.id" class="discussion-card">
                <div class="discussion-main" @click="viewDiscussion(discussion)">
                    <h3>{{ discussion.title }}</h3>
                    <p>{{ discussion.content.substring(0, 200) }}...</p>
                    <div class="discussion-meta">
                        <span>By: {{ discussion.first_name }} {{ discussion.last_name }} ({{ discussion.role }})</span>
                        <span>{{ discussion.reply_count }} replies</span>
                        <span>{{ formatDate(discussion.created_at) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Discussion Detail Modal -->
        <div v-if="selectedDiscussion" class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>{{ selectedDiscussion.title }}</h2>
                    <button @click="selectedDiscussion = null" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="discussion-content">{{ selectedDiscussion.content }}</p>
                    <hr>
                    <h3>Replies ({{ replies.length }})</h3>
                    <div v-for="reply in replies" :key="reply.id" class="reply-card">
                        <div class="reply-header">
                            <strong>{{ reply.first_name }} {{ reply.last_name }}</strong>
                            <small>{{ reply.role }} - {{ formatDate(reply.created_at) }}</small>
                        </div>
                        <p>{{ reply.reply }}</p>
                    </div>
                    
                    <!-- Reply Form -->
                    <div class="reply-form">
                        <textarea v-model="newReply" placeholder="Write your reply..." class="form-control" rows="3"></textarea>
                        <button @click="addReply" class="btn btn-primary">Reply</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Forum',
    data() {
        return {
            discussions: [],
            showNewDiscussion: false,
            newDiscussion: { title: '', content: '' },
            selectedDiscussion: null,
            replies: [],
            newReply: ''
        }
    },
    async mounted() {
        await this.fetchDiscussions()
    },
    methods: {
        async fetchDiscussions() {
            try {
                const response = await axios.get('/forum/discussions')
                this.discussions = response.data.data
            } catch (error) {
                console.error('Failed to fetch discussions:', error)
            }
        },
        async createDiscussion() {
            try {
                await axios.post('/forum/discussions', this.newDiscussion)
                this.showNewDiscussion = false
                this.newDiscussion = { title: '', content: '' }
                await this.fetchDiscussions()
            } catch (error) {
                alert('Failed to create discussion')
            }
        },
        async viewDiscussion(discussion) {
            try {
                const response = await axios.get(`/forum/discussions/${discussion.id}`)
                this.selectedDiscussion = response.data.discussion
                this.replies = response.data.replies
            } catch (error) {
                console.error('Failed to view discussion:', error)
            }
        },
        async addReply() {
            if (!this.newReply.trim()) return
            
            try {
                await axios.post(`/forum/discussions/${this.selectedDiscussion.id}/replies`, {
                    reply: this.newReply
                })
                this.newReply = ''
                // Refresh discussion
                const response = await axios.get(`/forum/discussions/${this.selectedDiscussion.id}`)
                this.replies = response.data.replies
            } catch (error) {
                alert('Failed to add reply')
            }
        },
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString()
        }
    }
}
</script>

<style scoped>
.forum-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
}

.forum-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.discussions-list {
    display: grid;
    gap: 15px;
}

.discussion-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    cursor: pointer;
    transition: box-shadow 0.3s;
}

.discussion-card:hover {
    box-shadow: 0 3px 10px rgba(0,0,0,0.1);
}

.discussion-meta {
    display: flex;
    gap: 20px;
    color: #666;
    font-size: 0.9em;
    margin-top: 10px;
}

.new-discussion-form {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.new-discussion-form input,
.new-discussion-form textarea {
    margin-bottom: 10px;
    width: 100%;
}

.form-buttons {
    display: flex;
    gap: 10px;
}

.btn-secondary {
    background: #6c757d;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal {
    background: white;
    border-radius: 10px;
    width: 90%;
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #ddd;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
}

.modal-body {
    padding: 20px;
}

.reply-card {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 10px;
}

.reply-form {
    margin-top: 20px;
}

.reply-form textarea {
    margin-bottom: 10px;
}
</style>