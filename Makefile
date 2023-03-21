maelstrom = ./maelstrom/maelstrom

.PHONY: test
test: test-1 test-2 test-3 test-4

.PHONY: test-1
test-1:
	${maelstrom} test -w echo --bin src/echo.js --node-count 1 --time-limit 10

.PHONY: test-2
test-2:
	${maelstrom} test -w unique-ids --bin src/uuid.js --time-limit 30 \
		--rate 1000 --node-count 3 --availability total --nemesis partition

.PHONY: test-3
test-3: test-3a test-3b test-3c test-3d

.PHONY: test-3a
test-3a:
	${maelstrom} test -w broadcast --bin src/broadcast.js --node-count 1 \
		--time-limit 20 --rate 10

.PHONY: test-3b
test-3b:
	${maelstrom} test -w broadcast --bin src/broadcast.js --node-count 5 \
		--time-limit 20 --rate 10

.PHONY: test-3c
test-3c:
	${maelstrom} test -w broadcast --bin src/broadcast.js --node-count 5 \
		--time-limit 20 --rate 10 --nemesis partition

.PHONY: test-3d
test-3d:
	${maelstrom} test -w broadcast --bin src/broadcast.js --node-count 25 \
		--time-limit 20 --rate 100 --latency 100

# 3e uses the same settings as 3d

.PHONY: test-4
test-4:
	${maelstrom} test -w g-counter --bin src/counter.js --node-count 3 \
		--rate 100 --time-limit 20 --nemesis partition
