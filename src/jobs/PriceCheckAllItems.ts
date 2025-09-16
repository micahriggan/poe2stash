import { Job, Progress } from "./Job";
import { Estimate, PriceChecker } from "../services/PriceEstimator";
import { EnhancedPriceChecker } from "../services/EnhancedPriceEstimator";
import { Poe2Item } from "../services/types";

export interface PriceCheckProgress extends Progress<Estimate> {
  itemId?: string;
  error?: string;
}

export class PriceCheckAllItems extends Job<Estimate> {
  constructor(
    private filteredItems: Poe2Item[],
    private skipAlreadyChecked = true,
    private priceCheckSettings?: any,
  ) {
    super(
      "price-check-items",
      "Price Checking Items",
      "Checking items listed...",
    );
  }

  async *_task() {
    // Update enhanced price checker settings if provided
    if (this.priceCheckSettings) {
      EnhancedPriceChecker.updateSettings(this.priceCheckSettings);
    }

    const cached = PriceChecker.getCachedEstimates();
    for (let i = 0; i < this.filteredItems.length; i++) {
      const item = this.filteredItems[i];

      if (cached[item.id] && this.skipAlreadyChecked) {
        yield {
          total: this.filteredItems.length,
          current: i + 1,
          data: cached[item.id],
          itemId: item.id, // Include item ID for immediate updates
        };
      } else {
        try {
          // Try enhanced price checker first
          let price: Estimate;
          try {
            const enhancedResult = await EnhancedPriceChecker.estimateItemPrice(item);
            price = {
              price: enhancedResult.estimate.price,
              stdDev: { amount: 0, currency: enhancedResult.estimate.price.currency },
            };
          } catch (enhancedError) {
            console.warn('Enhanced price check failed, falling back to original:', enhancedError);
            // Fallback to original price checker
            price = await PriceChecker.estimateItemPrice(item);
          }

          yield {
            total: this.filteredItems.length,
            current: i + 1,
            data: price,
            itemId: item.id, // Include item ID for immediate updates
          };
        } catch (error: any) {
          console.error('Price check failed for item:', item.item.name || item.item.typeLine, error);
          if(error?.response?.data) {
            this.error = error.response.data?.error?.message || error.response.data;
          }
          
          // Don't yield failed results, just log the error and continue
          console.error(`Price check failed for item ${item.id}:`, error);
          // Continue to next item without yielding
        }
      }
    }
  }
}
