var charsets = {
    braillator: '"\'`,;:.¨',
    bubble: 'oO08°.:@',
    baton: '-_/|\\I1=',
    brainfuck: '><+-.,[]',
    test: 'abcdefgh',

    // UTF8
    cards: '♡♠♢♣♤♥♧♦',
    chess: '♙♘♗♖♕♔♞♜',
    music: '♩♪♫♬♭♮♯°',
};

$(function () {
    initBubblizator();
    initControls();
});

var bubblizator = null;

function initBubblizator() {
    bubblizator = new Bubblizator({
        charset: charsets.bubble
    });
}

function initControls() {
    var $btnEncode = $('#encode-btn');
    var $btnDecode = $('#decode-btn');
    var $input = $('[name=input]');
    var $key = $('[name=key]');
    
    $btnEncode.click(function () {
        var string = $input.val();
        var key = $key.val();
        
        var encoded = bubblizator.encode(string, key);
        
        $input.val(encoded);
    });
    
    $btnDecode.click(function () {
        var string = $input.val();
        var key = $key.val();
        
        var decoded = bubblizator.decode(string, key);
        
        $input.val(decoded);
    });
}

var fred = null;

function setPageTitle(title) {
    if (fred) {
        clearInterval(fred);
    }
    
    $('.bubblizator-title').html(title.charAt(0));
    var i = 1;
    
    fred = setInterval(function () {
        if (title.length > i) {
            $('.bubblizator-title').html(title.substr(0, ++i));
        } else {
            clearInterval(fred);
        }
    }, 10);
}
