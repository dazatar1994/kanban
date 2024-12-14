// src/plugins/vuetify.js
import { createVuetify } from 'vuetify';
import 'vuetify/styles'; // Обязательно для правильной работы стилей
import * as components from 'vuetify/lib/components';
import * as directives from 'vuetify/lib/directives';

export default createVuetify({
    components,
    directives,
});
