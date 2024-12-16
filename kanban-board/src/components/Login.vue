<template>
	<div>
		<h1>Авторизация</h1>
		<form @submit.prevent="handleLogin">
			<input v-model="username" type="text" placeholder="Имя пользователя" required />
			<input v-model="password" type="password" placeholder="Пароль" required />
			<button type="submit">Войти</button>
		</form>
		<p v-if="error" style="color: red;">{{ error }}</p>
	</div>
</template>

<script>
import authService from '@/services/authService';

export default {
	data() {
		return {
			username: '',
			password: '',
			error: '',
		};
	},

	methods: {
		async handleLogin() {
			try {
				const token = await authService.login(this.username, this.password);
				localStorage.setItem('username', authService.getUsername()); // Сохраняем имя пользователя
				this.$router.push('/dashboard');
			} catch (err) {
				this.error = err.message || 'Ошибка входа';
			}
		},
	},
};
</script>