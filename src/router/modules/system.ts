import i18n from "@/locales";
const { t } = i18n.global;

import Setting from "@iconify-icons/ep/setting";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

const systemRouter = {
  path: "/system",
  meta: {
    title: t("menus.hsSystemManagement"),
    icon: useRenderIcon(Setting),
    rank: 9,
    keepAlive: true
  },
  children: []
};

export default systemRouter;
