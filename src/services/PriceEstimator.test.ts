import { describe, it, expect, vi, afterEach } from "vitest";
import { PriceChecker } from "./PriceEstimator";
import { Poe2Trade } from "./poe2trade";
import { ParsedMod } from "./mods";
import { Poe2Item } from "./types";

/** 1 divine is worth 100 exalted, as far as these tests are concerned. */
const seedExchangeRates = () =>
  localStorage.setItem("exchange_rates", JSON.stringify({ exalted_divine: 100 }));

const parsed = (hash: string, tierNum?: number, value1?: number): ParsedMod => ({
  hash,
  text: hash,
  value1,
  tierNum,
  level: 60,
});

const item = (explicitMods: unknown[] = []) =>
  ({
    id: "listing-1",
    listing: { price: { amount: 5, currency: "exalted" } },
    item: { id: "listing-1", rarity: "Rare", baseType: "Corsair Coat", explicitMods },
  }) as unknown as Poe2Item;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getHighTierMods", () => {
  it("picks the best tiers first, since tier 1 beats tier 8", () => {
    const mods = [parsed("worst", 8), parsed("mid", 3), parsed("best", 1)];

    expect(PriceChecker.getHighTierMods(mods, 2).map((m) => m.hash)).toEqual([
      "best",
      "mid",
    ]);
  });

  it("treats tier 0 as the best tier", () => {
    const mods = [parsed("one", 1), parsed("zero", 0)];

    expect(PriceChecker.getHighTierMods(mods, 1)[0].hash).toBe("zero");
  });

  it("ranks mods of unknown tier last", () => {
    const mods = [parsed("unknown", undefined), parsed("worst", 8)];

    expect(PriceChecker.getHighTierMods(mods, 2).map((m) => m.hash)).toEqual([
      "worst",
      "unknown",
    ]);
  });

  it("does not mutate the array it is given", () => {
    const mods = [parsed("worst", 8), parsed("best", 1)];
    PriceChecker.getHighTierMods(mods, 2);

    expect(mods.map((m) => m.hash)).toEqual(["worst", "best"]);
  });

  it("returns everything when topN exceeds the mod count", () => {
    expect(PriceChecker.getHighTierMods([parsed("a", 1)], 5)).toHaveLength(1);
  });
});

describe("toSearchFilters", () => {
  it("uses the rolled value as the search floor", () => {
    expect(PriceChecker.toSearchFilters([parsed("explicit.stat_1", 1, 232)])).toEqual([
      { id: "explicit.stat_1", min: 232 },
    ]);
  });

  it("omits the floor for a mod with no value", () => {
    expect(PriceChecker.toSearchFilters([parsed("explicit.stat_1", 1)])).toEqual([
      { id: "explicit.stat_1" },
    ]);
  });
});

describe("priceEstimate", () => {
  it("returns null rather than NaN when there is nothing to average", () => {
    expect(PriceChecker.priceEstimate([])).toBeNull();
  });

  it("drops prices that failed to convert", () => {
    const estimate = PriceChecker.priceEstimate([
      { amount: 10, currency: "exalted" },
      { amount: NaN, currency: "exalted" },
      { amount: 20, currency: "exalted" },
    ]);

    expect(estimate?.price).toEqual({ amount: 15, currency: "exalted" });
  });

  it("returns null when every price failed to convert", () => {
    expect(
      PriceChecker.priceEstimate([{ amount: NaN, currency: "exalted" }]),
    ).toBeNull();
  });

  it("reports the mean and standard deviation", () => {
    const estimate = PriceChecker.priceEstimate([
      { amount: 10, currency: "exalted" },
      { amount: 20, currency: "exalted" },
    ]);

    expect(estimate?.price.amount).toBe(15);
    expect(estimate?.stdDev.amount).toBe(5);
  });

  it("refuses to average across currencies", () => {
    expect(() =>
      PriceChecker.priceEstimate([
        { amount: 1, currency: "divine" },
        { amount: 10, currency: "exalted" },
      ]),
    ).toThrow(/Multiple currencies/);
  });
});

describe("getCachedEstimates", () => {
  it("hides estimates cached before the NaN guard existed", () => {
    // NaN serialises to null, which is what a poisoned cache entry looks like on disk.
    localStorage.setItem(
      "price_estimates",
      JSON.stringify({
        good: { price: { amount: 12, currency: "exalted" }, stdDev: { amount: 1, currency: "exalted" } },
        poisoned: { price: { amount: NaN, currency: "exalted" }, stdDev: { amount: NaN, currency: "exalted" } },
      }),
    );

    expect(Object.keys(PriceChecker.getCachedEstimates())).toEqual(["good"]);
  });

  it("is empty when nothing has been cached", () => {
    expect(PriceChecker.getCachedEstimates()).toEqual({});
  });
});

describe("upscalePrice", () => {
  it("converts to divine once the total is worth more than one", async () => {
    seedExchangeRates();

    expect(await PriceChecker.upscalePrice({ amount: 250, currency: "exalted" })).toEqual({
      amount: 2.5,
      currency: "divine",
    });
  });

  it("leaves smaller amounts in exalted", async () => {
    seedExchangeRates();

    expect(await PriceChecker.upscalePrice({ amount: 40, currency: "exalted" })).toEqual({
      amount: 40,
      currency: "exalted",
    });
  });

  it("leaves the price alone when no exchange rate is available", async () => {
    // An exchange with no offers used to yield NaN and wipe out the amount.
    vi.spyOn(Poe2Trade.client, "getCurrencySwaps").mockResolvedValue({
      result: {},
    } as never);

    expect(await PriceChecker.upscalePrice({ amount: 5000, currency: "exalted" })).toEqual({
      amount: 5000,
      currency: "exalted",
    });
  });
});

describe("exchangeRate", () => {
  it("does not cache a rate it could not work out", async () => {
    const swaps = vi
      .spyOn(Poe2Trade.client, "getCurrencySwaps")
      .mockResolvedValue({ result: {} } as never);

    expect(await PriceChecker.exchangeRate("exalted", "chaos")).toBeNaN();
    expect(localStorage.getItem("exchange_rates")).toBeNull();

    // A later attempt is free to try again rather than reading back a cached NaN.
    await PriceChecker.exchangeRate("exalted", "chaos");
    expect(swaps).toHaveBeenCalledTimes(2);
  });
});

describe("totalValue", () => {
  it("sums a mixed-currency stash into one figure", async () => {
    seedExchangeRates();

    // 100 exalted + (2 divine = 200 exalted) = 300 exalted, which upscales to 3 divine.
    expect(
      await PriceChecker.totalValue([
        { amount: 100, currency: "exalted" },
        { amount: 2, currency: "divine" },
      ]),
    ).toEqual({ amount: 3, currency: "divine" });
  });

  it("ignores prices it cannot convert instead of returning NaN", async () => {
    seedExchangeRates();

    expect(
      await PriceChecker.totalValue([
        { amount: 30, currency: "exalted" },
        { amount: NaN, currency: "exalted" },
      ]),
    ).toEqual({ amount: 30, currency: "exalted" });
  });

  it("is zero for an empty stash", async () => {
    seedExchangeRates();

    expect(await PriceChecker.totalValue([])).toEqual({ amount: 0, currency: "exalted" });
  });
});

describe("estimateItemPrice", () => {
  const mod = {
    description: "+232 to [Evasion] Rating",
    domain: "explicit",
    hash: "stat.explicit.stat_53045048",
    mods: [{ name: "Adroit", tier: "P3", level: 65, magnitudes: [] }],
  };

  it("caches an estimate averaged from the comparable listings", async () => {
    seedExchangeRates();
    vi.spyOn(Poe2Trade, "getItemByAttributes").mockResolvedValue({
      result: ["other-1", "other-2"],
    } as never);
    vi.spyOn(Poe2Trade, "fetchItems").mockResolvedValue({
      result: [
        { listing: { price: { amount: 10, currency: "exalted" } } },
        { listing: { price: { amount: 20, currency: "exalted" } } },
      ],
    } as never);

    const estimate = await PriceChecker.estimateItemPrice(item([mod]));

    expect(estimate?.price).toEqual({ amount: 15, currency: "exalted" });
    expect(PriceChecker.getCachedEstimates()["listing-1"].price.amount).toBe(15);
  });

  it("returns null and caches nothing when no comparables come back", async () => {
    seedExchangeRates();
    vi.spyOn(Poe2Trade, "getItemByAttributes").mockResolvedValue({ result: [] } as never);
    vi.spyOn(Poe2Trade, "fetchItems").mockResolvedValue({ result: [] } as never);

    expect(await PriceChecker.estimateItemPrice(item([mod]))).toBeNull();
    expect(PriceChecker.getCachedEstimates()).toEqual({});
  });

  it("searches on the item's own roll as the floor", async () => {
    seedExchangeRates();
    const search = vi
      .spyOn(Poe2Trade, "getItemByAttributes")
      .mockResolvedValue({ result: [] } as never);
    vi.spyOn(Poe2Trade, "fetchItems").mockResolvedValue({ result: [] } as never);

    await PriceChecker.estimateItemPrice(item([mod]));

    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({
        baseType: "Corsair Coat",
        explicit: [{ id: "explicit.stat_53045048", min: 232 }],
      }),
      undefined,
    );
  });
});

describe("sampleRange", () => {
  it("returns everything when there is less than asked for", () => {
    expect(PriceChecker.sampleRange(["a", "b"], 5)).toEqual(["a", "b"]);
  });

  it("spreads the sample across the range", () => {
    const items = Array.from({ length: 10 }, (_, i) => String(i));

    expect(PriceChecker.sampleRange(items, 5)).toEqual(["0", "2", "4", "6", "8"]);
  });
});

describe("sumPrice", () => {
  it("is zero exalted for no prices", () => {
    expect(PriceChecker.sumPrice([])).toEqual({ amount: 0, currency: "exalted" });
  });

  it("refuses to add across currencies", () => {
    expect(() =>
      PriceChecker.sumPrice([
        { amount: 1, currency: "divine" },
        { amount: 1, currency: "exalted" },
      ]),
    ).toThrow(/Multiple currencies/);
  });
});
