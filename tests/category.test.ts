import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import type { Request } from "express";
import { prisma } from "../src/lib/prisma";
import { categoryService } from "../src/modules/category/category.service";
import { categoryValidation, categorySlug } from "../src/modules/category/category.validation";

const restorers: (() => void)[] = [];
function stub(target: object, key: string, implementation: (...args: any[]) => any) {
  const original = Reflect.get(target, key);
  const replacement = mock.fn(implementation);
  Reflect.set(target, key, replacement);
  restorers.push(() => { Reflect.set(target, key, original); });
  return replacement;
}
afterEach(() => { while (restorers.length) restorers.pop()!(); });
const request = (body: unknown) => ({body}) as Request;

test("category validation rejects whitespace names, invalid booleans, URLs and review states", () => {
  assert.ok(categoryValidation.createCategory(request({name: "  "})).length);
  assert.ok(categoryValidation.updateCategory(request({isActive: "false"})).length);
  assert.ok(categoryValidation.updateCategory(request({image: "javascript:alert(1)"})).length);
  assert.ok(categoryValidation.reviewSuggestion(request({status: "PENDING"})).length);
  assert.equal(categoryValidation.createCategory(request({name: "Camping"})).length, 0);
  assert.equal(categorySlug("  Water   Sports  "), "water-sports");
  assert.ok(categorySlug("ক্যাম্পিং"));
});

test("public lists only active categories; admin can include inactive", async () => {
  const calls: unknown[] = [];
  stub(prisma.category, "findMany", async (args: unknown) => {calls.push(args); return [];});
  await categoryService.getAllCategories();
  await categoryService.getAllCategories(true);
  assert.deepEqual((calls[0] as {where: unknown}).where, {isActive: true});
  assert.deepEqual((calls[1] as {where: unknown}).where, {});
});

test("create normalises names and blocks existing categories including inactive ones", async () => {
  stub(prisma.category, "findFirst", async () => ({id: "existing", isActive: false}));
  const create = stub(prisma.category, "create", async () => {throw new Error("must not create");});
  await assert.rejects(categoryService.createCategory({name: " camping "}), /already exists/);
  assert.equal(create.mock.callCount(), 0);
});

test("delete blocks categories with gear, preserving listings and rental history", async () => {
  stub(prisma.category, "findUnique", async () => ({id: "used", _count: {gearItems: 2}}));
  const remove = stub(prisma.category, "delete", async () => ({}));
  await assert.rejects(categoryService.deleteCategory("used"), /Deactivate it instead/);
  assert.equal(remove.mock.callCount(), 0);
});

test("unused categories can be deleted", async () => {
  stub(prisma.category, "findUnique", async () => ({id: "unused", _count: {gearItems: 0}}));
  const remove = stub(prisma.category, "delete", async () => ({}));
  await categoryService.deleteCategory("unused");
  assert.equal(remove.mock.callCount(), 1);
});

test("rename keeps the slug stable and ignores extra payload fields", async () => {
  stub(prisma.category, "findUnique", async () => ({id: "one", slug: "camping"}));
  stub(prisma.category, "findFirst", async () => null);
  let data: Record<string, unknown> = {};
  stub(prisma.category, "update", async (args: {data: Record<string, unknown>}) => {data = args.data; return data;});
  await categoryService.updateCategory("one", {name: " Camping equipment ", isActive: false, gearItems: {deleteMany: {}}} as never);
  assert.equal(data.name, "Camping equipment");
  assert.equal(data.slug, undefined);
  assert.equal(data.isActive, false);
  assert.equal("gearItems" in data, false);
});

test("provider suggestion lists are restricted to the requesting provider", async () => {
  let where: unknown;
  stub(prisma.categorySuggestion, "findMany", async (args: {where: unknown}) => {where = args.where; return [];});
  await categoryService.getSuggestions("provider-a");
  assert.deepEqual(where, {providerId: "provider-a"});
});

test("duplicate pending suggestions are rejected", async () => {
  stub(prisma.category, "findFirst", async () => null);
  stub(prisma.categorySuggestion, "findFirst", async () => ({id: "pending"}));
  await assert.rejects(categoryService.suggestCategory("provider-a", {name: "Climbing"}), /awaiting review/);
});

test("approval uses a transaction and links an active category", async () => {
  const tx = {
    categorySuggestion: {
      updateMany: async () => ({count: 1}),
      findUniqueOrThrow: async () => ({id: "suggestion", name: "Climbing", slug: "climbing", description: "Climbing gear"}),
      update: async (args: unknown) => args,
    },
    category: {findFirst: async () => null, create: async () => ({id: "new-category"})},
  };
  stub(prisma, "$transaction", async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
  const result = await categoryService.reviewSuggestion("suggestion", "APPROVED");
  assert.deepEqual(result, {where: {id: "suggestion"}, data: {categoryId: "new-category"}});
});

test("already reviewed suggestions cannot be processed twice", async () => {
  const tx = {categorySuggestion: {updateMany: async () => ({count: 0})}};
  stub(prisma, "$transaction", async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
  await assert.rejects(categoryService.reviewSuggestion("reviewed", "APPROVED"), /already reviewed/);
});

test("rejection never creates a category", async () => {
  const rejected = {id: "suggestion", status: "REJECTED"};
  const tx = {categorySuggestion: {updateMany: async () => ({count: 1}), findUniqueOrThrow: async () => rejected}};
  stub(prisma, "$transaction", async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
  assert.deepEqual(await categoryService.reviewSuggestion("suggestion", "REJECTED"), rejected);
});


test("HTTP routes enforce admin/provider roles, ownership and request validation", async () => {
  const {default: express} = await import("express");
  const {categoryRoutes} = await import("../src/modules/category/category.route");
  const {jwtUtils} = await import("../src/utils/jwt");
  stub(jwtUtils, "verifyToken", (token: string) => ({success: true, data: {id: token, role: token}}));
  stub(prisma.user, "findUnique", async ({where}: {where: {id: string}}) => ({id: where.id, name: "Test", email: "test@example.invalid", role: where.id, status: "ACTIVE"}));
  const created = stub(categoryService, "createCategory", async () => ({id: "category", name: "Camping"}));
  stub(categoryService, "getAllCategories", async () => []);
  let owner: string | undefined;
  stub(categoryService, "getSuggestions", async (providerId?: string) => {owner = providerId; return [];});
  stub(categoryService, "reviewSuggestion", async () => ({status: "APPROVED"}));
  const app = express();
  app.use(express.json()); app.use("/categories", categoryRoutes);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address() as {port: number};
  const send = (path: string, role?: string, method = "GET", body?: unknown) => fetch(`http://127.0.0.1:${address.port}/categories${path}`, {method, headers: {"Content-Type": "application/json", ...(role ? {Authorization: `Bearer ${role}`} : {})}, ...(body ? {body: JSON.stringify(body)} : {})});
  try {
    assert.equal((await send("/manage")).status, 401);
    assert.equal((await send("/manage", "PROVIDER")).status, 403);
    assert.equal((await send("/manage", "ADMIN")).status, 200);
    assert.equal((await send("", "PROVIDER", "POST", {name: "Camping"})).status, 403);
    assert.equal((await send("", "ADMIN", "POST", {name: " "})).status, 400);
    assert.equal((await send("", "ADMIN", "POST", {name: "Camping"})).status, 201);
    assert.equal(created.mock.callCount(), 1);
    assert.equal((await send("/suggestions", "CUSTOMER")).status, 403);
    assert.equal((await send("/suggestions", "PROVIDER")).status, 200);
    assert.equal(owner, "PROVIDER");
    assert.equal((await send("/suggestions", "ADMIN")).status, 200);
    assert.equal(owner, undefined);
    assert.equal((await send("/suggestions/one", "PROVIDER", "PATCH", {status: "APPROVED"})).status, 403);
    assert.equal((await send("/suggestions/one", "ADMIN", "PATCH", {status: "PENDING"})).status, 400);
    assert.equal((await send("/suggestions/one", "ADMIN", "PATCH", {status: "APPROVED"})).status, 200);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
