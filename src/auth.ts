
import pkg from 'pg'
import { betterAuth } from 'better-auth'
// import { Pool } from "pg";
// import Database from "better-sqlite3"


const { Pool } = pkg

export const auth = betterAuth({
  emailAndPassword: { enabled: true },
  database: new Pool({ connectionString: import.meta.env.DATABASE_URL })
})

// import { betterAuth } from 'better-auth';

// export const auth = betterAuth({
//     // database: new Pool({ 
//     //     connectionString: process.env.DATABASE_URL 
//     // }),
//     database: new Database("./sqlite.db"),
//     baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4321",
//     secret: process.env.BETTER_AUTH_SECRET!,
//     socialProviders: { 
//         google: { 
//             clientId: process.env.GOOGLE_CLIENT_ID!, 
//             clientSecret: process.env.GOOGLE_CLIENT_SECRET!, 
//         } 
//     },
//     user: { 
//         additionalFields: { 
//             userMetadata: { 
//                 type: 'json', 
//                 required: false, 
//                 input: false, 
//             }, 
//             appMetadata: { 
//                 type: 'json', 
//                 required: false, 
//                 input: false, 
//             }, 
//             invitedAt: { 
//                 type: 'date', 
//                 required: false, 
//                 input: false, 
//             }, 
//             lastSignInAt: { 
//                 type: 'date', 
//                 required: false, 
//                 input: false, 
//             }, 
//         }, 
//     }, 
// })