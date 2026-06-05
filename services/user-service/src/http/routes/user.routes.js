const express = require('express');
const userService = require('../../services/user.service');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(201).json({ user });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const result = await userService.loginUser(req.body);
    res.json(result);
  })
);

router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const access_token = getBearerToken(req);
    const user = await userService.getProfile({ access_token });
    res.json({ user });
  })
);

module.exports = router;
