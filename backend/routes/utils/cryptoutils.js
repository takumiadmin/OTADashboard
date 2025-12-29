import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";
import { EncryptCommand } from "@aws-sdk/client-kms";

const kmsClient = new KMSClient({ region: "ap-south-1" }); // Replace with your AWS region

export const decryptPassword = async (encryptedPassword) => {
    try {
        const command = new DecryptCommand({
            CiphertextBlob: Buffer.from(encryptedPassword, 'base64')
        });
        const { Plaintext } = await kmsClient.send(command);
        console.log("🔓 Password decrypted successfully");
        return Buffer.from(Plaintext).toString('utf-8');
    } catch (error) {
        console.error("❌ Decryption error:", error);
        throw new Error("Decryption failed");
    }
};
export const encryptPassword = async (password) => {
    try {
        const command = new EncryptCommand({
            KeyId: "// Replace with your actual KMS Key ID or alias", // Replace with your actual KMS Key ID or alias
            Plaintext: Buffer.from(password, "utf-8")
        });

        const { CiphertextBlob } = await kmsClient.send(command);
        console.log("🔐 Password encrypted successfully");
        return Buffer.from(CiphertextBlob).toString("base64");
    } catch (error) {
        console.error("❌ Encryption error:", error);
        throw new Error("Encryption failed");
    }
};
