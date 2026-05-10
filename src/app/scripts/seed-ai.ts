
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from 'uuid';
import "dotenv/config";
import { envVars } from "../config/env";
import { prisma } from "../lib/prisma";

const GEMINI_API_KEY = envVars.GEMINI_API_KEY || "";

const contents = [
  // Product Discovery & Launch
  "Products Hunt helps you discover the best new tech products before anyone else.",
  "Launch your product on Products Hunt to get exposure to thousands of early adopters and makers.",
  "The best time to launch your product is Tuesday through Thursday at 12:00 AM PT.",
  "Products Hunt has a strict no-spam policy. Only genuine product launches are accepted.",
  "You can schedule your product launch up to 7 days in advance on Products Hunt.",
  
  // Upvote System
  "Upvoting a product helps it rank higher on the daily leaderboard.",
  "Each user can upvote a product only once. Make your vote count!",
  "The product with the most upvotes becomes the #1 Product of the Day.",
  "Upvotes are reset daily at 12:00 AM PT for the new day's leaderboard.",
  "You need to be logged in to upvote a product on Products Hunt.",
  
  // Leaderboard & Rankings
  "Products Hunt features daily, weekly, and monthly leaderboards for top products.",
  "The weekly leaderboard showcases the most upvoted products from Monday to Sunday.",
  "Being featured on the Products Hunt leaderboard can bring thousands of visitors to your product.",
  "Products that make it to the top 3 of the day get special badges and recognition.",
  
  // Makers & Community
  "Join the Products Hunt community to connect with fellow makers, founders, and creators.",
  "Makers can share their journey, get feedback, and improve their products through the community.",
  "Following your favorite makers helps you discover products they launch or upvote.",
  "Products Hunt has over 5,000 active makers launching products every month.",
  
  // Product Submission Guidelines
  "Your product must be live and accessible before submitting to Products Hunt.",
  "Products Hunt does not accept placeholder pages, coming soon pages, or products under development.",
  "Each product submission requires a clear title, description, thumbnail image, and live URL.",
  "You can edit your product listing after submission, but major changes may require review.",
  
  // Moderation & Review
  "All products go through a moderation process before appearing on Products Hunt.",
  "Products Hunt moderators review submissions within 24-48 hours.",
  "Products that violate community guidelines may be removed from Products Hunt.",
  "You will receive an email notification when your product is approved or needs changes.",
  
  // Featured Products
  "Products Hunt features the best products on the homepage every day.",
  "Getting featured on Products Hunt can drive 10,000+ visitors to your product landing page.",
  "Products with high-quality thumbnails and clear descriptions are more likely to get upvoted.",
  
  // Tips for Success
  "Engage with commenters on your product page to build trust and get more upvotes.",
  "Share your Products Hunt launch page on social media to drive external upvotes.",
  "Having a demo video increases your product's chances of getting noticed on Products Hunt.",
  "Respond to every comment on your product within the first hour of launch for better engagement.",
  
  // Badges & Achievements
  "Products Hunt awards special badges for #1 Product of the Day, Week, and Month.",
  "Products that receive 500+ upvotes get the 'Popular' badge on their listing.",
  "Makers who successfully launch multiple products earn 'Top Maker' status on Products Hunt.",
  
  // API & Developers
  "Products Hunt provides a public API for developers to access product data and rankings.",
  "You can integrate Products Hunt API into your app to show trending products in real-time.",
  "The Products Hunt API is free for developers and includes endpoints for products, comments, and upvotes.",
  
  // Contact & Support
  "For support inquiries, email Products Hunt at support@productshunt.com.",
  "You can reach Products Hunt on Twitter @ProductHunt for quick assistance.",
  "Products Hunt support team responds within 24 hours on business days.",
  "For partnership opportunities, contact partnerships@productshunt.com.",
  
  // General Info
  "Products Hunt was founded in 2013 and has since helped launch over 100,000 products.",
  "Products Hunt is the world's largest community for discovering and sharing new tech products.",
  "Join Products Hunt today to stay ahead of the curve and discover the future of tech."
];

async function seedAi() {
  if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is not set in .env");
    console.log("Please add GEMINI_API_KEY to your .env file before running this script.");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  // Using text-embedding-004 which is the latest stable embedding model from Google
  const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });

  console.log("🚀 Seeding AI knowledge base...");

  await prisma.$executeRaw`TRUNCATE TABLE ai_knowledge`;
  console.log("🗑️ Old data cleared successfully.");

  for (const content of contents) {
    try {
      console.log(`- Generating embedding for: "${content}"`);
      const result = await model.embedContent(content);
      const embedding = result.embedding.values;

      // PostgreSQL pgvector expects the format '[0.1, 0.2, 0.3]'
      const embeddingString = `[${embedding.join(",")}]`;

      // We use $executeRawUnsafe because $executeRaw with parameterized arrays 
      // doesn't always play nice with the 'vector' type cast in Prisma yet.
      await prisma.$executeRawUnsafe(
        `INSERT INTO ai_knowledge (id, content, embedding) VALUES ($1, $2, $3::vector)`,
        uuidv4(),
        content,
        embeddingString
      );

      console.log("  ✅ Inserted successfully.");
    } catch (error) {
      console.error(`  ❌ Error inserting "${content}":`, error);
    }
  }

  console.log("✨ Seeding completed!");
  await prisma.$disconnect();
}

seedAi().catch(async (e) => {
  console.error("💥 Critical error during seeding:", e);
  await prisma.$disconnect();
  process.exit(1);
});
