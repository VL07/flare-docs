import type { MarkdownInstance } from "astro"

export interface DocPage {
	title: string
}

export type DocPageProps = MarkdownInstance<DocPage> & { sidebar: Sidebar, path: string }

export interface SidebarItem {
	title: string,
	path: string,
	children: Sidebar,
	position: number,
	visible: boolean,
	sidebarName: string,
	childrenArray: SidebarItem[],
	lastPath: string
}

export type Sidebar = Record<string, SidebarItem>