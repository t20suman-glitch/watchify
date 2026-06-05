const express = require('express');
const watchService = require('../../services/watch.service');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get(
  '/latest',
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const videos = await watchService.getLatestVideos({ page, limit });
    res.json({ videos });
  })
);

router.get(
  '/history',
  requireAuth,
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const history = await watchService.getWatchHistory({
      userId: req.user.id,
      page,
      limit,
    });
    res.json({ history });
  })
);

router.get(
  '/:mediaId/stream',
  requireAuth,
  asyncHandler(async (req, res) => {
    await watchService.pipeWatchStream({
      userId: req.user.id,
      mediaId: req.params.mediaId,
      res,
    });
  })
);

router.patch(
  '/:mediaId/progress',
  requireAuth,
  asyncHandler(async (req, res) => {
    const session = await watchService.updateProgress({
      userId: req.user.id,
      mediaId: req.params.mediaId,
      sessionId: req.body.sessionId || req.body.session_id,
      positionSeconds: Number(req.body.positionSeconds ?? req.body.position_seconds ?? 0),
    });
    res.json({ session });
  })
);

router.get(
  '/:mediaId',
  asyncHandler(async (req, res) => {
    const video = await watchService.getVideo(req.params.mediaId);
    res.json({ video });
  })
);

module.exports = router;
