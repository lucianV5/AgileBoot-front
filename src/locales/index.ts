import { createI18n } from "vue-i18n";
import zh_CN from "./zh-CN";
import en_US from "./en";
import App from "../App.vue";
import { createApp } from "vue";

const i18n = createI18n({
  locale: "zh_CN",
  fallbackLocale: "zh_CN",
  messages: {
    zh_CN,
    en_US
  },
  globalInjection: true, // 全局注入 $t 函数
  silentTranslationWarn: true, // 去掉警告
  missingWarn: false,
  silentFallbackWarn: true, //抑制警告
  legacy: false // 修复组件引入i18n时vite脚手架报错的问题
});

createApp(App).use(i18n);

export default i18n;
