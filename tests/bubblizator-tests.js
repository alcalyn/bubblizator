var charsets = {
    test: 'abcdefgh',
    braillator: ',;.:\'"¨`',
    bubble: 'oO08°.Qu',
    music:'pqbdo|~µ',
    baton: '-_/|\\I1=',
    brainfuck: '><+-.,[]'
};

// ¥ = 194, 165
var utf8String = '¥£€$¢₡₢₣₤abc₥₦₧₨₩₪₫₭₮₯₹ Julien ok.';
var utf8StringLength = 69;
var utf8Bytes = [
    194, 165, 194, 163, 226, 130, 172, 36, 194, 162, 226, 130, 161, 226, 130, 162,
    226, 130, 163, 226, 130, 164, 97, 98, 99, 226, 130, 165, 226, 130, 166, 226,
    130, 167, 226, 130, 168, 226, 130, 169, 226, 130, 170, 226, 130, 171, 226, 130,
    173, 226, 130, 174, 226, 130, 175, 226, 130, 185, 32, 74, 117, 108, 105, 101,
    110, 32, 111, 107, 46
];

var string = 'Hello World !';
var key = 'secret key';

var encoder = new BubblizatorEncoder();
var decoder = new BubblizatorDecoder();
var keyHasherMD5 = new BubblizatorKeyHasher(md5);

var options = {
    charset: charsets.test,
    encoder: encoder,
    decoder: decoder,
    keyHasher: keyHasherMD5,
    oldBubblizatorSupport: false
}

var bubblizator = new Bubblizator(options);

/*
 * Test UTF8
 */
console.info('Testing UTF8');

assertEquals(UTF8.length(utf8String), utf8StringLength);
assertArrayEquals(UTF8.stringToArray(utf8String), utf8Bytes);
assertEquals(UTF8.arrayToString([194, 165, 32, 106, 117, 108]), '¥ jul');

/*
 * Test encode
 */
console.info('Testing encode');

assertArrayEquals(encoder.unserialize(' '), [32]);
assertArrayEquals(encoder.unserialize('¥ jul'), [194, 165, 32, 106, 117, 108]);

assertArrayEquals(encoder.shift([4, 5, 6], [2]), [6, 7, 8]);
assertArrayEquals(encoder.shift([1, 1, 1], [2, 5]), [3, 6, 3]);
assertArrayEquals(encoder.shift([10, 20, 40], [2, 5, 8, 1]), [12, 25, 48]);
assertArrayEquals(encoder.shift([255, 200, 255, 100], [1, 100, 10, 200]), [0, 44, 9, 44]);

assertEquals(encoder.joinOctets([0]), '00000000');
assertEquals(encoder.joinOctets([255]), '11111111');
assertEquals(encoder.joinOctets([5, 8, 200]), '000001010000100011001000');

assertArrayEquals(encoder.splitTriplets('111100001111000011110000'), [7, 4, 1, 7, 0, 3, 6, 0]);
assertArrayEquals(encoder.splitTriplets('11110000'), [7, 4, 0]);
assertArrayEquals(encoder.splitTriplets('11110001'), [7, 4, 2]);
assertArrayEquals(encoder.splitTriplets('1111000011110000'), [7, 4, 1, 7, 0, 0]);

assertEquals(encoder.encodeCharset([0, 1, 2, 3, 4, 5, 6, 7], '01234567'), '01234567');
assertEquals(encoder.encodeCharset([6, 7, 1, 5, 0], '01234567'), '67150');
assertEquals(encoder.encodeCharset([4, 7, 1], '¥£€$¢₡₢₣'), '¢₣£');

/*
 * Test decode
 */
console.info('Testing Decode');

assertArrayEquals(decoder.decodeCharset('01234567', '01234567'), [0, 1, 2, 3, 4, 5, 6, 7]);
assertArrayEquals(decoder.decodeCharset('67150', '01234567'), [6, 7, 1, 5, 0]);
assertArrayEquals(decoder.decodeCharset('¢₣£', '¥£€$¢₡₢₣'), [4, 7, 1]);
assertArrayEquals(decoder.decodeCharset('0 e 1 séfg 2 3, 4 ₢₢ 56ds 7 ', '01234567'), [0, 1, 2, 3, 4, 5, 6, 7]);

assertEquals(decoder.joinTriplets([7, 4, 1, 7, 0, 3, 6, 0]), '111100001111000011110000');
assertEquals(decoder.joinTriplets([7, 4, 0]), '11110000');
assertEquals(decoder.joinTriplets([7, 4, 2]), '11110001');
assertEquals(decoder.joinTriplets([7, 4, 1, 7, 0, 0]), '1111000011110000');

assertArrayEquals(decoder.splitOctets('00000000'), [0]);
assertArrayEquals(decoder.splitOctets('11111111'), [255]);
assertArrayEquals(decoder.splitOctets('111111110'), [255]);
assertArrayEquals(decoder.splitOctets('000001010000100011001000'), [5, 8, 200]);
assertArrayEquals(decoder.splitOctets('100000011'), [129]);

assertArrayEquals(decoder.unshift([6, 7, 8], [2]), [4, 5, 6]);
assertArrayEquals(decoder.unshift([3, 6, 3], [2, 5]), [1, 1, 1]);
assertArrayEquals(decoder.unshift([12, 25, 48], [2, 5, 8, 1]), [10, 20, 40]);
assertArrayEquals(decoder.unshift([0, 45, 9, 45], [1, 100, 10, 200]), [255, 201, 255, 101]);

assertEquals(decoder.serialize([32]), ' ');
assertEquals(decoder.serialize([194, 165, 32, 106, 117, 108]), '¥ jul');

/*
 * Test key hasher
 */
console.info('Testing MD5 key hasher');

assertEquals(keyHasherMD5.hash(), 'd41d8cd98f00b204e9800998ecf8427e');
assertEquals(keyHasherMD5.hash('key ₡ secret'), '5243fddd7ce1722e6b8577bf6000e689');

assertArrayEquals(keyHasherMD5.unserialize('1020ff'), [16, 32, 255]);
assertArrayEquals(keyHasherMD5.unserialize(), [0]);

/*
 * Test Bubblizator
 */
console.info('Testing bubblizator');

assertTrue(bubblizator.checkCharset('abcdefgh'));
assertFalse(bubblizator.checkCharset('abcdefg'));
assertFalse(bubblizator.checkCharset('abcdefgg'));
assertTrue(bubblizator.checkCharset('¥bcdefg₡'));
assertEquals(bubblizator.decode(bubblizator.encode(string, key), key), string);

try {
    var bubblizatorDefaults = new Bubblizator();
    console.log('ok');
} catch (e) {
    console.warn('Failed to instanciate a bubblizator with no options');
}



function assertEquals(a, b) {
    if (a === b) {
        console.log('ok');
    } else {
        console.warn('Failed to assert that "'+a+'" === "'+b+'"\n', new Error().stack);
    }
}

function assertArrayEquals(a, b) {
    if (a) a = Object.keys(a).map(function (key) {return a[key]}); else a = [];
    if (b) b = Object.keys(b).map(function (key) {return b[key]}); else b = [];
    
    if ((a.length === b.length) && (JSON.stringify(a) === JSON.stringify(b))) {
        console.log('ok');
    } else {
        console.warn('Failed to assert that Array "'+a+'" === "'+b+'"\n', new Error().stack);
    }
}

function assertTrue(a) {
    assertEquals(a, true);
}

function assertFalse(a) {
    assertEquals(a, false);
}
