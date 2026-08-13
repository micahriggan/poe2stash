import { Price, Poe2Item } from "./types";
import { Poe2Trade } from "./poe2trade";
import { Cache } from "./Cache";
import { ParsedMod, parseMod } from "./mods";

export type Estimate = { price: Price; stdDev: Price };

class PriceEstimator {
  async findMatchingItem(item: Poe2Item, league?: string) {
    const explicits = this.parseItemMods(item).explicits;
    const topMods = this.getHighTierMods(explicits, explicits.length);

    const topMatch = await Poe2Trade.getItemByAttributes({
      rarity: item.item.rarity,
      baseType: item.item.baseType,
      explicit: this.toSearchFilters(topMods),
      status: "securable",
    }, league);

    return topMatch;
  }

  /** Turns parsed mods into trade search filters, keeping the item's rolled value as the floor. */
  toSearchFilters(mods: ParsedMod[]) {
    return mods.map((mod) => ({
      id: mod.hash,
      ...Poe2Trade.range(mod.value1),
    }));
  }

  async estimateItemPrice(item: Poe2Item, league?: string) {
    const explicits = this.parseItemMods(item).explicits;
    console.log("Estimating price for item in league:", league);

    const allPrices: Price[] = [];
    const currency = "exalted";

    // loop until we have 10 prices or we have no more mods to search
    for (let i = explicits.length; i >= 1 && allPrices.length < 10; i--) {
      const topMods = this.getHighTierMods(explicits, i);

      const topMatch = await Poe2Trade.getItemByAttributes({
        status: "securable",
        rarity: item.item.rarity,
        baseType: item.item.baseType,
        explicit: this.toSearchFilters(topMods),
      }, league);
      //await wait(1000);

      // ignore your own listing
      const filtered = topMatch.result.filter((i) => i != item.id);
      const topPrices = await this.getPricesForItemIds(filtered);
      //await wait(5000);

      allPrices.push(...topPrices);
    }

    if (item.item.rarity.toLowerCase() === "normal") {
      // no explicits for normals, so we'll need to lookup seperately
      console.log("fetching normal item", allPrices);
      const normal = await Poe2Trade.getItemByAttributes({
        rarity: item.item.rarity,
        baseType: item.item.baseType,
        status: "securable",
      }, league);
      //await wait(1000);
      const filtered = normal.result.filter((i) => i != item.id);
      const sampledItems = this.sampleRange(filtered, 10);
      const normalPrices = await this.getPricesForItemIds(sampledItems);
      allPrices.push(...normalPrices);
    }

    await this.fetchManyExchangeRates(
      currency,
      allPrices.map((p) => p.currency),
    );
    const estimate = this.priceEstimate(allPrices);

    if (!estimate) {
      // No comparable listings were found (or none had a usable exchange rate), so there
      // is nothing to average. Caching a NaN here would show as `~NaN` for a day.
      console.log("No comparable listings found for", item.item.baseType);
      return null;
    }

    estimate.price = await this.upscalePrice(estimate.price);
    estimate.stdDev = await this.upscalePrice(estimate.stdDev);

    console.log({ allPrices, estimate, item });

    this.cachePriceEstimate(item.item.id, estimate);
    return estimate as Estimate;
    // perform some searches based off the explicits to see if we can find comparable items
    // but we also want to learn about which mods are valuable for rares
    // we can detect this by the general pattern of item_type, item_rarity, (mod1, mod2, ...modN) => price floor
    // we can also learn the max tiers by performing a search for item_type, mod descending. we should save these facts
    // unique items should be handled by searching for the exact item with the mods equal or greater
  }

  async getPricesForItemIds(ids: string[], currency = "exalted") {
    const items = await Poe2Trade.fetchItems(ids);

    const currencies = Poe2Trade.toUniqueItems(
      items.result
        .map((i) => i.listing.price.currency)
        .concat(items.result.map((i) => i.listing.price.currency)),
    );

    await this.fetchManyExchangeRates(currency, currencies);

    const prices = this.toEquivalentPrices(
      currency,
      items.result.map((i) => ({
        amount: i.listing.price.amount,
        currency: i.listing.price.currency,
      })),
    );

    return prices;
  }

  sampleRange(items: string[], want: number) {
    if (items.length <= want) {
      return items;
    }
    const skip = Math.floor(items.length / want);
    return new Array(want).fill(0).map((_v, i) => items[i * skip]);
  }

  async upscalePrice(price: Price) {
    const divineRate = await this.exchangeRate("exalted", "divine");
    if (!Number.isFinite(divineRate) || divineRate <= 0) {
      return price;
    }
    if (price.amount > divineRate) {
      // convert from exalted to divine if large enough
      price.amount = price.amount / divineRate;
      price.currency = "divine";
    }

    return price;
  }

  getCachedEstimates() {
    const cacheKey = `price_estimates`;
    const data = Cache.getJson<Record<string, Estimate>>(cacheKey) || {};

    // Estimates cached before the NaN guard below could hold `{ amount: NaN }`, which
    // JSON stores as `null`. Drop them so they get re-checked rather than rendered.
    return Object.fromEntries(
      Object.entries(data).filter(([, estimate]) =>
        Number.isFinite(estimate?.price?.amount),
      ),
    ) as Record<string, Estimate>;
  }

  /**
   * Sums a set of prices into a single figure, converting every entry into `currency`
   * first and then upscaling to divine once the total is large enough.
   */
  async totalValue(prices: Price[], currency = "exalted") {
    const usable = prices.filter((p) => p && Number.isFinite(p.amount));

    await this.fetchManyExchangeRates(
      currency,
      usable.map((p) => p.currency),
    );

    const equivalent = this.toEquivalentPrices(currency, usable).filter((p) =>
      Number.isFinite(p.amount),
    );

    return this.upscalePrice(this.sumPrice(equivalent));
  }

  cachePriceEstimate(itemId: string, estimate: Estimate) {
    const cacheKey = `price_estimates`;
    const data = Cache.getJson<Record<string, Estimate>>(cacheKey) || {};
    data[itemId] = estimate;
    Cache.setJson(cacheKey, data, Cache.times.day);
  }

  priceEstimate(prices: Price[]) {
    // A missing exchange rate turns a converted price into NaN, and averaging an empty
    // list gives NaN as well, so drop anything that isn't a real number first.
    prices = prices.filter((p) => Number.isFinite(p.amount));

    if (!prices.length) {
      return null;
    }

    // check to make sure currency is the same

    const currencies = Poe2Trade.toUniqueItems(prices.map((p) => p.currency));

    if (currencies.length > 1) {
      throw new Error("Multiple currencies found");
    }

    const priceAmounts = prices.map((p) => p.amount);

    const price = this.mean(priceAmounts);

    const stdDev = this.stdDev(priceAmounts);

    const currency = currencies[0];

    return {
      price: { amount: price, currency },
      stdDev: { amount: stdDev, currency },
    };
  }

  getCachedExchangeRates(iWant: string, iHave: string) {
    const cacheKey = `exchange_rates`;
    const cacheData = Cache.getJson<Record<string, number>>(cacheKey) || {};

    const key = `${iWant}_${iHave}`;
    return cacheData[key];
  }

  cacheExchangeRates(iWant: string, iHave: string, rate: number) {
    const cacheKey = `exchange_rates`;
    const cache = localStorage.getItem(cacheKey);
    const cacheData = cache ? JSON.parse(cache) : {};

    const key = `${iWant}_${iHave}`;
    cacheData[key] = rate;

    Cache.setJson(cacheKey, cacheData, Cache.times.hour);
  }

  toEquivalentPrices(iWant: string, prices: Price[]) {
    return prices.map((p) => ({
      amount: this.equivalentPrice(iWant, p),
      currency: iWant,
    }));
  }

  equivalentPrice(iWant: string, price: Price) {
    if (price.currency === iWant) {
      return price.amount;
    }

    const cachedRate = this.getCachedExchangeRates(iWant, price.currency);

    console.log(
      price.amount,
      price.currency,
      `=`,
      price.amount * cachedRate,
      iWant,
    );
    return price.amount * cachedRate;
  }

  async fetchManyExchangeRates(iWant: string, iHave: string[]) {
    for (const currency of Poe2Trade.toUniqueItems(iHave)) {
      await this.exchangeRate(iWant, currency);
    }
  }

  async avgExchangeRate(iWant: string, iHave: string) {
    const rate1 = await this.exchangeRate(iWant, iHave);
    const rate2 = 1 / (await this.exchangeRate(iHave, iWant));

    return (rate1 + rate2) / 2;
  }

  async exchangeRate(iWant: string, iHave: string) {
    const cached = this.getCachedExchangeRates(iWant, iHave);

    if (cached) {
      return cached;
    }

    if (iWant === iHave) {
      await this.cacheExchangeRates(iWant, iHave, 1);
      return 1;
    }

    const swaps = await Poe2Trade.client.getCurrencySwaps(iWant, iHave);
    const amounts = Object.values(swaps.result)
      .map((s) =>
        s.listing.offers.map((o) => ({
          amount: o.item.amount / o.exchange.amount,
          currency: o.exchange.currency,
        })),
      )
      .flat() as Price[];

    const prices = amounts.map((a) => a.amount).slice(0, 10);
    const weights = Object.values(swaps.result)
      .map((s) => s.listing.offers.map((o) => o.item.amount))
      .flat()
      .slice(0, 10);

    console.log({ iWant, iHave, amounts, weights });
    const mean = this.weightedAvg(prices, weights);

    if (!Number.isFinite(mean)) {
      // No offers came back, so there is no rate to cache. Caching NaN would poison
      // every conversion through this pair for the next hour.
      console.log("No exchange rate available for", iWant, "/", iHave);
      return mean;
    }

    await this.cacheExchangeRates(iWant, iHave, mean);
    return mean;
  }

  sumPrice(prices: Price[]) {
    if (!prices.length) {
      return { amount: 0, currency: "exalted" } as Price;
    }

    const currencies = Poe2Trade.toUniqueItems(prices.map((p) => p.currency));

    if (currencies.length > 1) {
      throw new Error("Multiple currencies found");
    }

    const currency = prices[0].currency;
    const amount = this.sum(prices.map((p) => p.amount));

    return { amount, currency } as Price;
  }

  sum(values: number[]) {
    return values.reduce((a, b) => a + b, 0);
  }

  mean(values: number[]) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  weightedAvg(values: number[], weights: number[]) {
    return this.sum(values.map((v, i) => v * weights[i])) / this.sum(weights);
  }

  variance(values: number[]) {
    const mean = this.mean(values);
    return this.mean(values.map((v) => Math.pow(v - mean, 2)));
  }

  stdDev(values: number[]) {
    return Math.sqrt(this.variance(values));
  }

  // The trade API now returns each mod with its stat id and tier attached, so mods no
  // longer have to be matched back to the stat table by their text.
  parseItemMods(item: Poe2Item) {
    const explicits = (item.item.explicitMods || []).map(parseMod);
    const implicits = (item.item.implicitMods || []).map(parseMod);
    const enchants = (item.item.enchantMods || []).map(parseMod);

    console.log({ explicits, implicits, enchants });

    return {
      explicits,
      implicits,
      enchants,
    };
  }

  /**
   * The `topN` best mods on the item. Tier 1 is the best tier, so this sorts ascending;
   * mods whose tier is unknown sort last rather than being treated as top rolls.
   */
  getHighTierMods(mods: ParsedMod[], topN: number) {
    const rank = (mod: ParsedMod) => mod.tierNum ?? Number.MAX_SAFE_INTEGER;
    return [...mods].sort((a, b) => rank(a) - rank(b)).slice(0, topN);
  }
}

export const PriceChecker = new PriceEstimator();
