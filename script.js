$(function () {

    var tags = [{
        start: 53,
        end: 85
        }]
    var ranges = [];

    $("html").on("mouseup", function () {

        //  $('pre')[0].prepend("<p>Test</p>")
        // $('pre')[0].append("<p>Test</p>")
        highlightSelection()
    });

    function getRange() {
        var rangePromise = jQuery.Deferred();
        var range = window.getSelection().getRangeAt(0);
        rangePromise.resolve(range)
        return rangePromise.promise();
    }

    function highlightSelection() {
        //window.getSelection().getRangeAt(0).startContainer.prepend("<text>fdsfa</text>")
        //console.log(window.getSelection().getRangeAt(0).endContainer)
        //highlightRange(window.getSelection().getRangeAt(0))
        //            ranges.push(window.getSelection().getRangeAt(0));
        $.when(getRange()).then(
            function (range) {
                console.log(range)
                maketag({
                    start: range.startOffset,
                    end: range.endOffset
                })
            });
        //            var safeRanges = getSafeRanges(userSelection);
        //            for (var i = 0; i < safeRanges.length; i++) {
        //                highlightRange(safeRanges[i]);
        //            }
    }

    function maketag(tagInfo) {

        var text = $("#text")[0].innerHTML

        var newText = text.substring(0, tagInfo.start) + "<span>" + text.substring(tagInfo.start, tagInfo.end) + "</span>" + text.substring(tagInfo.end, text.length)

        var newPre = $('<pre/>')
        newPre.css({
            "z-index": -2
        })
        newPre.append(newText)
        $("#highLights").append(newPre)


        infoDialog();



    }

    function infoDialog() {
        $("#dialog").css({
            "visibility": "visible"
        });
        $("#dialog").dialog();

    }

    function highlightRange(range) {
        newNode = document.createElement("param");
        range.endContainer.appendChild(newNode);
        //range.selectNode(document.getElementsByTagName("div").item(0));
        range.insertNode(newNode);
        //range.insertBefore(newNode);
        //var btn = document.createElement("<param/>");
        //         var newNode = document.createElement("div"); // newNode.setAttribute( // "style", // "background-color: yellow; display: inline;" // ); // range.surroundContents(newNode);
        //console.log(range)
        //range.append(newNode);
    }
    //
    //        function getSafeRanges(dangerous) {
    //            var a = dangerous.commonAncestorContainer;
    //            // Starts -- Work inward from the start, selecting the largest safe range
    //            var s = new Array(0),
    //                rs = new Array(0);
    //            if (dangerous.startContainer != a)
    //                for (var i = dangerous.startContainer; i != a; i = i.parentNode)
    //                    s.push(i);
    //            if (0 < s.length)
    //                for (var i = 0; i < s.length; i++) {
    //                    var xs = document.createRange();
    //                    if (i) {
    //                        xs.setStartAfter(s[i - 1]);
    //                        xs.setEndAfter(s[i].lastChild);
    //                    } else {
    //                        xs.setStart(s[i], dangerous.startOffset);
    //                        xs.setEndAfter(
    //                            (s[i].nodeType == Node.TEXT_NODE) ?
    //                            s[i] : s[i].lastChild
    //                        );
    //                    }
    //                    rs.push(xs);
    //                }
    //
    //            // Ends -- basically the same code reversed
    //            var e = new Array(0),
    //                re = new Array(0);
    //            if (dangerous.endContainer != a)
    //                for (var i = dangerous.endContainer; i != a; i = i.parentNode)
    //                    e.push(i);
    //            if (0 < e.length)
    //                for (var i = 0; i < e.length; i++) {
    //                    var xe = document.createRange();
    //                    if (i) {
    //                        xe.setStartBefore(e[i].firstChild);
    //                        xe.setEndBefore(e[i - 1]);
    //                    } else {
    //                        xe.setStartBefore(
    //                            (e[i].nodeType == Node.TEXT_NODE) ?
    //                            e[i] : e[i].firstChild
    //                        );
    //                        xe.setEnd(e[i], dangerous.endOffset);
    //                    }
    //                    re.unshift(xe);
    //                }
    //
    //            // Middle -- the uncaptured middle
    //            if ((0 < s.length) && (0 < e.length)) {
    //                var xm = document.createRange();
    //                xm.setStartAfter(s[s.length - 1]);
    //                xm.setEndBefore(e[e.length - 1]);
    //            } else {
    //                return [dangerous];
    //            }
    //
    //            // Concat
    //            rs.push(xm);
    //            response = rs.concat(re);
    //
    //            // Send to Console
    //            return response;
    //        }
});
