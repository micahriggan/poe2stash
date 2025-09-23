import React, { useRef, useEffect } from "react";
import { Poe2WebsocketClient } from "../services/Poe2WebsocketClient";
import { Poe2Item } from "../services/types";
import { Poe2Trade } from "../services/poe2trade";
import { wait } from "../utils/wait";
import { LEAGUE_PATH } from "../config/league";

interface LiveMonitorButtonProps {
  accountName: string;
  items: Poe2Item[];
  liveSearchItems: Poe2Item[];
  isLiveMonitoring: boolean;
  setIsLiveMonitoring: React.Dispatch<React.SetStateAction<boolean>>;
  setLiveSearchItems: React.Dispatch<React.SetStateAction<Poe2Item[]>>;
  setItems: React.Dispatch<React.SetStateAction<Poe2Item[]>>;
  onPriceCheck: (item: Poe2Item) => Promise<void>;
}

export const LiveMonitorButton: React.FC<LiveMonitorButtonProps> = ({
  accountName,
  items,
  liveSearchItems,
  isLiveMonitoring,
  setIsLiveMonitoring,
  setLiveSearchItems,
  setItems,
  onPriceCheck,
}: LiveMonitorButtonProps) => {
  const wsRef = useRef<Poe2WebsocketClient | null>(null);

  const setupWebSocket = (id: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new Poe2WebsocketClient(`/live/poe2/${LEAGUE_PATH}${id}`);

    let newItemsBatch = [] as string[];
    ws.onMessage = async (event: MessageEvent) => {
      if (event.data instanceof Blob) {
        const text = await event.data.text();
        console.log(text);

        const data = JSON.parse(text);
        if (data.new && data.new.length > 0) {
          for (const newItemId of data.new) {
            // if we turn off live monitoring, skip price checking the items
            if (!isLiveMonitoring) {
              return;
            }

            newItemsBatch.push(newItemId);

            await wait(5000);

            // try to fetch in batches after 5 seconds of events, incase many items come in at once
            if (newItemsBatch.length > 0) {
              const toFetch = Poe2Trade.toUniqueItems([...newItemsBatch]);
              Poe2Trade.upsertCachedAccountItems(accountName, toFetch);

              newItemsBatch = [];
              const newItems = await Poe2Trade.fetchAllItems(
                accountName,
                toFetch,
                true,
              );

              if (newItems.length > 0) {
                // items that we don't already have in items, or
                // items that have previously factored into profit calculation and are now getting updated

                const netNewItems = newItems.filter(
                  (i) =>
                    liveSearchItems.map((item) => item.id).includes(i.id) ||
                    !items.map((item) => item.id).includes(i.id),
                );
                setLiveSearchItems((prevItems) => [
                  ...netNewItems,
                  ...prevItems.filter((i) => !toFetch.includes(i.id)),
                ]);

                setItems((prevItems) => [
                  ...newItems,
                  ...prevItems.filter((i) => !toFetch.includes(i.id)),
                ]);
              }

              for (const item of newItems) {
                try {
                  await onPriceCheck(item);
                  await wait(5000);
                } catch (e) {
                  console.error(e);
                }
              }
            }
          }
        }
      }
    };

    ws.onClose = () => {
      console.log("WebSocket connection closed");
    };

    ws.onError = (error: Event) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current = ws;
  };

  const liveMonitor = async () => {
    if (isLiveMonitoring) {
      setIsLiveMonitoring(false);
      wsRef.current?.close();
      setLiveSearchItems([]);
      return;
    }

    setIsLiveMonitoring(true);
    const accountSearch = await Poe2Trade.getAccountItems(accountName);
    setupWebSocket(accountSearch.id);
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <button
      onClick={liveMonitor}
      className="bg-blue-500 text-white p-2 rounded"
    >
      Live Monitor
    </button>
  );
};
