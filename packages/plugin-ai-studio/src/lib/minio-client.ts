import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"

let s3Client: S3Client | null = null

function getClient(): S3Client {
  if (s3Client) return s3Client

  const endpoint = process.env.MINIO_ENDPOINT
  const accessKey = process.env.MINIO_ACCESS_KEY
  const secretKey = process.env.MINIO_SECRET_KEY

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error(
      "MinIO not configured — set MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY"
    )
  }

  s3Client = new S3Client({
    endpoint: `https://${endpoint}`,
    region: "us-east-1",
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true,
  })
  return s3Client
}

function getBucket(): string {
  return process.env.MINIO_BUCKET || "medusa-media"
}

export async function uploadToMinio(
  key: string,
  body: Buffer,
  contentType = "image/jpeg"
): Promise<string> {
  const client = getClient()
  const bucket = getBucket()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
    })
  )

  return `https://${process.env.MINIO_ENDPOINT}/${bucket}/${key}`
}

export async function fetchFromMinio(key: string): Promise<Buffer | null> {
  try {
    const client = getClient()
    const result = await client.send(
      new GetObjectCommand({ Bucket: getBucket(), Key: key })
    )

    if (!result.Body) return null

    const chunks: Uint8Array[] = []
    for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  } catch {
    return null
  }
}
