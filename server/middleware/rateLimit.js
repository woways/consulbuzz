const buckets =
  new Map();

function now() {
  return Date.now();
}

function cleanupExpired(
  currentTime
) {
  if (
    buckets.size <
    10000
  ) {
    return;
  }

  for (
    const [
      key,
      value,
    ] of buckets
  ) {
    if (
      value.resetAt <=
      currentTime
    ) {
      buckets.delete(
        key
      );
    }
  }
}

export function createRateLimiter({
  windowMs,
  max,
  keyPrefix,
  message,
}) {
  return function rateLimiter(
    req,
    res,
    next
  ) {
    const currentTime =
      now();

    cleanupExpired(
      currentTime
    );

    const ip =
      req.ip ||
      req.socket
        ?.remoteAddress ||
      "unknown";

    const key =
      `${keyPrefix}:${ip}`;

    let entry =
      buckets.get(key);

    if (
      !entry ||
      entry.resetAt <=
        currentTime
    ) {
      entry = {
        count: 0,
        resetAt:
          currentTime +
          windowMs,
      };

      buckets.set(
        key,
        entry
      );
    }

    entry.count += 1;

    res.setHeader(
      "X-RateLimit-Limit",
      String(max)
    );

    res.setHeader(
      "X-RateLimit-Remaining",
      String(
        Math.max(
          max -
            entry.count,
          0
        )
      )
    );

    res.setHeader(
      "X-RateLimit-Reset",
      String(
        Math.ceil(
          entry.resetAt /
            1000
        )
      )
    );

    if (
      entry.count >
      max
    ) {
      res.setHeader(
        "Retry-After",
        String(
          Math.ceil(
            (
              entry.resetAt -
              currentTime
            ) /
              1000
          )
        )
      );

      return res
        .status(429)
        .json({
          success:
            false,
          message,
        });
    }

    return next();
  };
}