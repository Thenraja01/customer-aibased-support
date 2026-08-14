import mongoose from "mongoose";
import env from "../config/env.js";
import { processOrchestratedMessage, getAuthContext } from "../services/ai/aiOrchestrator.js";
import User from "../modules/user/user.schema.js";
import Chat from "../modules/chat/chat.schema.js";

async function main() {
  console.log("Connecting to MongoDB:", env.MONGODB_URI);
  await mongoose.connect(env.MONGODB_URI);

  try {
    // Retrieve a test user from DB
    const testUser = await User.findOne({ role: "admin" }).lean();
    if (!testUser) {
      console.log("No test admin user found in DB. Please run database seeding.");
      return;
    }
    console.log("Using test user:", testUser.name, "Role:", testUser.role, "Org:", testUser.organization_id);

    // Create a temporary copilot chat session
    const chatSession = await Chat.create({
      user_id: testUser._id,
      organization_id: testUser.organization_id,
      topic: "Test Copilot Chat",
      is_copilot: true
    });

    console.log("Created test copilot chat session ID:", chatSession._id);

    // 1. Test Read Tool Routing
    console.log("\n--- Testing Read Tool Routing: 'How many users are active?' ---");
    const readResult = await processOrchestratedMessage({
      chatId: chatSession._id.toString(),
      user: testUser,
      message: "How many users are active?",
      modelName: "llama3.2:3b"
    });
    console.log("Read Result:", JSON.stringify(readResult, null, 2));

    // 2. Test Write Action Confirmation Preview
    console.log("\n--- Testing Write Action Confirmation: 'Send a notification to branch Chennai' ---");
    const writeResult = await processOrchestratedMessage({
      chatId: chatSession._id.toString(),
      user: testUser,
      message: "Send a notification to branch Chennai",
      modelName: "llama3.2:3b"
    });
    console.log("Write Result (Expect Pending Action):", JSON.stringify(writeResult, null, 2));

    // 3. Test Action Confirmation Execution
    if (writeResult.pendingAction) {
      console.log("\n--- Testing Confirming the Action ---");
      const confirmResult = await processOrchestratedMessage({
        chatId: chatSession._id.toString(),
        user: testUser,
        message: "Proceed with action",
        modelName: "llama3.2:3b",
        actionConfirm: {
          action: writeResult.pendingAction.action,
          payload: writeResult.pendingAction.payload,
          confirmed: true
        }
      });
      console.log("Confirm Result:", JSON.stringify(confirmResult, null, 2));
    }

    // Cleanup
    await Chat.deleteOne({ _id: chatSession._id });
    console.log("\nCleaned up test chat session.");

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

main().catch(console.error);
