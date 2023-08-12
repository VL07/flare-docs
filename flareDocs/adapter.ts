import type { AstroConfig, AstroIntegration, GetStaticPathsResult, Props } from "astro";

export interface FlareDocsOptions {
	components: {
		documentationPage: string
	}
}

export default function flareDocsIntegration(): AstroIntegration {
	return {
		name: "flareDocs",
		hooks: {
			"astro:config:setup": async ({ injectRoute }) => {
				console.log("Starting setup")

				injectRoute({
					pattern: "/docs/[...path]",
					entryPoint: "./flareDocs/pages/[...path].astro"
				})
			}
		}
	}
}