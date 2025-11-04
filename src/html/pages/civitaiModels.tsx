import { use, useActionState } from "react";
import { atom } from "jotai";
import { type ModelWithAllRelations } from "../../modules/civitai/service/crud/modelId";
import { type ModelsRequestOpts } from "../../modules/civitai/models/models_endpoint";
import { edenTreaty } from "../utils";

const modelsRequestOpts = atom<ModelsRequestOpts>({
  page: 1,
  limit: 20,
});
const models = atom<Array<ModelWithAllRelations>>([]);

function fetchModels({ searchOptions }: { searchOptions: ModelsRequestOpts }) {
  const [state, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const { data, error, headers, response, status } =
        await edenTreaty.civitai.api.v1.models.get({ query: searchOptions });
    }
  );
}

function App({}) {}

export default App;
