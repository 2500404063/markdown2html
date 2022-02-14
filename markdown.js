/**
 * Author: Felix
 * CreatedDate: 2021/8/10
 * UpdatedDate: 2022/2/14
 * Version: 4.3
 */

function text_md_onchange() {
    document.getElementById("result").innerHTML = markdownToHtml(document.getElementById("text_md").value);
    // document.getElementById("result").innerText = markdownToHtml(document.getElementById("text_md").value);
}

//Markdown convert runtime.
let _mdRuntime = {
    'TitleIdCount': 0,
    'QuoteCount': 0,
    'Lists': {},
    'InCodeBlock': false,
    'InLaTexBlock': false,
}

///Define user's alias
let _aliases = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '\\s': '&nbsp',
    '\\*': '&pwd;'
}
let _aliasesRecover = {
    '&pwd;': '*'
}

//Only for one complete markdown article.
function markdownToHtml(mdSrc) {
    _mdRuntime['TitleIdCount'] = 0;
    let lines = mdSrc.split(/\n/gm);
    var original_first = undefined;
    var first = undefined;
    var second = undefined;
    for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(/\r/g, '');
        if (i < lines.length - 1) second = lines[i + 1].replace(/\r/g, '');
        else second = undefined;
        first = original_first;
        original_first = lines[i];
        lines[i] = _dispatcher(first, lines[i], second);

    }
    let output = '';
    for (let index = 0; index < lines.length; index++) {
        const element = lines[index];
        output += element;
    }
    return output;
}

function _dispatcher(first, line, second) {
    let formats = {
        'latexblock': false,
        'inlinelatex': false,
        'codeblock': false,
        'inlinecode': false,
        'paragraph': false,
        'splitLine': false,
        'title': false,
        'bold': false,
        'italic': false,
        'paragraph': false,
        'alias': false,
        'list': false,
        'blockquote': false,
        'link': false,
        'img': false,
        'maintext': false
    };

    formats['latexblock'] = _isLaTexBlock(line);
    if (formats['latexblock']) return _convertLaTexBlock(line);
    if (_mdRuntime['InLaTexBlock']) return line + '\n';

    formats['codeblock'] = _isCodeBlock(line);
    if (formats['codeblock']) return _convertCodeBlock(line);
    if (_mdRuntime['InCodeBlock']) {
        line = line.replace(/\</g, "&lt;");
        line = line.replace(/\>/g, '&gt;');
        return line + '\n';
    }

    formats['paragraph'] = _isParagraph(line);
    if (formats['paragraph']) {
        return _convertParagraph(line);
    }

    formats['splitLine'] = _isSplitLine(line);
    if (formats['splitLine']) {
        return _convertSplitLine(line);
    }

    formats['inlinelatex'] = _isInlineLaTex(line);
    if (formats['inlinelatex']) line = _convertInlineLaTex(line);

    formats['inlinecode'] = _isInlineCode(line);
    if (formats['inlinecode']) line = _convertInlineCode(line);

    formats['alias'] = _isAlias(line);
    if (formats['alias']) line = _convertAlias_first(line);

    formats['blockquote'] = _isQuote(line);
    if (formats['blockquote']) line = _convertQoute(first, line, second);

    formats['title'] = _isContainTitle(line);
    if (formats['title']) line = _convertTitle(line);

    formats['bold'] = _isBold(line);
    if (formats['bold']) line = _convertBold(line);

    formats['italic'] = _isItalic(line);
    if (formats['italic']) line = _convertItalic(line);

    formats['list'] = _isList(line);
    if (formats['list']) line = _convertList(first, line, second);

    formats['img'] = _isImg(line);
    if (formats['img']) line = _convertImg(line);

    formats['link'] = _isLink(line);
    if (formats['link']) line = _convertLink(line);

    if (formats['alias']) line = _convertAlias_second(line);

    formats['maintext'] = _isMainText(formats);
    if (formats['maintext']) line = _convertMainText(line);
    return line;
}

///Function: Check if it is a paragraph
function _isParagraph(line) {
    if (line.search(/\S/g) >= 0) return false;
    else return true;
}
///Function: Convert paragraph
function _convertParagraph(line) {
    return '<br>';
}

///Function: Check if it exists title.
function _isContainTitle(line) {
    let pos = line.search(/^(#{1,6})\s.*/i);
    if (pos >= 0) {
        return true;
    } else {
        return false;
    }
}

///Function: Convert title format.
function _convertTitle(line) {
    if (line.search(/^(#{1})\s.*/) >= 0) {
        return `<h1 id='md_title_${_mdRuntime['TitleIdCount']++}'>${line.substr(2, line.length - 2)}</h1>`;
    } else if (line.search(/^(#{2})\s.*/) >= 0) {
        return `<h2 id='md_title_${_mdRuntime['TitleIdCount']++}'>${line.substr(3, line.length - 3)}</h2>`;
    } else if (line.search(/^(#{3})\s.*/) >= 0) {
        return `<h3 id='md_title_${_mdRuntime['TitleIdCount']++}'>${line.substr(4, line.length - 4)}</h3>`;
    } else if (line.search(/^(#{4})\s.*/) >= 0) {
        return `<h4 id='md_title_${_mdRuntime['TitleIdCount']++}'>${line.substr(5, line.length - 5)}</h4>`;
    } else if (line.search(/^(#{5})\s.*/) >= 0) {
        return `<h5 id='md_title_${_mdRuntime['TitleIdCount']++}'>${line.substr(6, line.length - 6)}</h5>`;
    } else if (line.search(/^(#{6})\s.*/) >= 0) {
        return `<h6 id='md_title_${_mdRuntime['TitleIdCount']++}'>${line.substr(7, line.length - 7)}</h6>`;
    } else {
        return "<p>Markdown convert error: on function _convertTitle(line)</p>";
    }
}

///Function: Check if bold format exists.
function _isBold(line) {
    if (line.search(/\*\*.+?\*\*/g) >= 0) {
        return true;
    } else {
        return false;
    }
}

///Function：Convert bold format
function _convertBold(line) {
    var list = line.match(/\*\*.+?\*\*/g);
    for (let i = 0; i < list.length; i++) {
        const element = list[i];
        var processed = `<strong>${element.slice(2, -2)}</strong>`;
        line = line.replace(/\*\*.+?\*\*/, processed);
    }
    return line;
}

///Function: Check if italic format exists.
function _isItalic(line) {
    if (line.search(/\*.+?\*/g) >= 0) {
        return true;
    } else {
        return false;
    }
}

///Function：Convert italic format
function _convertItalic(line) {
    var list = line.match(/\*.+?\*/g);
    for (let i = 0; i < list.length; i++) {
        const element = list[i];
        var processed = `<em>${element.slice(1, -1)}</em>`;
        line = line.replace(/\*.+?\*/, processed);
    }
    return line;
}

///Function: check if it is main text
function _isMainText(formats) {
    //omitted: paragraph
    if (!formats['title'] && !formats['list'] && !formats['blockquote']) {
        return true;
    }
    return false;
}

///Function: process main text with alignment.
function _convertMainText(line) {
    var align_type = -1; //-1:left    0:middle    1:right
    var r1 = line.match(/---.+/);
    if (r1 != null) {
        var r2 = line.match(/---.+---/);
        if (r2 != null) {
            align_type = 0;
            line = r2[0].slice(3, -3);
        } else {
            align_type = 1;
            line = r1[0].slice(3);
        }
    }
    if (align_type == -1) return `<p>${line}</p>`;
    else if (align_type == 0) return `<p style='text-align:center;'>${line}</p>`;
    else return `<p style='text-align:end;'>${line}</p>`;
}

///Function: Check if alias exists.
function _isAlias(line) {
    if (line.search(/\\./) >= 0) return true;
    else return false;
}


///Function：replace all alias
function _convertAlias_first(line) {
    for (const key in _aliases) {
        line = line.replace(RegExp(`\\\\${key}`, 'g'), _aliases[key]);
    }
    return line;
}

///Function: recover some alias，whichi conflicts with markdown.
function _convertAlias_second(line) {
    for (const key in _aliasesRecover) {
        line = line.replace(RegExp(key, 'g'), _aliasesRecover[key]);
    }
    return line;
}


function _isList(line) {
    if (line.search(/[0-9]\.\s\S/) >= 0) return true;
    else if (line.search(/-\s\S/) >= 0) return true;
    else return false;
}

function _convertList(first, line, second) {
    var first_type = -1; //-1: not a list,   0: ordered,   1: unordered
    var first_spaceLength = -1;
    if (first != undefined) {
        if (first.search(/[0-9]\.\s/) >= 0) first_type = 0;
        else if (first.search(/-\s/) >= 0) first_type = 1;
        else first_type = -1;
        if (first_type == 0) {
            first_spaceLength = first.match(/\s*[0-9]\.\s/)[0].slice(0, -3).length;
        } else if (first_type == 1) {
            first_spaceLength = first.match(/\s*-\s/)[0].slice(0, -2).length;
        }
    }

    var line_type = -1;
    var line_spaceLength = -1;
    var line_content = '';
    if (line.search(/[0-9]\.\s/) >= 0) line_type = 0;
    else if (line.search(/-\s/) >= 0) line_type = 1;
    else line_type = -1;
    if (line_type == 0) {
        line_spaceLength = line.match(/\s*[0-9]\.\s/)[0].slice(0, -3).length;
        // if (line_spaceLength % 3 != 0) {
        //     return '<p>List Error: a tab must be a multiple of 3.</p>'
        // }
        var prefix_length = line.match(/\s*[0-9]+\.\s/)[0].length;
        line_content = line.slice(prefix_length);
    } else if (line_type == 1) {
        line_spaceLength = line.match(/\s*-\s/)[0].slice(0, -2).length;
        // if (line_spaceLength % 3 != 0) {
        //     return '<p>List Error: a tab must be a multiple of 3.</p>'
        // }
        var prefix_length = line.match(/\s*-\s/)[0].length;
        line_content = line.slice(prefix_length);
    }

    var second_type = -1;
    var second_spaceLength = -1;
    if (second != undefined) {
        if (second.search(/[0-9]\.\s/) >= 0) second_type = 0;
        else if (second.search(/-\s/) >= 0) second_type = 1;
        else second_type = -1;
        if (second_type == 0) {
            second_spaceLength = second.match(/\s*[0-9]\.\s/)[0].slice(0, -3).length;
        } else if (second_type == 1) {
            second_spaceLength = second.match(/\s*-\s/)[0].slice(0, -2).length;
        }
    }

    //Head
    if (_mdRuntime['Lists'][line_spaceLength] == undefined || _mdRuntime['Lists'][line_spaceLength] != line_type) {
        if (line_type == 0) {
            line = `<ol><li>${line_content}</li>`;
        } else if (line_type == 1) {
            line = `<ul><li>${line_content}</li>`;
        }
        _mdRuntime['Lists'][line_spaceLength] = line_type;
    }
    //item 
    else {
        line = `<li>${line_content}</li>`;
    }
    //Tail
    if (second_type == -1 ||
        _mdRuntime['Lists'][second_spaceLength] != undefined && _mdRuntime['Lists'][second_spaceLength] != second_type) {
        var endings = [];
        for (const key in _mdRuntime['Lists']) {
            const element = _mdRuntime['Lists'][key];
            if (element == 0) endings.push('</ol>');
            else endings.push('</ul>');
        }
        line += endings.reverse().join().replace(/,/g, '');
        _mdRuntime['Lists'] = {};
    } else if (line_spaceLength > second_spaceLength) {
        if (_mdRuntime['Lists'][line_spaceLength] == 0) line += '</ol>';
        else line += '</ul>';
        _mdRuntime['Lists'][line_spaceLength] = undefined;
    }
    return line;
}


function _isQuote(line) {
    if (line.search(/>+\s/) >= 0) return true;
    return false;
}

function _convertQoute(first, line, second) {
    var first_levels = -1;
    if (first != undefined) {
        var result = first.match(/>/g);
        if (result != null) first_levels = result.length;
    }

    var line_levels = -1;
    var line_content = '';
    line = line.replace(/\s*>/, '>');
    line_levels = line.match(/>/g).length;
    line_content = line.slice(line_levels + 1);

    var second_levels = -1;
    if (second != undefined) {
        var result = second.match(/>/g);
        if (result != null) second_levels = result.length;
    }

    //Head
    if (first_levels == -1 || first_levels != line_levels) {
        line = `<blockquote><p>${line_content}</p>`;
        _mdRuntime['QuoteCount']++;
    }
    //Same level
    else if (first_levels == line_levels) {
        line = `<p>${line_content}</p>`
    }
    //Tail
    if (second_levels == -1) {
        for (let i = 0; i < _mdRuntime['QuoteCount']; i++) {
            line += '</blockquote>';
        }
        _mdRuntime['QuoteCount'] = 0;
    }
    return line;
}

function _isSplitLine(line) {
    if (line.match(/^-{3,}$/) != null) return true;
    else return false;
}

function _convertSplitLine(line) {
    return '<hr>';
}

function _isCodeBlock(line) {
    if (line.match(/^```.*$/) != null) return true;
    else return false;
}

function _convertCodeBlock(line) {
    if (!_mdRuntime['InCodeBlock']) {
        var language = 'default';
        line = line.replace(/\s/g, '');
        if (line.match(/^```.+$/) != null) {
            _mdRuntime['InCodeBlock'] = true;
            language = line.slice(3);
            line = `<pre><code style='language-${language}'>`;
        } else {
            line = '<p>CodeBlock Error: Lack in language type<p>';
        }
    } else {
        line = `</pre></code>`;
        _mdRuntime['InCodeBlock'] = false;
    }
    return line;
}

//Function：link: [text](url)
function _isLink(line) {
    if (line.match(/\[.+\]\(.+\)/) != null) return true;
    return false;
}

function _convertLink(line) {
    var name, url;
    var r1 = line.match(/\[.+?\]\(.+?\)/g);
    for (const link of r1) {
        name = link.match(/\[.+?\]/)[0].slice(1, -1);
        url = link.match(/\(.+?\)/)[0].slice(1, -1);
        line = line.replace(/\[.+?\]\(.+?\)/, `<a href='${url}' target='_blank'>${name}</a>`)
    }
    return line;
}

function _isImg(line) {
    if (line.match(/!\[.*\]\(.+\)/) != null) return true;
    return false;
}

function _convertImg(line) {
    var name, url;
    var r1 = line.match(/!\[.*?\]\(.+?\)/g);
    for (const img of r1) {
        name = img.match(/!\[.*?\]/)[0].slice(2, -1);
        url = img.match(/\(.+?\)/)[0].slice(1, -1);
        line = line.replace(/!\[.*?\]\(.+?\)/, `<img src='${url}' alt='${name}' title='${name}' >`)
    }
    return line;
}

function _isLaTexBlock(line) {
    if (line.replace(/\s/g, '') == '$$') {
        _mdRuntime['InLaTexBlock'] = !_mdRuntime['InLaTexBlock'];
        return true;
    } else {
        return false;
    }
}

function _convertLaTexBlock(line) {
    return '$$\n';
}

function _isInlineLaTex(line) {
    if (line.match(/\$.+\$/) != null) return true;
    else return false;
}

function _convertInlineLaTex(line) {
    return line;
}

function _isInlineCode(line) {
    if (line.match(/`.+?`/g) != null) return true;
    else return false;
}

function _convertInlineCode(line) {
    line = line.replace(/\</g, "&lt;");
    line = line.replace(/\>/g, '&gt;');
    var r1 = line.match(/`.+?`/g);
    for (const code of r1) {
        line = line.replace(/`.+?`/, `<code>${code.slice(1,-1)}</code>`)
    }
    return line;
}