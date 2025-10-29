import { Job } from "./Job";
import { Poe2Trade } from "../services/poe2trade";
import { PriceChecker } from "../services/PriceEstimator";

export class SyncAccount extends Job<string[]> {
  constructor(private account: string, private league: string = "Standard") {
    super(
      "account-sync",
      "Sync Account",
      "Scrapes the trade website for all your items. This might take a few minutes.",
    );
  }

  async *_task() {

    try {
      let price = 1;
      let currency = "exalted";
      let allItems: string[] = [];
      let done = false;
      let count = 0;

      let allCachedItems = Poe2Trade.getCachedAccountItems(this.account);
      let totalNeeded = 0;

      while (!done) {
        count++;

        if (count > 20) {
          console.log("Too many iterations");
          break;
        }

        const response = await Poe2Trade.getAccountItems(
          this.account,
          price,
          currency,
          this.league,
        );

        if (count === 1) {
          totalNeeded = response.total;

          if (totalNeeded === allCachedItems.length) {
            // on the first iteration we can detect we've already got everything
            console.log("No new items found");
            return allCachedItems;
          }

          console.log("clearning account item cache");
          Poe2Trade.setCachedAccountItems(this.account, []);
          allCachedItems = [];
        }

        console.log(
          "Trade site says we need to fetch",
          response.total,
          "items. We have",
          allCachedItems.length,
        );

        if (!response.result.length) {
          done = true;
          break;
        }

        Poe2Trade.upsertCachedAccountItems(this.account, response.result);
        Poe2Trade.pruneAccountItemsLessThan(
          this.account,
          price,
          currency,
          allItems,
        );
        allCachedItems = Poe2Trade.getCachedAccountItems(this.account);

        const [lastItem] = await Poe2Trade.fetchAllItems(this.account, [
          response.result[response.result.length - 1],
        ]);

        let lastItemPrice = lastItem?.listing.price.amount || price;
        let lastItemPriceCurrency = lastItem?.listing.price.currency || currency;

        if (lastItemPriceCurrency !== currency) {
          const exchangeRate = await PriceChecker.avgExchangeRate(
            currency,
            lastItemPriceCurrency,
          );
          // convert everything to exalted price
          lastItemPrice = exchangeRate * lastItemPrice;
          lastItemPriceCurrency = currency;
        }

        if (lastItemPrice == price) {
          // if no price is present on the last guy, this should hit
          const itemLevelFetch = await Poe2Trade.getAllAccountItemsByItemLevel(
            this.account,
            price,
            currency,
            this.league,
          );
          allItems.push(...itemLevelFetch);
          console.log({ lastItemPrice, price }, "incrementing price");
          price++;
        } else {
          console.log({ lastItemPrice }, "jumping price");
          price = lastItemPrice > price ? lastItemPrice : price * 1.2;
        }

        allItems.push(...response.result);
        allItems = Poe2Trade.toUniqueItems(allItems);

        yield {
          total: totalNeeded,
          current: allItems.length,
          data: allItems,
        };

        console.log("Seen items:", allItems.length);
      }

      Poe2Trade.setCachedAccountItems(this.account, allItems);
      return allItems;
    } catch (error: any) {
      console.error(error);
      if(error?.response?.data) {
        this.error = error.response.data?.error?.message || error.response.data;
      }
    }
  }
}
