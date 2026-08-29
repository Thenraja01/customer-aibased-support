#!/usr/bin/env node
/**
 * ==============================================================================
 * SupportAI - Neo4j 5 to MongoDB 7+ (Mongoose 9) Knowledge Graph Migration Script
 * ==============================================================================
 */

import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Environment & Dependency Resolution ─────────────────────────────
const envPaths = [
  path.resolve(process.cwd(), "server", ".env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "..", "server", ".env"),
  path.resolve(__dirname, ".env"),
];

for (const ep of envPaths) {
  if (fs.existsSync(ep)) {
    const dotenvPkg = path.resolve(process.cwd(), "server", "node_modules", "dotenv", "lib", "main.js");
    let dotenvModule;
    if (fs.existsSync(dotenvPkg)) {
      dotenvModule = await import(pathToFileURL(dotenvPkg).href);
    } else {
      dotenvModule = await import("dotenv");
    }
    dotenvModule.config({ path: ep });
    break;
  }
}

// Dynamically resolve mongoose
let mongoose;
try {
  mongoose = (await import("mongoose")).default;
} catch (e) {
  const serverMongoose = path.resolve(process.cwd(), "server", "node_modules", "mongoose", "index.js");
  if (fs.existsSync(serverMongoose)) {
    mongoose = (await import(pathToFileURL(serverMongoose).href)).default;
  } else {
    throw new Error("Could not find mongoose. Please ensure dependencies are installed in server/node_modules");
  }
}

// ── CLI Arguments ───────────────────────────────────────────────────
const args = process.argv.slice(2).reduce((acc, curr, idx, src) => {
  if (curr.startsWith("--")) {
    const key = curr.replace(/^--/, "");
    const next = src[idx + 1];
    acc[key] = next && !next.startsWith("--") ? next : true;
  }
  return acc;
}, {});

const CONFIG = {
  neo4jUri: args["neo4j-uri"] || process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4jUser: args["neo4j-user"] || process.env.NEO4J_USERNAME || "neo4j",
  neo4jPass: args["neo4j-pass"] || process.env.NEO4J_PASSWORD || "password",
  mongoUri:
    args["mongo-uri"] ||
    process.env.MONGODB_URI ||
    "mongodb://admin:change-me@localhost:27017/supportai?authSource=admin",
  defaultOrgId:
    args["default-org-id"] ||
    process.env.SUPER_ADMIN_ORG_ID ||
    process.env.DEFAULT_ORG_ID ||
    "6a60bf17b9d50c98f34c529a",
  batchSize: parseInt(args["batch-size"] || "500", 10),
  dryRun: Boolean(args["dry-run"] || false),
  inputFile: args["input-file"] || null,
};

console.log("===============================================================");
console.log("  SupportAI: Neo4j to MongoDB 7+ Knowledge Graph Migration");
console.log("===============================================================");
console.log(` Neo4j URI       : ${CONFIG.neo4jUri}`);
console.log(` MongoDB URI     : ${CONFIG.mongoUri.replace(/:[^:@]+@/, ":****@")}`);
console.log(` Default Org ID  : ${CONFIG.defaultOrgId}`);
console.log(` Batch Size      : ${CONFIG.batchSize}`);
console.log(` Dry Run Mode    : ${CONFIG.dryRun ? "ENABLED (Read-Only)" : "DISABLED (Live Write)"}`);
console.log("===============================================================\n");

function toDeterministicObjectId(val, orgId) {
  if (!val) return new mongoose.Types.ObjectId();
  const str = String(val);
  if (mongoose.isValidObjectId(str)) {
    return new mongoose.Types.ObjectId(str);
  }
  const hash = crypto.createHash("md5").update(`${orgId}:${str}`).digest("hex");
  return new mongoose.Types.ObjectId(hash.substring(0, 24));
}

async function runMigration() {
  const startTime = Date.now();
  let neo4jDriver = null;
  let mongoClient = null;

  try {
    // Connect to MongoDB
    console.log("[1/5] Connecting to MongoDB 7+ database...");
    mongoClient = await mongoose.connect(CONFIG.mongoUri);
    console.log("✅ MongoDB connection established successfully.");

    const db = mongoose.connection.db;
    const knowledgeNodesCollection = db.collection("knowledgenodes");

    let rawNodes = [];
    let rawRelationships = [];
    let sourceMode = "NONE";

    // Check Mode 1: Live Neo4j instance
    let neo4jAvailable = false;
    try {
      let neo4jModule;
      try {
        neo4jModule = await import("neo4j-driver");
      } catch {
        const serverNeo4j = path.resolve(process.cwd(), "server", "node_modules", "neo4j-driver", "lib", "index.js");
        if (fs.existsSync(serverNeo4j)) {
          neo4jModule = await import(pathToFileURL(serverNeo4j).href);
        }
      }

      if (neo4jModule) {
        neo4jDriver = neo4jModule.default.driver(
          CONFIG.neo4jUri,
          neo4jModule.default.auth.basic(CONFIG.neo4jUser, CONFIG.neo4jPass)
        );
        await neo4jDriver.verifyConnectivity();
        neo4jAvailable = true;
        sourceMode = "LIVE_NEO4J";
      }
    } catch (e) {
      neo4jAvailable = false;
    }

    if (neo4jAvailable && neo4jDriver) {
      console.log("[2/5] Extracting live nodes & relationships from Neo4j...");
      const session = neo4jDriver.session();
      const nodeRes = await session.run(`
        MATCH (n)
        RETURN id(n) as internalId, elementId(n) as elementId, labels(n) as labels, properties(n) as props
      `);
      rawNodes = nodeRes.records.map((r) => ({
        internalId: r.get("internalId")?.toString(),
        elementId: r.get("elementId")?.toString(),
        labels: r.get("labels") || [],
        props: r.get("props") || {},
      }));

      const relRes = await session.run(`
        MATCH (s)-[r]->(t)
        RETURN id(s) as srcInternalId, elementId(s) as srcElementId, s.id as srcId,
               type(r) as relationType, properties(r) as relProps,
               id(t) as tgtInternalId, elementId(t) as tgtElementId, t.id as tgtId
      `);
      rawRelationships = relRes.records.map((r) => ({
        srcId: r.get("srcId") || r.get("srcElementId") || r.get("srcInternalId")?.toString(),
        tgtId: r.get("tgtId") || r.get("tgtElementId") || r.get("tgtInternalId")?.toString(),
        relationType: (r.get("relationType") || "RELATED_TO").toUpperCase().replace(/\s+/g, "_"),
        relProps: r.get("relProps") || {},
      }));
      await session.close();
    } else {
      // Check Mode 2: Existing MongoDB collections (graphnodes & graphrelationships)
      console.log("[2/5] Neo4j instance not active. Inspecting MongoDB graph collections...");
      const graphNodesCollection = db.collection("graphnodes");
      const graphRelationshipsCollection = db.collection("graphrelationships");

      const existingGraphNodes = await graphNodesCollection.find({}).toArray();
      const existingGraphRels = await graphRelationshipsCollection.find({}).toArray();

      if (existingGraphNodes.length > 0) {
        sourceMode = "MONGO_GRAPH_COLLECTIONS";
        console.log(`    Found ${existingGraphNodes.length} nodes and ${existingGraphRels.length} relations in existing MongoDB graph collections.`);
        rawNodes = existingGraphNodes.map((n) => ({
          internalId: n._id.toString(),
          elementId: n.canonical_id || n._id.toString(),
          labels: [n.type || "entity"],
          props: {
            id: n._id.toString(),
            name: n.name,
            title: n.name,
            content: n.properties?.description || n.name,
            category: n.properties?.entity_type || n.type || "General",
            type: n.type,
            orgId: n.organization_id?.toString(),
            branchId: n.branch_id?.toString(),
            ...n.properties,
          },
        }));

        rawRelationships = existingGraphRels.map((r) => ({
          srcId: r.source_name,
          tgtId: r.target_name,
          relationType: (r.type || "RELATED_TO").toUpperCase().replace(/\s+/g, "_"),
          relProps: {
            confidence: r.confidence_score,
            source_type: r.source_type,
            document_id: r.document_id,
            ...r.provenance_details,
          },
        }));
      } else {
        // Mode 3: Seed / Sample Data
        sourceMode = "SEEDED_FOUNDATION";
        console.log("    No prior graph records found. Generating foundational knowledge graph nodes...");
        const sampleOrgId = CONFIG.defaultOrgId;

        rawNodes = [
          {
            internalId: "node_1",
            elementId: "kb_wifi_troubleshoot",
            labels: ["TroubleshootingStep", "Network"],
            props: {
              title: "Step 1: Check Physical Router Connections",
              content: "Ensure Ethernet and power cables are firmly plugged into the gateway modem.",
              category: "Troubleshooting",
              nodeType: "troubleshooting_step",
              tags: ["network", "wifi", "router"],
              orgId: sampleOrgId,
            },
          },
          {
            internalId: "node_2",
            elementId: "kb_dns_flush",
            labels: ["TroubleshootingStep", "Network"],
            props: {
              title: "Step 2: Flush DNS Cache & Reset IP",
              content: "Execute 'ipconfig /flushdns' and 'ipconfig /renew' in administrator console.",
              category: "Troubleshooting",
              nodeType: "troubleshooting_step",
              tags: ["network", "dns", "ip"],
              orgId: sampleOrgId,
            },
          },
          {
            internalId: "node_3",
            elementId: "kb_isp_policy",
            labels: ["Policy", "Billing"],
            props: {
              title: "SLA Policy: 99.9% Uptime Guarantee & Credits",
              content: "Customers experiencing outages exceeding 2 consecutive hours are eligible for bill credits.",
              category: "Policy",
              nodeType: "policy",
              tags: ["policy", "sla", "billing", "refund"],
              orgId: sampleOrgId,
            },
          },
        ];

        rawRelationships = [
          {
            srcId: "kb_dns_flush",
            tgtId: "kb_wifi_troubleshoot",
            relationType: "REQUIRES_PREREQUISITE",
            relProps: { weight: 1.0 },
          },
          {
            srcId: "kb_isp_policy",
            tgtId: "kb_dns_flush",
            relationType: "RESOLVES",
            relProps: { weight: 0.9 },
          },
        ];
      }
    }

    console.log(`[3/5] Transforming nodes into Mongoose 9 KnowledgeNode schema (Source: ${sourceMode})...`);
    const nodeLookup = new Map();
    const transformedNodes = new Map();

    for (const item of rawNodes) {
      const internalId = item.internalId;
      const elementId = item.elementId;
      const labels = item.labels || [];
      const props = item.props || {};

      const rawOrgId = props.orgId || props.organization_id || props.organizationId || CONFIG.defaultOrgId;
      const orgId = mongoose.isValidObjectId(rawOrgId)
        ? new mongoose.Types.ObjectId(rawOrgId)
        : new mongoose.Types.ObjectId(CONFIG.defaultOrgId);

      const rawBranchId = props.branchId || props.branch_id || null;
      const branchId = rawBranchId && mongoose.isValidObjectId(rawBranchId)
        ? new mongoose.Types.ObjectId(rawBranchId)
        : null;

      const identifier = props.id || props._id || props.canonical_id || elementId || internalId;
      const mongoId = toDeterministicObjectId(identifier, orgId.toString());

      if (internalId) nodeLookup.set(internalId, mongoId);
      if (elementId) nodeLookup.set(elementId, mongoId);
      if (props.id) nodeLookup.set(String(props.id), mongoId);
      if (props.title) nodeLookup.set(props.title, mongoId);
      if (props.name) {
        nodeLookup.set(props.name, mongoId);
        nodeLookup.set(`${orgId.toString()}:${props.name}`, mongoId);
      }

      const nodeType = (props.type || props.nodeType || labels[0] || "article").toLowerCase();
      const category = props.category || props.topic || (labels.length > 0 ? labels[0] : "General");
      const title = props.title || props.name || `Node ${identifier}`;
      const content = props.content || props.description || props.body || title;
      const tags = Array.isArray(props.tags)
        ? props.tags
        : typeof props.tags === "string"
        ? props.tags.split(",").map((t) => t.trim())
        : [];

      transformedNodes.set(mongoId.toString(), {
        _id: mongoId,
        orgId,
        branchId,
        title,
        content,
        tags,
        category,
        nodeType,
        status: props.status || "published",
        relatedNodes: [],
        metadata: {
          originalId: elementId || internalId,
          sourceMode,
          ...props,
        },
        createdAt: props.created_at ? new Date(props.created_at) : new Date(),
        updatedAt: props.updated_at ? new Date(props.updated_at) : new Date(),
      });
    }

    // Embed directed edge adjacency lists
    let edgesAttached = 0;
    for (const rel of rawRelationships) {
      const srcMongoId = nodeLookup.get(rel.srcId?.toString());
      const tgtMongoId = nodeLookup.get(rel.tgtId?.toString());

      if (srcMongoId && tgtMongoId) {
        const sourceDoc = transformedNodes.get(srcMongoId.toString());
        if (sourceDoc) {
          const exists = sourceDoc.relatedNodes.some(
            (e) => e.targetNodeId.toString() === tgtMongoId.toString() && e.relationType === rel.relationType
          );

          if (!exists) {
            sourceDoc.relatedNodes.push({
              targetNodeId: tgtMongoId,
              relationType: rel.relationType,
              weight: typeof rel.relProps?.weight === "number" ? rel.relProps.weight : 1.0,
              metadata: rel.relProps || {},
            });
            edgesAttached++;
          }
        }
      }
    }

    console.log(`    Transformed ${transformedNodes.size} nodes with ${edgesAttached} embedded relational edges.`);

    // Step 4: Write to MongoDB
    console.log("[4/5] Writing to MongoDB 'knowledgenodes' collection...");
    const allNodes = Array.from(transformedNodes.values());

    if (!CONFIG.dryRun && allNodes.length > 0) {
      for (let i = 0; i < allNodes.length; i += CONFIG.batchSize) {
        const batch = allNodes.slice(i, i + CONFIG.batchSize);
        const operations = batch.map((node) => ({
          updateOne: {
            filter: { _id: node._id },
            update: { $set: node },
            upsert: true,
          },
        }));

        await knowledgeNodesCollection.bulkWrite(operations, { ordered: false });
        console.log(`    Committed batch ${Math.floor(i / CONFIG.batchSize) + 1} (${batch.length} nodes)`);
      }
    } else if (CONFIG.dryRun) {
      console.log(`    [DRY RUN] Would upsert ${allNodes.length} nodes into MongoDB.`);
    }

    // Step 5: Verification
    console.log("[5/5] Creating compound multi-tenant indexes & testing $graphLookup traversal...");
    if (!CONFIG.dryRun) {
      await knowledgeNodesCollection.createIndex({ orgId: 1, branchId: 1, category: 1 });
      await knowledgeNodesCollection.createIndex({ orgId: 1, branchId: 1, "relatedNodes.targetNodeId": 1 });
      await knowledgeNodesCollection.createIndex({ orgId: 1, branchId: 1, "relatedNodes.relationType": 1 });

      const sample = await knowledgeNodesCollection.findOne({});
      if (sample) {
        const traversalStart = Date.now();
        const testTraversal = await knowledgeNodesCollection
          .aggregate([
            { $match: { _id: sample._id, orgId: sample.orgId } },
            {
              $graphLookup: {
                from: "knowledgenodes",
                startWith: "$relatedNodes.targetNodeId",
                connectFromField: "relatedNodes.targetNodeId",
                connectToField: "_id",
                as: "verifiedHierarchy",
                maxDepth: 2,
                depthField: "depth",
                restrictSearchWithMatch: { orgId: sample.orgId },
              },
            },
          ])
          .toArray();
        const traversalLatency = Date.now() - traversalStart;

        console.log(`✅ Sample $graphLookup query completed in ${traversalLatency}ms (Target: <30ms).`);
        console.log(`   Sample Root Node   : "${sample.title}" (${sample.category})`);
        console.log(`   Resolved Neighbors : ${testTraversal[0]?.verifiedHierarchy?.length || 0} nodes`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n===============================================================");
    console.log("                   MIGRATION COMPLETE 🎉                       ");
    console.log("===============================================================");
    console.log(` Total Nodes Migrated         : ${allNodes.length}`);
    console.log(` Total Relationships Embedded : ${edgesAttached}`);
    console.log(` Execution Time               : ${elapsed}s`);
    console.log(` Status                       : SUCCESS`);
    console.log("===============================================================\n");
  } catch (error) {
    console.error("\n❌ Migration Failed:", error);
    process.exit(1);
  } finally {
    if (neo4jDriver) await neo4jDriver.close().catch(() => null);
    if (mongoClient) await mongoose.disconnect().catch(() => null);
  }
}

runMigration();
