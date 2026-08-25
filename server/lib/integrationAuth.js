import crypto from "crypto";

function signingSecret() {
  const value = String(process.env.INTEGRATION_SIGNING_SECRET || "").trim();

  if (value.length < 32) {
    throw new Error(
      "INTEGRATION_SIGNING_SECRET must be configured with at least 32 characters"
    );
  }

  return value;
}

export function integrationApiKey(companyId, provider, version = 1) {
  const digest = crypto
    .createHmac("sha256", signingSecret())
    .update(`${companyId}:${provider}:${Number(version) || 1}`)
    .digest("hex");

  return `cb_${String(provider).toLowerCase()}_${digest}`;
}

export function integrationApiKeyMatches(
  companyId,
  provider,
  candidate,
  version = 1
) {
  const expected = integrationApiKey(companyId, provider, version);
  const received = String(candidate || "");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}