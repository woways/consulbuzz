function normalizeIp(ip) {
  return String(ip || "")
    .trim()
    .replace(/^::ffff:/, "");
}

export function isPublicIp(ip) {
  const value = normalizeIp(ip);

  if (!value) return false;

  if (
    value === "::1" ||
    value === "127.0.0.1" ||
    value === "0.0.0.0" ||
    value === "localhost"
  ) {
    return false;
  }

  // Common private IPv4 ranges.
  if (
    /^10\./.test(value) ||
    /^192\.168\./.test(value) ||
    /^169\.254\./.test(value) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(value)
  ) {
    return false;
  }

  // Common local/private IPv6 ranges.
  if (
    /^fe80:/i.test(value) ||
    /^fc/i.test(value) ||
    /^fd/i.test(value)
  ) {
    return false;
  }

  return true;
}

function countryName(countryCode) {
  if (!countryCode) return null;

  try {
    return new Intl.DisplayNames(
      ["en"],
      {
        type: "region",
      }
    ).of(
      String(countryCode)
        .toUpperCase()
    );
  } catch {
    return String(countryCode)
      .toUpperCase();
  }
}

export async function lookupIpLocation(ip) {
  const value =
    normalizeIp(ip);

  if (
    !isPublicIp(
      value
    )
  ) {
    return null;
  }

  const token =
    process.env.IPINFO_TOKEN;

  if (!token) {
    return null;
  }

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      2500
    );

  try {
    const response =
      await fetch(
        `https://ipinfo.io/${encodeURIComponent(value)}/json?token=${encodeURIComponent(token)}`,
        {
          signal:
            controller.signal,
          headers: {
            Accept:
              "application/json",
          },
        }
      );

    if (
      !response.ok
    ) {
      return null;
    }

    const data =
      await response.json();

    if (
      data?.bogon
    ) {
      return null;
    }

    return {
      city:
        data?.city
          ? String(
              data.city
            ).slice(
              0,
              120
            )
          : null,

      country:
        data?.country
          ? String(
              countryName(
                data.country
              ) ||
                data.country
            ).slice(
              0,
              120
            )
          : null,
    };
  } catch (error) {
    if (
      error?.name !==
      "AbortError"
    ) {
      console.error(
        "IP geolocation lookup failed:",
        error?.message ||
          error
      );
    }

    return null;
  } finally {
    clearTimeout(
      timeout
    );
  }
}