import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { PostGenerateImageSchema } from "./admin/ai-studio/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/ai-studio",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostGenerateImageSchema)],
    },
  ],
})
