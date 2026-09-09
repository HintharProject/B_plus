import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, describe, it } from "vitest";

let environment: RulesTestEnvironment;

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: "b-plus-rules-test",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync(resolve("firestore.rules"), "utf8"),
    },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, "users/alice"), { displayName: "Alice" }),
      setDoc(doc(db, "users/bob"), { displayName: "Bob" }),
      setDoc(doc(db, "requestPrivate/request-1"), { preciseDestination: { address: "Private" } }),
      setDoc(doc(db, "matches/match-1"), {
        requesterId: "alice",
        candidateId: "bob",
        organizationId: null,
        status: "PENDING",
      }),
      setDoc(doc(db, "auditLogs/audit-1"), { actorId: "alice", action: "TEST" }),
    ]);
  });
});

afterAll(async () => {
  await environment.cleanup();
});

describe("deny-by-default Firestore rules", () => {
  it("allows a user to read their own account but not another account", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    await assertSucceeds(getDoc(doc(alice, "users/alice")));
    await assertFails(getDoc(doc(alice, "users/bob")));
  });

  it("denies client writes even to the user's own account", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(alice, "users/alice"), { roles: ["ADMIN"] }));
  });

  it("allows match participants to read the limited match", async () => {
    const bob = environment.authenticatedContext("bob").firestore();
    await assertSucceeds(getDoc(doc(bob, "matches/match-1")));
  });

  it("never exposes private request data directly", async () => {
    const bob = environment.authenticatedContext("bob").firestore();
    await assertFails(getDoc(doc(bob, "requestPrivate/request-1")));
  });

  it("restricts audit logs to a server-issued admin claim", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    const admin = environment.authenticatedContext("admin", { admin: true }).firestore();
    await assertFails(getDoc(doc(alice, "auditLogs/audit-1")));
    await assertSucceeds(getDoc(doc(admin, "auditLogs/audit-1")));
  });
});
