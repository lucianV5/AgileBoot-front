/** 处理环境变量 */
type Recordable<T = any> = Record<string, T>;

interface ViteEnv {
  VITE_PORT: number;
  VITE_PUBLIC_PATH: string;
  VITE_ROUTER_HISTORY: string;
  VITE_CDN: boolean;
  VITE_HIDE_HOME: string;
  VITE_COMPRESSION: "gzip" | "brotli" | "both" | "none";
  VITE_APP_BASE_API: string;
  [key: string]: any;
}

const wrapperEnv = (envConfigs: Recordable): ViteEnv => {
  /** 此处为默认值 */
  const defaultEnvConfigs: ViteEnv = {
    VITE_PORT: 8848,
    VITE_PUBLIC_PATH: "",
    VITE_ROUTER_HISTORY: "",
    VITE_CDN: false,
    VITE_HIDE_HOME: "false",
    VITE_COMPRESSION: "none",
    VITE_APP_BASE_API: ""
  };

  for (const configName of Object.keys(envConfigs)) {
    let realConfigValue = envConfigs[configName].replace(/\\n/g, "\n");
    realConfigValue =
      realConfigValue === "true"
        ? true
        : realConfigValue === "false"
        ? false
        : realConfigValue;

    if (configName === "VITE_PORT") {
      realConfigValue = Number(realConfigValue);
    }

    defaultEnvConfigs[configName] = realConfigValue;
    if (typeof realConfigValue === "string") {
      process.env[configName] = realConfigValue;
    } else if (typeof realConfigValue === "object") {
      process.env[configName] = JSON.stringify(realConfigValue);
    }
  }
  return defaultEnvConfigs;
};

export { wrapperEnv };
