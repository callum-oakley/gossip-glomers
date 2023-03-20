(ns gossip-glomers.broadcast
  (:require [gossip-glomers.node :as node]))

;; Index every broadcast message we receive. Each node sends messages to other
;; nodes along with their index, so that they know if they've missed any. Each
;; node also periodically tells every other node the last index it saw, so that
;; it can be sent any missed messages.
;;
;; This strategy never re-sends messages unnecessarily, and for parts 3d and 3e,
;; results in:
;;
;;   messages per operation: ~13
;;   median latency: ~70ms
;;   maximum latency: ~100ms

(defn init [state]
  (swap! state assoc :messages (zipmap (:node-ids @state) (repeat [])))
  (future
    (loop []
      (Thread/sleep 10000)
      (run! #(node/post state % {:type "sync"
                                 :index (count ((:messages @state) %))})
            (remove #{(:node-id @state)} (:node-ids @state)))
      (recur))))

(defn handle [state msg]
  (case (:type (:body msg))
    "broadcast"
    (let [index (count ((:messages @state) (:node-id @state)))]
      (swap! state update-in [:messages (:node-id @state)]
             conj (:message (:body msg)))
      (run! #(node/post state % {:type "new_messages"
                                 :messages [(:message (:body msg))]
                                 :index index})
            (remove #{(:node-id @state)} (:node-ids @state)))
      (node/reply state msg {:type "broadcast_ok"}))

    "read"
    (node/reply state msg
                {:type "read_ok"
                 :messages (distinct (apply concat (vals (:messages @state))))})

    "topology"
    (node/reply state msg {:type "topology_ok"})

    "new_messages"
    (when (= (count ((:messages @state) (:src msg))) (:index (:body msg)))
      (swap! state update-in [:messages (:src msg)]
             into (:messages (:body msg))))

    "sync"
    (let [messages ((:messages @state) (:node-id @state))]
      (when (< (:index (:body msg)) (count messages))
        (node/post state (:src msg)
                   {:type "new_messages"
                    :messages (subvec messages (:index (:body msg)))
                    :index (:index (:body msg))})))))

(defn -main []
  (node/run init handle))
