import type { AstroIntegration } from "astro";

export interface FlareDocsOptions {
	customPages?: {
		docPage?: string,
		indexPage?: string
	}
}

export let options: FlareDocsOptions

export default function flareDocsIntegration(passedOptions: FlareDocsOptions): AstroIntegration {
	options = passedOptions

	return {
		name: "flareDocs",
		hooks: {
			"astro:config:setup": async ({ injectRoute }) => {
				injectRoute({
					pattern: "/docs/[...slug]",
					entryPoint: passedOptions.customPages?.docPage || "@vl07/flare-docs/package/index.astro"
				})
			}
		}
	}
}