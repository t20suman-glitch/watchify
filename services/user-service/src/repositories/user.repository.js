const User = require('../models/user.model');

async function create({ email, username, passwordHash }) {
  const doc = await User.create({
    email: email.trim().toLowerCase(),
    username: username.trim(),
    password: passwordHash,
  });
  return doc;
}

async function findByEmail(email) {
  return User.findOne({ email: email.trim().toLowerCase() }).select('+password');
}

async function findById(id) {
  return User.findById(id);
}

function toProto(doc) {
  return {
    id: doc._id.toString(),
    email: doc.email,
    username: doc.username,
    created_at: doc.createdAt?.toISOString() ?? '',
    updated_at: doc.updatedAt?.toISOString() ?? '',
  };
}

module.exports = { create, findByEmail, findById, toProto };
