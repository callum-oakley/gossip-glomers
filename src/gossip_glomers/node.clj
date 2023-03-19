(ns gossip-glomers.node
  (:require [clojure.data.json :as json]
            [clojure.string :as str]))

(defn log
  "Log a message to STDERR. Takes arguments as in format."
  [& args]
  (.println *err* (apply format args)))

(defn read-msg
  "Read a message from STDIN."
  []
  (let [line (read-line)]
    (log "READ  %s" (str/trim line))
    (json/read-str line :key-fn keyword)))

(defn write-msg
  "Write a message to STDOUT."
  [msg]
  (let [line (json/write-str msg)]
    (log "WRITE %s" line)
    (println line)))

(defn post
  "Send a message with the given body to dest."
  [state dest body]
  (write-msg {:src (:node-id @state) :dest dest :body body}))

(defn reply
  "Reply to the given message with the given body."
  [state msg body]
  (post state (:src msg) (assoc body :in_reply_to (:msg_id (:body msg)))))

(defn request
  "Send a request with the given body to dest and register a reply handler."
  [state dest body timeout reply-handler]
  (let [msg-id (str (java.util.UUID/randomUUID))]
    (swap! state update :reply-handlers assoc msg-id reply-handler)
    (post state dest (assoc body :msg_id msg-id))
    (future
      (Thread/sleep timeout)
      (when-let [reply-handler ((:reply-handlers @state) msg-id)]
        (swap! state update :reply-handlers dissoc msg-id)
        (reply-handler state :timeout)))))

(defn run
  "Run a node with the given message handler; a function of state and message."
  ([handler on-init]
   (let [state (atom nil)]
     (loop []
       (let [msg (read-msg)]
         (cond
           (= "init" (:type (:body msg)))
           (do
             (swap! state assoc
                    :node-id (:node_id (:body msg))
                    :node-ids (:node_ids (:body msg)))
             (on-init state)
             (reply state msg {:type "init_ok"}))

           (:in_reply_to (:body msg))
           (let [msg-id (:in_reply_to (:body msg))]
             (when-let [reply-handler ((:reply-handlers @state) msg-id)]
               (swap! state update :reply-handlers dissoc msg-id)
               (reply-handler state msg)))

           :else
           (handler state msg)))
       (recur))))
  ([handler]
   (run handler identity)))
