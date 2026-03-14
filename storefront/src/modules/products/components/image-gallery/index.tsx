import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  return (
    <div className="flex flex-col gap-4">
      {images.map((image, index) => (
        <div
          key={image.id}
          className="relative aspect-square w-full overflow-hidden bg-gray-50 rounded-lg"
          id={image.id}
        >
          {!!image.url && (
            <Image
              src={image.url}
              priority={index === 0}
              alt={`Product image ${index + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default ImageGallery
