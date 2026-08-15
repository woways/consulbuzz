import crypto from "crypto";

export function requestId(
  req,
  res,
  next
) {
  const id =
    req.headers[
      "x-request-id"
    ] ||
    crypto.randomUUID();

  req.requestId =
    String(id);

  res.setHeader(
    "X-Request-Id",
    req.requestId
  );

  next();
}

export function securityHeaders(
  req,
  res,
  next
) {
  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  res.setHeader(
    "X-Frame-Options",
    "DENY"
  );

  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  res.setHeader(
    "Cross-Origin-Resource-Policy",
    "same-site"
  );

  res.setHeader(
    "X-DNS-Prefetch-Control",
    "off"
  );

  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  next();
}

export function requestLogger(
  req,
  res,
  next
) {
  const startedAt =
    Date.now();

  res.on(
    "finish",
    () => {
      const duration =
        Date.now() -
        startedAt;

      const line = {
        requestId:
          req.requestId,
        method:
          req.method,
        path:
          req.originalUrl,
        status:
          res.statusCode,
        durationMs:
          duration,
      };

      console.log(
        JSON.stringify(
          line
        )
      );
    }
  );

  next();
}