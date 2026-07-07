import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playersRouter from "./players";
import matchesRouter from "./matches";
import leaderboardRouter from "./leaderboard";
import badgesRouter from "./badges";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playersRouter);
router.use(matchesRouter);
router.use(leaderboardRouter);
router.use(badgesRouter);

export default router;
