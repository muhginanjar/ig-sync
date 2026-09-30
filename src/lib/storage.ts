import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
