import { Button, Form, type FormProps, Input } from "antd";
import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { edenTreaty } from "../utils";
import { atomWithImmer } from "jotai-immer";
import {
  _settingsValidator,
  defaultSettings,
  type Settings,
} from "../../modules/settings/models";

const settingsImmerAtom = atomWithImmer(defaultSettings);
function App() {
  const [settings, setSettings] = useAtom<Settings>(settingsImmerAtom);
  const { isPending, error, data } = useQuery({
    queryKey: ["settings"],
    queryFn: () =>
      edenTreaty.settings.api.settings.get().then((data) => {
        setSettings(data.data!);
        return settings;
      }),
    // refetchOnMount: true,
    // staleTime: 1,
  });
  if (isPending) return "Loading...";

  if (error) {
    return "An error has occurred: Can't communicate with server, may it's not even running yet.";
  }

  const onFinish: FormProps<Settings>["onFinish"] = (values) => {
    console.log("Success:", values);
  };

  const onFinishFailed: FormProps<Settings>["onFinishFailed"] = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <Form
      name="basic"
      initialValues={settings}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item<Settings>
        label="CivitAI API Key"
        name="civitaiToken"
        rules={[
          {
            required: true,
            message: "Please input your CivitAI API key here!",
          },
        ]}
      >
        <Input
          value={settings.civitaiToken}
          onChange={(e) => {
            setSettings((state) => {
              state.civitaiToken = e.target.value;
              return state;
            });
          }}
        />
      </Form.Item>
      <Form.Item<Settings>
        label="Models saving location"
        name="basePath"
        rules={[
          {
            required: true,
            message:
              "Please input the location of where your models will be saved at.",
          },
        ]}
      >
        <Input
          value={settings.basePath}
          onChange={(e) => {
            setSettings((state) => {
              state.basePath = e.target.value;
              return state;
            });
          }}
        />
      </Form.Item>
      <Form.Item<Settings>
        label="Proxy"
        name="httpProxy"
        rules={[
          {
            required: true,
            message:
              "You could set your proxy address for downloading at here. (optional)",
          },
        ]}
      >
        <Input
          value={settings.httpProxy}
          onChange={(e) => {
            setSettings((state) => {
              state.httpProxy = e.target.value;
              return state;
            });
          }}
        />
      </Form.Item>
      <Form.Item<Settings>
        label="GopeedAPI"
        name="gopeedHost"
        rules={[
          {
            required: true,
            message: "Please input your GopeedAPI host address here!",
          },
        ]}
      >
        <Input
          value={settings.gopeedHost}
          onChange={(e) => {
            setSettings((state) => {
              state.gopeedHost = e.target.value;
              return state;
            });
          }}
        ></Input>
      </Form.Item>
      <Form.Item label={null}>
        <Button
          type="primary"
          htmlType="button"
          // onClick={() => console.log(settings)}
          onClick={async () => {
            await edenTreaty.settings.api.settings.post(settings);
            setSettings(settings);
          }}
        >
          Save
        </Button>
      </Form.Item>
    </Form>
  );
}

export default App;
