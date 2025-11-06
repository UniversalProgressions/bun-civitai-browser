import { type MenuProps, Tabs, type TabsProps } from "antd";
import { SettingFilled } from "@ant-design/icons";
import SettingsPanel from "./pages/settingsPanel";
import LocalModelsGallery from "./pages/localModelsGallery";
import CivitaiModelsGallery from "./pages/civitaiModelsGallery";

type MenuItem = Required<MenuProps>["items"][number];

enum MenuItemKeys {
  Settings = "settings",
  Local = `Local`,
  CivitAI = `CivitAI`,
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
      label: `Local`,
      key: MenuItemKeys.Local,
      children: <LocalModelsGallery />,
    },
    {
      label: `CivitAI`,
      key: MenuItemKeys.CivitAI,
      children: <CivitaiModelsGallery />,
    },
    {
      label: `Settings`,
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
