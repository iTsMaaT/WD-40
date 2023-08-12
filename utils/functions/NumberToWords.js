const NumberToWord = function(s) {
    var th = ['', 'thousand', 'million', 'billion', 'trillion'];
    // uncomment this line for English Number System
    // var th = ['', 'thousand', 'million', 'milliard', 'billion'];

    var dg = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    var tn = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    var tw = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    s = s.toString();
    s = s.replace(/[, ]/g, '');

    if (s != parseFloat(s))
        return 'not a number';

    var x = s.indexOf('.');
    if (x == -1)
        x = s.length;

    if (x > 15)
        return 'too big';

    var n = s.split('');
    var str = '';
    var sk = 0;

    for (let i = 0; i < x; i++) {
        if ((x - i) % 3 == 2) {
            if (n[i] == '1') {
                str += tn[Number(n[i + 1])] + ' ';
                i++;
                sk = 1;
            } else if (n[i] != 0) {
                str += tw[n[i] - 2] + ' ';
                sk = 1;
            }
        } else if (n[i] != 0) {
            str += dg[n[i]] + ' ';
            if ((x - i) % 3 == 0)
                str += 'hundred ';
            sk = 1;
        }

        if ((x - i) % 3 == 1) {
            if (sk)
                str += th[(x - i - 1) / 3] + ' ';
            sk = 0;
        }
    }

    if (x != s.length) {
        const y = s.length;
        str += 'point ';
        for (i = x + 1; i < y; i++)
            str += dg[n[i]] + ' ';
    }

    str = str.replace(/\s+/g, ' ');
    return str.trim();
};
mosule.exports = NumberToWord;