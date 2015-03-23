## Stack API

So how does the library deal with _errors_, _context_, _arguments_, _completion_, _notFounds_ for each of the handles? Before it was said that

> `app.stack` returns a callback and constructs a consumable stack object which, upon call, will be used to invoke and give context to ...arguments


Well... the library by itself doesn't. It keeps an eye on the return value of each handle, gives a callback and adds a declarative API for you to use in each of the stacks you declare. But you are in charge.
