(ns gossip-glomers.broadcast
  (:require [gossip-glomers.node :as node]))

(def state (atom {:topology nil :messages #{}}))

(defn handle [req]
  (case (:type req)
    "broadcast"
    (do
      (swap! state update :messages conj (:message req))
      {:type "broadcast_ok"})

    "read"
    {:type "read_ok" :messages (:messages @state)}

    "topology"
    (do
      (swap! state assoc :topology (:topology req))
      {:type "topology_ok"})))

(defn -main []
  (node/run (node/init) handle))
