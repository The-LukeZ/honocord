# TODO

- Add support for sending files
- Fix docs and typing for this pattern:
  ```ts
  import type { Context } from "hono";
  import { BaseHonocordEnv } from "honocord";
  import { DBHelper } from "./db";
  
  export type HonoVariables = { db?: DBHelper };
  export type HonoEnv = BaseHonocordEnv<Cloudflare.Env, HonoVariables>;
  export type MyContext = Context<{
    Bindings: Cloudflare.Env;
    Variables: HonoVariables;
  }>;
  ```
