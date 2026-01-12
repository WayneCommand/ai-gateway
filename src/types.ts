import { DateTime, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const Task = z.object({
	name: Str({ example: "lorem" }),
	slug: Str(),
	description: Str({ required: false }),
	completed: z.boolean().default(false),
	due_date: DateTime(),
});

export const ChatCompletions = z.object({
	model: z.string(),
	stream: z.boolean().optional(),
	max_tokens: z.number().int().optional(),
	temperature: z.number().min(0).max(2).optional(),
	top_p: z.number().min(0).max(1).optional(),
	frequency_penalty: z.number().min(0).max(2).optional(),
	presence_penalty: z.number().min(0).max(2).optional(),
	messages: z.array(z.object({
		role: z.string(),
		content: Str(),
	})),
});