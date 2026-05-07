import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import multer from "multer"
import { PostStoreCreateRestockSubscription } from "./store/restock-subscriptions/validators"

// COA upload
const coaUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // 25 MB — COA PDFs are normally < 5 MB; chromatogram PDFs can be larger.
    fileSize: 25 * 1024 * 1024,
    files: 1,
  },
})

export default defineMiddlewares({
  routes: [
    // --- COA Upload ---
    {
      method: ["POST"],
      matcher: "/admin/products/:id/coa/files",
      middlewares: [coaUpload.single("file")],
    },
    // --- Restock Subscriptions ---
    {
      matcher: "/store/restock-subscriptions",
      method: "POST",
      middlewares: [
        authenticate("customer", ["bearer", "session"], {
          allowUnauthenticated: true,
        }),
        validateAndTransformBody(PostStoreCreateRestockSubscription),
      ],
    },
  ],
})
