import { Price, Poe2Item } from "./types";
import { Poe2Trade } from "./poe2trade";
import { Cache } from "./Cache";
import { Stats } from "../data/stats";

export type Stat = (typeof Stats)[0]["entries"][0];
export type Explicit = Poe2Item["item"]["extended"]["mods"]["explicit"][0];
export type Estimate = { price: Price; stdDev: Price };

class PriceEstimator {
  async findMatchingItem(item: Poe2Item, league?: string) {
    const parsedMods = this.parseItemMods(item);
    const topMods = await this.getHighTierMods(
      item,
      parsedMods.explicits?.length || 0,
    );

    const topStats = topMods
      .map((s) => s.magnitudes)
      .flat()
      .map((mag) => mag.hash)
      .map((hash) => parsedMods?.explicits?.find((p) => p.hash === hash))
      .filter((p) => p);

    const topMatch = await Poe2Trade.getItemByAttributes({
      rarity: item.item.rarity,
      baseType: item.item.baseType,
      explicit: topStats.map((s) => ({
        id: s!.hash,
        ...Poe2Trade.range(s!.value1),
      })),
      status: "securable",
    }, league);

    return topMatch;
  }

  async estimateItemPrice(item: Poe2Item, league?: string) {
    const parsedMods = this.parseItemMods(item);
    console.log("Estimating price for item in league:", league);

    const allPrices: Price[] = [];
    const currency = "exalted";

    // loop until we have 10 prices or we have no more mods to search
    for (
      let i = parsedMods?.explicits?.length || 0;
      i >= 1 && allPrices.length < 10;
      i--
    ) {
      const topMods = await this.getHighTierMods(item, i);

      const topStats = topMods
        .map((s) => s.magnitudes)
        .flat()
        .map((mag) => mag.hash)
        .map((hash) => parsedMods?.explicits?.find((p) => p.hash === hash))
        .filter((p) => p);

      const topMatch = await Poe2Trade.getItemByAttributes({
        status: "securable",
        rarity: item.item.rarity,
        baseType: item.item.baseType,
        explicit: topStats.map((s) => ({
          id: s!.hash,
          ...Poe2Trade.range(s!.value1),
        })),
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
    return data;
  }

  cachePriceEstimate(itemId: string, estimate: Estimate) {
    const cacheKey = `price_estimates`;
    const data = Cache.getJson<Record<string, Estimate>>(cacheKey) || {};
    data[itemId] = estimate;
    Cache.setJson(cacheKey, data, Cache.times.day);
  }

  priceEstimate(prices: Price[]) {
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

  extractMod(mod: string) {
    // This regex captures a number (integer or decimal) at the beginning of the string
    const numberCapture = /^.*?([-+]?\d+(?:\.\d+)?)(.*)$/;

    // First, replace bracketed alternatives:
    // This handles patterns with a pipe, e.g. "[Foo|Bar]"
    const bracketCapture = /\[([^|\]]+)\|([^\]]+)\]/g;
    const withoutPipeBrackets = mod.replace(bracketCapture, "$2");

    // Next, replace any remaining single brackets (without a pipe)
    const singleBracketCapture = /\[([^\]]+)\]/g;
    const withoutBrackets = withoutPipeBrackets.replace(
      singleBracketCapture,
      "$1",
    );

    // Finally, replace all numbers globally with "#"
    const output = withoutBrackets.replace(/[-+]?\d+(?:\.\d+)?/g, "#"); // Replace the number with a '#' and capture the rest of the string in group 2.

    // To capture the numbers that were replaced:
    const match = mod.match(numberCapture);

    // Look for generalized match, or exact match
    const statEntry = this.getStatEntryForMod(output, withoutBrackets);

    if (!statEntry) {
      console.log(`No stat entry found for mod: ${mod}, ${output}`);
      throw new Error(`No stat entry found for mod: ${mod}, ${output}`);
    }

    let value1 = match ? Number(match[1]) : undefined;
    let value2 = match && match[2] ? Number(match[2]) : undefined;

    const inverted =
      (statEntry.text.includes("increased") && output.includes("reduced")) ||
      (statEntry.text.includes("reduced") && output.includes("increased"));

    if (statEntry.text !== output && inverted) {
      // we had to invert to find the stat entry
      if (value1) value1 = -value1;
      if (value2) value2 = -value2;
    }

    return {
      mod: mod,
      parsed: output,
      value1,
      value2,
      hash: statEntry.id,
    };
  }

  getStatEntryForMod(mod: string, original?: string) {
    const stats = Stats.map((statGroup) =>
      statGroup.entries.filter(
        (entry) =>
          entry.text === mod ||
          entry.text === mod.replace("increased", "reduced") ||
          entry.text === mod.replace("reduced", "increased") ||
          entry.text === mod.replace("in your Maps", "in Area") ||
          entry.text === mod.replace("in your Maps", "in this Area") ||
          (original && entry.text === original),
      ),
    ).flat();
    return stats.length > 0 ? stats[0] : null;
  }

  parseItemMods(item: Poe2Item) {
    const explicits = item.item.explicitMods?.map((mod) => {
      return this.extractMod(mod);
    });
    const implicits = item.item.implicitMods?.map((mod) => {
      return this.extractMod(mod);
    });
    const enchants = item.item.enchantMods?.map((mod) => {
      return this.extractMod(mod);
    });

    console.log({ explicits, implicits, enchants });

    return {
      explicits,
      implicits,
      enchants,
    };
  }

  getStatEntry(mod: Explicit) {
    return mod.magnitudes
      .map((magnitude) => {
        return Stats.map((statGroup) =>
          statGroup.entries.filter((entry) => entry.id === magnitude.hash),
        );
      })
      .flat();
  }

  async getHighTierMods(item: Poe2Item, topN: number) {
    return item.item.extended.mods.explicit
      .map((mod) => {
        return {
          mod: mod.name,
          tier: mod.tier,
          level: mod.level,
          tierNum: Number(mod.tier.replace("S", "").replace("P", "")),
          magnitudes: mod.magnitudes,
        };
      })
      .sort((a, b) => b.tierNum - a.tierNum)
      .slice(0, topN);
  }
}

export const PriceChecker = new PriceEstimator();
