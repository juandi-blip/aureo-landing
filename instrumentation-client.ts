import { initBotId } from "botid/client/core";

// Register the endpoints BotID should challenge. Protection activates once
// deployed on Vercel; locally checkBotId() is permissive.
initBotId({
  protect: [
    { path: "/api/waitlist", method: "POST" },
    { path: "/api/waitlist", method: "PATCH" },
    { path: "/api/auth/signup", method: "POST" },
    { path: "/api/auth/login", method: "POST" },
  ],
});
