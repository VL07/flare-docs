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
	isIndex: boolean,
	[key: string]: unknown
}

export type AnyRoute = Route | IndexRoute

export interface IndexRoute {
	doc: Doc | undefined,
	id: string,
	name: string,
	fullSlug: string,
	versionSlug: string | undefined,
	pathSlug: string,
	children: AnyRoute[],
	isEmpty: boolean,
	isIndex: boolean,
	[key: string]: unknown
}

interface Path extends GetStaticPathsItem {
	params: { slug: string | undefined },
	props: Route,
}

interface IndexPath extends GetStaticPathsItem {
	params: { slug: string | undefined },
	props: IndexRoute
}

function normalizeSlug(slug: string): string {
	if (slug.endsWith("/index")) {
		slug = slug.slice(0, -"/index".length)
	} else if (slug === "index") {
		return ""
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
			pathSlug: extractPathSlug(normalizeSlug(doc.slug)),
			isIndex: doc.id.endsWith("index.md")
		}
	})

	return routes
}

export const routes: Route[] = getPages()

function getFileName(path: string): string {
	const fullFile = path.split("/").at(-1)
	if (!fullFile) {
		return path.split(".").slice(0, -1).join(".")
	}

	return fullFile.split(".").slice(0, -1).join(".")
}

interface TemporaryRouteGroup {
	doc: Doc | undefined,
	name: string,
	id: string,
	fullSlug: string,
	versionSlug: string | undefined,
	pathSlug: string,
	children: TemporaryRouteGroup[],
	isIndex: boolean
}

function parseTemporaryRouteGroup(group: TemporaryRouteGroup): IndexRoute | Route {
	return {
		doc: group.doc,
		id: group.id,
		name: group.name,
		fullSlug: group.fullSlug,
		versionSlug: group.versionSlug,
		pathSlug: group.pathSlug,
		isEmpty: group.doc ? group.doc.body.trim() === "" : true,
		children: group.children.map(child => parseTemporaryRouteGroup(child)),
		isIndex: group.isIndex
	}
}

function sortDocGroups(unsortedGroups: AnyRoute[]): AnyRoute[] {
	for (const group of unsortedGroups) {
		if (!group.children) {
			continue
		}

		group.children = sortDocGroups((group as IndexRoute).children)
	}

	return unsortedGroups.sort((a, b) => {
		if ((!a.doc || !a.doc.data.index) && (!b.doc || !b.doc.data.index)) {
			return 0
		}

		if (!a.doc || !a.doc.data.index) {
			return 1
		}

		if (!b.doc || b.doc.data.index) {
			return -1
		}

		return a.doc.data.index - b.doc.data.index
	})
}

function getDocGroups(): AnyRoute[] {
	const temporaryRoutes: TemporaryRouteGroup[] = []

	for (const route of routes) {
		const isIndex = getFileName(route.id) === "index"
		const path = route.id.split("/").slice(0, -1).join("/")

		const directories = (isIndex ? path : route.id.split(".").slice(0, -1).join(".")).split("/")
		let parent: TemporaryRouteGroup[] = temporaryRoutes
		let index: number = 0
		let currentPath = ""
		for (const directory of directories) {
			currentPath = currentPath ? currentPath + "/" + directory : directory

			if (index === directories.length - 1) {
				const selfRoute = temporaryRoutes.find(temporaryRoute => temporaryRoute.name === directory)

				if (!selfRoute) {
					parent.push({
						doc: route.doc,
						name: directory,
						id: route.doc.id,
						fullSlug: route.fullSlug,
						versionSlug: route.versionSlug,
						pathSlug: route.pathSlug,
						isIndex: isIndex,
						children: []
					})
				} else {
					selfRoute.doc = route.doc
				}

				break
			}

			const nextRoute = temporaryRoutes.find(temporaryRoute => temporaryRoute.name === directory)
			if (!nextRoute) {
				const children: TemporaryRouteGroup[] = []

				parent.push({
					doc: undefined,
					name: directory,
					children: children,
					id: currentPath,
					fullSlug: normalizeSlug(currentPath),
					versionSlug: extractPathSlug(normalizeSlug(currentPath)),
					pathSlug: extractPathSlug(normalizeSlug(currentPath)),
					isIndex: true
				})

				parent = children
			} else {
				parent = nextRoute.children
			}

			index += 1
		}
	}

	const parsedRoutes = temporaryRoutes.map(route => parseTemporaryRouteGroup(route))

	const sortedRoutes = sortDocGroups(parsedRoutes)

	return sortedRoutes
}

export const groups: AnyRoute[] = getDocGroups()

function findGroupWithoutIndex(group: AnyRoute): IndexRoute[] {
	const groupsWithoutIndex: IndexRoute[] = []

	if (!group.doc) {
		groupsWithoutIndex.push(group as IndexRoute)
	}

	if (!group.children) {
		return groupsWithoutIndex
	}

	for (const child of (group as IndexRoute).children) {
		groupsWithoutIndex.concat(findGroupWithoutIndex(child))
	}

	return groupsWithoutIndex
}

function getDocGroupsWithoutIndex(): IndexRoute[] {
	let groupsWithoutIndex: IndexRoute[] = []

	for (const group of groups) {
		groupsWithoutIndex = groupsWithoutIndex.concat(findGroupWithoutIndex(group))
	}

	return groupsWithoutIndex
}

export const groupsWithoutIndex: IndexRoute[] = getDocGroupsWithoutIndex()

function findGroupIndex(group: AnyRoute): IndexRoute[] {
	const groupsIndex: IndexRoute[] = []

	if (!group.isIndex) {
		return groupsIndex
	}

	groupsIndex.push(group as IndexRoute)

	for (const child of (group as IndexRoute).children) {
		groupsIndex.concat(findGroupIndex(child))
	}

	return groupsIndex
}

function getDocGroupIndex(): IndexRoute[] {
	let groupIndex: IndexRoute[] = []

	for (const group of groups) {
		groupIndex = groupIndex.concat(findGroupIndex(group))
	}

	return groupIndex
}

export const groupIndexRoutes: IndexRoute[] = getDocGroupIndex()

function getPaths(): Path[] {
	return routes.filter(route => !route.isIndex).map(route => {
		return {
			params: {
				slug: route.fullSlug === "" ? undefined : route.fullSlug
			},
			props: route
		}
	})
}

export const paths: Path[] = getPaths()

function getIndexPaths(indexRoutes: IndexRoute[]): IndexPath[] {
	let pathsMapped: IndexPath[] = []

	for (const route of indexRoutes) {
		let routes = [
			{
				params: {
					slug: route.fullSlug === "" ? undefined : route.fullSlug
				},
				props: route
			}
		]

		routes = routes.concat(getIndexPaths(route.children.filter(child => child.isIndex) as IndexRoute[]))

		pathsMapped = pathsMapped.concat(routes)
	}

	return pathsMapped
}

export const indexPaths: IndexPath[] = getIndexPaths(groupIndexRoutes)

export const allPaths: (Path | IndexPath)[] = (paths as (Path | IndexPath)[]).concat(indexPaths)

console.log(indexPaths)
console.log(allPaths)