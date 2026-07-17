import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "./modules/user/user.schema.js";
import Role from "./modules/role/role.schema.js";
import Organization from "./modules/organization/organization.schema.js";
import FAQ from "./modules/faq/faq.schema.js";
import Ticket from "./modules/ticket/ticket.schema.js";
import Chat from "./modules/chat/chat.schema.js";
import Document from "./modules/document/document.schema.js";
import DocumentType from "./modules/document-type/documentType.schema.js";
import Notification from "./modules/notification/notification.schema.js";
import DocumentChunk from "./modules/document/documentChunk.schema.js";
import KnowledgeGraph from "./modules/knowledge-graph/knowledgeGraph.schema.js";
import GraphEdge from "./modules/knowledge-graph/graphEdge.schema.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/customer-support-system";

async function seed() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to database.");

    // Create Organizations
    let defaultOrg = await Organization.findOne({ email: "system@admin.com" });
    if (!defaultOrg) {
      defaultOrg = new Organization({
        organization_id: "ORG-SYS-001",
        name: "System Organization",
        email: "system@admin.com",
        phone: "1234567890",
        address: "HQ",
      });
      await defaultOrg.save();
      console.log("Default organization created.");
    }

    let testOrg = await Organization.findOne({ email: "test@company.com" });
    if (!testOrg) {
      testOrg = new Organization({
        organization_id: "ORG-TEST-001",
        name: "Test Company",
        email: "test@company.com",
        phone: "9876543210",
        address: "Test Address",
      });
      await testOrg.save();
      console.log("Test organization created.");
    }

    // Create Roles
    const rolesToCreate = ["super_admin", "admin", "agent", "customer"];
    for (const roleName of rolesToCreate) {
      const existingRole = await Role.findOne({ role_name: roleName });
      if (!existingRole) {
        await Role.create({ role_name: roleName });
        console.log(`Role ${roleName} created.`);
      }
    }

    const superAdminRole = await Role.findOne({ role_name: "super_admin" });
    const adminRole = await Role.findOne({ role_name: "admin" });
    const agentRole = await Role.findOne({ role_name: "agent" });
    const customerRole = await Role.findOne({ role_name: "customer" });

    // Create Super Admin
    let superAdmin = await User.findOne({ email: "superadmin@admin.com" });
    if (!superAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin@123", salt);
      superAdmin = new User({
        organization_id: defaultOrg._id,
        role_id: superAdminRole._id,
        name: "Super Admin",
        email: "superadmin@admin.com",
        password: hashedPassword,
        auth_type: "local",
        status: "active",
      });
      await superAdmin.save();
      console.log("Super admin user created. Email: superadmin@admin.com, Password: Admin@123");
    }

    // Create Admin
    let admin = await User.findOne({ email: "admin@test.com" });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin@123", salt);
      admin = new User({
        organization_id: testOrg._id,
        role_id: adminRole._id,
        name: "Test Admin",
        email: "admin@test.com",
        password: hashedPassword,
        phone: "555-0101",
        auth_type: "local",
        status: "active",
      });
      await admin.save();
      console.log("Admin user created. Email: admin@test.com, Password: Admin@123");
    }

    // Create Agent
    let agent = await User.findOne({ email: "agent@test.com" });
    if (!agent) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Agent@123", salt);
      agent = new User({
        organization_id: testOrg._id,
        role_id: agentRole._id,
        name: "Test Agent",
        email: "agent@test.com",
        password: hashedPassword,
        phone: "555-0102",
        auth_type: "local",
        status: "active",
      });
      await agent.save();
      console.log("Agent user created. Email: agent@test.com, Password: Agent@123");
    }

    // Create Customers
    const customers = [
      { name: "John Doe", email: "john@test.com", phone: "555-0103" },
      { name: "Jane Smith", email: "jane@test.com", phone: "555-0104" },
      { name: "Bob Johnson", email: "bob@test.com", phone: "555-0105" },
    ];

    for (const customerData of customers) {
      let customer = await User.findOne({ email: customerData.email });
      if (!customer) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("Customer@123", salt);
        customer = new User({
          organization_id: testOrg._id,
          role_id: customerRole._id,
          name: customerData.name,
          email: customerData.email,
          password: hashedPassword,
          phone: customerData.phone,
          auth_type: "local",
          status: "active",
        });
        await customer.save();
        console.log(`Customer user created. Email: ${customerData.email}, Password: Customer@123`);
      }
    }

    // Create Document Types
    const docTypes = [
      { name: "ID Proof", description: "Government issued ID" },
      { name: "Address Proof", description: "Utility bill or bank statement" },
      { name: "Business License", description: "Business registration document" },
    ];

    for (const docType of docTypes) {
      let existing = await DocumentType.findOne({ name: docType.name });
      if (!existing) {
        await DocumentType.create(docType);
        console.log(`Document type ${docType.name} created.`);
      }
    }

    // Create FAQs
    const faqs = [
      {
        organization_id: testOrg._id,
        question: "How do I reset my password?",
        answer: "Go to the login page and click 'Forgot Password'. Follow the instructions sent to your email to reset your password.",
        is_active: true,
      },
      {
        organization_id: testOrg._id,
        question: "How can I contact support?",
        answer: "You can contact support through the chat feature on our platform, or by creating a support ticket. Our team typically responds within 24 hours.",
        is_active: true,
      },
      {
        organization_id: testOrg._id,
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, PayPal, and bank transfers. Payment is processed securely through our payment gateway.",
        is_active: true,
      },
      {
        organization_id: testOrg._id,
        question: "How do I upload documents?",
        answer: "Navigate to the Documents section in your dashboard, click 'Upload Document', select your file, and provide a title. Your document will be reviewed by our team.",
        is_active: true,
      },
    ];

    for (const faq of faqs) {
      let existing = await FAQ.findOne({ question: faq.question });
      if (!existing) {
        await FAQ.create(faq);
        console.log(`FAQ created: ${faq.question}`);
      }
    }

    // Create Tickets
    const johnUser = await User.findOne({ email: "john@test.com" });
    const janeUser = await User.findOne({ email: "jane@test.com" });

    if (johnUser) {
      const tickets = [
        {
          user_id: johnUser._id,
          organization_id: testOrg._id,
          subject: "Login issue",
          description: "I cannot log in to my account. It says invalid credentials.",
          status: "open",
          priority: "high",
        },
        {
          user_id: johnUser._id,
          organization_id: testOrg._id,
          subject: "Billing question",
          description: "I have a question about my last invoice.",
          status: "resolved",
          priority: "medium",
        },
      ];

      for (const ticket of tickets) {
        let existing = await Ticket.findOne({ subject: ticket.subject, user_id: ticket.user_id });
        if (!existing) {
          await Ticket.create(ticket);
          console.log(`Ticket created: ${ticket.subject}`);
        }
      }
    }

    if (janeUser) {
      const ticket = {
        user_id: janeUser._id,
        organization_id: testOrg._id,
        subject: "Feature request",
        description: "I would like to suggest a new feature for the dashboard.",
        status: "in_progress",
        priority: "low",
      };
      let existing = await Ticket.findOne({ subject: ticket.subject, user_id: ticket.user_id });
      if (!existing) {
        await Ticket.create(ticket);
        console.log(`Ticket created: ${ticket.subject}`);
      }
    }

    // Create Chats
    if (johnUser) {
      const chats = [
        {
          user_id: johnUser._id,
          organization_id: testOrg._id,
          topic: "Help with navigation",
          status: "closed",
        },
        {
          user_id: johnUser._id,
          organization_id: testOrg._id,
          topic: "Account settings",
          status: "open",
        },
      ];

      for (const chat of chats) {
        let existing = await Chat.findOne({ topic: chat.topic, user_id: chat.user_id });
        if (!existing) {
          await Chat.create(chat);
          console.log(`Chat created: ${chat.topic}`);
        }
      }
    }

    // Create Documents with content for RAG
    if (johnUser) {
      const policyDocType = await DocumentType.findOne({ name: "Business License" }) || await DocumentType.create({ name: "Company Policy", description: "Company policies and procedures" });

      const policyDocs = [
        {
          title: "Employee Leave Policy",
          content: `Employee Leave Policy

1. Annual Leave
Full-time employees are entitled to 20 days of paid annual leave per year. Leave must be requested at least 2 weeks in advance. Unused leave can be carried over to the next year up to a maximum of 5 days.

2. Sick Leave
Employees are entitled to 10 days of paid sick leave per year. A medical certificate is required for absences exceeding 3 consecutive days. Sick leave cannot be carried over.

3. Parental Leave
Primary caregivers are entitled to 16 weeks of paid parental leave. Secondary caregivers are entitled to 4 weeks. Parental leave must be taken within 12 months of the birth or adoption.

4. Bereavement Leave
Employees are entitled to 5 days of paid bereavement leave for immediate family members and 2 days for extended family members.

5. Unpaid Leave
Unpaid leave may be granted at the discretion of management for up to 30 days per year. Requests must be submitted 30 days in advance.`,
        },
        {
          title: "Remote Work Policy",
          content: `Remote Work Policy

1. Eligibility
Employees who have completed their probationary period and have a satisfactory performance rating are eligible for remote work arrangements.

2. Schedule
Remote work days must be agreed upon with the direct manager. Core working hours of 10:00 AM to 3:00 PM must be maintained regardless of location.

3. Equipment
The company provides a laptop and necessary software. Employees are responsible for maintaining a reliable internet connection and suitable workspace at home.

4. Communication
Remote employees must be available on Slack during core hours and respond to messages within 30 minutes. Weekly video meetings with the team are mandatory.

5. Security
All company data must be accessed through the VPN. Personal devices should not be used for handling sensitive information. Two-factor authentication is required for all company accounts.`,
        },
        {
          title: "Refund and Returns Policy",
          content: `Refund and Returns Policy

1. General Policy
We offer a 30-day money-back guarantee on all our products and services. If you are not satisfied, you can request a full refund within 30 days of purchase.

2. How to Request a Refund
Contact our support team through the chat feature or email support@company.com with your order number and reason for the refund.

3. Processing Time
Refunds are processed within 5-7 business days. The refund will be credited to the original payment method.

4. Exceptions
Custom or personalized orders are non-refundable. Subscriptions can be cancelled at any time, and a prorated refund will be issued for the remaining period.

5. Damaged Products
If you receive a damaged product, please contact us within 48 hours with photos of the damage. We will arrange a replacement or full refund.`,
        },
      ];

      for (const docData of policyDocs) {
        let existing = await Document.findOne({ title: docData.title, user_id: johnUser._id });
        if (!existing) {
          const doc = await Document.create({
            user_id: johnUser._id,
            organization_id: testOrg._id,
            document_type_id: policyDocType?._id,
            title: docData.title,
            file_url: "",
            status: "approved",
          });

          // Create chunks for the document
          const sentences = docData.content.split(/\n\n+/);
          let chunkIndex = 0;
          for (const sentence of sentences) {
            if (sentence.trim().length > 20) {
              const keywords = sentence.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w) => w.length > 3).slice(0, 8);
              const embedding = new Array(128).fill(0);
              keywords.forEach((kw, i) => {
                let hash = 0;
                for (let j = 0; j < kw.length; j++) {
                  hash = ((hash << 5) - hash + kw.charCodeAt(j)) | 0;
                }
                embedding[Math.abs(hash % 128)] += 1 / (i + 1);
              });
              const mag = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
              if (mag > 0) embedding.forEach((_, i) => (embedding[i] /= mag));

              await DocumentChunk.create({
                document_id: doc._id,
                chunk_index: chunkIndex,
                content: sentence.trim(),
                embedding,
                keywords,
                token_count: sentence.split(/\s+/).length,
              });
              chunkIndex++;
            }
          }

          // Create KG nodes
          const entityNames = ["annual leave", "sick leave", "remote work", "refund policy", "parental leave", "core hours", "equipment", "security"];
          const nodes = [];
          for (const name of entityNames) {
            const node = await KnowledgeGraph.create({
              document_id: doc._id,
              entity_name: name,
              entity_type: "Policy",
              content_hash: Buffer.from(name).toString("base64"),
              metadata: { source: docData.title },
            });
            nodes.push(node);
          }

          // Create KG edges
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < Math.min(nodes.length, i + 3); j++) {
              await GraphEdge.create({
                source_id: nodes[i]._id,
                target_id: nodes[j]._id,
                relationship: "related_to",
                weight: 0.5,
                document_id: doc._id,
              });
            }
          }

          console.log(`Document created with RAG data: ${docData.title} (${chunkIndex} chunks, ${nodes.length} KG nodes)`);
        }
      }
    }

    // Create Notifications
    if (johnUser) {
      const notifications = [
        {
          user_id: johnUser._id,
          title: "Welcome to the platform!",
          message: "Thank you for joining. Here's a quick guide to get started.",
          type: "info",
          is_read: false,
        },
        {
          user_id: johnUser._id,
          title: "Your document was approved",
          message: "Your passport copy has been verified and approved.",
          type: "success",
          is_read: true,
        },
      ];

      for (const notif of notifications) {
        let existing = await Notification.findOne({ title: notif.title, user_id: notif.user_id });
        if (!existing) {
          await Notification.create(notif);
          console.log(`Notification created: ${notif.title}`);
        }
      }
    }

    console.log("\n=== Seeding Summary ===");
    console.log("Credentials:");
    console.log("Super Admin: superadmin@admin.com / Admin@123");
    console.log("Admin: admin@test.com / Admin@123");
    console.log("Agent: agent@test.com / Agent@123");
    console.log("Customer: john@test.com / Customer@123");
    console.log("Customer: jane@test.com / Customer@123");
    console.log("Customer: bob@test.com / Customer@123");
    console.log("\nSeeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
