import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import {
  PostGenerateImageSchema,
  PostShootSchema,
  PostShootViewSchema,
} from "./admin/ai-studio/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/ai-studio",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostGenerateImageSchema)],
    },
    {
      matcher: "/admin/ai-studio/shoot",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostShootSchema)],
    },
    {
      matcher: "/admin/ai-studio/shoot/:view",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostShootViewSchema)],
    },
  ],
})
