import { Job } from "./Job";
import { Estimate, PriceChecker } from "../services/PriceEstimator";
import { Poe2Item } from "../services/types";

export class PriceCheckAllItems extends Job<Estimate> {
  constructor(
    private filteredItems: Poe2Item[],
    private skipAlreadyChecked = true,
  ) {
    super(
      "price-check-items",
      "Price Checking Items",
      "Checking items listed...",
    );
  }

  async *_task() {
    const cached = PriceChecker.getCachedEstimates();
    for (let i = 0; i < this.filteredItems.length; i++) {
      const item = this.filteredItems[i];

      if (cached[item.id] && this.skipAlreadyChecked) {
        yield {
          total: this.filteredItems.length,
          current: i + 1,
          data: cached[item.id],
        };
      } else {
        try {
          const price = await PriceChecker.estimateItemPrice(item);
          yield {
            total: this.filteredItems.length,
            current: i + 1,
            data: price,
          };
        } catch (error: any) {
          console.error(error);
          if(error?.response?.data) {
            console.log("setting desc")
            this.error = error.response.data;
          }
        }
      }
    }
  }
}
