<template>
    <div class="split-login-container">
        <!-- Language Switcher (absolute top right) -->
        <div class="lang-switcher-login">
            <button @click="switchLanguage('en')" :class="{'active': $i18n.locale === 'en'}">EN</button>
            <button @click="switchLanguage('am')" :class="{'active': $i18n.locale === 'am'}">AM</button>
        </div>
        
        <!-- Left Hero Section -->
        <div class="hero-section">
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <div class="brand">
                    <img src="../assets/logo.png" alt="Logo" class="logo" @error="handleImageError" v-if="!imageError">
                    <div class="logo-fallback" v-else>🌿</div>
                    <h1>{{ $t('login.easy_farming') }}</h1>
                </div>
                <h2>{{ $t('login.hero_subtitle') }}</h2>
                <p>{{ $t('login.hero_desc') }}</p>
                <div class="glass-stats">
                    <div class="stat-item">
                        <span class="stat-num">10k+</span>
                        <span class="stat-text">{{ $t('login.farmers') }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-num">500+</span>
                        <span class="stat-text">{{ $t('login.experts') }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Form Section -->
        <div class="form-section">
            <div class="form-wrapper">
                <div class="form-header">
                    <h2>{{ $t('login.welcome_back') }}</h2>
                    <p>{{ $t('login.welcome_sub') }}</p>
                </div>
                
                <form @submit.prevent="handleLogin" class="modern-form">
                    <div v-if="error" class="alert-toast">
                        <span class="icon">⚠️</span> {{ error }}
                    </div>
                    
                    <div class="input-group">
                        <label for="phone">{{ $t('login.phone') }}</label>
                        <div class="input-with-icon">
                            <span class="input-icon">📱</span>
                            <input 
                                type="text" 
                                id="phone" 
                                v-model="phone_number" 
                                placeholder="09XXXXXXXX"
                                required
                                pattern="09[0-9]{8}"
                            >
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <label for="password">{{ $t('login.password') }}</label>
                        <div class="input-with-icon">
                            <span class="input-icon">🔒</span>
                            <input 
                                :type="showPassword ? 'text' : 'password'" 
                                id="password" 
                                v-model="password" 
                                required
                            >
                            <button 
                                type="button" 
                                class="password-toggle" 
                                @click="showPassword = !showPassword"
                                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                            >
                                <span v-if="showPassword">👁️</span>
                                <span v-else>🙈</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <label class="remember-me">
                            <input type="checkbox"> {{ $t('login.remember_me') }}
                        </label>
                        <a href="#" class="forgot-password">{{ $t('login.forgot') }}</a>
                    </div>
                    
                    <button type="submit" class="btn-primary" :class="{ 'loading': loading }" :disabled="loading">
                        <span class="btn-text" v-if="!loading">{{ $t('login.sign_in') }}</span>
                        <span class="spinner" v-else></span>
                    </button>
                </form>
                
                <div class="form-footer">
                    <p>{{ $t('login.no_account') }} <router-link to="/register" class="link">{{ $t('login.create_one') }}</router-link></p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Login',
    data() {
        return {
            phone_number: '',
            password: '',
            error: '',
            loading: false,
            imageError: false,
            showPassword: false
        }
    },
    methods: {
        switchLanguage(lang) {
            this.$i18n.locale = lang;
            localStorage.setItem('language', lang);
        },
        handleImageError() {
            this.imageError = true;
        },
        async handleLogin() {
            this.error = ''
            this.loading = true
            
            try {
                // Axios will prepend the baseURL set in main.js
                const response = await axios.post('/auth/login', {
                    phone_number: this.phone_number,
                    password: this.password
                })
                
                if (response.data.success) {
                    localStorage.setItem('token', response.data.token)
                    localStorage.setItem('user', JSON.stringify(response.data.user))
                    this.$router.push('/dashboard')
                }
            } catch (error) {
                this.error = error.response?.data?.message || 'Login failed. Please try again.'
            } finally {
                this.loading = false
            }
        }
    }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

.split-login-container {
    display: flex;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    background-color: var(--bg-white);
    color: var(--text-dark);
    position: relative;
    transition: background-color 0.3s ease, color 0.3s ease;
}

.lang-switcher-login {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 100;
    display: flex;
    gap: 10px;
    background: var(--bg-white);
    border: 1px solid var(--border-color);
    padding: 8px;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.lang-switcher-login button {
    border: none;
    background: transparent;
    padding: 5px 10px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    color: #495057;
    transition: all 0.3s;
}

.lang-switcher-login button.active {
    background: #2d6a4f;
    color: white;
}

/* HERO SECTION (LEFT) */
.hero-section {
    flex: 1;
    display: none;
    position: relative;
    background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
    overflow: hidden;
    color: white;
}

@media (min-width: 900px) {
    .hero-section {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 4rem;
    }
}

/* Subtle animated background pattern */
.hero-section::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.05) 10%, transparent 20%),
                radial-gradient(circle, rgba(255,255,255,0.05) 10%, transparent 20%);
    background-size: 60px 60px;
    background-position: 0 0, 30px 30px;
    animation: backgroundShift 30s linear infinite;
    z-index: 1;
}

@keyframes backgroundShift {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(27, 67, 50, 0.2), rgba(27, 67, 50, 0.8));
    z-index: 2;
}

.hero-content {
    position: relative;
    z-index: 3;
    max-width: 600px;
    animation: fadeUp 1s ease-out;
}

.brand {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 2rem;
}

.logo {
    width: 50px;
    height: 50px;
    object-fit: contain;
    background: white;
    padding: 8px;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.logo-fallback {
    width: 50px;
    height: 50px;
    background: white;
    color: #2d6a4f;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.brand h1 {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin: 0;
}

.hero-content h2 {
    font-size: 48px;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 1.5rem;
    background: linear-gradient(to right, #ffffff, #cce3de);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.hero-content p {
    font-size: 18px;
    line-height: 1.6;
    color: #e9ecef;
    margin-bottom: 3rem;
}

.glass-stats {
    display: flex;
    gap: 20px;
}

.stat-item {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 1.5rem;
    flex: 1;
    transition: transform 0.3s ease, background 0.3s ease;
}

.stat-item:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.15);
}

.stat-num {
    display: block;
    font-size: 32px;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 5px;
}

.stat-text {
    font-size: 14px;
    color: #cce3de;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
}

/* FORM SECTION (RIGHT) */
.form-section {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: var(--bg-white);
    transition: background-color 0.3s ease;
}

.form-wrapper {
    width: 100%;
    max-width: 420px;
    animation: fadeIn 0.8s ease-out;
}

.form-header {
    margin-bottom: 2.5rem;
}

.form-header h2 {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-dark);
    margin-bottom: 0.5rem;
    letter-spacing: -0.5px;
}

.form-header p {
    color: #6c757d;
    font-size: 16px;
}

/* Alerts */
.alert-toast {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff0f0;
    color: #d62828;
    padding: 12px 16px;
    border-radius: 12px;
    border-left: 4px solid #d62828;
    margin-bottom: 24px;
    font-weight: 500;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
}

/* Form Inputs */
.input-group {
    margin-bottom: 1.5rem;
}

.input-group label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 8px;
}

.input-with-icon {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 16px;
    font-size: 18px;
    color: #adb5bd;
    pointer-events: none;
}

.input-with-icon input {
    width: 100%;
    padding: 14px 45px 14px 45px;
    font-size: 15px;
    color: var(--text-dark);
    background: var(--bg-light);
    border: 2px solid var(--border-color);
    border-radius: 12px;
    transition: all 0.3s ease;
}

.input-with-icon input:hover {
    background: var(--border-color);
}

.input-with-icon input:focus {
    background: var(--bg-white);
    border-color: #2d6a4f;
    box-shadow: 0 0 0 4px rgba(45, 106, 79, 0.1);
    outline: none;
}

.input-with-icon input::placeholder {
    color: #adb5bd;
}

/* Form Actions */
.form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    font-size: 14px;
}

.remember-me {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-dark);
    font-weight: 500;
    cursor: pointer;
}

.remember-me input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #2d6a4f;
    cursor: pointer;
}

.forgot-password {
    color: #2d6a4f;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;
}

.forgot-password:hover {
    color: #1b4332;
    text-decoration: underline;
}

/* Button */
.btn-primary {
    position: relative;
    width: 100%;
    padding: 16px;
    background: #2d6a4f;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(45, 106, 79, 0.2);
    display: flex;
    justify-content: center;
    align-items: center;
}

.btn-primary:hover:not(:disabled) {
    background: #1b4332;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(45, 106, 79, 0.3);
}

.btn-primary:active:not(:disabled) {
    transform: translateY(0);
}

.btn-primary:disabled {
    background: #95d5b2;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
}

.spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
}

/* Footer */
.form-footer {
    margin-top: 2.5rem;
    text-align: center;
    font-size: 15px;
    color: var(--text-light);
}

.form-footer .link {
    color: #2d6a4f;
    font-weight: 600;
    text-decoration: none;
    margin-left: 5px;
    transition: color 0.2s;
}

.form-footer .link:hover {
    color: #1b4332;
    text-decoration: underline;
}

/* Animations */
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.password-toggle {
    position: absolute;
    right: 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 18px;
    color: var(--text-light);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: color 0.2s;
    user-select: none;
    z-index: 5;
}

.password-toggle:hover {
    color: var(--primary-color);
}
</style>