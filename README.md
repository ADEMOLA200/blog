# RumptyCloud Blog

The official RumptyCloud blog, built with Astro and Markdown content collections.

## Local development

Use Node.js 24. If you use `nvm`, the repository includes an `.nvmrc` file:

```bash
nvm use
npm install
npm run dev
```

Astro serves the site at `http://localhost:4321` by default.

## Production build

```bash
npm run build
npm run preview
```

The static production site is generated in `dist/`.

## Add a post

Create a Markdown or MDX file in `src/content/posts/`. Every post must provide the fields defined in `src/content.config.ts`:

```yaml
---
title: "Post title"
description: "A concise search and social description."
publishedDate: 2026-08-04
author: "RumptyCloud Team"
authorType: "Organization"
cover: "/images/example-banner.png"
coverWidth: 1200
coverHeight: 630
coverAlt: "Accessible description of the banner"
tags:
  - "Deployment"
draft: false
---
```

The filename becomes the URL slug. For example, `first-deployment.md` is published at `/blog/first-deployment/`.

## Site URL

The default canonical origin is `https://blog.rumptycloud.com`. Override it at build time when needed:

```bash
SITE_URL=https://example.com npm run build
```

## Journal design

The Journal uses the supplied RumptyCloud reference design. Illustrations, licensed
self-hosted fonts, styles, and browser scripts live in `public/journal/`. Shared
Astro components render navigation, search, cards, and the footer. Edit source
files rather than generated files in `dist/`.

Posts can optionally set `card` and `hero` image paths; both fall back to `cover`.
The first tag supplies the topic filter. Counts, reading times, search results,
article contents, and related builds are generated from published posts. Search
opens with the search button or `/`; article code blocks have copy buttons.
The existing `/blog/<slug>/` routes, RSS feed, sitemap, and SEO metadata are retained.

The archive paginates four notes at a time with shareable `?page=2` URLs.
Topic filters reset to page one; search covers every published note. With
JavaScript disabled, all notes remain visible and pagination is hidden.

## Search and social previews

`cover` is the social preview image for Open Graph, Twitter, and article structured
data; `coverAlt` describes it. Set `coverWidth` and `coverHeight` to the actual
pixel dimensions. Current posts use the new Journal artwork. Set `authorType` to
`Person` for named authors or `Organization` for the team. Keep descriptions and
publication/update dates accurate; do not change dates just to imply freshness.

The built HTML contains article, breadcrumb, website, publisher, and image
structured data. Full post text, headings, and archive links are available without
JavaScript. The 404 page is marked `noindex`. Check deployed URLs in Search Console
and the Rich Results Test after release; social services may retain cached previews
until their next fetch.
