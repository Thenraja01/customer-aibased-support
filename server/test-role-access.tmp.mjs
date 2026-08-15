import mongoose from "mongoose";
import env from "./config/env.js";
import { verifyAccess, searchWithScope, getRoleFilter } from "./modules/rag/rag.service.js";
import Organization from "./modules/organization/organization.schema.js";
import { chromaService } from "./config/chroma.js";

async function testRole(orgId, roleName, roleId) {
  console.log(`\n=== roleName=${roleName} roleId=${roleId} ===`);
  const access = await verifyAccess(orgId, roleName, roleId);
  console.log("verifyAccess:", JSON.stringify(access, null, 2));

  if (!access.authorized || !access.accessScope) {
    console.log("Skipping search: Not authorized or inactive");
    return;
  }

  try {
    const res = await searchWithScope("What are your shipment times?", orgId, access.accessScope, 5, null, null);
    console.log("chunks:", res.document_results.length);
    for (const r of res.document_results.slice(0, 3)) {
      console.log(`  score=${r.score.toFixed(4)} chunk=${r.chunk_index} doc=${r.document_id} content=${r.content.substring(0, 50)}...`);
    }
  } catch (err) {
    console.log("Search error (likely Chroma offline):", err.message);
  }
}

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  try {
    await chromaService.init();
  } catch (err) {
    console.log("Chroma DB init failed/skipped:", err.message);
  }
  
  const orgId = "6a76dc1ac5cf8ff9f45ee94f";
  console.log(`Testing using Org ID: ${orgId}`);

  console.log("roleFilter(customer):", JSON.stringify(getRoleFilter("customer")));
  console.log("roleFilter(support):", JSON.stringify(getRoleFilter("support")));
  console.log("roleFilter(public):", JSON.stringify(getRoleFilter("public")));
  await testRole(orgId, "customer", "support");
  await testRole(orgId, "support", "support");
  await testRole(orgId, "customer", null);
  await testRole(orgId, "support", null);
  await testRole(orgId, "customer", undefined);
  await testRole(orgId, "public", null);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
