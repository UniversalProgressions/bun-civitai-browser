import { type MenuProps, Tabs, type TabsProps } from "antd";
import { SettingFilled } from "@ant-design/icons";
import SettingsPanel from "./pages/settingsPanel";
import LocalModelsGallery from "./pages/localModelsGallery";
import DownloadPanel from "./pages/downloadPanel";
import CivitaiGallery from "./pages/civitaiModelsGallery";

type MenuItem = Required<MenuProps>["items"][number];

enum MenuItemKeys {
  Settings = "settings",
  Local = `Local`,
  CivitAI = `CivitAI`,
  Download = `Download`,
}

function GalleryContent() {
  const galleries: TabsProps["items"] = [
    {
      label: MenuItemKeys.Local,
      key: MenuItemKeys.Local,
      children: <LocalModelsGallery />,
    },
    {
      label: MenuItemKeys.CivitAI,
      key: MenuItemKeys.CivitAI,
      children: <CivitaiGallery />,
    },
    {
      label: MenuItemKeys.Download,
      key: MenuItemKeys.Download,
      children: <DownloadPanel />,
    },
    {
      label: MenuItemKeys.Settings,
      key: MenuItemKeys.Settings,
      children: <SettingsPanel />,
      destroyOnHidden: true,
    },
  ];
  return <Tabs defaultActiveKey="1" centered items={galleries} />;
}

function App() {
  return <GalleryContent />;
}

export default App;
