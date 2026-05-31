<!-- Main Dashboard - Role-based content display -->
<template>
    <div class="dashboard">
        <header class="dashboard-header animate-fade-in">
            <div class="header-overlay-glow"></div>
            <h1>Welcome back, {{ user.first_name }} {{ user.last_name }}</h1>
            <p class="role-badge">{{ user.role.replace('_', ' ').toUpperCase() }}</p>
        </header>

        <!-- Ethiopian Agricultural Showcase Section -->
        <section class="showcase-section animate-fade-in">
            <h2 class="showcase-title">🌾 Local Agricultural Showcase</h2>
            <p class="showcase-subtitle">Discover our farming community, premium cash crops, and traditional superfood products.</p>
            <div class="showcase-grid">
                <div class="showcase-card">
                    <div class="showcase-image-wrapper">
                        <img src="/images/ethiopian_farmer.png" alt="Ethiopian Farmer" class="showcase-img">
                        <span class="showcase-tag">Community</span>
                    </div>
                    <div class="showcase-content">
                        <h3>Farming Communities</h3>
                        <p>Empowering local smallholders with real-time weather alerts, sustainable crop guidance, and expert collaborative forums to bolster regional agricultural resilience.</p>
                    </div>
                </div>

                <div class="showcase-card">
                    <div class="showcase-image-wrapper">
                        <img src="/images/coffee_crop.png" alt="Highland Coffee" class="showcase-img">
                        <span class="showcase-tag">Highland Crops</span>
                    </div>
                    <div class="showcase-content">
                        <h3>Premium Coffee Beans</h3>
                        <p>Highland volcanic soils and shaded traditional canopies in Ethiopia yield the most complex, aromatic, and world-renowned Arabica coffee crop varieties.</p>
                    </div>
                </div>

                <div class="showcase-card">
                    <div class="showcase-image-wrapper">
                        <img src="/images/ethiopian_crops.png" alt="Traditional Grains" class="showcase-img">
                        <span class="showcase-tag">Local Products</span>
                    </div>
                    <div class="showcase-content">
                        <h3>Teff & Grains Showcase</h3>
                        <p>Cultivating premium gluten-free teff and grains. We bridge the gap between hard-working farmers and modern marketplace trade infrastructures.</p>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Warning Alerts Section (visible to all) -->
        <section class="warnings-section animate-fade-in" v-if="warnings.length > 0">
            <h2>
                <span class="warning-icon">⚠️</span>
                Active Warnings & Threats
            </h2>
            <div class="warnings-grid">
                <div v-for="warning in warnings" :key="warning.id" 
                     :class="['warning-card', warning.warning_type]">
                    <h3>{{ warning.title }}</h3>
                    <p>{{ warning.content.substring(0, 150) }}...</p>
                    <small>Posted: {{ formatDate(warning.created_at) }}</small>
                </div>
            </div>
        </section>
        
        <!-- Latest Information Posts -->
        <section class="posts-section animate-fade-in">
            <h2>
                <span class="section-icon">📄</span>
                Latest Agricultural Information
            </h2>
            <div class="posts-grid">
                <div v-for="post in recentPosts" :key="post.id" class="post-card">
                    <h3>{{ post.title }}</h3>
                    <p>{{ post.content.substring(0, 180) }}...</p>
                    <div class="post-meta">
                        <small>By: {{ post.first_name }} {{ post.last_name }}</small>
                        <small>{{ formatDate(post.created_at) }}</small>
                    </div>
                    <router-link :to="`/posts/${post.id}`" class="btn-link">Read More &rarr;</router-link>
                </div>
            </div>
        </section>
        
        <!-- Quick Actions based on role -->
        <section class="quick-actions animate-fade-in">
            <h2>
                <span class="section-icon">⚡</span>
                Quick Actions
            </h2>
            <div class="actions-grid">
                <router-link to="/posts" class="action-card">
                    <span class="action-icon">📄</span>
                    <span>View All Posts</span>
                </router-link>
                <router-link to="/forum" class="action-card">
                    <span class="action-icon">💬</span>
                    <span>Discussion Forum</span>
                </router-link>
                <router-link to="/warnings" class="action-card">
                    <span class="action-icon">⚠️</span>
                    <span>View Warnings</span>
                </router-link>
                <router-link v-if="isSuperAdmin" to="/admin/users" class="action-card">
                    <span class="action-icon">👥</span>
                    <span>Manage Users</span>
                </router-link>
                <router-link v-if="canReport" to="/reports" class="action-card">
                    <span class="action-icon">📝</span>
                    <span>Report Problem</span>
                </router-link>
                <router-link v-if="canInnovate" to="/innovations" class="action-card">
                    <span class="action-icon">💡</span>
                    <span>Share Innovation</span>
                </router-link>
            </div>
        </section>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Dashboard',
    data() {
        return {
            user: JSON.parse(localStorage.getItem('user') || '{}'),
            warnings: [],
            recentPosts: []
        }
    },
    computed: {
        isSuperAdmin() {
            return this.user.role === 'super_admin'
        },
        isBranchAdmin() {
            return this.user.role === 'branch_admin'
        },
        canReport() {
            return ['da', 'sms', 'farmer'].includes(this.user.role)
        },
        canInnovate() {
            return ['da', 'sms', 'farmer'].includes(this.user.role)
        }
    },
    async mounted() {
        await this.fetchWarnings()
        await this.fetchRecentPosts()
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
            }
        },
        async fetchRecentPosts() {
            try {
                const response = await axios.get('/posts?limit=5')
                this.recentPosts = response.data.data
            } catch (error) {
                console.error('Failed to fetch posts:', error)
            }
        },
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }
    }
}
</script>

<style scoped>
.dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 8px 0;
}

.dashboard-header {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: white;
    padding: 40px 30px;
    border-radius: var(--radius-lg);
    margin-bottom: 35px;
    box-shadow: var(--shadow-md);
    position: relative;
    overflow: hidden;
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

.dashboard-header h1 {
    font-size: 60px;
    font-weight: 800;
    margin-bottom: 8px;
    color: white;
    letter-spacing: -0.5px;
    position: relative;
    z-index: 2;
}

.role-badge {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: inline-block;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-top: 5px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    position: relative;
    z-index: 2;
}

/* Showcase Section Styling */
.showcase-section {
    margin-bottom: 45px;
}

.showcase-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 6px;
}

.showcase-subtitle {
    color: var(--text-light);
    margin-bottom: 24px;
    font-size: 15px;
}

.showcase-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
}

.showcase-card {
    background: var(--bg-white);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}

.showcase-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-md);
}

.showcase-image-wrapper {
    position: relative;
    height: 180px;
    width: 100%;
    overflow: hidden;
    background: #eaeaea;
}

.showcase-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.showcase-card:hover .showcase-img {
    transform: scale(1.05);
}

.showcase-tag {
    position: absolute;
    top: 15px;
    left: 15px;
    background: var(--primary-color);
    color: white;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 4px 10px;
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
}

.showcase-content {
    padding: 20px;
}

.showcase-content h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--text-dark);
}

.showcase-content p {
    font-size: 14px;
    color: var(--text-light);
    line-height: 1.6;
}

/* Warnings and Posts Layout styling */
.warnings-section h2,
.posts-section h2,
.quick-actions h2 {
    color: var(--primary-color);
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.warnings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 45px;
}

.warning-card {
    padding: 20px;
    border-radius: var(--radius-md);
    color: white;
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.warning-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.warning-card.flood { background: linear-gradient(135deg, #0066cc, #004d99); }
.warning-card.wildfire { background: linear-gradient(135deg, #cc3300, #992600); }
.warning-card.locust_swarm { background: linear-gradient(135deg, #996600, #734d00); }
.warning-card.general { background: linear-gradient(135deg, #666, #4d4d4d); }

.posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    margin-bottom: 45px;
}

.post-card {
    background: var(--bg-white);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 24px;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
}

.post-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-3px);
    border-color: var(--primary-light);
}

.post-card h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 12px;
}

.post-card p {
    color: var(--text-light);
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 15px;
}

.post-meta {
    display: flex;
    justify-content: space-between;
    color: var(--text-light);
    font-size: 12px;
    margin-top: auto;
    padding-top: 15px;
    border-top: 1px solid var(--border-color);
}

.btn-link {
    color: var(--primary-color);
    font-weight: 700;
    text-decoration: none;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    background: transparent;
    margin-top: 12px;
    align-self: flex-start;
    transition: color 0.2s ease, transform 0.2s ease;
}

.btn-link:hover {
    color: var(--primary-light);
    transform: translateX(3px);
}

/* Actions styling */
.actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
}

.action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--bg-white);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    text-decoration: none;
    color: var(--text-dark);
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-card:hover {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white !important;
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
}

.action-card:hover .action-icon {
    transform: scale(1.1);
}

.action-icon {
    font-size: 2.2em;
    margin-bottom: 12px;
    transition: transform 0.3s ease;
}

.action-card span:last-child {
    font-size: 14px;
    font-weight: 600;
    text-align: center;
}

/* Animations */
.animate-fade-in {
    animation: fadeIn 0.4s ease-out both;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Mobile responsive screen tuning */
@media (max-width: 768px) {
    .dashboard-header {
        padding: 30px 20px;
        margin-bottom: 25px;
    }
    
    .dashboard-header h1 {
        font-size: 24px;
    }
    
    .showcase-grid, .posts-grid, .warnings-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }
    
    .actions-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }
    
    .action-card {
        padding: 16px;
    }
    
    .action-icon {
        font-size: 1.8em;
        margin-bottom: 8px;
    }
}
</style>