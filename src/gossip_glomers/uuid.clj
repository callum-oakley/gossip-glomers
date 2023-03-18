(ns gossip-glomers.uuid
  (:require [gossip-glomers.node :as node]))

(defn handle [node {:keys [body] :as msg}]
  (case (:type body)
    "generate" (node/respond node msg {:type "generate_ok"
                                       :id (java.util.UUID/randomUUID)})))

(defn -main []
  (node/run (node/init) handle))
