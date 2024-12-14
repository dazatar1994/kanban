module.exports = {
	chainWebpack: (config) => {
	  config.plugin('define').tap((definitions) => {
		Object.assign(definitions[0], {
		  // Указываем feature-флаги
		  __VUE_OPTIONS_API__: true, // Включить Options API
		  __VUE_PROD_DEVTOOLS__: false, // Отключить devtools в production
		  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false, // Установить значение
		});
		return definitions;
	  });
	},
  };
  