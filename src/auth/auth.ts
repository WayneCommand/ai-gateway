import {Context} from "hono";

// 基于 bearer 的委托认证
export async function bearer(token: string, c: Context): Promise<boolean> {
    return token === 'cloudflare_ai'
}