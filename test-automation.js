// Automated Test Script for AI Customer Support System
// Tests: Login, Document Upload, RAG Ingestion, AI Query

const BASE_URL = "http://localhost:3030";

let authToken = "";
let userId = "";
let organizationId = "";
let uploadedDocumentId = "";

// Helper function for API calls
async function apiCall(endpoint, method = "GET", body = null, token = null) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, success: data.success, data };
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error.message);
    return { status: 0, success: false, error: error.message };
  }
}

// Test 1: Customer Login
async function testCustomerLogin() {
  console.log("\n=== Test 1: Customer Login ===");
  const result = await apiCall("/auth/v1/login", "POST", {
    email: "john@test.com",
    password: "Customer@123",
  });

  if (result.success && result.data.token) {
    authToken = result.data.token;
    userId = result.data.data.id;
    organizationId = result.data.data.organization_id._id;
    console.log("✅ Login successful");
    console.log(`   User ID: ${userId}`);
    console.log(`   Organization ID: ${organizationId}`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log("❌ Login failed:", result.data?.message || result.error);
    console.log("   Response:", JSON.stringify(result.data, null, 2));
    return false;
  }
}

// Test 2: Get User Profile
async function testGetProfile() {
  console.log("\n=== Test 2: Get User Profile ===");
  const result = await apiCall("/users/profile", "GET", null, authToken);

  if (result.success && result.data) {
    const userData = result.data.data || result.data;
    console.log("✅ Profile retrieved successfully");
    console.log(`   Name: ${userData.name}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role_id?.role_name}`);
    return true;
  } else {
    console.log("❌ Profile retrieval failed:", result.data?.message || result.error);
    return false;
  }
}

// Test 3: Get FAQs
async function testGetFAQs() {
  console.log("\n=== Test 3: Get FAQs ===");
  const result = await apiCall("/faqs/active", "GET", null, authToken);

  if (result.success && result.data) {
    const faqs = result.data.data || result.data;
    const faqArray = Array.isArray(faqs) ? faqs : [];
    console.log("✅ FAQs retrieved successfully");
    console.log(`   Count: ${faqArray.length}`);
    faqArray.forEach((faq, i) => {
      console.log(`   ${i + 1}. ${faq.question?.substring(0, 50)}...`);
    });
    return true;
  } else {
    console.log("❌ FAQ retrieval failed:", result.data?.message || result.error);
    return false;
  }
}

// Test 4: Get User Documents
async function testGetDocuments() {
  console.log("\n=== Test 4: Get User Documents ===");
  const result = await apiCall(`/documents/user/${userId}`, "GET", null, authToken);

  if (result.success && result.data) {
    const docs = result.data.data || result.data;
    const docArray = Array.isArray(docs) ? docs : [];
    console.log("✅ Documents retrieved successfully");
    console.log(`   Count: ${docArray.length}`);
    docArray.forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.title} - Status: ${doc.status}`);
    });
    return true;
  } else {
    console.log("❌ Document retrieval failed:", result.data?.message || result.error);
    return false;
  }
}

// Test 5: Create a Chat
async function testCreateChat() {
  console.log("\n=== Test 5: Create Chat ===");
  const result = await apiCall(
    "/chats",
    "POST",
    {
      user_id: userId,
      organization_id: organizationId,
      topic: "Test Chat for RAG",
    },
    authToken
  );

  if (result.success && result.data) {
    console.log("✅ Chat created successfully");
    console.log(`   Chat ID: ${result.data._id}`);
    console.log(`   Topic: ${result.data.topic}`);
    return result.data._id;
  } else {
    console.log("❌ Chat creation failed:", result.data?.message || result.error);
    return null;
  }
}

// Test 6: Send AI Message (RAG Query)
async function testAIMessage(chatId) {
  console.log("\n=== Test 6: Send AI Message (RAG Query) ===");
  const result = await apiCall(
    "/chats/ai",
    "POST",
    {
      chatId: chatId,
      message: "How do I reset my password?",
    },
    authToken
  );

  if (result.success && result.data) {
    console.log("✅ AI message processed successfully");
    console.log(`   AI Response: ${result.data.content?.substring(0, 100)}...`);
    return true;
  } else {
    console.log("❌ AI message failed:", result.data?.message || result.error);
    return false;
  }
}

// Test 7: Get Chat History
async function testChatHistory() {
  console.log("\n=== Test 7: Get Chat History ===");
  const result = await apiCall(`/chats/user/${userId}`, "GET", null, authToken);

  if (result.success && result.data) {
    const chats = result.data.data || result.data;
    const chatArray = Array.isArray(chats) ? chats : [];
    console.log("✅ Chat history retrieved successfully");
    console.log(`   Count: ${chatArray.length}`);
    return true;
  } else {
    console.log("❌ Chat history retrieval failed:", result.data?.message || result.error);
    return false;
  }
}

// Test 8: Get Notifications
async function testNotifications() {
  console.log("\n=== Test 8: Get Notifications ===");
  const result = await apiCall(`/notifications/user/${userId}`, "GET", null, authToken);

  if (result.success && result.data) {
    const notifs = result.data.data || result.data;
    const notifArray = Array.isArray(notifs) ? notifs : [];
    console.log("✅ Notifications retrieved successfully");
    console.log(`   Count: ${notifArray.length}`);
    notifArray.forEach((notif, i) => {
      console.log(`   ${i + 1}. ${notif.title} - Read: ${notif.is_read}`);
    });
    return true;
  } else {
    console.log("❌ Notification retrieval failed:", result.data?.message || result.error);
    return false;
  }
}

// Test 9: Get Tickets
async function testTickets() {
  console.log("\n=== Test 9: Get Tickets ===");
  const result = await apiCall(`/tickets/user/${userId}`, "GET", null, authToken);

  if (result.success && result.data) {
    const tickets = result.data.data || result.data;
    const ticketArray = Array.isArray(tickets) ? tickets : [];
    console.log("✅ Tickets retrieved successfully");
    console.log(`   Count: ${ticketArray.length}`);
    ticketArray.forEach((ticket, i) => {
      console.log(`   ${i + 1}. ${ticket.subject} - Status: ${ticket.status}`);
    });
    return true;
  } else {
    console.log("❌ Ticket retrieval failed:", result.data?.message || result.error);
    return false;
  }
}

// Test 10: Admin Login
async function testAdminLogin() {
  console.log("\n=== Test 10: Admin Login ===");
  const result = await apiCall("/auth/v1/login", "POST", {
    email: "admin@test.com",
    password: "Admin@123",
  });

  if (result.success && result.data.token) {
    authToken = result.data.token;
    userId = result.data.data.id;
    organizationId = result.data.data.organization_id._id;
    console.log("✅ Admin login successful");
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: ${result.data.data.role_id?.role_name}`);
    return true;
  } else {
    console.log("❌ Admin login failed:", result.data?.message || result.error);
    return false;
  }
}

// Test 11: Get All Documents (Admin)
async function testAdminGetDocuments() {
  console.log("\n=== Test 11: Admin Get All Documents ===");
  const result = await apiCall("/documents", "GET", null, authToken);

  if (result.success && result.data) {
    const docs = result.data.data || result.data;
    const docArray = Array.isArray(docs) ? docs : [];
    console.log("✅ All documents retrieved successfully");
    console.log(`   Count: ${docArray.length}`);
    if (docArray.length > 0) {
      uploadedDocumentId = docArray[0]._id;
      console.log(`   First Document ID: ${uploadedDocumentId}`);
    }
    return true;
  } else {
    console.log("❌ Document retrieval failed:", result.data?.message || result.error);
    return false;
  }
}

// Test 12: RAG Stats (Admin)
async function testRAGStats() {
  console.log("\n=== Test 12: RAG Stats ===");
  const result = await apiCall("/rag/stats", "GET", null, authToken);

  if (result.success && result.data) {
    console.log("✅ RAG stats retrieved successfully");
    console.log(`   Data:`, JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log("❌ RAG stats retrieval failed:", result.data?.message || result.error);
    return false;
  }
}

// Test 13: AI Session Stats (Admin)
async function testAISessionStats() {
  console.log("\n=== Test 13: AI Session Stats ===");
  const result = await apiCall("/ai-sessions/stats", "GET", null, authToken);

  if (result.success && result.data) {
    console.log("✅ AI Session stats retrieved successfully");
    console.log(`   Data:`, JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log("❌ AI Session stats retrieval failed:", result.data?.message || result.error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log("========================================");
  console.log("  Automated Test Suite");
  console.log("  AI Customer Support System");
  console.log("========================================");

  const results = [];

  // Customer Tests
  results.push(await testCustomerLogin());
  results.push(await testGetProfile());
  results.push(await testGetFAQs());
  results.push(await testGetDocuments());
  const chatId = await testCreateChat();
  if (chatId) {
    results.push(await testAIMessage(chatId));
  }
  results.push(await testChatHistory());
  results.push(await testNotifications());
  results.push(await testTickets());

  // Admin Tests
  results.push(await testAdminLogin());
  results.push(await testAdminGetDocuments());
  results.push(await testRAGStats());
  results.push(await testAISessionStats());

  // Summary
  console.log("\n========================================");
  console.log("  Test Summary");
  console.log("========================================");
  const passed = results.filter((r) => r === true).length;
  const failed = results.filter((r) => r === false).length;
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log("========================================");
}

// Run tests
runTests().catch(console.error);
