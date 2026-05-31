<template>
    <div class="faq-page animate-fade-in">
        <header class="faq-header">
            <div class="header-overlay-glow"></div>
            <h1>❓ Frequently Asked Questions & AI Support</h1>
            <p>Get instant answers about Easy Farming, crop scheduling, disease prevention, and interactive AI support.</p>
        </header>

        <div class="faq-layout">
            <!-- Left Panel: FAQ Accordions -->
            <div class="faq-accordion-section">
                <div class="search-bar-wrapper">
                    <input 
                        type="text" 
                        v-model="searchQuery" 
                        placeholder="Search frequently asked questions..." 
                        class="form-control faq-search-input"
                    >
                </div>

                <div class="accordion-group">
                    <div 
                        v-for="(item, index) in filteredFaqs" 
                        :key="index" 
                        :class="['faq-item', { 'active': activeIndex === index }]"
                        @click="toggleAccordion(index)"
                    >
                        <div class="faq-question">
                            <span>{{ item.question }}</span>
                            <span class="chevron">&darr;</span>
                        </div>
                        <div class="faq-answer-wrapper">
                            <div class="faq-answer">
                                <p>{{ item.answer }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Panel: Interactive AI Assistant Chatbot -->
            <div class="faq-ai-chat-section">
                <div class="ai-chat-card">
                    <div class="chat-header">
                        <span class="bot-avatar">🤖</span>
                        <div class="bot-info">
                            <h3>AI Agro-Assistant</h3>
                            <span class="bot-status">Online &bull; Smart Sorting</span>
                        </div>
                    </div>

                    <div class="chat-messages" ref="chatContainer">
                        <div 
                            v-for="(msg, index) in chatMessages" 
                            :key="index" 
                            :class="['chat-msg', msg.sender]"
                        >
                            <div class="msg-bubble">
                                <p>{{ msg.text }}</p>
                                <div v-if="msg.isProblem" class="auto-alert-badge">
                                    🚨 Auto-Alert Generated & Prioritized to Super Admin!
                                </div>
                                <span class="msg-time">{{ msg.time }}</span>
                            </div>
                        </div>
                        <div v-if="aiTyping" class="chat-msg bot">
                            <div class="msg-bubble typing-bubble">
                                <span class="dot"></span>
                                <span class="dot"></span>
                                <span class="dot"></span>
                            </div>
                        </div>
                    </div>

                    <div class="chat-input-wrapper">
                        <form @submit.prevent="sendChatMessage" class="chat-form">
                            <input 
                                type="text" 
                                v-model="userMessage" 
                                placeholder="Ask about teff, coffee, warnings, reports..." 
                                class="form-control chat-input"
                                :disabled="aiTyping"
                            >
                            <button type="submit" class="btn btn-primary send-btn" :disabled="aiTyping || !userMessage.trim()">
                                ➔
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Faq',
    data() {
        return {
            searchQuery: '',
            activeIndex: null,
            aiTyping: false,
            userMessage: '',
            chatMessages: [
                {
                    sender: 'bot',
                    text: 'Hello! I am your AI Agro-Assistant. Ask me anything about crop planning, warnings, or how I prioritize reports for higher-ups!',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ],
            faqs: [
                {
                    question: 'How is weather intelligence and swarm warning warnings collected?',
                    answer: 'Easy Farming coordinates with meteorological databases and pest tracking reports submitted by local Development Agents (DAs). When high-probability threats are confirmed, warnings are published immediately and broadcasted to all active farmers.'
                },
                {
                    question: 'What are the recommended planting windows for Teff in the highlands?',
                    answer: 'Teff is typically planted between mid-July and early August in high-altitude zones when rainfall is stable. Our AI scheduling can recommend tailored dates based on your specific woreda and regional moisture alerts.'
                },
                {
                    question: 'How does the AI prioritizing system work for higher-ups?',
                    answer: 'To protect Super Admins and Branch Admins from alert fatigue, our AI Priority Classifier analyzes all submitted problem reports. It inspects text strings for critical keywords (like infestation, drought, failure, and flooding) or high-severity tags to toggle priority status, moving critical issues to the top of the queues.'
                },
                {
                    question: 'How do I submit a crop problem report?',
                    answer: 'Click "Report Problem" in the sidebar navigation menu. Complete the form by entering a descriptive title, detail, woreda location, and severity level. Reports flagged critical are instantly routed as high-priority database alerts to branch leaders.'
                },
                {
                    question: 'How can I prevent leaf rust and mold damage on wheat?',
                    answer: 'Avoid overhead watering, use certified rust-resistant wheat varieties, and ensure optimal spacing to facilitate airflow. If spots appear, log a report immediately so an SMS (Subject Matter Specialist) can advise on targeted local treatments.'
                }
            ]
        }
    },
    computed: {
        filteredFaqs() {
            if (!this.searchQuery.trim()) return this.faqs;
            const q = this.searchQuery.toLowerCase();
            return this.faqs.filter(item => 
                item.question.toLowerCase().includes(q) || 
                item.answer.toLowerCase().includes(q)
            );
        }
    },
    methods: {
        toggleAccordion(index) {
            this.activeIndex = this.activeIndex === index ? null : index;
        },
        async sendChatMessage() {
            if (!this.userMessage.trim() || this.aiTyping) return;

            const userText = this.userMessage.trim();
            this.chatMessages.push({
                sender: 'user',
                text: userText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            this.userMessage = '';
            this.scrollToBottom();

            this.aiTyping = true;
            try {
                const response = await axios.post('/faq/chat', { message: userText });
                if (response.data && response.data.success) {
                    this.chatMessages.push({
                        sender: 'bot',
                        text: response.data.reply,
                        isProblem: response.data.is_problem,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                } else {
                    throw new Error('Chatbot returned an error response');
                }
            } catch (error) {
                console.error('Chatbot error:', error);
                this.chatMessages.push({
                    sender: 'bot',
                    text: '⚠️ Technical connection alert: I had trouble reaching the AI server. Please verify your internet connection or check back shortly.',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
            } finally {
                this.aiTyping = false;
                this.scrollToBottom();
            }
        },
        scrollToBottom() {
            this.$nextTick(() => {
                const container = this.$refs.chatContainer;
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            });
        }
    }
}
</script>

<style scoped>
.faq-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 8px 0;
}

.faq-header {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: white;
    padding: 35px 25px;
    border-radius: var(--radius-lg);
    margin-bottom: 30px;
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

.faq-header h1 {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 8px;
    color: white;
    position: relative;
    z-index: 2;
}

.faq-header p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 15px;
    position: relative;
    z-index: 2;
}

.faq-layout {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 30px;
}

/* FAQ Accordion Styling */
.faq-accordion-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.search-bar-wrapper {
    width: 100%;
}

.faq-search-input {
    padding: 14px 20px;
    font-size: 15px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    background: var(--bg-white);
}

.accordion-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.faq-item {
    background: var(--bg-white);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-sm);
}

.faq-item:hover {
    border-color: var(--primary-light);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
}

.faq-question {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    font-weight: 600;
    color: var(--text-dark);
    font-size: 16px;
    user-select: none;
}

.chevron {
    font-size: 14px;
    transition: transform 0.3s ease;
    color: var(--text-light);
}

.faq-item.active .chevron {
    transform: rotate(180deg);
    color: var(--primary-color);
}

.faq-answer-wrapper {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
}

.faq-item.active .faq-answer-wrapper {
    max-height: 250px;
}

.faq-answer {
    padding: 0 24px 20px 24px;
    color: var(--text-light);
    font-size: 14px;
    line-height: 1.6;
    border-top: 1px solid var(--border-color);
    padding-top: 15px;
}

/* Chatbot Section Styling */
.faq-ai-chat-section {
    position: sticky;
    top: 20px;
    height: calc(100vh - 160px);
    min-height: 480px;
}

.ai-chat-card {
    background: var(--bg-white);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chat-header {
    padding: 16px 20px;
    background: var(--primary-color);
    color: white;
    display: flex;
    align-items: center;
    gap: 12px;
}

.bot-avatar {
    font-size: 26px;
    background: rgba(255, 255, 255, 0.2);
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.bot-info h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: white;
}

.bot-status {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.8);
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    background: var(--bg-light);
}

.chat-msg {
    display: flex;
    max-width: 85%;
}

.chat-msg.bot {
    align-self: flex-start;
}

.chat-msg.user {
    align-self: flex-end;
}

.msg-bubble {
    padding: 12px 16px;
    border-radius: 14px;
    font-size: 13.5px;
    line-height: 1.5;
    position: relative;
}

.chat-msg.bot .msg-bubble {
    background: var(--bg-white);
    color: var(--text-dark);
    border: 1px solid var(--border-color);
    border-top-left-radius: 2px;
}

.chat-msg.user .msg-bubble {
    background: var(--primary-color);
    color: white;
    border-top-right-radius: 2px;
}

.msg-time {
    display: block;
    font-size: 10px;
    color: var(--text-light);
    text-align: right;
    margin-top: 4px;
}

.chat-msg.user .msg-time {
    color: rgba(255, 255, 255, 0.7);
}

.chat-input-wrapper {
    padding: 15px 20px;
    border-top: 1px solid var(--border-color);
    background: var(--bg-white);
}

.chat-form {
    display: flex;
    gap: 10px;
}

.chat-input {
    flex: 1;
    border-radius: 20px;
    padding: 10px 18px;
    font-size: 14px;
}

.send-btn {
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    flex-shrink: 0;
}

/* Typing Indicator Animation */
.typing-bubble {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 14px 18px !important;
}

.typing-bubble .dot {
    width: 6px;
    height: 6px;
    background: var(--text-light);
    border-radius: 50%;
    animation: typing 1.4s infinite both;
}

.typing-bubble .dot:nth-child(2) { animation-delay: .2s; }
.typing-bubble .dot:nth-child(3) { animation-delay: .4s; }

@keyframes typing {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
}

.auto-alert-badge {
    background: rgba(214, 40, 40, 0.1);
    color: var(--danger-color);
    border: 1px solid rgba(214, 40, 40, 0.25);
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    font-size: 11px;
    font-weight: 700;
    margin-top: 8px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(0.98); }
}

/* Responsive Scaling */
@media (max-width: 900px) {
    .faq-layout {
        grid-template-columns: 1fr;
    }
    
    .faq-ai-chat-section {
        position: static;
        height: 400px;
        min-height: auto;
    }
}
</style>
