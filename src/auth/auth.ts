import {Context} from "hono";

// 基于 bearer 的委托认证
export async function bearer(token: string, c: Context): Promise<boolean> {

    return await isSecure(token, c.env.CLIENT_KEY)
}

// 我自己的验证服务
async function isSecure(clientKey, secretKey: string): Promise<boolean> {
    let payload = {"ak": clientKey, "sk": secretKey}

    let token = Buffer.from(JSON.stringify(payload)).toString('base64');

    let response = await fetch("https://secure.waynecommand.com/bearer/verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        }
    });

    let result = await response.json() as {success: boolean}

    return result.success
}