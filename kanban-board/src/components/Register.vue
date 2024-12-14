<template>
	<div class="register-container">
	  <h1>Регистрация</h1>
	  <form @submit.prevent="handleRegister">
		<input
		  v-model="username"
		  type="text"
		  placeholder="Имя пользователя"
		  required
		/>
		<input
		  v-model="password"
		  type="password"
		  placeholder="Пароль"
		  required
		/>
		<select v-model="role">
		  <option value="user">Пользователь</option>
		  <option value="admin">Администратор</option>
		</select>
		<button type="submit">Зарегистрироваться</button>
	  </form>
	  <p v-if="error" style="color: red;">{{ error }}</p>
	  <p v-if="success" style="color: green;">{{ success }}</p>
	</div>
  </template>
  
  <script>
  import authService from "@/services/authService";
  
  export default {
	data() {
	  return {
		username: "",
		password: "",
		role: "user",
		error: "",
		success: "",
	  };
	},
	methods: {
	  async handleRegister() {
		try {
		  await authService.register(this.username, this.password, this.role);
		  this.success = "Регистрация успешна! Теперь вы можете войти.";
		  this.error = "";
		} catch (err) {
		  this.error = err.message || "Ошибка регистрации";
		  this.success = "";
		}
	  },
	},
  };
  </script>
  
  <style>
  .register-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 50px;
  }
  
  form {
	display: flex;
	flex-direction: column;
	width: 300px;
  }
  
  input, select, button {
	margin-bottom: 10px;
	padding: 10px;
	font-size: 16px;
  }
  </style>
  