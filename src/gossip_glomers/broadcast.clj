(ns gossip-glomers.broadcast
  (:require [gossip-glomers.node :as node]))

(defn gossip [state dests]
  (run! (fn [batch]
          (when-let [dest (first batch)]
            (node/post state dest {:type "gossip"
                                   :messages (:messages @state)
                                   :dests (rest batch)})))
        (split-at (quot (count dests) 2) (shuffle dests))))

(defn handle [state msg]
  (case (:type (:body msg))
    "broadcast"
    (do
      (swap! state update :messages (fnil conj #{}) (:message (:body msg)))
      (swap! state assoc :recent-broadcast? true)
      (gossip state (remove #{(:node-id @state)} (:node-ids @state)))
      (node/reply state msg {:type "broadcast_ok"}))

    "read"
    (node/reply state msg {:type "read_ok" :messages (:messages @state)})

    "topology"
    (node/reply state msg {:type "topology_ok"})
    
    "gossip"
    (do
      (swap! state update :messages (fnil into #{}) (:messages (:body msg)))
      (gossip state (:dests (:body msg))))))

(defn on-init [state]
  (future
    (loop []
      (Thread/sleep 1000)
      (when-not (:recent-broadcast? @state)
        (gossip state (remove #{(:node-id @state)} (:node-ids @state))))
      (swap! state assoc :recent-broadcast? false)
      (recur))))

(defn -main []
  (node/run handle on-init))
