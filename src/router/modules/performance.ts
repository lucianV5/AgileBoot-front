import i18n from "@/locales";

import  TrendCharts  from "@iconify-icons/ep/trend-charts";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

const performanceRouter = {
  path: "/performance/index",
  name: "SystemPerformance",
  component: () => import("@/views/system/performance/index.vue"),
  meta: {
    // title: i18n.global.t("menus.hsPerformanceManagement"),
    //  icon: useRenderIcon(TrendCharts),
    roles: ["admin", "system"],
    parentId: "/system"
  }
};

export default performanceRouter;