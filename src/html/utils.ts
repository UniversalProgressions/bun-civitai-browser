import { treaty } from "@elysiajs/eden";

import type { App } from "../modules/index";

export const edenTreaty = treaty<App>(window.location.origin);
