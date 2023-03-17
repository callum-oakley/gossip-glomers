(ns gossip-glomers.echo
  (:require [gossip-glomers.node :as node]))

(defn -main []
  (node/run (node/init)
            (fn [req]
              (case (:type req)
                "echo" (assoc req :type "echo_ok")))))
