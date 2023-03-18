(ns gossip-glomers.node
  (:require [clojure.data.json :as json]))

(defn log
  "Log a message to STDERR. Takes arguments as in format."
  [& args]
  (.println *err* (apply format args)))

(defn read-msg
  "Read a message from STDIN."
  []
  (json/read-str (read-line) :key-fn keyword))

(defn write-msg
  "Write a message to STDOUT."
  [msg]
  (println (json/write-str msg)))

(defn post
  "Send a message with the given body to dest."
  [node dest body]
  (write-msg {:src (:id node) :dest dest :body body}))

(defn respond
  "Respond to a message with a response body, wrapping it and setting src, dest,
   and in_reply_to."
  [node {:keys [src body]} res]
  (post node src (assoc res :in_reply_to (:msg_id body))))

(defn init
  "Handle init message and return a node."
  []
  (let [{:keys [body] :as msg} (read-msg)]
    (if (not= "init" (:type body))
      (throw (ex-info "expected init" {:msg msg}))
      (let [node {:id (:node_id body) :nodes (:node_ids body)}]
        (respond node msg {:type "init_ok"})
        node))))

(defn run
  "Run a node with the given message handler."
  [node handler]
  (loop []
    (let [{:keys [dest] :as msg} (read-msg)]
      (when (= dest (:id node))
        (handler node msg)))
    (recur)))
