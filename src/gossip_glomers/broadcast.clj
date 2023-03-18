(ns gossip-glomers.broadcast
  (:require [gossip-glomers.node :as node]))

(def state (atom {:messages #{}}))

(defn gossip [node topology]
  (loop []
    (run! #(node/post node % {:type "gossip" :messages (:messages @state)})
          (topology (:id node)))
    (Thread/sleep 1000)
    (recur)))

(defn handle [node {:keys [body] :as msg}]
  (case (:type body)
    "broadcast"
    (do
      (swap! state update :messages conj (:message body))
      (node/respond node msg {:type "broadcast_ok"}))

    "read"
    (node/respond node msg {:type "read_ok" :messages (:messages @state)})

    "topology"
    (do
      (future (gossip node (update-keys (:topology body) name)))
      (node/respond node msg {:type "topology_ok"}))
    
    "gossip"
    (swap! state update :messages into (:messages body))))

(defn -main []
  (node/run (node/init) handle))
