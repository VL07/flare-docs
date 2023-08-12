import type { GetStaticPathsItem, MarkdownHeading } from "astro";
import type { AstroComponentFactory } from "astro/dist/runtime/server";
import { getCollection } from "astro:content"

const docsCollection = await getCollection("docs")

export interface Doc {
    id: string,
    slug: string,
    body: string,
    collection: string,
    data: any,
	render(): Promise<{
        Content: AstroComponentFactory,
        headings: MarkdownHeading[],
	}>
}

export interface Route {
	doc: Doc,
	id: string,
	fullSlug: string,
	versionSlug: string | undefined,
	pathSlug: string,
	[key: string]: unknown
}

interface Path extends GetStaticPathsItem {
	params: { slug: string | undefined };
	props: Route;
}

function normalizeSlug(slug: string): string {
	if (slug.endsWith("/index")) {
		slug = slug.slice(0, -"/index".length)
	}

	return slug
}

function extractVersionSlug(slug: string): string | undefined {
	if (slug.startsWith("v")) {
		return slug.split("/")[0]
	}

	return undefined
}

function extractPathSlug(slug: string): string {
	const versionSlug = extractVersionSlug(slug)

	if (versionSlug) {
		return slug.slice(versionSlug.length)
	}

	return slug
}

function getPages(): Route[] {
	const routes: Route[] = docsCollection.map(doc => {
		return {
			doc: doc,
			id: doc.id,
			fullSlug: normalizeSlug(doc.slug),
			versionSlug: extractVersionSlug(normalizeSlug(doc.slug)),
			pathSlug: extractPathSlug(normalizeSlug(doc.slug))
		}
	})

	return routes
}

export const routes: Route[] = getPages()

function getPaths(): Path[] {
	return routes.map(route => {
		return {
			params: {
				slug: route.fullSlug
			},
			props: route
		}
	})
}

export const paths: Path[] = getPaths()