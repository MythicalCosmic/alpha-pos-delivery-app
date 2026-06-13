import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router.js";

import "./styles/tokens.css";
import "./styles/ui.css";
import "./styles/splash.css";
import "./styles/screens.css";
import "./styles/revamp.css";
import "./styles/app.css";

createApp(App).use(router).mount("#app");
