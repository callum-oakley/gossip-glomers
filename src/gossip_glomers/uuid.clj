(ns gossip-glomers.uuid
  (:require [gossip-glomers.node :as node]))

(defn handle [req]
  (case (:type req)
    "generate" {:type "generate_ok" :id (java.util.UUID/randomUUID)}))

(defn -main []
  (node/run (node/init) handle))
