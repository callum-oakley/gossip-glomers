(ns gossip-glomers.echo
  (:require [gossip-glomers.node :as node]))

(defn handle [node {:keys [body] :as msg}]
  (case (:type body)
    "echo" (node/respond node msg {:type "echo_ok" :echo (:echo body)})))

(defn -main []
  (node/run (node/init) handle))
