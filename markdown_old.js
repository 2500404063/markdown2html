/**
 * Author: Felix
 * CreatedDate: 2021/8/10
 * UpdatedDate: 2022/1/6 
 * Version: 2.0
 */

function text_md_onchange() {
    // document.getElementById("result").innerHTML = markdownToHtml(document.getElementById("text_md").value);
    document.getElementById("result").innerText = markdownToHtml(document.getElementById("text_md").value);
}

//For <h1 id='title_1'>...</h1>
let _convertTitleIdCount = 0;
//global labels
let _convertRuntime;

//Only for one complete markdown article.
function markdownToHtml(mdSrc) {
    //Unify the tail of a line.
    mdSrc = mdSrc.replace(/\r/mg, "");
    _convertRuntime = {
        //false: toBeStart
        //true: toBeEnd
        'multiBold': false,
        'multiBoldStartFinished': false,
        'multiItalicized': false,
        'multiItalicizedStartFinished': false,
        //0: no quote
        //1: quote start finished
        //2: wait to be ended
        'quote': 0,
        //0: no ol
        //1: ol start finished
        //2: wait to be ended
        'ol': 0,
        'ul': 0,
        'originalBlock': false,
        'originalSet': new Array(),
        'codeBlock': false,
        'texBlock': false,
    };
    _convertTitleIdCount = 0;
    let lines = mdSrc.split(/\n/gm);
    for (let i = 0; i < lines.length; i++) {
        line = lines[i];
        lines[i] = _dispatcher(line);
    }
    let output = '';
    for (let index = 0; index < lines.length; index++) {
        const element = lines[index];
        output += element;
        if (element == '<pre><code>') {
            if (index != lines.length - 1) output;
        } else {
            if (index != lines.length - 1) output += '\n';
        }
    }
    output = _convertOriginal(output);
    return output;
}
function _dispatcher(line) {
    //Existing formats in a line.
    let containedElements = {
        'title': false,
        'breakLine': false,
        'paragraph': false,
        'bold': false,
        'italicized': false,
        'blockquote': false,
        'ol': false,
        'ul': false,
        'splitLine': false,
        'link': false,
        'img': false,
    };
    line = _originalStart(line);
    line = _convertCodeBlock(line);
    _omitTexConvert(line);
    if (!_convertRuntime['codeBlock'] && !_convertRuntime['texBlock']) {
        containedElements['title'] = _isContainTitle(line);
        if (containedElements['title']) {
            line = _convertTitle(line);
        }
        containedElements['splitLine'] = _isSplitLine(line);
        if (containedElements['splitLine']) {
            line = _convertSplitLine(line);
        }
        containedElements['bold'] = _isBold(line);
        if (containedElements['bold']) {
            line = _convertBold(line);
        }
        containedElements['italicized'] = _isItalicized(line);
        if (containedElements['italicized']) {
            line = _convertItalicized(line);
        }
        containedElements['blockquote'] = _isQuote(line);
        if (containedElements['blockquote']) {
            line = _convertQuote(line);
        }
        containedElements['ol'] = _isOl(line);
        containedElements['ul'] = _isUl(line);
        if (containedElements['ul'] || containedElements['ol']) {
            line = _convertOlUl(line);
        }
        containedElements['img'] = _isImg(line);
        if (containedElements['img']) {
            line = _convertImg(line);
        }
        containedElements['link'] = _isLink(line);
        if (containedElements['link']) {
            line = _convertLink(line);
        }
        containedElements['BreakLine'] = _isBreakLine(line);
        if (containedElements['BreakLine']) {
            line = _convertBreakLine(line);
        }
    }
    return line;
}

function _isContainTitle(line) {
    let pos = line.search(/^(#{1,6})\s.*/i);
    if (pos >= 0) {
        return true;
    }
    else {
        return false;
    }
}

function _isBreakLine(line) {
    //1. does not exist h1
    //2. does not exist <blockquote>
    //3. is not '<p>'
    //4. is not '</p>'
    //5. empty
    //6. [ol / ol]
    //7. in ol
    //8. [ul / ul]
    //9. in ul
    //10. ---
    //11. <img>
    //12. <pre><code> <pre></code>
    //13. $$
    if (line.replace(/\s*/g, '') == '<blockquote>' || line.replace(/\s*/g, '') == '</blockquote>') {
        return false;
    }
    if (_convertRuntime['quote'] > 0) {
        return false;
    }
    if (line.search(/(<blockquote>)|(<\/blockquote>)/i) >= 0) {
        return false;
    }
    if (line.search('<p>') >= 0 || line.search('</p>') >= 0 || line.search('<P>') >= 0 || line.search('</P>') >= 0) {
        return false;
    }
    if (line == '' || line.search(/^\s*$/) >= 0) {
        return false;
    }
    if (line.replace(/\s*/g, '') == '<ol>' || line.replace(/\s*/g, '') == '</ol>') {
        return false;
    }
    if (_convertRuntime['ol'] > 0) {
        return false;
    }
    if (line.replace(/\s*/g, '') == '<ul>' || line.replace(/\s*/g, '') == '</ul>') {
        return false;
    }
    if (_convertRuntime['ul'] > 0) {
        return false;
    }
    if (line == '<hr>') {
        return false;
    }
    if (line.search('<img') >= 0) {
        return false;
    }
    if (line == '</pre></code>') {
        return false;
    }
    if (line.replace(/\s*/g, '') == '$$') {
        return false;
    }
    return true;
}

function _isParagraph(line) {
    if (line == '{' || line == '}') {
        return true;
    } else {
        return false;
    }
}

function _isBold(line) {
    if (line.search(/\*\*\S/) >= 0 && line.search(/\S\*\*/) >= 0) {
        _convertRuntime['multiBold'] = false;
        return true;
    } else if (line.search(/\*\*\S/) >= 0) {
        _convertRuntime['multiBold'] = true;
        return true;
    } else if (line.search(/\S\*\*/) >= 0) {
        return true;
    } else {
        return false;
    }
}

function _isItalicized(line) {
    if (line.search(/[^\*\s]*\*[^\*\s]+/) >= 0 &&
        line.search(/[^\*\s]\*[^\*]*/) >= 0) {
        _convertRuntime['multiItalicized'] = false;
        return true;
    } else if (line.search(/[^\*\s]*\*[^\*\s]+/) >= 0) {
        _convertRuntime['multiItalicized'] = true;
        return true;
    } else if (line.search(/[^\*\s]\*[^\*]*/) >= 0) {
        return true;
    } else {
        return false;
    }
}

function _isQuote(line) {
    if (line.replace(/\s*/g, "") == '<:') {
        return true;
    }
    if (line.replace(/\s*/g, "") == ':>') {
        return true;
    }
    if (_convertRuntime['quote'] > 0) {
        return true;
    }
    return false;
}

function _isOl(line) {
    if (line.replace(/\s*/g, "") == '[ol') {
        return true;
    }
    if (line.replace(/\s*/g, "") == 'ol]') {
        return true;
    }
    if (_convertRuntime['ol'] > 0) {
        return true;
    }
    return false;
}

function _isUl(line) {
    if (line.replace(/\s*/g, "") == '[ul') {
        return true;
    }
    if (line.replace(/\s*/g, "") == 'ul]') {
        return true;
    }
    if (_convertRuntime['ul'] > 0) {
        return true;
    }
    return false;
}

function _isSplitLine(line) {
    if (line == '---') {
        return true;
    }
}

function _isLink(line) {
    if (line.search(/\[.*\]\(.*\)/) >= 0) {
        return true;
    } else if (line.search(/\[.*\]new\(.*\)/) >= 0) {
        return true;
    } else {
        return false;
    }
}

function _isImg(line) {
    if (line.search(/!\[.*\]\(.*\)/) >= 0) {
        return true;
    } else {
        return false;
    }
}

function _originalStart(line) {
    let pos0 = -1, pos1 = -1;
    while (true) {
        pos0 = line.search(/\{:.*?:\}/);
        if (pos0 >= 0) {
            pos1 = line.search(/:\}/);
            _convertRuntime['originalSet'].push(line.slice(pos0 + 2, pos1));
            line = line.replace(/\{:.*?:\}/, '{-:WAIT_' + (_convertRuntime['originalSet'].length - 1) + ':-}');
        } else {
            break;
        }
    }
    return line;
}

function _convertTitle(line) {
    //symbol:#/##/###/####/#####/######
    //1. only one line
    //2. only one space before main text
    if (line.search(/^(#{1})\s.*/) >= 0) {
        return '<h1 id=\'md_h1_' + _convertTitleIdCount++ + '\'>' + line.substr(2, line.length - 2) + '</h1>';
    } else if (line.search(/^(#{2})\s.*/) >= 0) {
        return '<h2 id=\'md_h2_' + _convertTitleIdCount++ + '\'>' + line.substr(3, line.length - 3) + '</h2>';
    } else if (line.search(/^(#{3})\s.*/) >= 0) {
        return '<h3 id=\'md_h3_' + _convertTitleIdCount++ + '\'>' + line.substr(4, line.length - 4) + '</h3>';
    } else if (line.search(/^(#{4})\s.*/) >= 0) {
        return '<h4 id=\'md_h4_' + _convertTitleIdCount++ + '\'>' + line.substr(5, line.length - 5) + '</h4>';
    } else if (line.search(/^(#{5})\s.*/) >= 0) {
        return '<h5 id=\'md_h5_' + _convertTitleIdCount++ + '\'>' + line.substr(6, line.length - 6) + '</h5>';
    } else if (line.search(/^(#{6})\s.*/) >= 0) {
        return '<h6 id=\'md_h6_' + _convertTitleIdCount++ + '\'>' + line.substr(7, line.length - 7) + '</h6>';
    } else {
        return "<h1>Markdown convert error: on function _convertTitle(line)</h1>";
    }
}

function _convertBreakLine(line) {
    return '<p>' + line + '</p>';
}

function _convertBold(line) {
    let codeBlocks = new Array();
    let codePos0 = -1;
    for (; codePos0 = line.search(/(<code>).*?(<\/code>)/) != -1;) {
        let codePos1 = line.indexOf('</code>', codePos0);
        codeBlocks.push(line.slice(codePos0 + 6, codePos1));
        line = line.replace(/(<code>).*?(<\/code>)/, '<mycode>' + (codeBlocks.length - 1) + '</mycode>');
    }

    if (_convertRuntime['multiBold'] == false) {
        while (true) {
            //Here a problem: when ** is in Single line code block for c++.
            //Single Line
            let start = line.search(/\*\*\S/);
            if (start >= 0) {
                line = line.slice(0, start) + "<strong>" + line.slice(start + 2);
            }
            start = line.search(/\S\*\*/);
            if (start >= 0) {
                line = line.slice(null, start + 1) + "</strong>" + line.slice(start + 3);
            }
            if (start == -1) break;
        }
    } else {
        //Multiple Line
        let start = line.search(/\*\*\S/);
        if (start >= 0 && _convertRuntime['multiBoldStartFinished'] == false) {
            line = line.slice(0, start) + "<strong>" + line.slice(start + 2);
            _convertRuntime['multiBoldStartFinished'] = true;
        }
        start = line.search(/\S\*\*/);
        if (start >= 0) {
            line = line.slice(null, start + 1) + "</strong>" + line.slice(start + 3);
            _convertRuntime['multiBold'] = false;
            _convertRuntime['multiBoldStartFinished'] = false;
        }
    }

    for (let i = 0; i < codeBlocks.length; i++) {
        const element = codeBlocks[i];
        line = line.replace('<mycode>' + i + '</mycode>', '<code>' + element + '</code>');
    }

    return line;
}

function _convertItalicized(line) {

    let codeBlocks = new Array();
    let codePos0 = -1;
    for (; codePos0 = line.search(/(<code>).*?(<\/code>)/) != -1;) {
        let codePos1 = line.indexOf('</code>', codePos0);
        codeBlocks.push(line.slice(codePos0 + 6, codePos1));
        line = line.replace(/(<code>).*?(<\/code>)/, '<mycode>' + (codeBlocks.length - 1) + '</mycode>');
    }

    if (_convertRuntime['multiItalicized'] == false) {
        while (true) {
            //Single Line
            let start = line.search(/[^\*\s]*\*[^\*\s]+/);
            if (start >= 0) {
                line = line.slice(0, start) + "<em>" + line.slice(start + 1);
            }
            start = line.search(/[^\*\s]\*[^\*]*/);
            if (start >= 0) {
                line = line.slice(null, start + 1) + "</em>" + line.slice(start + 2);
            }
            if (start == -1) break;
        }
    } else {
        //Multiple Line
        let start = line.search(/[^\*]*\*[^\*\s]+/);
        if (start >= 0 && _convertRuntime['multiItalicizedStartFinished'] == false) {
            line = line.slice(0, start) + "<em>" + line.slice(start + 1);
            _convertRuntime['multiItalicizedStartFinished'] = true;
        }
        start = line.search(/[^\*\s]+\*[^\*]*/);
        if (start >= 0) {
            line = line.slice(null, start + 1) + "</em>" + line.slice(start + 2);
            _convertRuntime['multiItalicized'] = false;
            _convertRuntime['multiItalicizedStartFinished'] = false;
        }
    }
    for (let i = 0; i < codeBlocks.length; i++) {
        const element = codeBlocks[i];
        line = line.replace('<mycode>' + i + '</mycode>', '<code>' + element + '</code>');
    }
    return line;
}

function _convertQuote(line) {
    if (line.replace(/\s*/g, "") == '<:') {
        _convertRuntime['quote']++;
        return '<blockquote>';
    }
    else if (line.replace(/\s*/g, "") == ':>') {
        _convertRuntime['quote']--;
        return '</blockquote>';
    } else if (line.search(/^\s*$/gm) == -1 || line != '') {
        let wordPos = line.search(/\S/);
        return '<p>' + line.slice(wordPos) + '</p>';
    } else {
        return '';
    }
}

function _convertOlUl(line) {
    if (line.replace(/\s*/g, "") == '[ul') {
        _convertRuntime['ul']++;
        return '<ul>';
    }
    else if (line.replace(/\s*/g, "") == 'ul]') {
        _convertRuntime['ul']--;
        return '</ul>';
    }
    if (line.replace(/\s*/g, "") == '[ol') {
        _convertRuntime['ol']++;
        return '<ol>';
    }
    else if (line.replace(/\s*/g, "") == 'ol]') {
        _convertRuntime['ol']--;
        return '</ol>';
    } else if (line.search(/^\s*$/gm) == -1 || line != '') {
        let wordPos = line.search(/\S/);
        return '<li>' + line.slice(wordPos) + '</li>';
    } else {
        return '';
    }
}

function _convertSplitLine(line) {
    return '<hr>';
}

function _convertLink(line) {
    while (true) {
        let pos0 = line.search(/\[.*\]new\(.*\)/);
        if (pos0 >= 0) {
            let pos1 = line.indexOf(']', pos0);
            let pos2 = line.indexOf('(', pos1);
            let pos3 = line.indexOf(')', pos2);
            line = line.slice(0, pos0) + "<a target='_blank' href='" + line.slice(pos2 + 1, pos3) + "'>" + line.slice(pos0 + 1, pos1) + "</a>" + line.slice(pos3 + 1);
        } else if ((pos0 = line.search(/\[.*\]\(.*\)/)) >= 0) {
            let pos1 = line.indexOf(']', pos0);
            let pos2 = line.indexOf('(', pos1);
            let pos3 = line.indexOf(')', pos2);
            line = line.slice(0, pos0) + "<a href='" + line.slice(pos2 + 1, pos3) + "'>" + line.slice(pos0 + 1, pos1) + "</a>" + line.slice(pos3 + 1);
        } else {
            break;
        }
    }
    return line;
}

function _convertImg(line) {
    let pos0 = line.search(/!\[.*\]\(.*\)/);
    if (pos0 >= 0) {
        let pos1 = line.indexOf(']', pos0);
        let pos2 = line.indexOf('(', pos1);
        let pos3 = line.indexOf(')', pos2);
        line = line.slice(0, pos0) + "<img"
            + " src='" + line.slice(pos2 + 1, pos3) + "'"
            + " alt='" + line.slice(pos0 + 2, pos1) + "'"
            + " title='" + line.slice(pos0 + 2, pos1) + "'"
            + ">" + line.slice(pos3 + 1);
    }
    return line;
}

function _convertOriginal(output) {
    for (let i = 0; i < _convertRuntime['originalSet'].length; i++) {
        const element = _convertRuntime['originalSet'][i];
        let escapedText = _escapeText(element);
        output = output.replace(RegExp("\{-:WAIT_" + i + ":\-}"), escapedText);
    }
    return output;
}

function _convertCodeBlock(line) {
    if (line.search(/^(```)/) >= 0 && _convertRuntime['codeBlock'] == false) {
        line = '<pre><code>';
        _convertRuntime['codeBlock'] = true;
    } else if (line.search(/^(```)$/) >= 0 && _convertRuntime['codeBlock'] == true) {
        line = '</pre></code>';
        _convertRuntime['codeBlock'] = false;
    }
    while (true) {
        let pos0 = line.search(/`.*?`/);
        if (pos0 >= 0) {
            let pos1 = line.indexOf('`', pos0 + 1);
            line = line.slice(0, pos0) + '<code>' + _escapeText(line.slice(pos0 + 1, pos1)) + '</code>' + line.slice(pos1 + 1);
        } else {
            break;
        }
    }
    return line;
}

function _escapeText(escapedText) {
    //Only supports one single line.
    escapedText = escapedText.replace(/</g, '&lt;');
    escapedText = escapedText.replace(/>/g, '&gt;');
    escapedText = escapedText.replace(/\s/g, '&nbsp;');
    return escapedText;
}

function _omitTexConvert(line) {
    if (line.replace(/\s*/g, '') == '$$') {
        _convertRuntime['texBlock'] = !_convertRuntime['texBlock'];
    }
}