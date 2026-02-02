import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from 'nanoid'

export const s3 = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const uploadFile = async (file: File) => {
    try {
        const key = `${nanoid(6)}-${file.name}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: file.type || "application/pdf",
                ContentDisposition: `attachment`,
            })
        );

        return {
            success: true,
            key,
        };
    } catch (error) {
        console.error("S3 upload failed:", error);

        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown upload error",
        };
    }
};

export const deleteFile = async (key: string) => {
    try {
        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
            })
        );

        return {
            success: true,
        };
    } catch (error) {
        console.error("S3 delete failed:", error);

        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown delete error",
        };
    }
};

export const getPresignedUrl = async (key: string) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });

    return await getSignedUrl(s3, command, { expiresIn: 3600 });
};
