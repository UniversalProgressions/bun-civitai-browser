This project is aiming to be a fullstack application to download, manage and browsing models those downloaded form CivitAI.

It involves in a ton of npm packages for frontend and backend development.

At first I have to say that it's not a SSR project.

For frontend, it uses:
React, Jotai, Antd, tailwindCSS

For backend, it uses:
Bun.js runtime, Elysia framework, prisma ORM(SQLite).

The communication between frontend and backend is mainly via Elysia's feature "EdenTreaty" to achieve type safe communication.
