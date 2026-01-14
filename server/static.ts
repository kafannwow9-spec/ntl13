import express, { type Express } from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// تعريف المسارات لضمان التوافق مع Node.js 22 على Render
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// قم بتغيير اسم الدالة من setupStatic إلى serveStatic
export function serveStatic(app: Express) {
  // تحديد مسار الملفات بعد عملية البناء (Build)
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (process.env.NODE_ENV === "production") {
    // 1. تقديم الملفات الثابتة (CSS, JS, Images)
    app.use(express.static(distPath));

    // 2. توجيه أي طلب غير معروف إلى index.html ليعمل نظام React Router
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    // في بيئة التطوير (Replit)
    console.log("Environment: Development - Vite will handle static files.");
  }
}
