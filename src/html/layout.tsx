import { type MenuProps, Tabs, type TabsProps } from "antd";
import { SettingFilled } from "@ant-design/icons";
import SettingsPanel from "./pages/settingsPanel";
import LocalModelsGallery from "./pages/localModelsGallery";
import DownloadPanel from "./pages/downloadPanel";

type MenuItem = Required<MenuProps>["items"][number];

enum MenuItemKeys {
  Settings = "settings",
  Local = `Local`,
  CivitAI = `CivitAI`,
  Download = `Download`,
}

const items: MenuItem[] = [
  {
    label: "Settings",
    key: MenuItemKeys.Settings,
    icon: <SettingFilled />,
  },
];

function GalleryContent() {
  const galleries: TabsProps["items"] = [
    {
      label: MenuItemKeys.Local,
      key: MenuItemKeys.Local,
      children: <LocalModelsGallery />,
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
  return (
    <div className="h-dvh">
      <GalleryContent />
    </div>
  );
}

export default App;
