TESTS = test/test.*.js

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--require should \
		--timeout 1000 \
		--growl \
		$(TESTS)

.PHONY: test
