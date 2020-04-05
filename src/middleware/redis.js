const redis = require("redis");

let _client = null;

module.exports = function redisMiddleware(redisConfig) {
  return (req, res, next) => {
    if (!_client) {
      _client = redis.createClient({
        ...redisConfig,
      });
    };
    req.redisClient = _client;
    next();
  };
};
