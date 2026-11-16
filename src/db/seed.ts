import { db } from "./index";
import { users } from "./schema";

async function main() {
  await db
    .insert(users)
    .values([
      { email: "alice@ajaia.test", name: "Alice" },
      { email: "bob@ajaia.test", name: "Bob" },
      { email: "carol@ajaia.test", name: "Carol" },
    ])
    .onConflictDoNothing();
  console.log("Seeded users: alice@, bob@, carol@ajaia.test");
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
