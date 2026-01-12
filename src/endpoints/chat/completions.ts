import {OpenAPIRoute} from "chanfana";
import {AppContext, ChatCompletions} from "../../types";

export class ChatCompletionsEndpoint extends OpenAPIRoute {

    schema = {
        tags: ["Chat"],
        summary: "Chat completions endpoint",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: ChatCompletions,
                    },
                }
            }
        }
    }

    async handle(c: AppContext) {
        // Get validated data
        const data = await this.getValidatedData<typeof this.schema>();

        // Retrieve the validated request body
        const completions = data.body;

        // write log to betterstack.
        await logs(completions, c.env.LOGS_TOKEN);

        // Implement your own object insertion here
        // 兼容 NextChat
        if (!completions.model.startsWith("@")) completions.model = "@" + completions.model;

        let res: Response;
        // 如果是 Github Models
        // @gh/openai/gpt-4o
        // @gh/meta/meta-llama-3.1-405b-instruct
        if (completions.model.startsWith("@gh/")) {
            res = await github(completions, c.env)

            // 如果是 SiliconFlow Models
            // @sf/siliconflow/siliconflow-llama-3.1-405b-instruct
        }else if (completions.model.startsWith("@sf/")) {
            res = await siliconflow(completions, c.env);
        } else {
            res = await cloudflare(completions, c.env);
        }


        // Return
        if (res) {
            // add non stream support
            if (completions.stream) {
                // https://blog.cloudflare.com/workers-ai-streaming
                return new Response(res.body,
                    {headers: {"content-type": "text/event-stream"}}
                );
            }else {
                return res;
            }
        }

        return Response.json({
            success: false,
            error: "Model not found"
        }, {status: 404});
    }



}

async function github(body: any, env: Env) {
    // to gh model.
    body.model = body.model.match(/[^/]+$/)?.[0] || body.model;

    const fetchOptions = buildRequestOptions(body, env.GITHUB_API_KEY);

    return await fetch(
        `https://models.inference.ai.azure.com/chat/completions`,
        fetchOptions
    );
}

async function cloudflare(body: any, env: Env) {
    // 如果值 0/-1，手动再设置一下 max_tokens
    if (!body.max_tokens) body.max_tokens = 2048
    if (body.max_tokens < 2048) body.max_tokens = 2048

    const fetchOptions = buildRequestOptions(body, env.CLOUDFLARE_API_KEY)

    // this.lastRequestId = res.headers.get('cf-ai-req-id');

    return await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
        fetchOptions
    );
}

async function siliconflow(body: any, env: Env) {

    // to siliconflow model.
    body.model = body.model.replace(/^@sf\//, '');

    const fetchOptions = buildRequestOptions(body, env.SILICONFLOW_API_KEY);

    return await fetch(
        `https://api.siliconflow.cn/v1/chat/completions`,
        fetchOptions
    );
}

/**
 * curl -X POST \
 *   -H 'Content-Type: application/json' \
 *   -H 'Authorization: Bearer yY1BJdu3DG7RzeYvp2MJ4nQk' \
 *   -d '{"dt":"'"$(date -u +'%Y-%m-%d %T UTC')"'","message":"Hello from Better Stack!"}' \
 *   --insecure \
 *   https://s1671544.eu-nbg-2.betterstackdata.com
 * @param event
 * @param token
 */
async function logs(event: any, token: string) {
    console.log(`ai-gateway call [${event.model}]`, event);
    await fetch("https://in.logs.betterstack.com", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
            dt: new Date().toISOString(),
            message: `ai-gateway call [${event.model}] model`,
            event: event
        })
    })
}


function buildRequestOptions(body: any, token: string) {
    console.debug("content: ", body);
    return {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': `application/json`
        }
    };
}