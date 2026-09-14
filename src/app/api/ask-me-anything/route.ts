// Disabled — not a priority right now. Requests to this route will 404.
// To re-enable, uncomment below (it was already stubbed: it never persisted
// submissions anywhere, just console.log'd them — wire it to Zoho CRM per
// src/app/api/contact/route.ts before turning it back on for real).
//
// import { NextResponse } from "next/server";
//
// const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// const PHONE_PATTERN = /^[0-9+\-\s()]+$/;
//
// export async function POST(request: Request) {
//   let body: {
//     name?: string;
//     email?: string;
//     whatsapp?: string;
//     question?: string;
//   };
//
//   try {
//     body = await request.json();
//   } catch {
//     return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
//   }
//
//   const { name, email, whatsapp, question } = body;
//   if (!name || !email || !whatsapp || !question) {
//     return NextResponse.json({ error: "All fields are required." }, { status: 400 });
//   }
//   if (!EMAIL_PATTERN.test(email)) {
//     return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
//   }
//   if (!PHONE_PATTERN.test(whatsapp) || whatsapp.replace(/\D/g, "").length < 7) {
//     return NextResponse.json(
//       { error: "Enter a valid WhatsApp number." },
//       { status: 400 }
//     );
//   }
//
//   // TODO: wire this up to Zoho CRM (see src/app/api/contact/route.ts for the
//   // pattern) once the Ask Me Anything CRM/Campaigns setup is ready.
//   console.log("Ask Me Anything submission:", { name, email, whatsapp, question });
//
//   return NextResponse.json({ ok: true });
// }
export {};
