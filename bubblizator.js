(function (root, factory) {
    factory(root, root.Uint8Array, root.Uint8Array, root.sha512, root.encodeURIComponent, root.Math);
})(this, function (exports, Uint8Array, Uint3Array, sha512, encodeURIComponent, Math) {
    /*
     * Default options for Bubblizator.
     */
    var defaultOptions = {
        charset: 'oO08°.:@',
        encoder: new BubblizatorEncoder(),
        decoder: new BubblizatorDecoder(),
        keyHasher: new BubblizatorKeyHasher(sha512),
        oldBubblizatorSupport: false
    };

    /**
     * Bubblizator class.
     * Encode and decode a message with a key.
     *
     * @param {Object} [options]
     * @param {char[8]} [options.charset] Defaults to old bubblizator charset ("'`,;:.¨)
     * @param {BubblizatorEncoder} [options.encoder]
     * @param {BubblizatorDecoder} [options.decoder]
     * @param {BubblizatorKeyHasher} [options.keyHasher]
     * @param {bool} [options.oldBubblizatorSupport] Support old bubblizator (no utf8 in encoded messages)
     *
     * @returns {Bubblizator}
     */
    function Bubblizator(options) {
        /**
         * @type {Array}
         */
        this.options = options;

        /*
         * Set default options if not set in options
         */
        if (this.options) {
            for (var key in defaultOptions) {
                if (!this.options[key]) {
                    this.options[key] = defaultOptions[key];
                }
            }
        } else {
            this.options = defaultOptions;
        }

        /*
         * Check charset
         */
        if (!this.checkCharset(this.options.charset)) {
            throw new Error('Invalid charset "'+this.options.charset+'". There must 8 differents characters.');
        }
    };

    /**
     * Encode a string
     *
     * @param {!string} string
     * @param {!string} key
     *
     * @returns {string}
     */
    Bubblizator.prototype.encode = function (string, key) {
        var encoder = this.options.encoder;

        var unserializedKey = this.hashKey(key);

        var bytes           = encoder.unserialize(string);
        var shiftedBytes    = encoder.shift(bytes, unserializedKey);
        var binarized       = encoder.joinOctets(shiftedBytes);
        var triplets        = encoder.splitTriplets(binarized);
        var encoded         = encoder.encodeCharset(triplets, this.options.charset);

        return encoded;
    };

    /**
     * Decode a string
     *
     * @param {!string} encoded
     * @param {!string} key
     *
     * @returns {string}
     *
     * @throws {Error} if decoding results as a malformed utf8 string
     */
    Bubblizator.prototype.decode = function (encoded, key) {
        var decoder = this.options.decoder;

        var unserializedKey = this.hashKey(key);

        var triplets        = decoder.decodeCharset(encoded, this.options.charset);
        var binarized       = decoder.joinTriplets(triplets);
        var shiftedBytes    = decoder.splitOctets(binarized);
        var bytes           = decoder.unshift(shiftedBytes, unserializedKey);
        var decoded         = null;
        try {
            decoded = decoder.serialize(bytes);
        } catch (e) {
            if (this.options.oldBubblizatorSupport) {
                decoded = arrayToStringAscii(bytes);
            } else {
                throw new Error('Cannot decode this string with the key, malformed utf8 string');
            }
        }

        return decoded;
    };

    /**
     * Hash a key and return an array of byte
     *
     * @param {!string} key
     *
     * @returns {Uint8Array}
     */
    Bubblizator.prototype.hashKey = function (key) {
        var keyHasher = this.options.keyHasher;

        var hash            = keyHasher.hash(key);
        var unserializedKey = keyHasher.unserialize(hash);

        return unserializedKey;
    };

    /**
     * Check if charset have strctly 8 differents chars
     *
     * @param {string} charset
     *
     * @returns {bool}
     */
    Bubblizator.prototype.checkCharset = function (charset) {
        if (8 !== charset.length) {
            return false;
        }

        var charsCode = {};
        var size = 0;

        for (var i = 0; i < 8; i++) {
            charsCode[charset.charCodeAt(i)] = true;
        }

        for (i in charsCode) {
            size++;
        }

        return 8 === size;
    };

    /**
     * Bubblizator encode functions
     *
     * @returns {BubblizatorEncoder}
     */
    function BubblizatorEncoder() {
    };

    /**
     * Serialize a string to an array of byte (manage utf8)
     *
     * @param {!string} string
     *
     * @returns {Uint8Array} bytes
     */
    BubblizatorEncoder.prototype.unserialize = function (string) {
        return UTF8.stringToArray(string);
    };

    /**
     * Shift bytes using key hash
     *
     * @param {!Uint8Array} bytes
     * @param {!Uint8Array} unserializedKey
     *
     * @returns {Uint8Array} shiftedBytes
     */
    BubblizatorEncoder.prototype.shift = function (bytes, unserializedKey) {
        var length = bytes.length;
        var keyLength = unserializedKey.length;
        var shiftedBytes = new Uint8Array(length);

        for (var i = 0; i < length; i++) {
            shiftedBytes[i] = bytes[i] + unserializedKey[i % keyLength];
        }

        return shiftedBytes;
    };

    /**
     * Join byte to create a string representing a binary
     *
     * @param {!Uint8Array} shiftedBytes
     *
     * @returns {string} binarized
     */
    BubblizatorEncoder.prototype.joinOctets = function (shiftedBytes) {
        var binarized = '';
        var length = shiftedBytes.length;
        var pad = '00000000';

        for (var i = 0; i < length; i++) {
            var binary = new Number(shiftedBytes[i]).toString(2);

            binarized += pad.substr(binary.length) + binary;
        }

        return binarized;
    };

    /**
     * Split binary string to array of int3.
     * Fill last triplets with 0 if there is a rest (pad right)
     *
     * @param {!string} binarized
     *
     * @returns {Uint3Array} triplets
     */
    BubblizatorEncoder.prototype.splitTriplets = function (binarized) {
        var binarizedLength = binarized.length;
        var tripletsLength = Math.ceil(binarized.length / 3);

        var rest = (tripletsLength * 3) - binarizedLength;

        while (rest > 0) {
            rest--;
            binarized += '0';
        }

        var triplets = new Uint3Array(tripletsLength);

        for (var i = 0; i < tripletsLength; i++) {
            var triplet = binarized.substr(i * 3, 3);

            triplets[i] = parseInt(triplet, 2);
        }

        return triplets;
    };

    /**
     * Convert int3's to encoded string using charset
     *
     * @param {!Uint3Array} triplets
     * @param {!string} charset
     *
     * @returns {string} encodedString
     */
    BubblizatorEncoder.prototype.encodeCharset = function (triplets, charset) {
        var encodedString = '';
        var tripletsLength = triplets.length;

        for (var i = 0; i < tripletsLength; i++) {
            encodedString += charset.charAt(triplets[i]);
        }

        return encodedString;
    };

    /**
     * Bubblizator decode functions
     *
     * @returns {BubblizatorDecoder}
     */
    function BubblizatorDecoder() {
    };

    /**
     * Convert octets to string. Ignore octet if not in charset
     *
     * @param {!Uint8Array} bytes
     *
     * @returns {string} decodedString
     *
     * @throws {Error} on malformed utf8 bytes sequence
     */
    BubblizatorDecoder.prototype.serialize = function (bytes) {
        return UTF8.arrayToString(bytes);
    };

    /**
     * Unshift int8's with key
     *
     * @param {!Uint8Array} shiftedBytes
     * @param {!Uint8Array} unserializedKey
     *
     * @returns {Uint8Array} bytes
     */
    BubblizatorDecoder.prototype.unshift = function (shiftedBytes, unserializedKey) {
        var shiftedBytesLength = shiftedBytes.length;
        var keyLength = unserializedKey.length;
        var bytes = new Uint8Array(shiftedBytesLength);

        for (var i = 0; i < shiftedBytesLength; i++) {
            bytes[i] = shiftedBytes[i] - unserializedKey[i % keyLength];
        }

        return bytes;
    };

    /**
     * Split binary string to octets
     *
     * @param {!string} binarized
     *
     * @returns {Uint8Array} shiftedBytes
     */
    BubblizatorDecoder.prototype.splitOctets = function (binarized) {
        var bytesLength = Math.floor(binarized.length / 8);
        var bytes = new Uint8Array(bytesLength);

        for (var i = 0; i < bytesLength; i++) {
            var byte = binarized.substr(i * 8, 8);

            bytes[i] = parseInt(byte, 2);
        }

        return bytes;
    };

    /**
     * Join triplets to create a binary string.
     * Remove trailing zero's to be a multiple of 8
     *
     * @param {!Uint3Array} triplets
     *
     * @returns {string} binarized
     */
    BubblizatorDecoder.prototype.joinTriplets = function (triplets) {
        var tripletsLength = triplets.length;
        var binarized = '';
        var pad = '000';

        for (var i = 0; i < tripletsLength; i++) {
            var binary = new Number(triplets[i]).toString(2);

            binarized += pad.substr(binary.length) + binary;
        }

        var bytesLength = Math.floor(binarized.length / 8);

        binarized = binarized.substr(0, bytesLength * 8);

        return binarized;
    };

    /**
     * Convert string chars into its charset index
     *
     * @param {!string} triplets
     * @param {!string} charset
     *
     * @returns {Uint3Array} triplets
     */
    BubblizatorDecoder.prototype.decodeCharset = function (encodedString, charset) {
        var charsetCodes = [];
        var encodedChars = encodedString.split('');
        var encodedCharsLength = encodedChars.length;

        for (var i = 0; i < encodedCharsLength; i++) {
            var charsetCode = charset.indexOf(encodedChars[i]);

            if (-1 !== charsetCode) {
                charsetCodes.push(charsetCode);
            }
        }

        return new Uint3Array(charsetCodes);
    };

    /**
     * Bubblizator key hasher
     *
     * @param {!Function} hashFunction
     *
     * @returns {BubblizatorKeyHasher}
     */
    function BubblizatorKeyHasher(hashFunction) {
        /**
         * @type {!Function}
         */
        this.hashFunction = hashFunction;
    };

    /**
     * Returns hash from hash function
     *
     * @param {string} key
     *
     * @returns {string} hex string
     */
    BubblizatorKeyHasher.prototype.hash = function (key) {
        if (key) {
            return this.hashFunction(key);
        } else {
            return this.hashFunction('');
        }
    };

    /**
     * Convert hex string to byte array
     *
     * @param {string} hash
     *
     * @returns {Uint8Array}
     */
    BubblizatorKeyHasher.prototype.unserialize = function (hash) {
        if (!hash) {
            return [0];
        }

        var hashLength = hash.length / 2;
        var key = new Uint8Array(hashLength);

        for (var i = 0; i < hashLength; i++) {
            key[i] = parseInt(hash.substr(i * 2, 2), 16);
        }

        return key;
    };

    /**
     * Utility class about UTF8 string proccessing
     *
     * @type UTF8
     */
    var UTF8 = {
        /**
         * Returns length in octets of an utf8 string
         *
         * @param {string} str
         *
         * @returns {int}
         */
        length: function (str) {
            var m = encodeURIComponent(str).match(/%[89ABab]/g);
            return str.length + (m ? m.length : 0);
        },

        /**
         * Returns array of bytes of an utf8 string
         *
         * @param {string} str
         *
         * @returns {Uint8Array}
         */
        stringToArray: function (str) {
            var utf8 = new Uint8Array(UTF8.length(str));
            var idx = 0;

            for (var i=0; i < str.length; i++) {
                var charcode = str.charCodeAt(i);
                if (charcode < 0x80) utf8[idx++] = charcode;
                else if (charcode < 0x800) {
                    utf8[idx++] = 0xc0 | (charcode >> 6);
                    utf8[idx++] = 0x80 | (charcode & 0x3f);
                }
                else if (charcode < 0xd800 || charcode >= 0xe000) {
                    utf8[idx++] = 0xe0 | (charcode >> 12);
                    utf8[idx++] = 0x80 | ((charcode>>6) & 0x3f),
                    utf8[idx++] = 0x80 | (charcode & 0x3f);
                }
                // surrogate pair
                else {
                    i++;
                    // UTF-16 encodes 0x10000-0x10FFFF by
                    // subtracting 0x10000 and splitting the
                    // 20 bits of 0x0-0xFFFFF into two halves
                    charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                              | (str.charCodeAt(i) & 0x3ff))
                    utf8[idx++] = 0xf0 | (charcode >>18);
                    utf8[idx++] = 0x80 | ((charcode>>12) & 0x3f);
                    utf8[idx++] = 0x80 | ((charcode>>6) & 0x3f);
                    utf8[idx++] = 0x80 | (charcode & 0x3f);
                }
            }

            return utf8;
        },

        /**
         * Decode bytes sequence to an utf8 string
         *
         * @param {!Uint8Array} bytes
         *
         * @returns {string}
         *
         * @throws {Error} on malformed utf8 bytes sequence
         */
        arrayToString: function (bytes) {
            var encodedString = String.fromCharCode.apply(null, bytes);
            var decodedString = decodeURIComponent(escape(encodedString));

            return decodedString;
        }
    };

    /**
     * If utf8 fails, it's maybe an old bubblizator encoded string (no utf8)
     *
     * @param {Uint8Array} bytes ascii
     *
     * @returns {string}
     */
    function arrayToStringAscii(bytes) {
        var s = '';
        var bytesLength = bytes.length;

        for (var i = 0; i < bytesLength; i++) {
            s += String.fromCharCode(bytes[i]);
        }

        return s;
    }

    exports.Bubblizator = Bubblizator;
    exports.BubblizatorEncoder = BubblizatorEncoder;
    exports.BubblizatorDecoder = BubblizatorDecoder;
    exports.BubblizatorKeyHasher = BubblizatorKeyHasher;
    exports.UTF8 = UTF8;
});
