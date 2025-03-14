import { wait } from "./utils";

interface RateLimitDetail {
  limit: number;
  window: number;
  reset: number;
  used?: number;
}

interface RateLimitRule {
  rule: string;
  limits: RateLimitDetail[];
  state: RateLimitDetail[];
  policy: string;
  ts: number;
}

/**
 * Parses a header value containing one or more segments of the form "value:window:reset"
 * into an array of RateLimitDetail objects.
 */
function parseRateLimitSegments(headerValue: string): RateLimitDetail[] {
  return headerValue.split(",").map((segment) => {
    const [limitStr, windowStr, resetStr] = segment.split(":");
    return {
      limit: Number(limitStr),
      window: Number(windowStr),
      reset: Number(resetStr),
    };
  });
}

/**
 * Parses the Axios response headers to return an array of rate limit rules.
 * It assumes headers are in the format:
 *  - x-rate-limit-[rule]: "value:window:reset[,value:window:reset,...]"
 *  - x-rate-limit-[rule]-state: "value:window:reset[,value:window:reset,...]"
 * Optionally, a header "x-rate-limit-rules" can provide a comma-separated list of rule names.
 */
export function parseRateLimitHeaders(
  headers: Record<string, any>,
): RateLimitRule[] {
  // Normalize header keys to lowercase for consistency.
  const lowerCaseHeaders = Object.keys(headers).reduce((acc: any, key) => {
    acc[key.toLowerCase()] = headers[key];
    return acc;
  }, {});

  const policy = lowerCaseHeaders["x-rate-limit-policy"];

  // Determine the list of rules. If a rules header is provided, use it; otherwise, infer.
  let ruleNames: string[] = [];
  if (lowerCaseHeaders["x-rate-limit-rules"]) {
    ruleNames = lowerCaseHeaders["x-rate-limit-rules"]
      .split(",")
      .map((rule: string) => rule.trim().toLowerCase());
  } else {
    // Infer rule names from header keys matching x-rate-limit-[rule] (ignore -state and policy headers).
    ruleNames = Object.keys(lowerCaseHeaders)
      .filter(
        (key) =>
          key.startsWith("x-rate-limit-") &&
          !key.endsWith("-state") &&
          key !== "x-rate-limit-policy" &&
          key !== "x-rate-limit-rules",
      )
      .map((key) => key.replace("x-rate-limit-", ""));
  }

  // Build the list of rate limit rule objects.
  const rules: RateLimitRule[] = ruleNames.map((rule) => {
    const ruleHeaderKey = `x-rate-limit-${rule}`;
    const stateHeaderKey = `x-rate-limit-${rule}-state`;

    const ruleHeaderValue = lowerCaseHeaders[ruleHeaderKey];
    const stateHeaderValue = lowerCaseHeaders[stateHeaderKey];

    // Parse segments if header values are available.
    const limits = ruleHeaderValue
      ? parseRateLimitSegments(ruleHeaderValue)
      : [];
    const state = stateHeaderValue
      ? parseRateLimitSegments(stateHeaderValue)
      : [];

    for (let i = 0; i < limits.length; i++) {
      limits[i].used = state[i].limit;
    }

    const ts = Date.now();
    return { rule, limits, state, policy, ts };
  });

  return rules;
}

export class RateLimitParser {
  rules: RateLimitRule[] = [];

  parse(headers: Record<string, any>) {
    const parsed = parseRateLimitHeaders(headers);
    this.clearOldRules();

    for (const rule of parsed) {
      const existing = this.rules.find(
        (r) => r.rule === rule.rule && r.policy === rule.policy,
      );
      if (existing) {
        existing.limits = rule.limits;
        existing.state = rule.state;
        existing.ts = rule.ts;
      } else {
        this.rules.push(rule);
      }
    }

    return parsed;
  }

  clearOldRules() {
    /*
     *const now = Date.now();
     *for (let i = 0; i < this.rules.length; i++) {
     *  const rule = this.rules[i];
     *  rule.limits = rule.limits.filter((l) => rule.ts + l.reset * 1000 > now);
     *}
     */
  }

  getWaitTimes() {
    const waitTimes = [];
    this.clearOldRules();

    const limits = this.rules.flatMap((r) => r.limits);
    console.log(limits);
    for (const limit of limits) {
      const used = limit.used || 0;
      const power = Math.sqrt(limit.limit);
      const waitTime =
        (used ** power / limit.limit ** power) * limit.window * 1000;
      waitTimes.push(waitTime);
    }

    console.log({ waitTimes });
    return waitTimes;
  }

  getWaitTime(minTime = 0) {
    return Math.max(...this.getWaitTimes(), minTime);
  }

  async waitForLimit(minTime = 0) {
    const waitTime = this.getWaitTime(minTime);
    console.log(`Waiting for ${waitTime}ms`);
    await wait(waitTime);
  }
}

export const RateLimits = new RateLimitParser();
