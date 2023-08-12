import { z } from "zod";

export default function docsSchema() {
	return z.object({
		title: z.string()
	})
}