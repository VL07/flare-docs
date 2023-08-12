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
				injectRoute({
					pattern: "/docs/[...path]",
					entryPoint: "@vl07/flare-docs/package/docsPage.astro"
				})
			}
		}
	}
}