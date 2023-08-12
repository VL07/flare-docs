import { defineConfig } from 'astro/config';
import flareDocsIntegration from './flareDocs/adapter';

// https://astro.build/config
export default defineConfig({
	integrations: [
		flareDocsIntegration()
	]
});
