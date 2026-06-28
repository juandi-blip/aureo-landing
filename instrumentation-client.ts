import { initBotId } from "botid/client/core";

// Register the endpoints BotID should challenge. Protection activates once
// deployed on Vercel; locally checkBotId() is permissive.
initBotId({
  protect: [{ path: "/api/waitlist", method: "POST" }],
});
