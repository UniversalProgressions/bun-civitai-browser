import { type MenuProps, Tabs, type TabsProps } from "antd";
import { SettingFilled } from "@ant-design/icons";
import SettingsPanel from "./pages/settingsPanel";
import LocalModelsGallery from "./pages/localModelsGallery";

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
      label: `Download`,
      key: MenuItemKeys.CivitAI,
      children: `Download Panel`,
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
