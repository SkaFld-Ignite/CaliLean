import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { PostResyncSchema } from "./admin/erp/resync/validators"

export default defineMiddlewares({
  routes: [
    {
      method: ["POST"],
      bodyParser: { preserveRawBody: true },
      matcher: "/erp*",
    },
    {
      matcher: "/admin/erp/resync",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostResyncSchema)],
    },
  ],
})
