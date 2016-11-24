Bubblizator
===========

Bubblizator is a symmetric-key algorithm which creates a bubble ciphertext.

Just see an example:

``` js
var bubblizator = new Bubblizator();

bubblizator.encode('This is a secret message !', 'my-secret');

/* Output:
80°08°8OO000.:O0.°0.0:@8O:°@0:OO@°8
::8o8808@o@°:OOoO@:oOo°O°o:o°:o°@0°
*/

bubblizator.decode('80°08°8OO000.:O0.°0.0:@8O:°@0:OO@°8::8o8808@o@°:OOoO@:oOo°O°o:o°:o°@0°', 'my-secret');

/* Output:
This is a secret message !
*/
```


## Installation

Using Bower:

``` bash
bower install bubblizator
```


## Usage


### Default usage

``` js
var bubblizator = new Bubblizator();

bubblizator.encode('This is a secret message !', 'my-secret');

bubblizator.decode('80°08°8OO000.:O0.°0.0:@8O:°@0:OO@°8::8o8808@o@°:OOoO@:oOo°O°o:o°:o°@0°', 'my-secret');
```

Using different key between encoding and decoding won't work.


### Using another charset

You can use another charset than bubbles.
A charset is 8 characters used for ciphertext.
It also supports an UTF-8 charset.

Just pass a `charset` option to bubblizator (string of 8 chars):

``` js
var bubblizator = new Bubblizator({
    charset: '♩♪♫♬♭♮♯°' // a Solfeggizator
});

bubblizator.encode('You touch my tralala', 'mydingdingdong');

/* Output:
♬♩♬♪♬♭♭°°♮♬♮°♫♭♪♭♭♫°°°♪°♭°♯♪♫♫♩♭♮°♩♮♫♮♯♪♯°♩♭°♭♮♮♩♫°♩♭♩
*/
```


## License

This library is under [MIT License](LICENSE).
