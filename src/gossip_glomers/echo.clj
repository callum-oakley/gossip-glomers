(ns gossip-glomers.echo
  (:require [gossip-glomers.node :as node]))

(defn handle [req]
  (case (:type req)
    "echo" {:type "echo_ok" :echo (:echo req)}))

(defn -main []
  (node/run (node/init) handle))
