import type { AstroIntegration } from "astro";

export interface FlareDocsOptions {
	components: {
		documentationPage: string
	}
}

export default function flareDocsIntegration(): AstroIntegration {
	console.log("here")
	return {
		name: "flareDocs",
		hooks: {
			"astro:config:setup": async ({ injectRoute }) => {
				console.log()
				injectRoute({
					pattern: "/docs/[...slug]",
					entryPoint: "@vl07/flare-docs/package/docPage.astro"
				})
			}
		}
	}
}