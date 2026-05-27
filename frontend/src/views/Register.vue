<template>
    <div class="register-container">
        <!-- Language Switcher (absolute top right) -->
        <div class="lang-switcher-login">
            <button @click="switchLanguage('en')" :class="{'active': $i18n.locale === 'en'}">EN</button>
            <button @click="switchLanguage('am')" :class="{'active': $i18n.locale === 'am'}">AM</button>
        </div>

        <div class="register-card">
            <div class="register-header">
                <h1>{{ $t('register.title') }}</h1>
                <p>{{ $t('register.subtitle') }}</p>
            </div>

            <form @submit.prevent="handleRegister">
                <div v-if="error" class="alert alert-danger">{{ error }}</div>
                <div v-if="success" class="alert alert-success">{{ success }}</div>

                <div class="form-row">
                    <div class="form-group">
                        <label>{{ $t('register.first_name') }}</label>
                        <input type="text" v-model="form.first_name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>{{ $t('register.last_name') }}</label>
                        <input type="text" v-model="form.last_name" class="form-control" required>
                    </div>
                </div>

                <div class="form-group">
                    <label>{{ $t('register.phone') }}</label>
                    <input type="text" v-model="form.phone_number" placeholder="09XXXXXXXX" class="form-control" required>
                </div>

                <div class="form-group">
                    <label>{{ $t('register.password') }}</label>
                    <input type="password" v-model="form.password" class="form-control" required minlength="6">
                </div>

                <div class="form-group">
                    <label>{{ $t('register.sex') }}</label>
                    <select v-model="form.sex" class="form-control" required>
                        <option value="">{{ $t('register.sex_select') }}</option>
                        <option value="Male">{{ $t('register.sex_male') }}</option>
                        <option value="Female">{{ $t('register.sex_female') }}</option>
                        <option value="Other">{{ $t('register.sex_other') }}</option>
                    </select>
                </div>

                <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
                    {{ loading ? $t('register.btn_creating') : $t('register.btn_create') }}
                </button>
            </form>

            <div class="register-footer">
                <p>{{ $t('register.have_account') }} <router-link to="/login">{{ $t('register.login_here') }}</router-link></p>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Register',
    data() {
        return {
            form: {
                first_name: '',
                last_name: '',
                phone_number: '',
                password: '',
                sex: ''
            },
            error: '',
            success: '',
            loading: false
        }
    },
    methods: {
        switchLanguage(lang) {
            this.$i18n.locale = lang;
            localStorage.setItem('language', lang);
        },
        async handleRegister() {
            this.error = ''
            this.success = ''
            this.loading = true

            try {
                const response = await axios.post('/auth/register/farmer', this.form)
                if (response.data.success) {
                    this.success = response.data.message
                    setTimeout(() => this.$router.push('/login'), 2000)
                }
            } catch (error) {
                this.error = error.response?.data?.errors?.[0] || 
                            error.response?.data?.message || 
                            'Registration failed'
            } finally {
                this.loading = false
            }
        }
    }
}
</script>

<style scoped>
.register-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%);
    padding: 20px;
    position: relative;
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
    color: var(--text-dark);
    transition: all 0.3s;
}

.lang-switcher-login button.active {
    background: #2d6a4f;
    color: white;
}

.register-card {
    background: var(--bg-white);
    color: var(--text-dark);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 40px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    transition: background-color 0.3s ease, border-color 0.3s ease;
}

.register-header {
    text-align: center;
    margin-bottom: 30px;
}

.register-header h1 {
    color: var(--primary-color);
    margin-bottom: 10px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: var(--text-dark);
}

.form-control {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color);
    background: var(--bg-white);
    color: var(--text-dark);
    border-radius: 5px;
    font-size: 16px;
    transition: border-color 0.3s, background-color 0.3s ease, color 0.3s ease;
}

select.form-control {
    background: var(--bg-white);
    color: var(--text-dark);
}

.btn-primary {
    background: #2d6a4f;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 5px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
}

.btn-primary:hover {
    background: #1b4332;
}

.btn-primary:disabled {
    background: #95a5a6;
    cursor: not-allowed;
}

.register-footer {
    margin-top: 20px;
    text-align: center;
}

.register-footer a {
    color: #40916c;
    text-decoration: none;
    font-weight: 600;
}

.alert-success {
    background: #d4edda;
    color: #155724;
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 20px;
}
</style>