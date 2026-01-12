import { fromHono } from "chanfana";
import { Hono } from "hono";
import { bearerAuth } from 'hono/bearer-auth'
import { bearer } from "./auth/auth";
import { ChatCompletionsEndpoint } from "./endpoints/chat/completions";


// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/openapi-doc",
});

// Register Auth Middleware
app.use(
	'/v1/chat/completions',
	bearerAuth({
		verifyToken: bearer,
	})
)

// Register OpenAPI endpoints
openapi.post("/v1/chat/completions", ChatCompletionsEndpoint);


// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;
