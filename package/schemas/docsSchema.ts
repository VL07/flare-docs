import { z } from "zod";

export default function docsSchema() {
	return z.object({
		title: z.string().optional(),
		description: z.string().optional(),
		index: z.number().optional()
	})
}