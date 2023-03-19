(ns gossip-glomers.uuid
  (:require [gossip-glomers.node :as node]))

(defn handle [state msg]
  (case (:type (:body msg))
    "generate" (node/reply state msg {:type "generate_ok"
                                      :id (str (java.util.UUID/randomUUID))})))

(defn -main []
  (node/run handle))
