import { pgTable, pgEnum, text, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("share_role", ["viewer", "editor"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
});

// Content is stored as sanitized HTML (what the editor emits). See ARCHITECTURE.md.
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  title: text("title").notNull().default("Untitled document"),
  contentHtml: text("content_html").notNull().default("<p></p>"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const documentShares = pgTable(
  "document_shares",
  {
    documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("editor"),
  },
  (t) => [primaryKey({ columns: [t.documentId, t.userId] })]
);
