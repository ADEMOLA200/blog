import type { CollectionEntry } from "astro:content";

export function noteInfo(post: CollectionEntry<"posts">) {
  const topic = post.data.tags[0] ?? "Notes";
  const cat = topic === "Virtual Machines" ? "vm" : topic.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const minutes = Math.max(1, Math.ceil((post.body?.trim().split(/\s+/).length ?? 0) / 220));
  const date = post.data.publishedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  return { title: post.data.title, href: `/blog/${post.id}/`, cat, topic, minutes, date,
    meta: `${post.data.author} · ${date} · ${minutes} min`,
    card: post.data.card ?? post.data.cover,
    hero: post.data.hero ?? post.data.cover,
  };
}
