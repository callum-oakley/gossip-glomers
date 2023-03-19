maelstrom = ./maelstrom/maelstrom

.PHONY: test
test: test-1 test-2 test-3

.PHONY: test-1
test-1:
	${maelstrom} test -w echo --bin bin/echo --node-count 1 --time-limit 10

.PHONY: test-2
test-2:
	${maelstrom} test -w unique-ids --bin bin/uuid --time-limit 30 --rate 1000 \
		--node-count 3 --availability total --nemesis partition

.PHONY: test-3
test-3: test-3a test-3b test-3c test-3d

.PHONY: test-3a
test-3a:
	${maelstrom} test -w broadcast --bin bin/broadcast --node-count 1 \
		--time-limit 20 --rate 10

.PHONY: test-3b
test-3b:
	${maelstrom} test -w broadcast --bin bin/broadcast --node-count 5 \
		--time-limit 20 --rate 10

.PHONY: test-3c
test-3c:
	${maelstrom} test -w broadcast --bin bin/broadcast --node-count 5 \
		--time-limit 20 --rate 10 --nemesis partition

.PHONY: test-3d
test-3d:
	${maelstrom} test -w broadcast --bin bin/broadcast --node-count 25 \
		--time-limit 20 --rate 100 --latency 100
