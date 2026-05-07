"use client"

import { useState, useEffect } from "react"
import { getCustomer } from "@lib/data/customer"
import { addProductReview } from "@lib/data/reviews"
import { HttpTypes } from "@medusajs/types"
import { Button, Input, Label, Textarea, toast, Toaster } from "@medusajs/ui"
import { Star, StarSolid } from "@medusajs/icons"

type ProductReviewsFormProps = {
  productId: string
}

export default function ProductReviewsForm({
  productId,
}: ProductReviewsFormProps) {
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [rating, setRating] = useState(0)

  useEffect(() => {
    if (customer) {
      return
    }

    getCustomer().then(setCustomer)
  }, [])

  if (!customer) {
    return <></>
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!content || !rating) {
      toast.error("Error", {
        description: "Please fill in required fields.",
      })
      return
    }

    setIsLoading(true)
    addProductReview({
      title,
      content,
      rating,
      first_name: customer.first_name || "",
      last_name: customer.last_name || "",
      product_id: productId,
    })
      .then(() => {
        setShowForm(false)
        setTitle("")
        setContent("")
        setRating(0)
        toast.success("Success", {
          description:
            "Your review has been submitted and is awaiting approval.",
        })
      })
      .catch(() => {
        toast.error("Error", {
          description:
            "An error occurred while submitting your review. Please try again later.",
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <div className="mt-8">
      {!showForm && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setShowForm(true)}>
            Add a review
          </Button>
        </div>
      )}
      {showForm && (
        <div className="flex flex-col gap-y-4">
          <span className="text-lg font-semibold text-calilean-ink">
            Add a review
          </span>

          <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-2">
              <Label>Title</Label>
              <Input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label>Content *</Label>
              <Textarea
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your experience with this product..."
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label>Rating *</Label>
              <div className="flex gap-x-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Button
                    key={index}
                    variant="transparent"
                    onClick={(e) => {
                      e.preventDefault()
                      setRating(index + 1)
                    }}
                    className="p-0"
                  >
                    {rating >= index + 1 ? (
                      <StarSolid className="text-ui-tag-orange-icon" />
                    ) : (
                      <Star />
                    )}
                  </Button>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={isLoading} variant="primary">
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </div>
      )}
      <Toaster />
    </div>
  )
}
