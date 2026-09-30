import {
  GetObjectCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function required(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} belum diisi di .env`);
  return v;
}

let client: S3Client | undefined;
function s3() {
  return (client ??= new S3Client({
    region: required("WASABI_REGION"),
    endpoint: required("WASABI_ENDPOINT"),
    credentials: {
      accessKeyId: required("WASABI_ACCESS_KEY_ID"),
      secretAccessKey: required("WASABI_SECRET_ACCESS_KEY"),
    },
    // Newer SDKs add CRC32 checksums by default, which bakes an empty-body
    // checksum into presigned upload URLs and breaks browser uploads.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  }));
}

const bucket = () => required("WASABI_BUCKET");

export async function putObject(key: string, body: Buffer, contentType: string) {
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function getObject(key: string) {
  return s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
}

/** Temporary public URL, so the bucket itself can stay private. */
export function signedUrl(key: string, expiresInSec = 2 * 60 * 60) {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key }), {
    expiresIn: expiresInSec,
  });
}

/** Lets the admin page upload a file straight from the browser to Wasabi. */
export function signedUploadUrl(key: string, contentType: string, expiresInSec = 60 * 60) {
  return getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }),
    { expiresIn: expiresInSec },
  );
}

/** Size of a stored object, or undefined if it doesn't exist. */
export async function objectSize(key: string) {
  try {
    const head = await s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return head.ContentLength;
  } catch {
    return undefined;
  }
}

/** Browser uploads (PUT) and share downloads need CORS on the bucket. */
export async function configureBucketCors(origins: string[]) {
  await s3().send(
    new PutBucketCorsCommand({
      Bucket: bucket(),
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origins,
            AllowedMethods: ["GET", "HEAD", "PUT"],
            AllowedHeaders: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
}
