(ns gossip-glomers.node
  (:require [clojure.data.json :as json]))

(defn- log
  "Log a message to STDERR. Takes arguments as in format."
  [& args]
  (.println *err* (apply format args)))

(defn- read-msg
  "Read a message from STDIN."
  []
  (json/read-str (read-line) :key-fn keyword))

(defn- write-msg
  "Write a message to STDOUT."
  [msg]
  (println (json/write-str msg)))

(defn- respond
  "Respond to a message with a response body, wrapping it and setting src, dest,
   and in_reply_to."
  [{:keys [src dest body]} res]
  (log "%s -> %s\n%s <- %s" src body src res)
  (write-msg {:src dest
              :dest src
              :body (assoc res :in_reply_to (:msg_id body))}))

(defn init
  "Handle init message and return a node."
  []
  (let [{:keys [body] :as msg} (read-msg)]
    (if (not= "init" (:type body))
      (throw (ex-info "expected init" {:msg msg}))
      (let [id (:node_id body) nodes (:node_ids body)]
        (respond msg {:type "init_ok"})
        {:id id :nodes nodes}))))

(defn run
  "Run a node with the given handler, which should be a function of request to
   response body, sans in_reply_to."
  [node handler]
  (loop []
    (let [{:keys [dest body] :as msg} (read-msg)]
      (when (= dest (:id node))
        (respond msg (handler body))))
    (recur)))
