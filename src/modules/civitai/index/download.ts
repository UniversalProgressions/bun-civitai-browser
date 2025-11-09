import { Client } from "@gopeed/rest";
import { CreateTaskWithRequest, CreateTaskBatch } from "@gopeed/types";
import { Elysia } from "elysia";
import { cron, Patterns } from '@elysiajs/cron'
import { type } from "arktype";
import { getSettings } from "#modules/settings/service";
import { model, type Model, type ModelVersion } from "#modules/civitai/models/models_endpoint";
import { getRequester } from "../service/utils";
import { KyResponse } from "ky";
import { ModelIdLayout, getMediaDir } from "#modules/civitai/service/fileLayout";
import { upsertOneModelVersion } from "#modules/civitai/service/crud/modelVersion";
export class ExternalServiceError extends Error {
  constructor(
    public message: string,
  ) {
    super(message);
    this.name = "ExternalServiceError";
  }
}

export class GopeedHostNotSpecifiedError extends Error {
  constructor(
    public message: string,
  ) {
    super(message);
    this.name = "GopeedHostNotSpecifiedError";
  }
}

export function getGopeedClient() {
  const settings = getSettings()
  if (!settings.gopeedHost) {
    throw new GopeedHostNotSpecifiedError(`Please specify gopeed API address to use model downloading feature.`)
  }
  const client = new Client({ host: settings.gopeedHost, token: settings.gopeedToken });
  return client
}

function makeModelFileDownloadUrl(url: string, token: string) {
  console.log(
    `this is the url I get from trpc: ${url}\n this is the token: ${token}`
  );
  const urlObj = new URL(url);

  urlObj.searchParams.set("token", token);
  console.log(`this is the url I get after adding token: ${urlObj.toString()}`);
  return urlObj.toString();
}

class UnauthorizedError extends Error {
  constructor(
    public message: string,
    public kyRes: KyResponse
  ) {
    super(message);
    this.name = "UnauthorizedError";
    this.kyRes = kyRes
  }
}
class ResolveResourceUrlFailedError extends Error {
  constructor(
    public message: string,
    public kyRes: KyResponse

  ) {
    super(message);
    this.name = "ResolveResourceUrlFailedError";
    this.kyRes = kyRes
  }
}
export default new Elysia({ prefix: `/download` })
  .error({ UnauthorizedError, ResolveResourceUrlFailedError, ExternalServiceError })
  .onError(({ code, error, status }) => {
    switch (code) {
      case "ResolveResourceUrlFailedError":
        return status(error.kyRes.status, error.message)
      case "UnauthorizedError":
        return status(error.kyRes.status, error.message)
      case "ExternalServiceError":
        return status(500, error.message)
    }
  })
  .use(cron({
    name: 'downloadStatusAndCleanupFinishedTasks',
    pattern: Patterns.everySeconds(10),
    run() {
      return new Promise(async (res, rej) => {
        // prepare for gopeed task clean-up function
        res(undefined)
      })
    }
  }))
  .post(`/modelVersion`,
    async ({ body }) => {
      const { modelVersionId, model } = body;
      const settings = getSettings()
      const requester = getRequester()
      // check gopeed server status
      const gopeedRes = await requester.get(`${settings.gopeedHost}/api/v1/info`)
      if (!gopeedRes.ok) {
        throw new ExternalServiceError(`Failed to connect to gopeed server, please check your network connection, VPN tunnel and Gopeed service status.`)
      }
      const gopeed = getGopeedClient();
      // resolve model file download tasks
      const modelFileDownloadTasks: Array<CreateTaskWithRequest> = []
      const milayout = new ModelIdLayout(settings.basePath, model)
      const mvlayout = milayout.getModelVersionLayout(modelVersionId)

      const modelVersion: ModelVersion = model.modelVersions.find((mv) => mv.id === modelVersionId) as ModelVersion;
      modelVersion.files.map(async (file) => {
        const res = await requester.get(makeModelFileDownloadUrl(file.downloadUrl, settings.civitaiToken), {
          throwHttpErrors: false,
        });
        if (res.ok) {
          modelFileDownloadTasks.push({
            req: { url: res.url },
            opt: { name: mvlayout.getFileName(file.id), path: mvlayout.getFileDirPath() }
          })
        }
        switch (res.status) {
          case 401:
            throw new UnauthorizedError(`Unauthorized to access model file download url: ${file.downloadUrl},\nmay you have to purchase the model on civitai.`, res)
          // case 408:
          // Timeout
          default:
            throw new ResolveResourceUrlFailedError(`Failed to resolve model file download url: ${file.downloadUrl},\nplease try again later.`, res)
        }
      })
      // resolve media file download tasks
      const mediaTasks: CreateTaskBatch = { opt: { path: getMediaDir(settings.basePath) }, reqs: modelVersion.images.map((img) => ({ url: img.url })) }
      // Download Start
      // 1. save json data
      await Bun.file(milayout.getApiInfoJsonPath()).write(JSON.stringify(model, null, 2))
      await Bun.file(mvlayout.getApiInfoJsonPath()).write(JSON.stringify(modelVersion, null, 2))
      // 2. download model files
      const modelfileTasksId: Array<string> = []
      modelFileDownloadTasks.map(async (task) => {
        const taskId = await gopeed.createTask(task)
        modelfileTasksId.push(taskId)
      })
      // 3. download media files
      const mediaTasksId = await gopeed.createTaskBatch(mediaTasks)
      // 4. upsert model info to db
      const records = await upsertOneModelVersion(model, modelVersion)
      // 5. return tasks info
      return {
        modelfileTasksId,
        mediaTasksId
      }
    }, {
    body: type({ modelVersionId: "number", model: model }),
    response: type({ modelfileTasksId: type("string[]"), mediaTasksId: type("string[]") })
  })
