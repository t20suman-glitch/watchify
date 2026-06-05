const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const AppError = require('../errors/appError');

class LocalStorageProvider {
  constructor({ uploadDir }) {
    this.uploadDir = uploadDir;
  }

  resolvePath(key) {
    return path.join(this.uploadDir, key);
  }

  async save({ buffer, key }) {
    const fullPath = this.resolvePath(key);
    await fsPromises.mkdir(path.dirname(fullPath), { recursive: true });
    await fsPromises.writeFile(fullPath, buffer);
    return { key, url: null };
  }

  async getReadStream(key) {
    const fullPath = this.resolvePath(key);
    try {
      await fsPromises.access(fullPath);
    } catch {
      throw AppError.notFound('File not found in storage');
    }
    return { stream: fs.createReadStream(fullPath) };
  }

  async delete(key) {
    const fullPath = this.resolvePath(key);
    await fsPromises.unlink(fullPath).catch(() => {});
  }
}

module.exports = LocalStorageProvider;
