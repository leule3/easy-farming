<template>
    <div class="forum-container animate-fade-in">
        <!-- Forum Header Showcase -->
        <header class="forum-header">
            <div class="header-overlay-glow"></div>
            <div class="header-content">
                <h1>💬 Easy Farming Discussion Forum</h1>
                <p>Collaborate with farmers, DAs, Subject Matter Specialists, and administrators. Share questions, knowledge, and advice.</p>
            </div>
            <button @click="openNewDiscussionForm" class="btn btn-primary start-discussion-btn">
                <span>➕ Start New Discussion</span>
            </button>
        </header>

        <!-- New Discussion Form Card -->
        <transition name="slide-fade">
            <div v-if="showNewDiscussion" class="new-discussion-card">
                <div class="card-header">
                    <h2>🌱 Open a New Topic</h2>
                    <span class="close-card-btn" @click="showNewDiscussion = false">&times;</span>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">Discussion Title</label>
                        <input 
                            type="text" 
                            v-model="newDiscussion.title" 
                            placeholder="What would you like to discuss? Be specific..." 
                            class="form-control" 
                            required
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">Topic Content</label>
                        <textarea 
                            v-model="newDiscussion.content" 
                            placeholder="Provide deep details, ask your questions, or outline your farming findings..." 
                            class="form-control" 
                            rows="6" 
                            required
                        ></textarea>
                    </div>
                    <div class="form-buttons">
                        <button @click="createDiscussion" class="btn btn-primary" :disabled="!newDiscussion.title.trim() || !newDiscussion.content.trim()">
                            🚀 Post Discussion
                        </button>
                        <button @click="showNewDiscussion = false" class="btn btn-secondary">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Search and Info Bar -->
        <div class="forum-filter-bar">
            <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input 
                    type="text" 
                    v-model="searchQuery" 
                    placeholder="Search discussions by title, content, author, or role..." 
                    class="form-control forum-search-input"
                >
                <span v-if="searchQuery" class="clear-search" @click="searchQuery = ''">&times;</span>
            </div>
            <div class="discussion-count">
                Showing <strong>{{ filteredDiscussions.length }}</strong> of {{ discussions.length }} topics
            </div>
        </div>

        <!-- Discussions List Grid -->
        <div v-if="filteredDiscussions.length > 0" class="discussions-list">
            <div 
                v-for="discussion in filteredDiscussions" 
                :key="discussion.id" 
                class="discussion-card"
                @click="viewDiscussion(discussion)"
            >
                <div class="discussion-accent"></div>
                <div class="discussion-card-body">
                    <div class="discussion-top">
                        <span class="author-avatar">{{ discussion.first_name[0] }}</span>
                        <div class="author-info">
                            <h4>{{ discussion.first_name }} {{ discussion.last_name }}</h4>
                            <span class="badge" :class="getRoleClass(discussion.role)">{{ discussion.role.replace('_', ' ') }}</span>
                        </div>
                        <span class="discussion-date">{{ formatDate(discussion.created_at) }}</span>
                    </div>
                    <h3 class="discussion-title">{{ discussion.title }}</h3>
                    <p class="discussion-snippet">{{ discussion.content.substring(0, 160) }}<span v-if="discussion.content.length > 160">...</span></p>
                    
                    <div class="discussion-meta-footer">
                        <span class="reply-badge">
                            💬 <strong>{{ discussion.reply_count }}</strong> replies
                        </span>
                        
                        <!-- Owner/Admin Quick Controls -->
                        <div class="quick-card-actions" @click.stop>
                            <button 
                                v-if="discussion.user_id === currentUser.id" 
                                @click="editDiscussionFromList(discussion)" 
                                class="action-btn edit-btn-small" 
                                title="Edit Topic"
                            >
                                ✏️
                            </button>
                            <button 
                                v-if="discussion.user_id === currentUser.id || currentUser.role === 'super_admin'" 
                                @click="deleteDiscussion(discussion.id)" 
                                class="action-btn delete-btn-small" 
                                title="Delete Topic"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="empty-forum-state">
            <div class="empty-icon">🌾</div>
            <h3>No Discussions Found</h3>
            <p v-if="searchQuery">We couldn't find any discussions matching your search terms. Try refining your keywords.</p>
            <p v-else>Be the first one to start a collaborative discussion in the Easy Farming community!</p>
            <button v-if="searchQuery" @click="searchQuery = ''" class="btn btn-secondary mt-1">Clear Filters</button>
        </div>

        <!-- Discussion Detail Glassmorphic Modal -->
        <transition name="fade">
            <div v-if="selectedDiscussion" class="modal-overlay" @click="closeDiscussionModal">
                <div class="modal-card animate-zoom" @click.stop>
                    <div class="modal-card-header">
                        <div class="header-author-details">
                            <span class="avatar-large">{{ selectedDiscussion.first_name[0] }}</span>
                            <div>
                                <h2>{{ selectedDiscussion.first_name }} {{ selectedDiscussion.last_name }}</h2>
                                <span class="badge" :class="getRoleClass(selectedDiscussion.role)">{{ selectedDiscussion.role.replace('_', ' ') }}</span>
                            </div>
                        </div>
                        <div class="header-actions">
                            <button 
                                v-if="selectedDiscussion.user_id === currentUser.id" 
                                @click="toggleEditDiscussion" 
                                class="btn btn-sm btn-info"
                            >
                                {{ isEditingDiscussion ? 'Cancel Edit' : '✏️ Edit' }}
                            </button>
                            <button 
                                v-if="selectedDiscussion.user_id === currentUser.id || currentUser.role === 'super_admin'" 
                                @click="deleteDiscussion(selectedDiscussion.id)" 
                                class="btn btn-sm btn-danger"
                            >
                                🗑️ Delete
                            </button>
                            <button @click="closeDiscussionModal" class="modal-close-btn">&times;</button>
                        </div>
                    </div>

                    <div class="modal-card-body">
                        <!-- Standard View Mode -->
                        <div v-if="!isEditingDiscussion" class="discussion-detail-content">
                            <h1 class="selected-title">{{ selectedDiscussion.title }}</h1>
                            <p class="selected-text">{{ selectedDiscussion.content }}</p>
                            <div class="post-timestamp">
                                Published on {{ formatDate(selectedDiscussion.created_at) }}
                            </div>
                        </div>

                        <!-- Edit Discussion Mode -->
                        <div v-else class="discussion-edit-form">
                            <div class="form-group">
                                <label class="form-label">Edit Title</label>
                                <input 
                                    type="text" 
                                    v-model="editDiscussionData.title" 
                                    class="form-control" 
                                    required
                                >
                            </div>
                            <div class="form-group">
                                <label class="form-label">Edit Content</label>
                                <textarea 
                                    v-model="editDiscussionData.content" 
                                    class="form-control" 
                                    rows="5" 
                                    required
                                ></textarea>
                            </div>
                            <div class="edit-form-buttons">
                                <button @click="updateDiscussion" class="btn btn-sm btn-primary">💾 Save Changes</button>
                                <button @click="isEditingDiscussion = false" class="btn btn-sm btn-secondary">Cancel</button>
                            </div>
                        </div>

                        <hr class="separator-line">

                        <!-- Replies Section -->
                        <div class="replies-section">
                            <h3>Comments & Replies ({{ replies.length }})</h3>
                            
                            <div v-if="replies.length > 0" class="replies-list">
                                <div v-for="reply in replies" :key="reply.id" class="reply-card">
                                    <div class="reply-card-header">
                                        <div class="reply-author">
                                            <strong>{{ reply.first_name }} {{ reply.last_name }}</strong>
                                            <span class="reply-role-badge" :class="getRoleClass(reply.role)">{{ reply.role }}</span>
                                        </div>
                                        <div class="reply-meta-right">
                                            <span class="reply-time">{{ formatDate(reply.created_at) }}</span>
                                            
                                            <!-- Edit/Delete Reply Actions -->
                                            <div class="reply-action-menu">
                                                <button 
                                                    v-if="reply.user_id === currentUser.id" 
                                                    @click="enableEditReply(reply)" 
                                                    class="reply-mini-action" 
                                                    title="Edit Reply"
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    v-if="reply.user_id === currentUser.id || currentUser.role === 'super_admin'" 
                                                    @click="deleteReply(reply.id)" 
                                                    class="reply-mini-action delete-act" 
                                                    title="Delete Reply"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Standard Reply View -->
                                    <div v-if="editingReplyId !== reply.id" class="reply-body">
                                        <p>{{ reply.reply }}</p>
                                    </div>

                                    <!-- Inline Edit Reply View -->
                                    <div v-else class="reply-edit-box">
                                        <textarea 
                                            v-model="editReplyText" 
                                            class="form-control mb-1" 
                                            rows="2"
                                        ></textarea>
                                        <div class="reply-edit-actions">
                                            <button @click="updateReply(reply.id)" class="btn btn-sm btn-primary py-1 px-2">Save</button>
                                            <button @click="editingReplyId = null" class="btn btn-sm btn-secondary py-1 px-2">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="empty-replies">
                                <p>No replies yet. Start the conversation below!</p>
                            </div>

                            <!-- Reply Form -->
                            <div class="reply-form-wrapper">
                                <h4>Add Your Reply</h4>
                                <form @submit.prevent="addReply" class="reply-form">
                                    <textarea 
                                        v-model="newReply" 
                                        placeholder="Add to the discussion... Share helpful context or ask a follow up question." 
                                        class="form-control" 
                                        rows="3"
                                        required
                                    ></textarea>
                                    <button type="submit" class="btn btn-primary submit-reply-btn" :disabled="!newReply.trim()">
                                        💬 Submit Reply
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Forum',
    data() {
        return {
            discussions: [],
            searchQuery: '',
            currentUser: JSON.parse(localStorage.getItem('user') || '{}'),
            showNewDiscussion: false,
            newDiscussion: { title: '', content: '' },
            selectedDiscussion: null,
            replies: [],
            newReply: '',
            
            // Discussion Editing State
            isEditingDiscussion: false,
            editDiscussionData: { title: '', content: '' },
            
            // Reply Editing State
            editingReplyId: null,
            editReplyText: ''
        }
    },
    computed: {
        filteredDiscussions() {
            if (!this.searchQuery.trim()) return this.discussions;
            const query = this.searchQuery.toLowerCase();
            return this.discussions.filter(d => 
                d.title.toLowerCase().includes(query) ||
                d.content.toLowerCase().includes(query) ||
                `${d.first_name} ${d.last_name}`.toLowerCase().includes(query) ||
                d.role.toLowerCase().includes(query)
            );
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
        openNewDiscussionForm() {
            this.showNewDiscussion = true;
            // Scroll to the form
            this.$nextTick(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        },
        async createDiscussion() {
            if (!this.newDiscussion.title.trim() || !this.newDiscussion.content.trim()) return;
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
                
                // Initialize edit form details
                this.editDiscussionData.title = this.selectedDiscussion.title;
                this.editDiscussionData.content = this.selectedDiscussion.content;
                this.isEditingDiscussion = false;
                this.editingReplyId = null;
            } catch (error) {
                console.error('Failed to view discussion:', error)
            }
        },
        closeDiscussionModal() {
            this.selectedDiscussion = null;
            this.isEditingDiscussion = false;
            this.editingReplyId = null;
        },
        toggleEditDiscussion() {
            this.isEditingDiscussion = !this.isEditingDiscussion;
            if (this.isEditingDiscussion && this.selectedDiscussion) {
                this.editDiscussionData.title = this.selectedDiscussion.title;
                this.editDiscussionData.content = this.selectedDiscussion.content;
            }
        },
        editDiscussionFromList(discussion) {
            this.viewDiscussion(discussion).then(() => {
                this.isEditingDiscussion = true;
            });
        },
        async updateDiscussion() {
            if (!this.editDiscussionData.title.trim() || !this.editDiscussionData.content.trim()) return;
            try {
                await axios.put(`/forum/discussions/${this.selectedDiscussion.id}`, this.editDiscussionData);
                this.selectedDiscussion.title = this.editDiscussionData.title;
                this.selectedDiscussion.content = this.editDiscussionData.content;
                this.isEditingDiscussion = false;
                await this.fetchDiscussions();
            } catch (error) {
                console.error('Failed to update discussion:', error);
                alert('Failed to update discussion');
            }
        },
        async deleteDiscussion(id) {
            if (!confirm('⚠️ Are you sure you want to permanently delete this discussion topic? All replies will be deleted too.')) return;
            try {
                await axios.delete(`/forum/discussions/${id}`);
                this.selectedDiscussion = null;
                await this.fetchDiscussions();
            } catch (error) {
                console.error('Failed to delete discussion:', error);
                alert('Failed to delete discussion');
            }
        },
        async addReply() {
            if (!this.newReply.trim()) return
            try {
                await axios.post(`/forum/discussions/${this.selectedDiscussion.id}/replies`, {
                    reply: this.newReply
                })
                this.newReply = ''
                
                // Refresh single discussion detail
                const response = await axios.get(`/forum/discussions/${this.selectedDiscussion.id}`)
                this.replies = response.data.replies
                
                // Update lists dynamically
                await this.fetchDiscussions()
            } catch (error) {
                alert('Failed to add reply')
            }
        },
        enableEditReply(reply) {
            this.editingReplyId = reply.id;
            this.editReplyText = reply.reply;
        },
        async updateReply(replyId) {
            if (!this.editReplyText.trim()) return;
            try {
                await axios.put(`/forum/replies/${replyId}`, { reply: this.editReplyText });
                
                // Refresh replies list
                const response = await axios.get(`/forum/discussions/${this.selectedDiscussion.id}`);
                this.replies = response.data.replies;
                this.editingReplyId = null;
            } catch (error) {
                console.error('Failed to edit reply:', error);
                alert('Failed to update reply');
            }
        },
        async deleteReply(replyId) {
            if (!confirm('Are you sure you want to delete this reply?')) return;
            try {
                await axios.delete(`/forum/replies/${replyId}`);
                
                // Refresh replies list
                const response = await axios.get(`/forum/discussions/${this.selectedDiscussion.id}`);
                this.replies = response.data.replies;
                
                // Update comment counter in background
                await this.fetchDiscussions();
            } catch (error) {
                console.error('Failed to delete reply:', error);
                alert('Failed to delete reply');
            }
        },
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        },
        getRoleClass(role) {
            return {
                'badge-primary': role === 'super_admin',
                'badge-warning': role === 'branch_admin',
                'badge-info': role === 'sms',
                'badge-success': role === 'da',
                'badge-secondary': role === 'farmer'
            }
        }
    }
}
</script>

<style scoped>
.forum-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 8px 0;
}

/* Forum Header with glowing gradients */
.forum-header {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: white;
    padding: 35px 30px;
    border-radius: var(--radius-lg);
    margin-bottom: 30px;
    box-shadow: var(--shadow-md);
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.header-overlay-glow {
    position: absolute;
    top: -50%;
    right: -20%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    pointer-events: none;
}

.header-content h1 {
    font-size: 26px;
    font-weight: 850;
    margin-bottom: 6px;
    color: white;
}

.header-content p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14.5px;
    max-width: 650px;
    line-height: 1.5;
}

.start-discussion-btn {
    border-radius: var(--radius-md);
    padding: 12px 24px;
    background: white;
    color: var(--primary-color);
    box-shadow: var(--shadow-sm);
    flex-shrink: 0;
    font-size: 15px;
}

.start-discussion-btn:hover {
    background: var(--bg-light);
    color: var(--primary-dark);
}

/* New Discussion Form Box */
.new-discussion-card {
    background: var(--bg-white);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 24px;
    margin-bottom: 30px;
    box-shadow: var(--shadow-md);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.card-header h2 {
    font-size: 19px;
    font-weight: 700;
    margin: 0;
}

.close-card-btn {
    font-size: 28px;
    cursor: pointer;
    color: var(--text-light);
    transition: color 0.2s;
}

.close-card-btn:hover {
    color: var(--danger-color);
}

.form-buttons {
    display: flex;
    gap: 12px;
    margin-top: 10px;
}

/* Search bar styling */
.forum-filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 25px;
    flex-wrap: wrap;
}

.search-wrapper {
    position: relative;
    flex: 1;
    min-width: 280px;
}

.search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-light);
    font-size: 16px;
}

.forum-search-input {
    padding: 12px 16px 12px 42px;
    font-size: 14.5px;
    border-radius: 25px;
    background: var(--bg-white);
    border: 1px solid var(--border-color);
}

.clear-search {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 20px;
    color: var(--text-light);
    cursor: pointer;
}

.clear-search:hover {
    color: var(--danger-color);
}

.discussion-count {
    font-size: 14px;
    color: var(--text-light);
}

/* Discussions Grid & Cards */
.discussions-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
    gap: 16px;
}

.discussion-card {
    background: var(--bg-white);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    overflow: hidden;
    display: flex;
    box-shadow: var(--shadow-sm);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.discussion-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary-light);
}

.discussion-accent {
    width: 6px;
    background: var(--primary-color);
    flex-shrink: 0;
}

.discussion-card:hover .discussion-accent {
    background: var(--primary-light);
}

.discussion-card-body {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.discussion-top {
    display: flex;
    align-items: center;
    gap: 10px;
}

.author-avatar {
    width: 32px;
    height: 32px;
    background: var(--primary-light);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 14px;
}

.author-info h4 {
    margin: 0;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-dark);
}

.discussion-date {
    margin-left: auto;
    font-size: 11.5px;
    color: var(--text-light);
}

.discussion-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--text-dark);
    line-height: 1.4;
}

.discussion-snippet {
    font-size: 13.5px;
    color: var(--text-light);
    line-height: 1.5;
}

.discussion-meta-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--border-color);
    padding-top: 12px;
    margin-top: 5px;
}

.reply-badge {
    font-size: 12.5px;
    color: var(--text-light);
}

.quick-card-actions {
    display: flex;
    gap: 6px;
}

.action-btn {
    background: var(--bg-light);
    border: 1px solid var(--border-color);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.action-btn:hover {
    background: var(--border-color);
    transform: scale(1.1);
}

/* Glassmorphic Modal overlay and cards */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
}

.modal-card {
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    width: 100%;
    max-width: 800px;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
}

.modal-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 25px;
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    background: var(--bg-white);
    z-index: 10;
}

.header-author-details {
    display: flex;
    align-items: center;
    gap: 12px;
}

.avatar-large {
    width: 46px;
    height: 46px;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 18px;
    text-transform: uppercase;
}

.header-author-details h2 {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.modal-close-btn {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: var(--text-light);
    line-height: 1;
}

.modal-close-btn:hover {
    color: var(--danger-color);
}

.modal-card-body {
    padding: 25px;
    overflow-y: auto;
}

.discussion-detail-content {
    margin-bottom: 25px;
}

.selected-title {
    font-size: 22px;
    font-weight: 800;
    color: var(--text-dark);
    margin-bottom: 15px;
    line-height: 1.35;
}

.selected-text {
    font-size: 15px;
    color: var(--text-dark);
    line-height: 1.6;
    white-space: pre-wrap;
}

.post-timestamp {
    font-size: 11.5px;
    color: var(--text-light);
    margin-top: 15px;
}

/* Discussion edit form fields */
.discussion-edit-form {
    background: var(--bg-light);
    padding: 18px;
    border-radius: var(--radius-md);
    margin-bottom: 20px;
    border: 1px solid var(--border-color);
}

.edit-form-buttons {
    display: flex;
    gap: 8px;
}

.separator-line {
    border: 0;
    border-top: 1px solid var(--border-color);
    margin: 25px 0;
}

/* Comments and Replies sections */
.replies-section h3 {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 18px;
}

.replies-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 25px;
}

.reply-card {
    background: var(--bg-light);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: 16px;
}

.reply-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    flex-wrap: wrap;
    gap: 10px;
}

.reply-author {
    display: flex;
    align-items: center;
    gap: 8px;
}

.reply-author strong {
    font-size: 13.5px;
    color: var(--text-dark);
}

.reply-role-badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 10px;
}

.reply-meta-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.reply-time {
    font-size: 11px;
    color: var(--text-light);
}

.reply-action-menu {
    display: flex;
    gap: 4px;
}

.reply-mini-action {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 11px;
    opacity: 0.6;
    transition: opacity 0.2s;
    padding: 2px;
}

.reply-mini-action:hover {
    opacity: 1;
}

.reply-body p {
    font-size: 13.8px;
    color: var(--text-dark);
    line-height: 1.5;
    white-space: pre-wrap;
}

.reply-edit-box {
    margin-top: 5px;
}

.reply-edit-actions {
    display: flex;
    gap: 6px;
    margin-top: 5px;
}

.empty-replies {
    padding: 20px;
    text-align: center;
    color: var(--text-light);
    font-size: 14px;
    background: var(--bg-light);
    border-radius: var(--radius-sm);
    border: 1px dotted var(--border-color);
    margin-bottom: 25px;
}

/* Reply form styling */
.reply-form-wrapper {
    background: var(--bg-white);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
}

.reply-form-wrapper h4 {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 12px;
}

.reply-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.submit-reply-btn {
    align-self: flex-end;
    border-radius: var(--radius-sm);
    padding: 10px 20px;
}

/* Empty Forum state styling */
.empty-forum-state {
    padding: 50px 20px;
    text-align: center;
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    border: 1px dashed var(--border-color);
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.empty-forum-state h3 {
    font-size: 18px;
    margin-bottom: 8px;
}

.empty-forum-state p {
    font-size: 14px;
    color: var(--text-light);
    max-width: 480px;
    margin: 0 auto;
}

/* Role badge colors */
.badge-primary { background: rgba(45, 106, 79, 0.15); color: #2d6a4f; border: 1px solid rgba(45, 106, 79, 0.25); }
.badge-warning { background: rgba(247, 127, 0, 0.15); color: #f77f00; border: 1px solid rgba(247, 127, 0, 0.25); }
.badge-info { background: rgba(0, 102, 204, 0.15); color: #0066cc; border: 1px solid rgba(0, 102, 204, 0.25); }
.badge-success { background: rgba(42, 157, 143, 0.15); color: #2a9d8f; border: 1px solid rgba(42, 157, 143, 0.25); }
.badge-secondary { background: rgba(108, 117, 125, 0.15); color: #6c757d; border: 1px solid rgba(108, 117, 125, 0.25); }

/* Animation Transitions */
.slide-fade-enter-active, .slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fade-enter-from, .slide-fade-leave-to {
    transform: translateY(-10px);
    opacity: 0;
}

.fade-enter-active, .fade-leave-active {
    transition: opacity 0.2s ease-out;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

.animate-zoom {
    animation: zoomIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes zoomIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

.animate-fade-in {
    animation: fadeIn 0.35s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
    .forum-header {
        flex-direction: column;
        align-items: stretch;
        padding: 25px 20px;
    }
    
    .start-discussion-btn {
        align-self: flex-start;
    }
    
    .modal-card {
        height: 95vh;
        max-height: 95vh;
    }
    
    .modal-card-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }
    
    .header-actions {
        justify-content: flex-end;
    }
    
    .modal-close-btn {
        position: absolute;
        top: 15px;
        right: 15px;
    }
}
</style>