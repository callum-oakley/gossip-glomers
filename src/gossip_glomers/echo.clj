(ns gossip-glomers.echo
  (:require [gossip-glomers.node :as node]))

(defn handle [state msg]
  (case (:type (:body msg))
    "echo" (node/reply state msg {:type "echo_ok" :echo (:echo (:body msg))})))

(defn -main []
  (node/run identity handle))
